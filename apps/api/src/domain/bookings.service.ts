import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Actor, requireRole } from '../common/access';
import { BookingInput, page } from '../common/input';
import { fail } from '../common/errors';
import { audit, Db, TransactionService } from '../common/transaction.service';
import { PrismaService } from '../prisma.service';
import { activeUser } from './data';
import { assertInterval } from './rules';
import { NotificationsService } from './notifications.service';
@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService, private readonly tx: TransactionService, private readonly notifications: NotificationsService) {}
  async list(actor: Actor, pageNumber?: string, from?: string, to?: string, memberId?: string) {
    requireRole(actor, Role.OWNER, Role.PT, Role.MEMBER);
    const rows = await this.prisma.booking.findMany({ where: {
      ...(actor.role === Role.OWNER ? (memberId ? { memberId } : {}) : actor.role === Role.PT ? { ptId: actor.sub } : { memberId: actor.sub }),
      ...((from || to) ? { startAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lt: new Date(to) } : {}) } } : {}),
    }, ...page(pageNumber), orderBy: [{ startAt: from ? 'asc' : 'desc' }, { id: 'desc' }] });
    const profiles = await this.prisma.profile.findMany({ where: { userId: { in: [...new Set(rows.flatMap(b => [b.memberId, b.ptId]))] } }, select: { userId: true, fullName: true } });
    const names = new Map(profiles.map(p => [p.userId, p.fullName]));
    return rows.map(row => ({ ...row, memberName: names.get(row.memberId), ptName: names.get(row.ptId) }));
  }
  async detail(actor: Actor, id: string) {
    requireRole(actor, Role.OWNER, Role.PT, Role.MEMBER);
    const item = await this.prisma.booking.findUnique({ where: { id } });
    if (!item || (actor.role === Role.PT && item.ptId !== actor.sub) || (actor.role === Role.MEMBER && item.memberId !== actor.sub)) fail('NOT_FOUND', 'Không tìm thấy lịch tập.', 404);
    return item;
  }
  async save(actor: Actor, input: BookingInput, key?: string, id?: string, reason?: string) {
    requireRole(actor, Role.OWNER);
    const value = await this.tx.command(actor, id ? 'booking.edit' : 'booking.create', key, { id, input, reason }, async db => {
      const previous = id ? await db.booking.findUnique({ where: { id } }) : null;
      if (id && (!previous || previous.status === 'CANCELLED')) fail('BOOKING_UNAVAILABLE', 'Lịch không tồn tại hoặc đã hủy.');
      if (id && !reason?.trim()) fail('REASON_REQUIRED', 'Cần lý do thay đổi lịch.', 400);
      await this.validate(db, input, id);
      const data = { ...input, startAt: new Date(input.startAt), endAt: new Date(input.endAt) };
      const booking = id ? await db.booking.update({ where: { id }, data }) : await db.booking.create({ data: { ...data, createdBy: actor.sub } });
      const summary = (item: typeof booking) => ({ memberId: item.memberId, ptId: item.ptId, startAt: item.startAt, endAt: item.endAt });
      await audit(db, actor, id ? 'BOOKING_EDIT' : 'BOOKING_CREATE', 'booking', booking.id, reason, previous ? summary(previous) : undefined, summary(booking));
      await this.notifications.enqueue(db, [input.memberId, input.ptId, ...(previous ? [previous.memberId, previous.ptId] : [])], id ? 'BOOKING_RESCHEDULED' : 'BOOKING_CREATED', booking.id);
      return booking;
    });
    return value;
  }
  async cancel(actor: Actor, id: string, reason: string, key?: string) {
    requireRole(actor, Role.OWNER);
    const value = await this.tx.command(actor, 'booking.cancel', key, { id, reason }, async db => {
      const old = await db.booking.findUnique({ where: { id } });
      if (!old) fail('NOT_FOUND', 'Không tìm thấy lịch tập.', 404);
      if (old.status === 'CANCELLED') return old;
      const booking = await db.booking.update({ where: { id }, data: { status: 'CANCELLED', cancelReason: reason, cancelledBy: actor.sub, cancelledAt: new Date() } });
      await audit(db, actor, 'BOOKING_CANCEL', 'booking', id, reason);
      await this.notifications.enqueue(db, [old.memberId, old.ptId], 'BOOKING_CANCELLED', id);
      return booking;
    });
    return value;
  }
  private async validate(db: Db, input: BookingInput, id?: string) {
    await activeUser(db, input.memberId, Role.MEMBER);
    await activeUser(db, input.ptId, Role.PT);
    const assignment = await db.ptAssignment.findFirst({ where: { memberId: input.memberId, ptId: input.ptId, status: 'ACTIVE' } });
    if (!assignment) fail('PRIMARY_PT_REQUIRED', 'Booking phải dùng PT chính hiện tại của Member.');
    const startAt = new Date(input.startAt), endAt = new Date(input.endAt);
    assertInterval(startAt, endAt);
    const conflict = await db.booking.findFirst({ where: {
      ...(id ? { id: { not: id } } : {}), status: { not: 'CANCELLED' },
      startAt: { lt: endAt }, endAt: { gt: startAt },
      OR: [{ ptId: input.ptId }, { memberId: input.memberId }],
    } });
    if (conflict) fail(conflict.ptId === input.ptId ? 'BOOKING_PT_TIME_CONFLICT' : 'BOOKING_MEMBER_TIME_CONFLICT', 'PT hoặc Member đã có lịch trong khoảng thời gian này.');
  }
}
