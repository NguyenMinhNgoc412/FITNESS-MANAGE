import { Role } from '@prisma/client';
import { SalesAlertsService } from './sales-alerts.service';
import { SalesAlertsController } from './sales-alerts.controller';
import { SalesAlertFilter } from '../common/input';

describe('Sales alert queue filters', () => {
  const actor = { sub: 'synthetic-owner', sessionId: 'synthetic-session', role: Role.OWNER };
  const prisma = { salesAlert: { findMany: jest.fn() } };
  const tx = { run: jest.fn() };
  const service = new SalesAlertsService(prisma as never, tx as never, {} as never);
  beforeEach(() => { jest.resetAllMocks(); prisma.salesAlert.findMany.mockResolvedValue([]); tx.run.mockResolvedValue(undefined); });

  it('defaults to OPEN so recently closed alerts cannot displace unresolved ones', async () => {
    await service.alerts(actor);
    expect(prisma.salesAlert.findMany).toHaveBeenCalledWith({ where: { status: 'OPEN' }, skip: 0, take: 30, orderBy: [{ triggeredAt: 'desc' }, { id: 'desc' }] });
  });
  it.each<SalesAlertFilter>(['OPEN', 'CONTACTED', 'CONVERTED_RENEWED', 'CLOSED_NOT_CONTINUING', 'ALL'])('filters %s before paginating', async status => {
    await service.alerts(actor, '2', status);
    expect(prisma.salesAlert.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: status === 'ALL' ? {} : { status }, skip: 30, take: 30 }));
  });
  it.each([Role.PT, Role.MEMBER])('rejects %s before refresh or database access', async role => {
    await expect(service.alerts({ ...actor, role })).rejects.toThrow();
    expect(tx.run).not.toHaveBeenCalled(); expect(prisma.salesAlert.findMany).not.toHaveBeenCalled();
  });
  it('rejects malformed filter values at the controller boundary', () => {
    const list = { alerts: jest.fn() }, controller = new SalesAlertsController(list as never);
    for (const status of ['', 'UNKNOWN', 'open', '{"$ne":"CLOSED"}']) expect(() => controller.alerts(actor, '1', status)).toThrow();
    expect(list.alerts).not.toHaveBeenCalled();
    controller.alerts(actor);
    expect(list.alerts).toHaveBeenCalledWith(actor, undefined, 'OPEN');
  });
});
