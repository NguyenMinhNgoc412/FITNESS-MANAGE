import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles';
import { RolesGuard } from '../common/roles.guard';
import { ChangePtDto, CreateMemberDto, UpdateMemberDto } from './dto';
import { MembersService } from './members.service';
@Controller('members') @UseGuards(JwtAuthGuard, RolesGuard)
export class MembersController {
  constructor(private readonly members: MembersService) {}
  @Get() @Roles(Role.OWNER_ADMIN) list() { return this.members.list(); }
  @Post() @Roles(Role.OWNER_ADMIN) create(@CurrentUser() user: AuthUser, @Body() dto: CreateMemberDto) { return this.members.createWithInitialAssignment(user.sub, dto); }
  @Patch(':memberId') @Roles(Role.OWNER_ADMIN) update(@CurrentUser() user: AuthUser, @Param('memberId') memberId: string, @Body() dto: UpdateMemberDto) { return this.members.update(user.sub, memberId, dto); }
  @Post(':memberId/assignment/change-pt') @Roles(Role.OWNER_ADMIN) changePt(@CurrentUser() user: AuthUser, @Param('memberId') memberId: string, @Body() dto: ChangePtDto) { return this.members.changePt(user.sub, memberId, dto); }
  @Get(':memberId/current-pt') @Roles(Role.OWNER_ADMIN, Role.PT, Role.MEMBER) currentPt(@CurrentUser() user: AuthUser, @Param('memberId') memberId: string) { return this.members.currentPt(memberId, user.sub, user.role as Role); }
}
