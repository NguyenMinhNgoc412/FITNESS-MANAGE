import { Body, Controller, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { Actor, CurrentUser, Roles } from '../common/access';
import { bookingInput, id, parse, reason } from '../common/input';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { BookingsService } from './bookings.service';
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}
  @Roles(Role.OWNER)
  @Post('bookings')
  book(@CurrentUser() a: Actor, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.bookings.save(a, parse(bookingInput, b), k); }
  @Roles(Role.OWNER)
  @Patch('bookings/:id')
  editBooking(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) {
    const { reason: why, ...input } = parse(bookingInput.extend({ reason }), b);
    return this.bookings.save(a, input, k, parse(id, value), why);
  }
  @Roles(Role.OWNER)
  @Post('bookings/:id/cancel')
  cancelBooking(@CurrentUser() a: Actor, @Param('id') value: string, @Body() b: unknown, @Headers('idempotency-key') k?: string) { return this.bookings.cancel(a, parse(id, value), parse(z.object({ reason }).strict(), b).reason, k); }
  @Get('bookings') @Roles(Role.OWNER, Role.PT, Role.MEMBER)
  bookingsList(@CurrentUser() a: Actor, @Query('page') n?: string, @Query('from') from?: string, @Query('to') to?: string, @Query('memberId') memberId?: string) {
    return this.bookings.list(a, n, from ? parse(z.string().datetime(), from) : undefined, to ? parse(z.string().datetime(), to) : undefined, memberId ? parse(id, memberId) : undefined);
  }
  @Get('bookings/:id') @Roles(Role.OWNER, Role.PT, Role.MEMBER)
  booking(@CurrentUser() a: Actor, @Param('id') value: string) { return this.bookings.detail(a, parse(id, value)); }
}
