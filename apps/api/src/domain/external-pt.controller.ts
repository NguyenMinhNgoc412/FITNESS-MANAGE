import { Body, Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { Actor, CurrentUser, Roles } from '../common/access';
import { id, parse, phone, reason } from '../common/input';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { ExternalPtService } from './external-pt.service';
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExternalPtController {
  constructor(private readonly external: ExternalPtService) {}
  @Roles(Role.OWNER)
  @Post('members/:id/external-pt-passes')
  pass(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.external.create(a, parse(id, value), parse(z.object({ totalUses: z.number().int().positive().max(10000) }).strict(), b).totalUses, k); }
  @Roles(Role.OWNER)
  @Post('external-pt/checkin/initiate')
  initiate(@CurrentUser() a: Actor, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.external.initiate(a, parse(z.object({ phone, membershipId: id, passId: id }).strict(), b), k); }
  @Roles(Role.OWNER)
  @Post('external-pt/checkin/:id/owner-fallback-confirm')
  fallback(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    const input = parse(z.object({ reason, confirmedAtCounter: z.literal(true), pushUnavailable: z.literal(true) }).strict(), b);
    return this.external.confirm(a, parse(id, value), k, input.reason);
  }
  @Get('external-pt/requests') @Roles(Role.OWNER, Role.MEMBER)
  requests(@CurrentUser() a: Actor) { return this.external.requests(a); }
  @Get('members/me/external-pt-passes') @Roles(Role.MEMBER)
  myPasses(@CurrentUser() a: Actor) { return this.external.list(a, a.sub); }
  @Get('members/:id/external-pt-passes') @Roles(Role.OWNER, Role.MEMBER)
  passes(@CurrentUser() a: Actor, @Param('id') value: string) { return this.external.list(a, parse(id, value)); }
  @Post('external-pt/checkin/:id/confirm') @Roles(Role.MEMBER)
  confirm(@CurrentUser() a: Actor, @Param('id') value: string, @Headers('idempotency-key') k?: string) { return this.external.confirm(a, parse(id, value), k); }
}
