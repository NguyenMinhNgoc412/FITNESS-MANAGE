import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles';
import { RolesGuard } from './roles.guard';
import { AuditService } from './audit.service';
@Controller('audit') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.OWNER_ADMIN)
export class AuditController {
  constructor(private readonly audit: AuditService) {}
  @Get() list(@Query('entityType') entityType?: string, @Query('entityId') entityId?: string) { return this.audit.list(entityType, entityId); }
}
