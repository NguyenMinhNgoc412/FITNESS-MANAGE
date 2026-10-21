import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { NotificationsModule } from './notifications.module';
@Module({ imports: [NotificationsModule], controllers: [BookingsController], providers: [BookingsService] })
export class BookingsModule {}
