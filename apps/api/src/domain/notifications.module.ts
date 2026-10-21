import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsScheduler } from './notifications.scheduler';
import { DeviceTokensService } from './device-tokens.service';
import { DeviceTokensController } from './device-tokens.controller';
@Module({ controllers: [DeviceTokensController], providers: [NotificationsService, NotificationsScheduler, DeviceTokensService], exports: [NotificationsService] })
export class NotificationsModule {}
