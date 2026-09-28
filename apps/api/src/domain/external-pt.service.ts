import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Actor, requireRole, requireSelfOrOwner } from '../common/access';
import { fail } from '../common/errors';
import { audit, TransactionService } from '../common/transaction.service';
import { PrismaService } from '../prisma.service';
import { activeUser } from './data';
import { assertMembership } from './rules';
import { CheckinsService } from './checkins.service';
import { NotificationsService } from './notifications.service';
@Injectable()
export class ExternalPtService {
  constructor(private readonly prisma: PrismaService, private readonly tx: TransactionService, private readonly checkins: CheckinsService, private readonly notifications: NotificationsService) {}
  create(actor: Actor, memberId: string, totalUses: number, key?: string) {
    requireRole(actor, Role.OWNER);
    return this.tx.command(actor, 'external.pass', key, { memberId, totalUses }, async db => {
      await activeUser(db, memberId, Role.MEMBER);
      const pass = await db.externalPtPass.create({ data: { memberId, totalUses, createdBy: actor.sub } });
      await audit(db, actor, 'EXTERNAL_PASS_CREATE', 'externalPass', pass.id);
      return pass;
    });
  }
  list(actor: Actor, memberId: string) {
    requireSelfOrOwner(actor, memberId);
    return this.prisma.externalPtPass.findMany({ where: { memberId }, orderBy: { createdAt: 'desc' } });
  }
  requests(actor: Actor) {
    requireRole(actor, Role.OWNER, Role.MEMBER);
    return this.prisma.externalPtRequest.findMany({ where: { status: 'PENDING', ...(actor.role === Role.MEMBER ? { memberId: actor.sub } : {}) }, orderBy: { createdAt: 'desc' }, take: 100 });
  }
  async initiate(actor: Actor, input: { phone: string; membershipId: string; passId: string }, key?: string) {
    requireRole(actor, Role.OWNER);
    const request = await this.tx.command(actor, 'external.initiate', key, input, async db => {
      const member = await db.user.findUnique({ where: { phone: input.phone } });
      if (!member) fail('MEMBER_NOT_FOUND', 'Không tìm thấy Member.', 404);
      await activeUser(db, member.id, Role.MEMBER);
      assertMembership(await db.membership.findUnique({ where: { id: input.membershipId } }), member.id);
      const pass = await db.externalPtPass.findUnique({ where: { id: input.passId } });
      if (!pass || pass.memberId !== member.id || pass.status !== 'ACTIVE' || pass.usedUses >= pass.totalUses) fail('PASS_INVALID', 'External PT Pass không còn hiệu lực.');
      const pending = await db.externalPtRequest.findFirst({ where: { memberId: member.id, status: 'PENDING' } });
      if (pending) return pending;
      const value = await db.externalPtRequest.create({ data: { memberId: member.id, membershipId: input.membershipId, passId: pass.id, initiatedBy: actor.sub } });
      await this.notifications.enqueue(db, [member.id], 'EXTERNAL_PT_CONFIRM', value.id);
      return value;
    });
    await this.notifications.deliver().catch(() => undefined);
    return request;
  }
  confirm(actor: Actor, id: string, key?: string, fallbackReason?: string) {
    requireRole(actor, fallbackReason ? Role.OWNER : Role.MEMBER);
    return this.tx.command(actor, 'external.confirm', key, { id, fallbackReason }, async (db, commandId) => {
      const request = await db.externalPtRequest.findUnique({ where: { id } });
      if (!request || (!fallbackReason && request.memberId !== actor.sub)) fail('NOT_FOUND', 'Không tìm thấy yêu cầu.', 404);
      if (request.status === 'CONFIRMED') return { checkinId: request.checkinId };
      if (fallbackReason) {
        const notices = await db.notification.findMany({ where: { resourceId: id, type: 'EXTERNAL_PT_CONFIRM' } });
        // Push accepted by Expo can still fail to arrive. Require explicit direct
        // confirmation reason; record whether delivery was reported as accepted.
        await audit(db, actor, 'EXTERNAL_PT_FALLBACK', 'externalRequest', id, fallbackReason, undefined, { deliveryStates: notices.map(n => n.status) });
      }
      const pass = await db.externalPtPass.findUnique({ where: { id: request.passId } });
      if (!pass || pass.status !== 'ACTIVE' || pass.usedUses >= pass.totalUses) fail('PASS_INVALID', 'Pass đã hết lượt.');
      const log = await this.checkins.consumeIn(db, { ...actor, sub: request.initiatedBy }, {
        memberId: request.memberId, membershipId: request.membershipId, context: 'WITH_EXTERNAL_PT',
        method: 'PHONE', externalPtPassId: pass.id,
      }, commandId);
      await db.externalPtPass.update({ where: { id: pass.id }, data: { usedUses: { increment: 1 }, status: pass.usedUses + 1 === pass.totalUses ? 'EXHAUSTED' : 'ACTIVE' } });
      await db.externalPtRequest.update({ where: { id }, data: { status: 'CONFIRMED', checkinId: log.id } });
      await audit(db, actor, 'EXTERNAL_PT_CONFIRM', 'externalRequest', id);
      return { checkinId: log.id };
    });
  }
}
