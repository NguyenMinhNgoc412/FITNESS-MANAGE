import { Injectable } from '@nestjs/common';
import { BodyMeasurement, Role } from '@prisma/client';
import { z } from 'zod';
import { Actor, requireRole } from '../common/access';
import { fail } from '../common/errors';
import { id } from '../common/input';
import { Db, json, TransactionService } from '../common/transaction.service';
import { PrismaService } from '../prisma.service';
import { checked, requireEditableVersion, measurementInput, measurementPatch, measurementProgress, rangeQuery, versionInput } from './workout-rules';

const publicMeasurement = (v: BodyMeasurement) => ({ id: v.id, measurementDate: v.measurementDate, weightKg: v.weightUnits === null ? null : v.weightUnits / 100, heightCm: v.heightUnits === null ? null : v.heightUnits / 10, status: v.status, version: v.version, createdAt: v.createdAt, updatedAt: v.updatedAt, archivedAt: v.archivedAt });
const units = (weightKg: number | null, heightCm: number | null) => ({ weightUnits: weightKg === null ? null : Math.round(weightKg * 100), heightUnits: heightCm === null ? null : Math.round(heightCm * 10) });
@Injectable()
export class BodyMeasurementsService {
  constructor(private readonly prisma: PrismaService, private readonly tx: TransactionService) {}
  private self(a: Actor) { requireRole(a, Role.MEMBER); }
  private async measurement(db: Db, a: Actor, value: string) {
    const item = await db.bodyMeasurement.findFirst({ where: { id: checked(id, value), memberId: a.sub } });
    if (!item) fail('NOT_FOUND', 'Không tìm thấy số đo.', 404);
    return item;
  }
  private measurementRevision(db: Db, a: Actor, item: BodyMeasurement, action: string) {
    return db.measurementRevision.create({ data: { measurementId: item.id, memberId: a.sub, actorId: a.sub, version: item.version, action, snapshot: json(publicMeasurement(item)) } });
  }
  async list(a: Actor, raw: unknown) {
    this.self(a); const q = rangeQuery(raw, { status: z.enum(['ACTIVE', 'ARCHIVED', 'ALL']).default('ACTIVE') });
    const where = { memberId: a.sub, measurementDate: { gte: q.from, lte: q.to }, status: q.status === 'ALL' ? undefined : q.status };
    const [items, total] = await Promise.all([this.prisma.bodyMeasurement.findMany({ where, orderBy: [{ measurementDate: 'desc' }, { id: 'desc' }], skip: q.skip, take: 20 }), this.prisma.bodyMeasurement.count({ where })]);
    return { items: items.map(publicMeasurement), total, page: q.page, pageSize: 20 };
  }
  async detail(a: Actor, value: string) { this.self(a); return publicMeasurement(await this.measurement(this.prisma, a, value)); }
  create(a: Actor, raw: unknown, key?: string) {
    this.self(a); const input = checked(measurementInput, raw);
    return this.tx.command(a, 'measurement.create', key, input, async db => {
      if (await db.bodyMeasurement.findFirst({ where: { memberId: a.sub, measurementDate: input.measurementDate, status: 'ACTIVE' } })) fail('MEASUREMENT_DATE_CONFLICT', 'Ngày này đã có số đo. Mở bản đang có để sửa.');
      const item = await db.bodyMeasurement.create({ data: { memberId: a.sub, measurementDate: input.measurementDate, ...units(input.weightKg, input.heightCm) } });
      await this.measurementRevision(db, a, item, 'CREATE'); return publicMeasurement(item);
    });
  }
  update(a: Actor, value: string, raw: unknown, key?: string) {
    this.self(a); const input = checked(measurementPatch, raw); checked(id, value);
    return this.tx.command(a, 'measurement.update', key, { id: value, ...input }, async db => {
      const old = await this.measurement(db, a, value); requireEditableVersion(old.version, input.expectedVersion, old.status, 'MEASUREMENT_STATE_CONFLICT');
      const item = await db.bodyMeasurement.update({ where: { id: value }, data: { ...units(input.weightKg, input.heightCm), version: { increment: 1 } } });
      await this.measurementRevision(db, a, item, 'UPDATE'); return publicMeasurement(item);
    });
  }
  archive(a: Actor, value: string, raw: unknown, key?: string) {
    this.self(a); const input = checked(versionInput, raw); checked(id, value);
    return this.tx.command(a, 'measurement.archive', key, { id: value, ...input }, async db => {
      const old = await this.measurement(db, a, value); requireEditableVersion(old.version, input.expectedVersion, old.status, 'MEASUREMENT_STATE_CONFLICT');
      const item = await db.bodyMeasurement.update({ where: { id: value }, data: { status: 'ARCHIVED', archivedAt: new Date(), version: { increment: 1 } } });
      await this.measurementRevision(db, a, item, 'ARCHIVE'); return publicMeasurement(item);
    });
  }
  async progress(a: Actor, raw: unknown) {
    this.self(a); const q = rangeQuery(raw);
    const records = await this.prisma.bodyMeasurement.findMany({ where: { memberId: a.sub, status: 'ACTIVE', measurementDate: { gte: q.from, lte: q.to } }, select: { measurementDate: true, weightUnits: true, heightUnits: true } });
    return measurementProgress(records, q.from, q.to);
  }
  async revisions(a: Actor, value: string, raw: unknown) {
    this.self(a); const q = checked(z.object({ page: z.coerce.number().int().min(1).max(10000).default(1) }).strict(), raw);
    const db = this.prisma;
    await this.measurement(db, a, value);
    const select = { id: true, version: true, action: true, snapshot: true, recordedAt: true } as const;
    const args = { orderBy: { version: 'desc' as const }, skip: (q.page - 1) * 20, take: 20, select };
    const where = { memberId: a.sub, measurementId: value };
    return { items: await db.measurementRevision.findMany({ ...args, where }), total: await db.measurementRevision.count({ where }), page: q.page, pageSize: 20 };
  }
}
