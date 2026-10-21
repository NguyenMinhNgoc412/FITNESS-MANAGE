import { Logger } from '@nestjs/common';
import { NotificationsScheduler } from './notifications.scheduler';
import { NotificationsService } from './notifications.service';
import { SalesAlertsScheduler } from './sales-alerts.scheduler';
import { SalesAlertsService } from './sales-alerts.service';

describe.each([
  {
    name: 'notifications', interval: 5000, code: 'NOTIFICATION_DELIVERY_FAILED',
    create: (run: jest.Mock) => new NotificationsScheduler({ deliver: run } as unknown as NotificationsService),
  },
  {
    name: 'sales alerts', interval: 60000, code: 'SALES_ALERT_REFRESH_FAILED',
    create: (run: jest.Mock) => new SalesAlertsScheduler({ refresh: run } as unknown as SalesAlertsService),
  },
])('$name scheduler', ({ interval, code, create }) => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

  it('logs only a fixed safe code on failure, retries next tick and stops on destroy', async () => {
    const log = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const run = jest.fn().mockRejectedValueOnce(new Error('synthetic-private-diagnostic')).mockResolvedValue(undefined);
    const scheduler = create(run);
    try {
      scheduler.onModuleInit();
      await jest.advanceTimersByTimeAsync(0);
      expect(run).toHaveBeenCalledTimes(1);
      expect(log.mock.calls).toEqual([[code]]);
      await jest.advanceTimersByTimeAsync(interval);
      expect(run).toHaveBeenCalledTimes(2);
      expect(log).toHaveBeenCalledTimes(1);
    } finally { scheduler.onModuleDestroy(); }
    await jest.advanceTimersByTimeAsync(interval * 2);
    expect(run).toHaveBeenCalledTimes(2);
  });
});
