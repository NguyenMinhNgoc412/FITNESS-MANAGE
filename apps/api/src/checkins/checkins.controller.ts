import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles';
import { RolesGuard } from '../common/roles.guard';
import { CheckinsService } from './checkins.service';
import { CreateSelfCheckinDto } from './dto';
@Controller('checkins') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.PT, Role.MEMBER)
export class CheckinsController {
  constructor(private readonly checkins: CheckinsService) {}
  @Post('self') create(@CurrentUser() user: AuthUser, @Body() dto: CreateSelfCheckinDto) { return this.checkins.createSelf(user.sub, user.role as Role, dto.idempotencyKey); }
  @Get('self') history(@CurrentUser() user: AuthUser) { return this.checkins.ownHistory(user.sub); }
}
