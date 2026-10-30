import { Injectable } from '@nestjs/common';
import { Role, WorkoutSession } from '@prisma/client';
import { z } from 'zod';
import { Actor, requireRole } from '../common/access';
import { fail } from '../common/errors';
import { id } from '../common/input';
import { Db, json, TransactionService } from '../common/transaction.service';
import { PrismaService } from '../prisma.service';
import { CatalogContent, checked, completeWorkout, Entry, requireEditableVersion, rangeQuery, versionInput, WorkoutInput, workoutInput, workoutPatch, workoutProgress } from './workout-rules';

const publicWorkout = ({ memberId: _memberId, ...value }: WorkoutSession) => value;
@Injectable()
export class WorkoutsService {
  constructor(private readonly prisma: PrismaService, private readonly tx: TransactionService) {}
  private self(a: Actor) { requireRole(a, Role.MEMBER); }
  private async workout(db: Db, a: Actor, value: string) {
    const item = await db.workoutSession.findFirst({ where: { id: checked(id, value), memberId: a.sub } });
    if (!item) fail('NOT_FOUND', 'Không tìm thấy nhật ký.', 404);
    return item;
  }
  private async entries(db: Db, input: WorkoutInput, previous: Entry[] = []): Promise<Entry[]> {
    return Promise.all(input.exercises.map(async entry => {
      if (entry.source === 'CUSTOM') return { ...entry, displayName: entry.displayName, normalizedName: entry.displayName.trim().replace(/\s+/g, ' ').toLowerCase() };
      const old = previous.find(p => p.id === entry.id);
      if (old?.source === 'CATALOG' && old.catalogExerciseId === entry.catalogExerciseId && old.contentVersion === entry.contentVersion)
        return { ...old, sets: entry.sets };
      const catalog = await db.exerciseCatalog.findFirst({ where: { id: entry.catalogExerciseId, status: 'PUBLISHED', currentPublishedVersion: entry.contentVersion } });
      if (!catalog) fail('CATALOG_VERSION_CONFLICT', 'Bài mẫu đã đổi hoặc ngừng phát hành. Tải lại thư viện và xác nhận trước khi lưu.');
      const v = await db.exerciseCatalogVersion.findUnique({ where: { catalogExerciseId_contentVersion: { catalogExerciseId: catalog.id, contentVersion: entry.contentVersion } } });
      if (!v) fail('CATALOG_VERSION_CONFLICT', 'Nội dung bài mẫu chưa sẵn sàng.');
      const content = v.content as unknown as CatalogContent;
      return { ...entry, displayName: content.nameVi, normalizedName: content.nameVi.toLowerCase(), catalogSnapshot: content };
    }));
  }
  private revision(db: Db, a: Actor, item: WorkoutSession, action: string) {
    return db.workoutRevision.create({ data: { sessionId: item.id, memberId: a.sub, actorId: a.sub, version: item.version, action, snapshot: json(publicWorkout(item)) } });
  }
  async list(a: Actor, raw: unknown) {
    this.self(a);
    const q = rangeQuery(raw, { status: z.enum(['DRAFT', 'COMPLETED', 'ARCHIVED', 'ALL']).optional() });
    const where = { memberId: a.sub, workoutDate: { gte: q.from, lte: q.to }, status: q.status === 'ALL' ? undefined : q.status ? q.status : { in: ['DRAFT', 'COMPLETED'] } };
    const [items, total] = await Promise.all([this.prisma.workoutSession.findMany({ where, orderBy: [{ workoutDate: 'desc' }, { id: 'desc' }], skip: q.skip, take: 20 }), this.prisma.workoutSession.count({ where })]);
    return { items: items.map(publicWorkout), page: q.page, pageSize: 20, total };
  }
  async detail(a: Actor, value: string) { this.self(a); return publicWorkout(await this.workout(this.prisma, a, value)); }
  create(a: Actor, raw: unknown, key?: string) {
    this.self(a); const input = checked(workoutInput, raw);
    return this.tx.command(a, 'workout.create', key, input, async db => {
      const entries = await this.entries(db, input);
      const item = await db.workoutSession.create({ data: { memberId: a.sub, ...input, exercises: json(entries) } });
      await this.revision(db, a, item, 'CREATE'); return publicWorkout(item);
    });
  }
  update(a: Actor, value: string, raw: unknown, key?: string) {
    this.self(a); const input = checked(workoutPatch, raw); checked(id, value);
    return this.tx.command(a, 'workout.update', key, { id: value, ...input }, async db => {
      const old = await this.workout(db, a, value); requireEditableVersion(old.version, input.expectedVersion, old.status, 'WORKOUT_STATE_CONFLICT');
      const entries = await this.entries(db, input.input, old.exercises as unknown as Entry[]);
      if (old.status === 'COMPLETED') completeWorkout(entries);
      const item = await db.workoutSession.update({ where: { id: old.id }, data: { ...input.input, exercises: json(entries), version: { increment: 1 } } });
      await this.revision(db, a, item, 'UPDATE'); return publicWorkout(item);
    });
  }
  transition(a: Actor, value: string, raw: unknown, action: 'complete' | 'archive', key?: string) {
    this.self(a); const input = checked(versionInput, raw); checked(id, value);
    return this.tx.command(a, 'workout.' + action, key, { id: value, ...input }, async db => {
      const old = await this.workout(db, a, value); requireEditableVersion(old.version, input.expectedVersion, old.status, 'WORKOUT_STATE_CONFLICT');
      if (action === 'complete') {
        if (old.status !== 'DRAFT') fail('WORKOUT_STATE_CONFLICT', 'Chỉ hoàn tất buổi đang nháp.');
        completeWorkout(old.exercises as unknown as Entry[]);
      }
      const item = await db.workoutSession.update({ where: { id: old.id }, data: { version: { increment: 1 }, ...(action === 'complete' ? { status: 'COMPLETED', completedAt: new Date() } : { status: 'ARCHIVED', archivedAt: new Date(), statusBeforeArchive: old.status }) } });
      await this.revision(db, a, item, action.toUpperCase()); return publicWorkout(item);
    });
  }
  async revisions(a: Actor, value: string, raw: unknown) {
    this.self(a); const q = checked(z.object({ page: z.coerce.number().int().min(1).max(10000).default(1) }).strict(), raw);
    const db = this.prisma;
    await this.workout(db, a, value);
    const select = { id: true, version: true, action: true, snapshot: true, recordedAt: true } as const;
    const args = { orderBy: { version: 'desc' as const }, skip: (q.page - 1) * 20, take: 20, select };
    const where = { memberId: a.sub, sessionId: value };
    return { items: await db.workoutRevision.findMany({ ...args, where }), total: await db.workoutRevision.count({ where }), page: q.page, pageSize: 20 };
  }
  async progress(a: Actor, raw: unknown) {
    this.self(a);
    const q = rangeQuery(raw, { exerciseName: z.string().trim().min(1).max(100).optional(), catalogExerciseId: id.optional(), groupBy: z.enum(['week', 'month']).default('week') });
    if (q.exerciseName && q.catalogExerciseId) fail('INVALID_INPUT', 'Chỉ chọn một bài tùy chỉnh hoặc bài mẫu.', 400);
    const records = await this.prisma.workoutSession.findMany({ where: { memberId: a.sub, status: 'COMPLETED', workoutDate: { gte: q.from, lte: q.to } }, orderBy: [{ workoutDate: 'asc' }, { id: 'asc' }], select: { workoutDate: true, exercises: true } });
    return workoutProgress(records, q.from, q.to, q.groupBy, { exerciseName: q.exerciseName, catalogExerciseId: q.catalogExerciseId });
  }
}
