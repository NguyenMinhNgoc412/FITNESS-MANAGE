import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Actor, CurrentUser, Roles } from '../common/access';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { AuditService } from './audit.service';
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}
  @Roles(Role.OWNER)
  @Get('audit')
  audit(@CurrentUser() a: Actor, @Query('page') n?: string) { return this.auditService.logs(a, n); }
}
