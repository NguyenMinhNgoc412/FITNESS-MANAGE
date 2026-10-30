import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { AiController } from './ai/ai.controller';
import { MembershipsModule } from './domain/memberships.module';
import { CustomersModule } from './domain/customers.module';
import { PeopleModule } from './domain/people.module';
import { CheckinsModule } from './domain/checkins.module';
import { NotificationsModule } from './domain/notifications.module';
import { BookingsModule } from './domain/bookings.module';
import { ExternalPtModule } from './domain/external-pt.module';
import { SalesAlertsModule } from './domain/sales-alerts.module';
import { ReportsModule } from './domain/reports.module';
import { DashboardModule } from './domain/dashboard.module';
import { AuditModule } from './domain/audit.module';
import { WorkoutsModule } from './domain/workouts.module';
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, MembershipsModule, CustomersModule, PeopleModule, CheckinsModule, NotificationsModule, BookingsModule, ExternalPtModule, SalesAlertsModule, ReportsModule, DashboardModule, AuditModule, WorkoutsModule],
  controllers: [AiController],
})
export class AppModule {}
