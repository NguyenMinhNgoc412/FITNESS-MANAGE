import { Role } from '@prisma/client';
import { Actor } from '../common/access';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma.service';
import { reportMonthRange, summarizePackages } from './reporting';

describe('Owner reports', () => {
  const actor: Actor = { sub: 'synthetic-owner', sessionId: 'synthetic-session', role: Role.OWNER };
  const prisma = { membership: { groupBy: jest.fn() }, memberCheckin: { groupBy: jest.fn() }, ptAttendanceLog: { count: jest.fn() } };
  const service = new ReportsService(prisma as unknown as PrismaService);
  beforeEach(() => jest.resetAllMocks());
  it('counts people once across renewals and separates package modes', () => {
    expect(summarizePackages([
      { name: 'Gói A', mode: 'SESSION_BASED', memberId: 'a', _count: { _all: 3 } },
      { name: 'Gói A', mode: 'SESSION_BASED', memberId: 'b', _count: { _all: 1 } },
      { name: 'Gói A', mode: 'TIME_BASED', memberId: 'a', _count: { _all: 1 } },
    ])).toEqual([
      { name: 'Gói A', mode: 'SESSION_BASED', memberCount: 2, registrations: 4 },
      { name: 'Gói A', mode: 'TIME_BASED', memberCount: 1, registrations: 1 },
    ]);
    expect(summarizePackages([])).toEqual([]);
  });
  it('uses UTC+7 month boundaries including leap years and year rollover', () => {
    const february = reportMonthRange(2024, 2), december = reportMonthRange(2026, 12);
    expect(february.gte.toISOString()).toBe('2024-01-31T17:00:00.000Z');
    expect(february.lt.toISOString()).toBe('2024-02-29T17:00:00.000Z');
    expect(december.lt.toISOString()).toBe('2026-12-31T17:00:00.000Z');
  });
  it.each([Role.MEMBER, Role.PT])('rejects %s before any database read', async role => {
    await expect(service.packageStatistics({ ...actor, role })).rejects.toThrow();
    await expect(service.monthlyCheckins({ ...actor, role }, 2026)).rejects.toThrow();
    expect(prisma.membership.groupBy).not.toHaveBeenCalled();
    expect(prisma.memberCheckin.groupBy).not.toHaveBeenCalled();
    expect(prisma.ptAttendanceLog.count).not.toHaveBeenCalled();
  });
  it('returns all 12 months, zero-fills missing subjects and keeps PT separate', async () => {
    prisma.memberCheckin.groupBy.mockResolvedValueOnce([{ subjectType: 'MEMBER', _count: { _all: 4 } }, { subjectType: 'TRIAL', _count: { _all: 2 } }]).mockResolvedValue([]);
    prisma.ptAttendanceLog.count.mockResolvedValueOnce(3).mockResolvedValue(0);
    const result = await service.monthlyCheckins(actor, 2026);
    expect(result.months).toHaveLength(12);
    expect(result.months[0]).toEqual({ month: 1, member: 4, trial: 2, total: 6, pt: 3 });
    expect(result.months[1]).toEqual({ month: 2, member: 0, trial: 0, total: 0, pt: 0 });
    expect(prisma.memberCheckin.groupBy.mock.calls[0][0].where.checkedInAt).toEqual(reportMonthRange(2026, 1));
  });
});
