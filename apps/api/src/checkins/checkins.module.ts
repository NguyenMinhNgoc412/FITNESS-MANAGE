import { Module } from '@nestjs/common';
import { AttendanceModule } from '../attendance/attendance.module';
import { AuthModule } from '../auth/auth.module';
import { CheckinsController } from './checkins.controller';
import { CheckinsService } from './checkins.service';
@Module({ imports: [AuthModule, AttendanceModule], controllers: [CheckinsController], providers: [CheckinsService] }) export class CheckinsModule {}
