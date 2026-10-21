import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Actor, CurrentUser, Roles } from '../common/access';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { DashboardService } from './dashboard.service';
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}
  @Roles(Role.OWNER)
  @Get('dashboard')
  dashboard(@CurrentUser() a: Actor) { return this.dashboardService.dashboard(a); }
}
