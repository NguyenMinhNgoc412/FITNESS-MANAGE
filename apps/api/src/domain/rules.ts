import { Membership } from '@prisma/client';
import { fail } from '../common/errors';

export function membershipState(value: Pick<Membership, 'status' | 'mode' | 'startAt' | 'endAt' | 'totalSessions' | 'usedSessions'>, now = new Date()) {
  if (value.status === 'CANCELLED') return 'CANCELLED';
  if (value.startAt > now) return 'PENDING';
  if (value.mode === 'TIME_BASED') return value.endAt && value.endAt > now ? 'ACTIVE' : 'EXPIRED';
  return (value.totalSessions ?? 0) > value.usedSessions ? 'ACTIVE' : 'EXHAUSTED';
}
export function assertMembership(value: Membership | null, memberId: string, now = new Date()): asserts value is Membership {
  if (!value || value.memberId !== memberId || membershipState(value, now) !== 'ACTIVE') fail('MEMBERSHIP_INVALID', 'Gói tập không còn hiệu lực hoặc đã hết lượt.');
}
export function assertInterval(start: Date, end: Date) {
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end) fail('INVALID_INTERVAL', 'Giờ kết thúc phải sau giờ bắt đầu.', 400);
}
export function overlaps(start: Date, end: Date, otherStart: Date, otherEnd: Date) {
  return start < otherEnd && end > otherStart;
}
