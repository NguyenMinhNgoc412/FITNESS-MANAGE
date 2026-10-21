import { Body, Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { Actor, CurrentUser, Roles } from '../common/access';
import { id, membershipInput, parse, reason } from '../common/input';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { MembershipsService } from './memberships.service';
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}
  @Roles(Role.OWNER)
  @Post('members/:id/memberships')
  package(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.memberships.create(a, parse(id, value), parse(membershipInput, b), k); }
  @Roles(Role.OWNER)
  @Post('memberships/:id/renew')
  renew(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.memberships.renew(a, parse(id, value), parse(membershipInput, b), k); }
  @Roles(Role.OWNER)
  @Post('memberships/:id/cancel')
  cancelPackage(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.memberships.cancel(a, parse(id, value), parse(z.object({ reason }).strict(), b).reason, k); }
  @Get('members/:id/memberships') @Roles(Role.OWNER, Role.MEMBER)
  packages(@CurrentUser() a: Actor, @Param('id') value: string) { return this.memberships.list(a, parse(id, value)); }
}
