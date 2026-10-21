import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Actor, requireRole } from '../common/access';
import { PrismaService } from '../prisma.service';
import { reportMonthRange, summarizePackages } from './reporting';
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}
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
}
