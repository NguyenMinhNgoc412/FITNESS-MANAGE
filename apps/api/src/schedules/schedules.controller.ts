import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles';
import { RolesGuard } from '../common/roles.guard';
import { CreateScheduleDto, UpdateScheduleDto } from './dto';
import { SchedulesService } from './schedules.service';
@Controller('schedules') @UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
  constructor(private readonly schedules: SchedulesService) {}
  @Post() @Roles(Role.OWNER_ADMIN) create(@CurrentUser() user: AuthUser, @Body() dto: CreateScheduleDto) { return this.schedules.create(user.sub, dto); }
  @Get() @Roles(Role.OWNER_ADMIN, Role.PT, Role.MEMBER) list(@CurrentUser() user: AuthUser) { return this.schedules.list(user.sub, user.role as Role); }
  @Patch(':scheduleId') @Roles(Role.OWNER_ADMIN) update(@CurrentUser() user: AuthUser, @Param('scheduleId') scheduleId: string, @Body() dto: UpdateScheduleDto) { return this.schedules.update(user.sub, scheduleId, dto); }
}
