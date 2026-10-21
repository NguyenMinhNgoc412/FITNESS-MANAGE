import { Role } from '@prisma/client';
import { CustomersService } from './customers.service';

describe('customer history scope', () => {
  const customerId = '111111111111111111111111';
  const memberId = '222222222222222222222222';
  const actor = { sub: '333333333333333333333333', role: Role.OWNER, sessionId: 'session' };
  const prisma = {
    customer: { findUnique: jest.fn() },
    membership: { findMany: jest.fn() }, booking: { findMany: jest.fn() }, memberCheckin: { findMany: jest.fn() },
    externalPtPass: { findMany: jest.fn() }, externalPtRequest: { findMany: jest.fn() },
    salesAlert: { findMany: jest.fn() }, auditLog: { aggregateRaw: jest.fn() },
    profile: { findMany: jest.fn() },
    user: { findFirst: jest.fn() }, trialEntitlement: { findUnique: jest.fn() },
  };
  const service = new CustomersService(prisma as never, {} as never, {} as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.customer.findUnique.mockResolvedValue({ id: customerId, memberUserId: memberId });
    for (const collection of [prisma.membership, prisma.booking, prisma.memberCheckin, prisma.externalPtPass, prisma.externalPtRequest, prisma.salesAlert]) collection.findMany.mockResolvedValue([]);
    prisma.auditLog.aggregateRaw.mockResolvedValue([]);
    prisma.profile.findMany.mockResolvedValue([]);
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.trialEntitlement.findUnique.mockResolvedValue(null);
  });

  it('limits results to the customer and linked Member, omitting audit snapshots', async () => {
    prisma.booking.findMany.mockResolvedValue([{ id: '444444444444444444444444' }]);
    await service.history(actor, customerId, '2');
    expect(prisma.auditLog.aggregateRaw).toHaveBeenCalledWith({ pipeline: expect.arrayContaining([
      { $match: { $or: expect.arrayContaining([
        { resourceType: 'customer', resourceId: customerId },
        { resourceType: 'member', resourceId: memberId },
        { resourceType: 'booking', resourceId: '444444444444444444444444' },
        { resourceType: 'booking', $or: [{ 'before.memberId': memberId }, { 'after.memberId': memberId }] },
      ]) } },
      { $sort: { createdAt: -1, _id: -1 } }, { $skip: 30 }, { $limit: 30 },
      { $project: { _id: 0, id: { $toString: '$_id' }, action: 1, reason: 1, actorId: { $toString: '$actorId' }, createdAt: { $dateToString: { date: '$createdAt', format: '%Y-%m-%dT%H:%M:%S.%LZ', timezone: 'UTC' } } } },
    ]) });
  });

  it('keeps immutable booking references even when no current booking belongs to the Member', async () => {
    await service.history(actor, customerId);
    const match = prisma.auditLog.aggregateRaw.mock.calls[0][0].pipeline[0].$match;
    expect(match.$or).toContainEqual({ resourceType: 'booking', $or: [{ 'before.memberId': memberId }, { 'after.memberId': memberId }] });
  });

  it('returns only safe history fields and actor name, never snapshots', async () => {
    prisma.auditLog.aggregateRaw.mockResolvedValue([{ id: 'event', action: 'BOOKING_EDIT', actorId: actor.sub, createdAt: '2026-10-20T00:00:00.000Z', before: { memberId }, after: { memberId: 'other' } }]);
    prisma.profile.findMany.mockResolvedValue([{ userId: actor.sub, fullName: 'Synthetic actor' }]);
    expect(await service.history(actor, customerId)).toEqual([{ id: 'event', action: 'BOOKING_EDIT', createdAt: '2026-10-20T00:00:00.000Z', actorName: 'Synthetic actor' }]);
  });

  it.each([Role.PT, Role.MEMBER])('rejects %s before querying official profile or history', async role => {
    await expect(service.history({ ...actor, role }, customerId)).rejects.toThrow();
    await expect(service.detail({ ...actor, role }, customerId)).rejects.toThrow();
    await expect(service.checkins({ ...actor, role }, customerId)).rejects.toThrow();
    expect(prisma.customer.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
    expect(prisma.auditLog.aggregateRaw).not.toHaveBeenCalled();
  });

  it('reads a limited linked MEMBER profile, including locked account state', async () => {
    const member = { id: memberId, status: 'LOCKED', profile: { fullName: 'Synthetic Member', cccd: null } };
    prisma.user.findFirst.mockResolvedValue(member);
    const result = await service.detail(actor, customerId);
    expect(result.member).toEqual(member);
    expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { id: memberId, role: Role.MEMBER }, select: { id: true, status: true, profile: { select: { fullName: true, cccd: true } } } });
  });

  it('does not load official accounts for an unconverted Trial', async () => {
    prisma.customer.findUnique.mockResolvedValue({ id: customerId, memberUserId: null });
    expect((await service.detail(actor, customerId)).member).toBeNull();
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it.each([['2', 30], ['4', 90], ['5', 120]])('paginates check-ins on page %s beyond the former 100-row cap', async (n, skip) => {
    await service.checkins(actor, customerId, n);
    expect(prisma.memberCheckin.findMany).toHaveBeenCalledWith({
      where: { OR: [{ customerId }, { memberId }] },
      select: { id: true, checkedInAt: true, context: true, method: true, subjectType: true },
      skip, take: 30, orderBy: [{ checkedInAt: 'desc' }, { id: 'desc' }],
    });
  });

  it('validates check-in pagination before querying and rejects missing customers', async () => {
    await expect(service.checkins(actor, customerId, '0')).rejects.toThrow();
    expect(prisma.customer.findUnique).not.toHaveBeenCalled();
    prisma.customer.findUnique.mockResolvedValue(null);
    await expect(service.checkins(actor, customerId)).rejects.toThrow();
    expect(prisma.memberCheckin.findMany).not.toHaveBeenCalled();
  });
});
