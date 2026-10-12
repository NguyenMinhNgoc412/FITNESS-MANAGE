import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { Actor, CurrentUser, Roles } from '../common/access';
import { bookingInput, cccd, id, membershipInput, parse, parseConversion, parseMemberCheckin, password, phone, reason, text } from '../common/input';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { CustomersService } from './customers.service';
import { MembershipsService } from './memberships.service';
import { PeopleService } from './people.service';
import { BookingsService } from './bookings.service';
import { CheckinsService } from './checkins.service';
import { ExternalPtService } from './external-pt.service';
import { OperationsService } from './operations.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER)
export class OwnerController {
  constructor(
    private readonly customers: CustomersService, private readonly memberships: MembershipsService,
    private readonly people: PeopleService, private readonly bookings: BookingsService,
    private readonly checkins: CheckinsService, private readonly external: ExternalPtService,
    private readonly operations: OperationsService,
  ) {}
  @Post('customers/trials')
  trial(@CurrentUser() a: Actor, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    return this.customers.create(a, parse(z.object({ fullName: text, phone }).strict(), b), k);
  }
  @Get('customers/search')
  search(@CurrentUser() a: Actor, @Query('phone') p?: string, @Query('name') name?: string, @Query('cccd') card?: string, @Query('page') n?: string) {
    return this.customers.search(a, { phone: p ? parse(phone, p) : undefined, name: name ? parse(text, name) : undefined, cccd: card ? parse(cccd, card) : undefined }, n);
  }
  @Get('customers/:id')
  customer(@CurrentUser() a: Actor, @Param('id') value: string) { return this.customers.detail(a, parse(id, value)); }
  @Get('customers/:id/history')
  customerHistory(@CurrentUser() a: Actor, @Param('id') value: string, @Query('page') n?: string) { return this.customers.history(a, parse(id, value), n); }
  @Post('customers/:id/trial-checkin')
  trialCheckin(@CurrentUser() a: Actor, @Param('id') value: string, @Headers('idempotency-key') k?: string) { return this.customers.checkin(a, parse(id, value), k); }
  @Post('customers/:id/convert-to-member')
  convert(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    return this.customers.convert(a, parse(id, value), parseConversion(b), k);
  }
  @Get('people')
  peopleList(@CurrentUser() a: Actor, @Query('role') role: string, @Query('page') n?: string) { return this.people.list(a, parse(z.enum(['PT', 'MEMBER']), role), n); }
  @Post('people')
  createPerson(@CurrentUser() a: Actor, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    return this.people.create(a, parse(z.object({ fullName: text, phone, cccd, password, role: z.enum(['PT', 'MEMBER']) }).strict(), b), k);
  }
  @Patch('people/:id')
  updatePerson(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    return this.people.update(a, parse(id, value), parse(z.object({ fullName: text.optional(), cccd: cccd.optional(), status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']).optional(), dob: z.string().datetime().optional(), gender: text.optional(), address: text.optional(), reason }).strict(), b), k);
  }
  @Post('members/:id/memberships')
  package(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.memberships.create(a, parse(id, value), parse(membershipInput, b), k); }
  @Post('memberships/:id/renew')
  renew(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.memberships.renew(a, parse(id, value), parse(membershipInput, b), k); }
  @Post('memberships/:id/cancel')
  cancelPackage(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.memberships.cancel(a, parse(id, value), parse(z.object({ reason }).strict(), b).reason, k); }
  @Post('members/:id/pt-assignment')
  assign(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    const input = parse(z.object({ ptId: id, reason }).strict(), b);
    return this.people.assign(a, parse(id, value), input.ptId, input.reason, k);
  }
  @Patch('members/:id/pt-assignment')
  changeAssignment(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    return this.assign(a, value, b, k);
  }
  @Delete('members/:id/pt-assignment')
  unassign(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.people.assign(a, parse(id, value), null, parse(z.object({ reason }).strict(), b).reason, k); }
  @Get('members/:id/pt-assignment/history')
  assignments(@CurrentUser() a: Actor, @Param('id') value: string) { return this.people.history(a, parse(id, value)); }
  @Post('bookings')
  book(@CurrentUser() a: Actor, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.bookings.save(a, parse(bookingInput, b), k); }
  @Patch('bookings/:id')
  editBooking(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    const { reason: why, ...input } = parse(bookingInput.extend({ reason }), b);
    return this.bookings.save(a, input, k, parse(id, value), why);
  }
  @Post('bookings/:id/cancel')
  cancelBooking(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.bookings.cancel(a, parse(id, value), parse(z.object({ reason }).strict(), b).reason, k); }
  @Post('checkins/resolve-qr')
  resolve(@CurrentUser() a: Actor, @Body() b: unknown) { return this.checkins.resolve(a, parse(z.object({ token: z.string().min(1).max(2000) }).strict(), b).token); }
  @Post('checkins/member')
  memberCheckin(@CurrentUser() a: Actor, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    return this.checkins.member(a, parseMemberCheckin(b), k);
  }
  @Get('checkins')
  logs(@CurrentUser() a: Actor, @Query('page') n?: string) { return this.checkins.logs(a, n); }
  @Get('pt/attendance')
  ptLogs(@CurrentUser() a: Actor, @Query('page') n?: string) { return this.checkins.attendance(a, undefined, n); }
  @Get('pt/:id/attendance')
  ptLog(@CurrentUser() a: Actor, @Param('id') value: string, @Query('page') n?: string) { return this.checkins.attendance(a, parse(id, value), n); }
  @Post('members/:id/external-pt-passes')
  pass(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.external.create(a, parse(id, value), parse(z.object({ totalUses: z.number().int().positive().max(10000) }).strict(), b).totalUses, k); }
  @Post('external-pt/checkin/initiate')
  initiate(@CurrentUser() a: Actor, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.external.initiate(a, parse(z.object({ phone, membershipId: id, passId: id }).strict(), b), k); }
  @Post('external-pt/checkin/:id/owner-fallback-confirm')
  fallback(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    const input = parse(z.object({ reason, confirmedAtCounter: z.literal(true), pushUnavailable: z.literal(true) }).strict(), b);
    return this.external.confirm(a, parse(id, value), k, input.reason);
  }
  @Get('sales-alerts')
  alerts(@CurrentUser() a: Actor, @Query('page') n?: string) { return this.operations.alerts(a, n); }
  @Patch('sales-alerts/:id')
  updateAlert(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    const alertId = parse(id, value), input = parse(z.object({ status: z.enum(['OPEN', 'CONTACTED', 'CONVERTED_RENEWED', 'CLOSED_NOT_CONTINUING']), ownerNote: z.string().max(500).optional() }).strict(), b);
    return this.operations.updateAlert(a, alertId, input, k);
  }
  @Get('audit')
  audit(@CurrentUser() a: Actor, @Query('page') n?: string) { return this.operations.logs(a, n); }
  @Get('dashboard')
  dashboard(@CurrentUser() a: Actor) { return this.operations.dashboard(a); }
  @Get('reports/packages')
  packageStatistics(@CurrentUser() a: Actor) { return this.operations.packageStatistics(a); }
  @Get('reports/checkins')
  monthlyCheckins(@CurrentUser() a: Actor, @Query('year') year: string) {
    return this.operations.monthlyCheckins(a, Number(parse(z.string().regex(/^(19|20|21)\d{2}$/), year)));
  }
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReadController {
  constructor(private readonly memberships: MembershipsService, private readonly bookings: BookingsService, private readonly external: ExternalPtService) {}
  @Get('bookings') @Roles(Role.OWNER, Role.PT, Role.MEMBER)
  bookingsList(@CurrentUser() a: Actor, @Query('page') n?: string, @Query('from') from?: string, @Query('to') to?: string, @Query('memberId') memberId?: string) {
    return this.bookings.list(a, n, from ? parse(z.string().datetime(), from) : undefined, to ? parse(z.string().datetime(), to) : undefined, memberId ? parse(id, memberId) : undefined);
  }
  @Get('bookings/:id') @Roles(Role.OWNER, Role.PT, Role.MEMBER)
  booking(@CurrentUser() a: Actor, @Param('id') value: string) { return this.bookings.detail(a, parse(id, value)); }
  @Get('members/:id/memberships') @Roles(Role.OWNER, Role.MEMBER)
  packages(@CurrentUser() a: Actor, @Param('id') value: string) { return this.memberships.list(a, parse(id, value)); }
  @Get('members/:id/external-pt-passes') @Roles(Role.OWNER, Role.MEMBER)
  passes(@CurrentUser() a: Actor, @Param('id') value: string) { return this.external.list(a, parse(id, value)); }
  @Get('external-pt/requests') @Roles(Role.OWNER, Role.MEMBER)
  requests(@CurrentUser() a: Actor) { return this.external.requests(a); }
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SelfController {
  constructor(private readonly people: PeopleService, private readonly checkins: CheckinsService, private readonly external: ExternalPtService, private readonly operations: OperationsService) {}
  @Get('pt/me/members') @Roles(Role.PT)
  members(@CurrentUser() a: Actor) { return this.people.myMembers(a); }
  @Get('members/me/pt') @Roles(Role.MEMBER)
  pt(@CurrentUser() a: Actor) { return this.people.myPt(a); }
  @Get('members/me/qr') @Roles(Role.MEMBER)
  qr(@CurrentUser() a: Actor) { return this.checkins.qr(a); }
  @Get('members/me/checkins') @Roles(Role.MEMBER)
  history(@CurrentUser() a: Actor, @Query('page') n?: string) { return this.checkins.logs(a, n); }
  @Post('pt/me/checkin') @Roles(Role.PT)
  attendance(@CurrentUser() a: Actor, @Headers('idempotency-key') k?: string) { return this.checkins.pt(a, k); }
  @Get('pt/me/attendance') @Roles(Role.PT)
  attendanceHistory(@CurrentUser() a: Actor, @Query('page') n?: string) { return this.checkins.attendance(a, undefined, n); }
  @Get('members/me/external-pt-passes') @Roles(Role.MEMBER)
  passes(@CurrentUser() a: Actor) { return this.external.list(a, a.sub); }
  @Post('external-pt/checkin/:id/confirm') @Roles(Role.MEMBER)
  confirm(@CurrentUser() a: Actor, @Param('id') value: string, @Headers('idempotency-key') k?: string) { return this.external.confirm(a, parse(id, value), k); }
  @Post('notifications/device-token') @Roles(Role.OWNER, Role.PT, Role.MEMBER)
  device(@CurrentUser() a: Actor, @Body() b: unknown) {
    const { token } = parse(z.object({ token: z.string().regex(/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/) }).strict(), b);
    return this.operations.registerDevice(a, token);
  }
  @Delete('notifications/device-token') @Roles(Role.OWNER, Role.PT, Role.MEMBER)
  removeDevice(@CurrentUser() a: Actor, @Body() b: unknown) {
    const { token } = parse(z.object({ token: z.string().max(300) }).strict(), b);
    return this.operations.removeDevice(a, token);
  }
}
