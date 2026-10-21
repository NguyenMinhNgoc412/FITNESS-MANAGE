import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SalesAlertsService } from './sales-alerts.service';
@Injectable()
export class SalesAlertsScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SalesAlertsScheduler.name);
  private timer?: ReturnType<typeof setInterval>;
  constructor(private readonly service: SalesAlertsService) {}
  onModuleInit() {
    const run = () => { void this.service.refresh().catch(() => this.logger.error('SALES_ALERT_REFRESH_FAILED')); };
    this.timer = setInterval(run, 60000);
    this.timer.unref();
    run();
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
}
