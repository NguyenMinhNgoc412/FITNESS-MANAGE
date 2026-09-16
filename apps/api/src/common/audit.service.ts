import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

type Db = PrismaService | Prisma.TransactionClient;
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
  async append(actorId: string, action: string, entityType: string, entityId: string, summary?: Prisma.InputJsonValue, db: Db = this.prisma) {
    await db.auditEvent.create({ data: { actorId, action, entityType, entityId, summary } });
  }
  async list(entityType?: string, entityId?: string) {
    return this.prisma.auditEvent.findMany({ where: { entityType, entityId }, orderBy: { createdAt: 'desc' }, take: 100 });
  }
}
