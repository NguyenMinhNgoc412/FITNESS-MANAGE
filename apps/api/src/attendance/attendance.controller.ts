import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles';
import { RolesGuard } from '../common/roles.guard';
import { AttendanceService } from './attendance.service';
@Controller('attendance') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.OWNER_ADMIN)
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}
  @Get('overview') overview() { return this.attendance.overview(); }
  @Get('review') review() { return this.attendance.reviewList(); }
  @Get(':scheduleId') detail(@Param('scheduleId') scheduleId: string) { return this.attendance.detail(scheduleId); }
  @Post(':scheduleId/reconcile') reconcile(@Param('scheduleId') scheduleId: string) { return this.attendance.reconcileSchedule(scheduleId); }
}
