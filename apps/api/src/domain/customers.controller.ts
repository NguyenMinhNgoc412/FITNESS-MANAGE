import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { Actor, CurrentUser, Roles } from '../common/access';
import { cccd, id, parse, parseConversion, phone, text } from '../common/input';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { CustomersService } from './customers.service';
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}
  @Roles(Role.OWNER)
  @Post('customers/trials')
  trial(@CurrentUser() a: Actor, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    return this.customers.create(a, parse(z.object({ fullName: text, phone }).strict(), b), k);
  }
  @Roles(Role.OWNER)
  @Get('customers/search')
  search(@CurrentUser() a: Actor, @Query('phone') p?: string, @Query('name') name?: string, @Query('cccd') card?: string, @Query('page') n?: string) {
    return this.customers.search(a, { phone: p ? parse(phone, p) : undefined, name: name ? parse(text, name) : undefined, cccd: card ? parse(cccd, card) : undefined }, n);
  }
  @Roles(Role.OWNER)
  @Get('customers/:id')
  customer(@CurrentUser() a: Actor, @Param('id') value: string) { return this.customers.detail(a, parse(id, value)); }
  @Roles(Role.OWNER)
  @Get('customers/:id/history')
  customerHistory(@CurrentUser() a: Actor, @Param('id') value: string, @Query('page') n?: string) { return this.customers.history(a, parse(id, value), n); }
  @Roles(Role.OWNER)
  @Get('customers/:id/checkins')
  customerCheckins(@CurrentUser() a: Actor, @Param('id') value: string, @Query('page') n?: string) { return this.customers.checkins(a, parse(id, value), n); }
  @Roles(Role.OWNER)
  @Post('customers/:id/trial-checkin')
  trialCheckin(@CurrentUser() a: Actor, @Param('id') value: string, @Headers('idempotency-key') k?: string) { return this.customers.checkin(a, parse(id, value), k); }
  @Roles(Role.OWNER)
  @Post('customers/:id/convert-to-member')
  convert(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    return this.customers.convert(a, parse(id, value), parseConversion(b), k);
  }
}
