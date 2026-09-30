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
    salesAlert: { findMany: jest.fn() }, auditLog: { findMany: jest.fn() },
    profile: { findMany: jest.fn() },
  };
  const service = new CustomersService(prisma as never, {} as never, {} as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.customer.findUnique.mockResolvedValue({ id: customerId, memberUserId: memberId });
    for (const collection of [prisma.membership, prisma.booking, prisma.memberCheckin, prisma.externalPtPass, prisma.externalPtRequest, prisma.salesAlert]) collection.findMany.mockResolvedValue([]);
    prisma.auditLog.findMany.mockResolvedValue([]);
    prisma.profile.findMany.mockResolvedValue([]);
  });

  it('limits results to the customer and linked Member, omitting audit snapshots', async () => {
    prisma.booking.findMany.mockResolvedValue([{ id: '444444444444444444444444' }]);
    await service.history(actor, customerId, '2');
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { OR: expect.arrayContaining([
        { resourceType: 'customer', resourceId: customerId },
        { resourceType: 'member', resourceId: memberId },
        { resourceType: 'booking', resourceId: '444444444444444444444444' },
      ]) },
      select: { id: true, action: true, reason: true, actorId: true, createdAt: true },
      skip: 30, take: 30,
    }));
  });

  it('rejects PT access before querying customer data', async () => {
    await expect(service.history({ ...actor, role: Role.PT }, customerId)).rejects.toThrow();
    expect(prisma.customer.findUnique).not.toHaveBeenCalled();
  });
});
