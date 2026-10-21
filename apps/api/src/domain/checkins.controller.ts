import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { Actor, CurrentUser, Roles } from '../common/access';
import { id, parse, parseMemberCheckin } from '../common/input';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { CheckinsService } from './checkins.service';
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CheckinsController {
  constructor(private readonly checkins: CheckinsService) {}
  @Roles(Role.OWNER)
  @Post('checkins/resolve-qr')
  resolve(@CurrentUser() a: Actor, @Body() b: unknown) { return this.checkins.resolve(a, parse(z.object({ token: z.string().min(1).max(2000) }).strict(), b).token); }
  @Roles(Role.OWNER)
  @Post('checkins/member')
  memberCheckin(@CurrentUser() a: Actor, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    return this.checkins.member(a, parseMemberCheckin(b), k);
  }
  @Roles(Role.OWNER)
  @Get('checkins')
  logs(@CurrentUser() a: Actor, @Query('page') n?: string) { return this.checkins.logs(a, n); }
  @Roles(Role.OWNER)
  @Get('pt/attendance')
  ptLogs(@CurrentUser() a: Actor, @Query('page') n?: string) { return this.checkins.attendance(a, undefined, n); }
  @Get('members/me/qr') @Roles(Role.MEMBER)
  qr(@CurrentUser() a: Actor) { return this.checkins.qr(a); }
  @Get('members/me/checkins') @Roles(Role.MEMBER)
  history(@CurrentUser() a: Actor, @Query('page') n?: string) { return this.checkins.logs(a, n); }
  @Get('pt/me/qr') @Roles(Role.PT)
  ptQr(@CurrentUser() a: Actor) { return this.checkins.qr(a); }
  @Post('checkins/pt') @Roles(Role.OWNER)
  attendance(@CurrentUser() a: Actor, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.checkins.pt(a, parse(z.object({ token: z.string().min(1).max(2000) }).strict(), b).token, k); }
  @Get('pt/me/attendance') @Roles(Role.PT)
  attendanceHistory(@CurrentUser() a: Actor, @Query('page') n?: string) { return this.checkins.attendance(a, undefined, n); }
  @Roles(Role.OWNER)
  @Get('pt/:id/attendance')
  ptLog(@CurrentUser() a: Actor, @Param('id') value: string, @Query('page') n?: string) { return this.checkins.attendance(a, parse(id, value), n); }
}
