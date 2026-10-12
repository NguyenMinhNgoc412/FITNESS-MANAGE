import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { Actor, requireRole } from '../common/access';
import { fail } from '../common/errors';
import { audit, Db, TransactionService } from '../common/transaction.service';
import { page } from '../common/input';
import { PrismaService } from '../prisma.service';
import { activeUser } from './data';
import { assertMembership } from './rules';
import { MembershipsService } from './memberships.service';
import { assertNoDailyCheckin, checkinDayRange } from './checkin-day';
export type CheckinInput = { memberId: string; membershipId: string; context: 'SELF_TRAINING' | 'WITH_INTERNAL_PT'; bookingId?: string; method: 'PHONE' | 'QR'; qrToken?: string };
@Injectable()
export class CheckinsService {
  constructor(private readonly prisma: PrismaService, private readonly tx: TransactionService, private readonly jwt: JwtService, private readonly memberships: MembershipsService) {}
  async qr(actor: Actor) {
    requireRole(actor, Role.MEMBER);
    const token = await this.jwt.signAsync({ sub: actor.sub, kind: 'checkin' }, { secret: process.env.JWT_QR_SECRET, expiresIn: '2m' });
    return { token, expiresIn: 120 };
  }
  async qrSubject(token: string) {
    try {
      const value = await this.jwt.verifyAsync<{ sub: string; kind: string }>(token, { secret: process.env.JWT_QR_SECRET });
      if (value.kind !== 'checkin' || !/^[a-f0-9]{24}$/i.test(value.sub)) throw new Error();
      return value.sub;
    } catch { return fail('INVALID_QR', 'QR không hợp lệ hoặc đã hết hạn.', 400); }
  }
  async resolve(actor: Actor, token: string) {
    requireRole(actor, Role.OWNER);
    const memberId = await this.qrSubject(token);
    const member = await this.prisma.user.findFirst({ where: { id: memberId, role: Role.MEMBER, status: 'ACTIVE' }, select: { id: true, profile: { select: { fullName: true } } } });
    if (!member) fail('INVALID_QR', 'QR không còn hợp lệ.', 400);
    return { member, memberships: await this.memberships.list(actor, memberId) };
  }
  async member(actor: Actor, input: CheckinInput, key?: string) {
    requireRole(actor, Role.OWNER);
    if (input.method === 'QR' && (!input.qrToken || await this.qrSubject(input.qrToken) !== input.memberId)) fail('INVALID_QR', 'QR không khớp Member.', 400);
    return this.tx.command(actor, 'member.checkin', key, input, (db, commandId) => this.consumeIn(db, actor, input, commandId));
  }
  async consumeIn(db: Db, actor: Actor, input: Omit<CheckinInput, 'context'> & { context: string; externalPtPassId?: string }, commandId: string) {
    await activeUser(db, input.memberId, Role.MEMBER);
    const checkedInAt = new Date();
    const customer = await db.customer.findFirst({ where: { memberUserId: input.memberId } });
    await assertNoDailyCheckin(db, { memberId: input.memberId, customerId: customer?.id }, checkedInAt);
    const membership = await db.membership.findUnique({ where: { id: input.membershipId } });
    assertMembership(membership, input.memberId, checkedInAt);
    if (input.context === 'WITH_INTERNAL_PT') {
      const booking = input.bookingId ? await db.booking.findUnique({ where: { id: input.bookingId } }) : null;
      if (!booking || booking.memberId !== input.memberId || booking.status === 'CANCELLED') fail('BOOKING_REQUIRED', 'Cần booking PT hợp lệ của Member.');
    }
    if (input.context === 'WITH_EXTERNAL_PT' && !input.externalPtPassId) fail('PASS_CONFIRMATION_REQUIRED', 'Cần xác nhận External PT Pass.');
    if (membership.mode === 'SESSION_BASED') await db.membership.update({ where: { id: membership.id }, data: { usedSessions: { increment: 1 } } });
    const log = await db.memberCheckin.create({ data: {
      subjectType: 'MEMBER', customerId: customer?.id, memberId: input.memberId, membershipId: membership.id,
      context: input.context, bookingId: input.bookingId, externalPtPassId: input.externalPtPassId,
      method: input.method, operatorId: actor.sub, idempotencyKey: commandId, checkedInAt,
    } });
    await audit(db, actor, input.method === 'PHONE' ? 'MEMBER_PHONE_CHECKIN' : 'MEMBER_QR_CHECKIN', 'checkin', log.id);
    await this.memberships.alert(db, membership.id);
    return log;
  }
  pt(actor: Actor, key?: string) {
    requireRole(actor, Role.PT);
    return this.tx.command(actor, 'pt.checkin', key, {}, async (db, commandId) => {
      await activeUser(db, actor.sub, Role.PT);
      const checkedInAt = new Date();
      const existing = await db.ptAttendanceLog.findFirst({ where: { ptId: actor.sub, checkedInAt: checkinDayRange(checkedInAt) } });
      if (existing) fail('ALREADY_CHECKED_IN_TODAY', 'PT đã điểm danh hôm nay. Không tạo thêm lượt điểm danh.');
      return db.ptAttendanceLog.create({ data: { ptId: actor.sub, idempotencyKey: commandId, checkedInAt } });
    });
  }
  logs(actor: Actor, pageNumber?: string) {
    requireRole(actor, Role.OWNER, Role.MEMBER);
    return this.prisma.memberCheckin.findMany({ where: actor.role === Role.MEMBER ? { memberId: actor.sub } : {}, ...page(pageNumber), orderBy: { checkedInAt: 'desc' } });
  }
  attendance(actor: Actor, ptId?: string, pageNumber?: string) {
    requireRole(actor, Role.OWNER, Role.PT);
    if (actor.role === Role.PT && ptId && ptId !== actor.sub) fail('FORBIDDEN', 'Không có quyền xem log này.', 403);
    return this.prisma.ptAttendanceLog.findMany({ where: { ...(actor.role === Role.PT ? { ptId: actor.sub } : ptId ? { ptId } : {}) }, ...page(pageNumber), orderBy: { checkedInAt: 'desc' } });
  }
}
