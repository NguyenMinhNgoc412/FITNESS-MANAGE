import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles';
import { CreatePtDto, UpdatePtDto } from './dto';
import { PtService } from './pt.service';
@Controller('pts') @UseGuards(JwtAuthGuard, RolesGuard)
export class PtController {
  constructor(private readonly pts: PtService) {}
  @Get() @Roles(Role.OWNER_ADMIN) list() { return this.pts.list(); }
  @Post() @Roles(Role.OWNER_ADMIN) create(@CurrentUser() user: AuthUser, @Body() dto: CreatePtDto) { return this.pts.create(user.sub, dto); }
  @Patch(':ptId') @Roles(Role.OWNER_ADMIN) update(@CurrentUser() user: AuthUser, @Param('ptId') ptId: string, @Body() dto: UpdatePtDto) { return this.pts.update(user.sub, ptId, dto); }
  @Get(':ptId/members') @Roles(Role.OWNER_ADMIN, Role.PT) members(@CurrentUser() user: AuthUser, @Param('ptId') ptId: string) { return this.pts.listActiveMembers(ptId, user.sub, user.role as Role); }
}
