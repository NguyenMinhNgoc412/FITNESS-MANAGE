import { Module } from '@nestjs/common';
import { ExternalPtService } from './external-pt.service';
import { ExternalPtController } from './external-pt.controller';
import { CheckinsModule } from './checkins.module';
import { NotificationsModule } from './notifications.module';
@Module({ imports: [CheckinsModule, NotificationsModule], controllers: [ExternalPtController], providers: [ExternalPtService] })
export class ExternalPtModule {}
