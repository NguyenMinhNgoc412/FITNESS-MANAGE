import { Role } from '@prisma/client';
import { Actor } from '../common/access';
import { PrismaService } from '../prisma.service';
import { DashboardService } from './dashboard.service';

describe('Owner dashboard reads', () => {
  const actor: Actor = { sub: 'synthetic-owner', sessionId: 'synthetic-session', role: Role.OWNER };
  const db = {
    memberCheckin: { count: jest.fn() },
    trialEntitlement: { count: jest.fn() },
    salesAlert: { count: jest.fn() },
    booking: { findMany: jest.fn() },
    $transaction: jest.fn().mockRejectedValue(new Error('Writes unavailable')),
  };
  const service = new DashboardService(db as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    db.memberCheckin.count.mockResolvedValue(3);
    db.trialEntitlement.count.mockResolvedValue(2);
    db.salesAlert.count.mockResolvedValueOnce(4).mockResolvedValueOnce(1).mockResolvedValueOnce(3);
    db.booking.findMany.mockResolvedValue([{ ptId: 'synthetic-pt' }, { ptId: 'synthetic-pt' }]);
  });
  afterEach(() => jest.useRealTimers());

  it.each([
    ['2026-12-31T16:59:59.999Z', '2026-12-30T17:00:00.000Z', '2026-12-31T17:00:00.000Z'],
    ['2026-12-31T17:00:00.000Z', '2026-12-31T17:00:00.000Z', '2027-01-01T17:00:00.000Z'],
    ['2026-10-20T01:00:00.000Z', '2026-10-19T17:00:00.000Z', '2026-10-20T17:00:00.000Z'],
  ])('uses one bounded UTC+7 day for check-ins and bookings at %s', async (now, start, end) => {
    jest.setSystemTime(new Date(now));
    const result = await service.dashboard(actor);
    const range = { gte: new Date(start), lt: new Date(end) };
    expect(db.memberCheckin.count).toHaveBeenCalledWith({ where: { checkedInAt: range } });
    expect(db.booking.findMany).toHaveBeenCalledWith({ where: { status: 'SCHEDULED', startAt: range }, orderBy: { startAt: 'asc' } });
    expect(result).toMatchObject({ checkins: 3, trials: 2, alerts: 4, trialFinal: 1, membershipExpiring: 3, bookingsToday: 2, ptsToday: 1 });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it.each([Role.PT, Role.MEMBER])('rejects %s before reading data', async role => {
    await expect(service.dashboard({ ...actor, role })).rejects.toThrow();
    expect(db.memberCheckin.count).not.toHaveBeenCalled();
    expect(db.trialEntitlement.count).not.toHaveBeenCalled();
    expect(db.salesAlert.count).not.toHaveBeenCalled();
    expect(db.booking.findMany).not.toHaveBeenCalled();
  });
});
