import { z } from 'zod';
import { PrismaService } from '../prisma.service';
import { page } from '../common/input';
import { fail } from '../common/errors';

const historyRows = z.array(z.object({
  id: z.string(), action: z.string(), reason: z.string().nullish(), actorId: z.string(), createdAt: z.string(),
}));

export async function readCustomerHistory(prisma: PrismaService, targets: { resourceType: string; resourceId: string }[], memberId: string | null | undefined, pageNumber?: string) {
  const { skip, take } = page(pageNumber);
  // Prisma MongoDB JSON filters cannot express these nested member references.
  // Match persisted before/after evidence so reassignment does not detach history.
  const raw = await prisma.auditLog.aggregateRaw({ pipeline: [
    { $match: { $or: [
      ...targets,
      ...(memberId ? [{ resourceType: 'booking', $or: [{ 'before.memberId': memberId }, { 'after.memberId': memberId }] }] : []),
    ] } },
    { $sort: { createdAt: -1, _id: -1 } }, { $skip: skip }, { $limit: take },
    { $project: {
      _id: 0, id: { $toString: '$_id' }, action: 1, reason: 1, actorId: { $toString: '$actorId' },
      createdAt: { $dateToString: { date: '$createdAt', format: '%Y-%m-%dT%H:%M:%S.%LZ', timezone: 'UTC' } },
    } },
  ] });
  const result = historyRows.safeParse(raw);
  if (!result.success) fail('HISTORY_UNAVAILABLE', 'Chưa thể đọc nhật ký hồ sơ. Vui lòng thử lại.', 503);
  return result.data;
}
