import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles';
import { RolesGuard } from '../common/roles.guard';
import { ConvertGuestDto, CreateGuestDto } from './dto';
import { GuestsService } from './guests.service';
@Controller('guests') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.OWNER_ADMIN)
export class GuestsController {
  constructor(private readonly guests: GuestsService) {}
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreateGuestDto) { return this.guests.create(user.sub, dto); }
  @Get() list() { return this.guests.list(); }
  @Post(':guestId/convert') convert(@CurrentUser() user: AuthUser, @Param('guestId') guestId: string, @Body() dto: ConvertGuestDto) { return this.guests.convert(user.sub, guestId, dto); }
}
