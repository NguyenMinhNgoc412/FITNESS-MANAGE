import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AiAnalysisModule } from './ai-analysis/ai-analysis.module';
import { AttendanceModule } from './attendance/attendance.module';
import { CheckinsModule } from './checkins/checkins.module';
import { GuestsModule } from './guests/guests.module';
import { MembersModule } from './members/members.module';
import { OwnerAssistantModule } from './owner-assistant/owner-assistant.module';
import { PrismaModule } from './prisma.module';
import { PtModule } from './pt/pt.module';
import { SchedulesModule } from './schedules/schedules.module';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, PtModule, MembersModule, SchedulesModule, AttendanceModule, CheckinsModule, GuestsModule, AiAnalysisModule, OwnerAssistantModule] })
export class AppModule {}
