import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { OwnerController, ReadController, SelfController } from './domain/domain.controller';
import { CustomersService } from './domain/customers.service';
import { MembershipsService } from './domain/memberships.service';
import { PeopleService } from './domain/people.service';
import { BookingsService } from './domain/bookings.service';
import { CheckinsService } from './domain/checkins.service';
import { ExternalPtService } from './domain/external-pt.service';
import { NotificationsService } from './domain/notifications.service';
import { AiController } from './ai/ai.controller';
import { OperationsService } from './domain/operations.service';
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule],
  controllers: [SelfController, OwnerController, ReadController, AiController],
  providers: [CustomersService, MembershipsService, PeopleService, BookingsService, CheckinsService, ExternalPtService, NotificationsService, OperationsService],
})
export class AppModule {}
