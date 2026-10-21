import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { Actor, CurrentUser, Roles } from '../common/access';
import { cccd, id, parse, password, phone, reason, text } from '../common/input';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { PeopleService } from './people.service';
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PeopleController {
  constructor(private readonly people: PeopleService) {}
  @Roles(Role.OWNER)
  @Get('people')
  peopleList(@CurrentUser() a: Actor, @Query('role') role: string, @Query('page') n?: string) { return this.people.list(a, parse(z.enum(['PT', 'MEMBER']), role), n); }
  @Roles(Role.OWNER)
  @Post('people')
  createPerson(@CurrentUser() a: Actor, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    return this.people.create(a, parse(z.object({ fullName: text, phone, cccd, password, role: z.enum(['PT', 'MEMBER']) }).strict(), b), k);
  }
  @Roles(Role.OWNER)
  @Patch('people/:id')
  updatePerson(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    return this.people.update(a, parse(id, value), parse(z.object({ fullName: text.optional(), cccd: cccd.optional(), status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']).optional(), dob: z.string().datetime().optional(), gender: text.optional(), address: text.optional(), reason }).strict(), b), k);
  }
  @Roles(Role.OWNER)
  @Post('members/:id/pt-assignment')
  assign(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    const input = parse(z.object({ ptId: id, reason }).strict(), b);
    return this.people.assign(a, parse(id, value), input.ptId, input.reason, k);
  }
  @Roles(Role.OWNER)
  @Patch('members/:id/pt-assignment')
  changeAssignment(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    return this.assign(a, value, b, k);
  }
  @Roles(Role.OWNER)
  @Delete('members/:id/pt-assignment')
  unassign(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.people.assign(a, parse(id, value), null, parse(z.object({ reason }).strict(), b).reason, k); }
  @Roles(Role.OWNER)
  @Get('members/:id/pt-assignment/history')
  assignments(@CurrentUser() a: Actor, @Param('id') value: string) { return this.people.history(a, parse(id, value)); }
  @Get('pt/me/members') @Roles(Role.PT)
  members(@CurrentUser() a: Actor) { return this.people.myMembers(a); }
  @Get('members/me/pt') @Roles(Role.MEMBER)
  pt(@CurrentUser() a: Actor) { return this.people.myPt(a); }
}
