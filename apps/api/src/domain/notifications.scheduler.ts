import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
@Injectable()
export class NotificationsScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsScheduler.name);
  private timer?: ReturnType<typeof setInterval>;
  constructor(private readonly service: NotificationsService) {}
  onModuleInit() {
    const run = () => { void this.service.deliver().catch(() => this.logger.error('NOTIFICATION_DELIVERY_FAILED')); };
    this.timer = setInterval(run, 5000);
    this.timer.unref();
    run();
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
}
