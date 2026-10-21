import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Actor, requireRole } from '../common/access';
import { PrismaService } from '../prisma.service';
import { page } from '../common/input';
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
  logs(actor: Actor, n?: string) {
    requireRole(actor, Role.OWNER);
    return this.prisma.auditLog.findMany({ ...page(n), orderBy: { createdAt: 'desc' } });
  }
}
