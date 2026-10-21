import { Module } from '@nestjs/common';
import { SalesAlertsService } from './sales-alerts.service';
import { SalesAlertsController } from './sales-alerts.controller';
import { MembershipsModule } from './memberships.module';
import { SalesAlertsScheduler } from './sales-alerts.scheduler';
@Module({ imports: [MembershipsModule], controllers: [SalesAlertsController], providers: [SalesAlertsService, SalesAlertsScheduler], exports: [SalesAlertsService] })
export class SalesAlertsModule {}
