import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma.service';

describe('Notification delivery leases', () => {
  const pending = { id: 'synthetic-notice', recipientId: 'synthetic-member', type: 'BOOKING_CREATED', resourceId: 'synthetic-booking', attempts: 0 };
  const originalFetch = global.fetch;
  let service: NotificationsService;
  const db = {
    notification: { findMany: jest.fn(), updateMany: jest.fn() },
    deviceToken: { findMany: jest.fn() },
  };
  const ticket = (statuses: string[] = ['ok']) => ({ ok: true, status: 200, json: async () => ({ data: statuses.map(status => ({ status })) }) });
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-10-20T00:00:00Z'));
    service = new NotificationsService(db as unknown as PrismaService);
    db.notification.findMany.mockResolvedValue([pending]);
    db.notification.updateMany.mockResolvedValue({ count: 1 });
    db.deviceToken.findMany.mockResolvedValue([{ token: 'synthetic-device' }]);
    global.fetch = jest.fn().mockResolvedValue(ticket());
  });
  afterEach(() => { global.fetch = originalFetch; jest.useRealTimers(); });

  it('recovers expired and legacy claims but fails exhausted ones', async () => {
    await service.deliver();
    const [exhausted, recovered] = db.notification.updateMany.mock.calls.map(([arg]) => arg);
    expect(exhausted.where.AND[0]).toEqual({ status: 'SENDING', OR: [{ leaseUntil: { lte: new Date() } }, { leaseUntil: null }, { leaseUntil: { isSet: false } }] });
    expect(exhausted.where.AND[1]).toEqual({ attempts: { gte: 3 } });
    expect(exhausted.data.status).toBe('FAILED');
    expect(recovered.data).toMatchObject({ status: 'PENDING', claimToken: null, leaseUntil: null });
    expect(recovered.where.AND[1]).toEqual({ attempts: { lt: 3 } });
  });
  it('only sends after an atomic claim and fences completion with that claim token', async () => {
    await service.deliver();
    const claim = db.notification.updateMany.mock.calls[2][0], complete = db.notification.updateMany.mock.calls[3][0];
    expect(claim.data).toMatchObject({ status: 'SENDING', attempts: 1, leaseUntil: new Date(Date.now() + 60000) });
    expect(claim.where.AND[1]).toEqual({ attempts: 0 });
    expect(complete.where).toEqual({ id: pending.id, status: 'SENDING', claimToken: claim.data.claimToken });
    expect(complete.data).toMatchObject({ status: 'SENT', leaseUntil: null, claimToken: null });
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)[0].data.notificationId).toBe(pending.id);
  });
  it('does not send when another worker won the claim', async () => {
    db.notification.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 0 });
    await service.deliver();
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it.each([429, 503])('backs off transient HTTP %s without blocking the main mutation', async status => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status });
    await service.deliver();
    expect(db.notification.updateMany.mock.calls[3][0].data).toMatchObject({ status: 'PENDING', nextAttemptAt: new Date(Date.now() + 30000), errorCode: 'PUSH_UNAVAILABLE' });
  });
  it('ends retries after three attempts', async () => {
    db.notification.findMany.mockResolvedValue([{ ...pending, attempts: 2 }]);
    (global.fetch as jest.Mock).mockRejectedValue(new Error('synthetic transport failure'));
    await service.deliver();
    expect(db.notification.updateMany.mock.calls[3][0].data).toMatchObject({ status: 'FAILED', nextAttemptAt: null });
  });
  it('marks missing devices unavailable without retrying', async () => {
    db.deviceToken.findMany.mockResolvedValue([]);
    await service.deliver();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(db.notification.updateMany.mock.calls[3][0].data).toMatchObject({ status: 'UNAVAILABLE', errorCode: 'NO_DEVICE' });
  });
  it('does not replay partially accepted multi-device batches', async () => {
    db.deviceToken.findMany.mockResolvedValue([{ token: 'synthetic-a' }, { token: 'synthetic-b' }]);
    (global.fetch as jest.Mock).mockResolvedValue(ticket(['ok', 'error']));
    await service.deliver();
    expect(db.notification.updateMany.mock.calls[3][0].data.status).toBe('FAILED');
  });
  it('prevents overlapping local runs and releases the guard after a database error', async () => {
    let release!: (value: unknown) => void;
    db.notification.updateMany.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    const first = service.deliver();
    await service.deliver();
    expect(db.notification.updateMany).toHaveBeenCalledTimes(1);
    release({ count: 0 });
    await first;
    db.notification.updateMany.mockRejectedValueOnce(new Error('synthetic database error'));
    await expect(service.deliver()).rejects.toThrow('synthetic database error');
    await service.deliver();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
