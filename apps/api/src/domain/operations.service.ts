import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Actor, requireRole } from '../common/access';
import { fail } from '../common/errors';
import { page } from '../common/input';
import { audit, TransactionService } from '../common/transaction.service';
import { PrismaService } from '../prisma.service';
import { MembershipsService } from './memberships.service';
import { NotificationsService } from './notifications.service';
import { reportMonthRange, summarizePackages } from './reporting';
@Injectable()
export class OperationsService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private refreshing = false;
  constructor(private readonly prisma: PrismaService, private readonly tx: TransactionService, private readonly memberships: MembershipsService, private readonly notifications: NotificationsService) {}
  onModuleInit() {
    this.timer = setInterval(() => { void this.refresh().catch(() => undefined); void this.notifications.deliver().catch(() => undefined); }, 60000);
    this.timer.unref();
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
  async refresh() {
    if (this.refreshing) return;
    this.refreshing = true;
    try {
      await this.tx.run(async db => {
        const now = new Date();
        const candidates = await db.membership.findMany({ where: { status: 'ACTIVE', startAt: { lte: now }, OR: [{ mode: 'TIME_BASED', endAt: { gt: now, lte: new Date(now.getTime() + 7 * 86400000) } }, { mode: 'SESSION_BASED' }] } });
        for (const item of candidates) await this.memberships.alert(db, item.id);
      });
    } finally { this.refreshing = false; }
  }
  async alerts(actor: Actor, n?: string) {
    requireRole(actor, Role.OWNER);
    await this.refresh();
    const rows = await this.prisma.salesAlert.findMany({ ...page(n), orderBy: { triggeredAt: 'desc' } });
    return Promise.all(rows.map(async row => {
      const customer = row.customerId ? await this.prisma.customer.findUnique({ where: { id: row.customerId } }) : row.memberId ? await this.prisma.customer.findFirst({ where: { memberUserId: row.memberId } }) : null;
      return { ...row, customerId: customer?.id ?? row.customerId, customerName: customer?.fullName ?? 'Khách hàng' };
    }));
  }
  updateAlert(actor: Actor, id: string, input: { status: string; ownerNote?: string }, key?: string) {
    requireRole(actor, Role.OWNER);
    return this.tx.command(actor, 'alert.update', key, { id, input }, async db => {
      if (!await db.salesAlert.findUnique({ where: { id } })) fail('NOT_FOUND', 'Không tìm thấy cảnh báo.', 404);
      const result = await db.salesAlert.update({ where: { id }, data: { ...input, resolvedAt: ['OPEN', 'CONTACTED'].includes(input.status) ? null : new Date() } });
      await audit(db, actor, 'ALERT_UPDATE', 'salesAlert', id);
      return result;
    });
  }
  logs(actor: Actor, n?: string) {
    requireRole(actor, Role.OWNER);
    return this.prisma.auditLog.findMany({ ...page(n), orderBy: { createdAt: 'desc' } });
  }
  async packageStatistics(actor: Actor) {
    requireRole(actor, Role.OWNER);
    const rows = await this.prisma.membership.groupBy({ by: ['name', 'mode', 'memberId'], _count: { _all: true } });
    return summarizePackages(rows);
  }
  async monthlyCheckins(actor: Actor, year: number) {
    requireRole(actor, Role.OWNER);
    const months = await Promise.all(Array.from({ length: 12 }, async (_, index) => {
      const month = index + 1, checkedInAt = reportMonthRange(year, month);
      const [subjects, pt] = await Promise.all([
        this.prisma.memberCheckin.groupBy({ by: ['subjectType'], where: { checkedInAt }, _count: { _all: true } }),
        this.prisma.ptAttendanceLog.count({ where: { checkedInAt } }),
      ]);
      const member = subjects.find(row => row.subjectType === 'MEMBER')?._count._all ?? 0;
      const trial = subjects.find(row => row.subjectType === 'TRIAL')?._count._all ?? 0;
      return { month, member, trial, total: member + trial, pt };
    }));
    return { year, timezone: 'Asia/Bangkok', months };
  }
  async dashboard(actor: Actor) {
    requireRole(actor, Role.OWNER);
    await this.refresh();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);
    const [checkins, trials, alerts, trialFinal, membershipExpiring, bookings] = await Promise.all([
      this.prisma.memberCheckin.count({ where: { checkedInAt: { gte: today } } }),
      this.prisma.trialEntitlement.count({ where: { status: 'ACTIVE' } }),
      this.prisma.salesAlert.count({ where: { status: 'OPEN' } }),
      this.prisma.salesAlert.count({ where: { status: 'OPEN', type: 'TRIAL_FINAL' } }),
      this.prisma.salesAlert.count({ where: { status: 'OPEN', type: { in: ['MEMBERSHIP_EXPIRING_TIME', 'MEMBERSHIP_EXPIRING_SESSION'] } } }),
      this.prisma.booking.findMany({ where: { status: 'SCHEDULED', startAt: { gte: today, lt: tomorrow } }, orderBy: { startAt: 'asc' } }),
    ]);
    return { checkins, trials, alerts, trialFinal, membershipExpiring, bookingsToday: bookings.length, ptsToday: new Set(bookings.map(b => b.ptId)).size, bookings };
  }
  registerDevice(actor: Actor, token: string) {
    requireRole(actor, Role.OWNER, Role.PT, Role.MEMBER);
    return this.prisma.deviceToken.upsert({ where: { token }, update: { userId: actor.sub }, create: { userId: actor.sub, token }, select: { id: true } });
  }
  removeDevice(actor: Actor, token: string) {
    requireRole(actor, Role.OWNER, Role.PT, Role.MEMBER);
    return this.prisma.deviceToken.deleteMany({ where: { userId: actor.sub, token } });
  }
}
