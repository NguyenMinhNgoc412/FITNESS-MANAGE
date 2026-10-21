import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Actor, requireRole } from '../common/access';
import { PrismaService } from '../prisma.service';
import { checkinDayRange } from './checkin-day';
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}
  async dashboard(actor: Actor) {
    requireRole(actor, Role.OWNER);
    const today = checkinDayRange(new Date());
    const [checkins, trials, alerts, trialFinal, membershipExpiring, bookings] = await Promise.all([
      this.prisma.memberCheckin.count({ where: { checkedInAt: today } }),
      this.prisma.trialEntitlement.count({ where: { status: 'ACTIVE' } }),
      this.prisma.salesAlert.count({ where: { status: 'OPEN' } }),
      this.prisma.salesAlert.count({ where: { status: 'OPEN', type: 'TRIAL_FINAL' } }),
      this.prisma.salesAlert.count({ where: { status: 'OPEN', type: { in: ['MEMBERSHIP_EXPIRING_TIME', 'MEMBERSHIP_EXPIRING_SESSION'] } } }),
      this.prisma.booking.findMany({ where: { status: 'SCHEDULED', startAt: today }, orderBy: { startAt: 'asc' } }),
    ]);
    return { checkins, trials, alerts, trialFinal, membershipExpiring, bookingsToday: bookings.length, ptsToday: new Set(bookings.map(b => b.ptId)).size, bookings };
  }
}
