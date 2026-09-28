import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { Actor, requireRole } from '../common/access';
import { fail } from '../common/errors';
import { MembershipInput, page } from '../common/input';
import { audit, TransactionService } from '../common/transaction.service';
import { PrismaService } from '../prisma.service';
import { uniqueIdentity } from './data';
import { MembershipsService } from './memberships.service';
@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService, private readonly tx: TransactionService, private readonly memberships: MembershipsService) {}
  search(actor: Actor, query: { phone?: string; name?: string; cccd?: string }, pageNumber?: string) {
    requireRole(actor, Role.OWNER);
    return this.searchRows(query, pageNumber);
  }
  private async searchRows(query: { phone?: string; name?: string; cccd?: string }, pageNumber?: string) {
    let memberUserId: string | undefined;
    if (query.cccd) {
      const profile = await this.prisma.profile.findFirst({ where: { cccd: query.cccd } });
      if (!profile) return [];
      memberUserId = profile.userId;
    }
    return this.prisma.customer.findMany({ where: { ...(query.phone ? { phone: query.phone } : {}), ...(query.name ? { fullName: { contains: query.name, mode: 'insensitive' } } : {}), ...(memberUserId ? { memberUserId } : {}) }, ...page(pageNumber), orderBy: { createdAt: 'desc' } });
  }
  async detail(actor: Actor, id: string) {
    requireRole(actor, Role.OWNER);
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) fail('NOT_FOUND', 'Không tìm thấy khách hàng.', 404);
    const trial = await this.prisma.trialEntitlement.findUnique({ where: { customerId: id } });
    const checkins = await this.prisma.memberCheckin.findMany({ where: { customerId: id }, orderBy: { checkedInAt: 'desc' }, take: 100 });
    return { ...customer, trial, checkins };
  }
  create(actor: Actor, input: { fullName: string; phone: string }, key?: string) {
    requireRole(actor, Role.OWNER);
    return this.tx.command(actor, 'trial.create', key, input, async db => {
      if (await db.customer.findUnique({ where: { phone: input.phone } }) || await db.user.findUnique({ where: { phone: input.phone } })) fail('TRIAL_ALREADY_USED', 'Số điện thoại đã có hồ sơ. Hãy mở hồ sơ hiện có.');
      const customer = await db.customer.create({ data: input });
      const trial = await db.trialEntitlement.create({ data: { customerId: customer.id } });
      await audit(db, actor, 'TRIAL_CREATE', 'customer', customer.id);
      return { ...customer, trial };
    });
  }
  checkin(actor: Actor, customerId: string, key?: string) {
    requireRole(actor, Role.OWNER);
    return this.tx.command(actor, 'trial.checkin', key, { customerId }, async (db, commandId) => {
      const customer = await db.customer.findUnique({ where: { id: customerId } });
      const trial = await db.trialEntitlement.findUnique({ where: { customerId } });
      if (!customer || customer.status !== 'TRIAL' || !trial || trial.usedSessions >= 3 || trial.status !== 'ACTIVE') fail('TRIAL_EXHAUSTED', 'Khách không còn lượt Trial hợp lệ.');
      const recent = await db.memberCheckin.findFirst({ where: { customerId, checkedInAt: { gt: new Date(Date.now() - 30000) } } });
      if (recent) return recent;
      const usedSessions = trial.usedSessions + 1;
      await db.trialEntitlement.update({ where: { id: trial.id }, data: { usedSessions, status: usedSessions === 3 ? 'EXHAUSTED' : 'ACTIVE' } });
      const log = await db.memberCheckin.create({ data: { customerId, subjectType: 'TRIAL', context: 'TRIAL', method: 'PHONE', operatorId: actor.sub, idempotencyKey: commandId } });
      if (usedSessions === 3) await db.salesAlert.upsert({ where: { sourceKey: 'trial:' + customerId }, update: {}, create: { sourceKey: 'trial:' + customerId, customerId, type: 'TRIAL_FINAL' } });
      await audit(db, actor, 'TRIAL_PHONE_CHECKIN', 'checkin', log.id);
      return log;
    });
  }
  async convert(actor: Actor, customerId: string, input: { cccd: string; password: string; membership: MembershipInput }, key?: string) {
    requireRole(actor, Role.OWNER);
    const passwordHash = await bcrypt.hash(input.password, 12);
    // Never store password or CCCD in the idempotency result/audit.
    return this.tx.command(actor, 'trial.convert', key, { customerId, ...input }, async db => {
      const customer = await db.customer.findUnique({ where: { id: customerId } });
      if (!customer) fail('NOT_FOUND', 'Không tìm thấy khách hàng.', 404);
      if (customer.memberUserId) fail('ALREADY_MEMBER', 'Khách đã được chuyển thành Member.');
      await uniqueIdentity(db, customer.phone, input.cccd);
      const user = await db.user.create({ data: { phone: customer.phone, passwordHash, role: Role.MEMBER, profile: { create: { fullName: customer.fullName, cccd: input.cccd } } } });
      const updated = await db.customer.update({ where: { id: customerId }, data: { status: 'MEMBER', memberUserId: user.id } });
      await db.trialEntitlement.updateMany({ where: { customerId }, data: { status: 'CONVERTED' } });
      const membership = await this.memberships.createIn(db, actor, user.id, input.membership);
      await audit(db, actor, 'TRIAL_CONVERT', 'customer', customerId, undefined, undefined, { memberUserId: user.id });
      return { customer: updated, memberId: user.id, membership };
    });
  }
}
