import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { Actor, requireRole, requireSelfOrOwner } from '../common/access';
import { audit, Db, TransactionService } from '../common/transaction.service';
import { MembershipInput } from '../common/input';
import { fail } from '../common/errors';
import { activeUser } from './data';
import { membershipState } from './rules';

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService, private readonly tx: TransactionService) {}
  async list(actor: Actor, memberId: string) {
    requireSelfOrOwner(actor, memberId);
    const records = await this.prisma.membership.findMany({ where: { memberId }, orderBy: { createdAt: 'desc' } });
    return records.map(item => ({ ...item, effectiveStatus: membershipState(item), remainingSessions: item.totalSessions === null ? null : item.totalSessions - item.usedSessions }));
  }
  create(actor: Actor, memberId: string, input: MembershipInput, key?: string) {
    requireRole(actor, Role.OWNER);
    return this.tx.command(actor, 'membership.create', key, { memberId, input }, db => this.createIn(db, actor, memberId, input));
  }
  async createIn(db: Db, actor: Actor, memberId: string, input: MembershipInput, renewedFromId?: string) {
    await activeUser(db, memberId, Role.MEMBER);
    const value = await db.membership.create({ data: { memberId, ...input, startAt: new Date(input.startAt), endAt: input.endAt ? new Date(input.endAt) : undefined, createdBy: actor.sub, renewedFromId } });
    await audit(db, actor, renewedFromId ? 'MEMBERSHIP_RENEW' : 'MEMBERSHIP_CREATE', 'membership', value.id);
    await this.alert(db, value.id);
    return value;
  }
  renew(actor: Actor, id: string, input: MembershipInput, key?: string) {
    requireRole(actor, Role.OWNER);
    return this.tx.command(actor, 'membership.renew', key, { id, input }, async db => {
      const old = await db.membership.findUnique({ where: { id } });
      if (!old) fail('NOT_FOUND', 'Không tìm thấy gói tập.', 404);
      return this.createIn(db, actor, old.memberId, input, old.id);
    });
  }
  cancel(actor: Actor, id: string, reason: string, key?: string) {
    requireRole(actor, Role.OWNER);
    return this.tx.command(actor, 'membership.cancel', key, { id, reason }, async db => {
      if (!await db.membership.findUnique({ where: { id } })) fail('NOT_FOUND', 'Không tìm thấy gói tập.', 404);
      const value = await db.membership.update({ where: { id }, data: { status: 'CANCELLED' } });
      await audit(db, actor, 'MEMBERSHIP_CANCEL', 'membership', id, reason);
      return value;
    });
  }
  async alert(db: Db, id: string) {
    const item = await db.membership.findUniqueOrThrow({ where: { id } });
    if (membershipState(item) !== 'ACTIVE' && membershipState(item) !== 'EXHAUSTED') return;
    const soon = item.mode === 'SESSION_BASED'
      ? (item.totalSessions ?? 0) - item.usedSessions <= 3
      : !!item.endAt && item.endAt.getTime() - Date.now() <= 7 * 86400000;
    if (!soon) return;
    const type = item.mode === 'SESSION_BASED' ? 'MEMBERSHIP_EXPIRING_SESSION' : 'MEMBERSHIP_EXPIRING_TIME';
    await db.salesAlert.upsert({ where: { sourceKey: 'membership:' + id }, update: {}, create: { sourceKey: 'membership:' + id, memberId: item.memberId, type } });
  }
}
