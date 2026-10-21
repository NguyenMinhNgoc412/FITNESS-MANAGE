import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { Actor, CurrentUser, Roles } from '../common/access';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { ReportsService } from './reports.service';
import { parse } from '../common/input';
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}
  @Roles(Role.OWNER)
  @Get('reports/packages')
  packageStatistics(@CurrentUser() a: Actor) { return this.reports.packageStatistics(a); }
  @Roles(Role.OWNER)
  @Get('reports/checkins')
  monthlyCheckins(@CurrentUser() a: Actor, @Query('year') year: string) {
    return this.reports.monthlyCheckins(a, Number(parse(z.string().regex(/^(19|20|21)\d{2}$/), year)));
  }
}
