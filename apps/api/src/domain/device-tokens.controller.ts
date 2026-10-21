import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { Actor, CurrentUser, Roles } from '../common/access';
import { parse } from '../common/input';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { DeviceTokensService } from './device-tokens.service';
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeviceTokensController {
  constructor(private readonly devices: DeviceTokensService) {}
  @Post('notifications/device-token') @Roles(Role.OWNER, Role.PT, Role.MEMBER)
  device(@CurrentUser() a: Actor, @Body() b: unknown) {
    const { token } = parse(z.object({ token: z.string().regex(/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/) }).strict(), b);
    return this.devices.registerDevice(a, token);
  }
  @Delete('notifications/device-token') @Roles(Role.OWNER, Role.PT, Role.MEMBER)
  removeDevice(@CurrentUser() a: Actor, @Body() b: unknown) {
    const { token } = parse(z.object({ token: z.string().max(300) }).strict(), b);
    return this.devices.removeDevice(a, token);
  }
}
