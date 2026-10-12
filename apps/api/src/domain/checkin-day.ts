import { Db } from '../common/transaction.service';
import { fail } from '../common/errors';

export function checkinDayRange(now: Date) {
  const offset = 7 * 60 * 60 * 1000;
  const local = new Date(now.getTime() + offset);
  const start = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - offset;
  return { gte: new Date(start), lt: new Date(start + 86400000) };
}

// Call inside TransactionService.command after its shared business write lock.
export async function assertNoDailyCheckin(db: Db, identity: { memberId?: string; customerId?: string }, now: Date) {
  const existing = await db.memberCheckin.findFirst({ where: {
    OR: [...(identity.memberId ? [{ memberId: identity.memberId }] : []), ...(identity.customerId ? [{ customerId: identity.customerId }] : [])],
    checkedInAt: checkinDayRange(now),
  } });
  if (existing) fail('ALREADY_CHECKED_IN_TODAY', 'Khách đã điểm danh hôm nay. Không trừ thêm buổi hoặc lượt pass.');
}
