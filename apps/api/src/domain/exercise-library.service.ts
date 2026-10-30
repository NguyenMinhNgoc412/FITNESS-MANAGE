import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { Actor, requireRole } from '../common/access';
import { fail } from '../common/errors';
import { id } from '../common/input';
import { PrismaService } from '../prisma.service';
import { CatalogContent, checked, equipmentCodes, literalSearch, muscleGroups } from './workout-rules';

@Injectable()
export class ExerciseLibraryService {
  constructor(private readonly prisma: PrismaService) {}
  private self(a: Actor) { requireRole(a, Role.MEMBER); }
  async list(a: Actor, raw: unknown) {
    this.self(a);
    const q = checked(z.object({ muscleGroup: z.enum(muscleGroups).optional(), equipment: z.enum(equipmentCodes).optional(), q: z.string().trim().max(100).default(''), page: z.coerce.number().int().min(1).max(10000).default(1) }).strict(), raw);
    const where = { status: 'PUBLISHED', ...(q.muscleGroup ? { muscleGroups: { has: q.muscleGroup } } : {}), ...(q.equipment ? { equipmentCodes: { has: q.equipment } } : {}), ...(q.q ? { searchText: { contains: literalSearch(q.q) } } : {}) };
    const [items, total] = await Promise.all([this.prisma.exerciseCatalog.findMany({ where, orderBy: [{ nameVi: 'asc' }, { id: 'asc' }], skip: (q.page - 1) * 20, take: 20, select: { id: true, code: true, nameVi: true, muscleGroups: true, equipmentCodes: true, currentPublishedVersion: true } }), this.prisma.exerciseCatalog.count({ where })]);
    return { items, total, page: q.page, pageSize: 20 };
  }
  async detail(a: Actor, value: string) {
    this.self(a); const item = await this.prisma.exerciseCatalog.findFirst({ where: { id: checked(id, value), status: 'PUBLISHED' } });
    if (!item) fail('NOT_FOUND', 'Không tìm thấy bài mẫu.', 404);
    const v = await this.prisma.exerciseCatalogVersion.findUnique({ where: { catalogExerciseId_contentVersion: { catalogExerciseId: item.id, contentVersion: item.currentPublishedVersion } } });
    if (!v) fail('NOT_FOUND', 'Nội dung chưa sẵn sàng.', 404);
    const { reviewedAt: _reviewedAt, ...content } = v.content as unknown as CatalogContent;
    return { id: item.id, code: item.code, contentVersion: v.contentVersion, ...content };
  }
}
