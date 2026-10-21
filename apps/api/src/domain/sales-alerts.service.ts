import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Actor, requireRole } from '../common/access';
import { PrismaService } from '../prisma.service';
import { fail } from '../common/errors';
import { page, SalesAlertFilter } from '../common/input';
import { audit, TransactionService } from '../common/transaction.service';
import { MembershipsService } from './memberships.service';
@Injectable()
export class SalesAlertsService {
  private refreshing = false;
  constructor(private readonly prisma: PrismaService, private readonly tx: TransactionService, private readonly memberships: MembershipsService) {}
  async refresh() {
    if (this.refreshing) return;
    this.refreshing = true;
    try {
      await this.tx.run(async db => {
        const now = new Date();
        const candidates = await db.membership.findMany({ where: { status: 'ACTIVE', startAt: { lte: now }, OR: [{ mode: 'TIME_BASED', endAt: { gt: now, lte: new Date(now.getTime() + 7 * 86400000) } }, { mode: 'SESSION_BASED' }] } });
        for (const item of candidates) await this.memberships.alert(db, item.id);
      });
    } finally { this.refreshing = false; }
  }
  async alerts(actor: Actor, n?: string, status: SalesAlertFilter = 'OPEN') {
    requireRole(actor, Role.OWNER);
    const pagination = page(n);
    await this.refresh();
    const rows = await this.prisma.salesAlert.findMany({ where: status === 'ALL' ? {} : { status }, ...pagination, orderBy: [{ triggeredAt: 'desc' }, { id: 'desc' }] });
    return Promise.all(rows.map(async row => {
      const customer = row.customerId ? await this.prisma.customer.findUnique({ where: { id: row.customerId } }) : row.memberId ? await this.prisma.customer.findFirst({ where: { memberUserId: row.memberId } }) : null;
      return { ...row, customerId: customer?.id ?? row.customerId, customerName: customer?.fullName ?? 'Khách hàng' };
    }));
  }
  updateAlert(actor: Actor, id: string, input: { status: string; ownerNote?: string }, key?: string) {
    requireRole(actor, Role.OWNER);
    return this.tx.command(actor, 'alert.update', key, { id, input }, async db => {
      if (!await db.salesAlert.findUnique({ where: { id } })) fail('NOT_FOUND', 'Không tìm thấy cảnh báo.', 404);
      const result = await db.salesAlert.update({ where: { id }, data: { ...input, resolvedAt: ['OPEN', 'CONTACTED'].includes(input.status) ? null : new Date() } });
      await audit(db, actor, 'ALERT_UPDATE', 'salesAlert', id);
      return result;
    });
  }
}
