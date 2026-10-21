import { Body, Controller, Get, Headers, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { Actor, CurrentUser, Roles } from '../common/access';
import { id, parse, salesAlertFilter } from '../common/input';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { SalesAlertsService } from './sales-alerts.service';
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesAlertsController {
  constructor(private readonly sales: SalesAlertsService) {}
  @Roles(Role.OWNER)
  @Get('sales-alerts')
  alerts(@CurrentUser() a: Actor, @Query('page') n?: string, @Query('status') status?: string) { return this.sales.alerts(a, n, status === undefined ? 'OPEN' : parse(salesAlertFilter, status)); }
  @Roles(Role.OWNER)
  @Patch('sales-alerts/:id')
  updateAlert(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    const alertId = parse(id, value), input = parse(z.object({ status: z.enum(['OPEN', 'CONTACTED', 'CONVERTED_RENEWED', 'CLOSED_NOT_CONTINUING']), ownerNote: z.string().max(500).optional() }).strict(), b);
    return this.sales.updateAlert(a, alertId, input, k);
  }
}
