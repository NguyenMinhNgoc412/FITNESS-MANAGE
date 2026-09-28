import { Injectable } from '@nestjs/common';
import { Role, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { Actor, requireRole } from '../common/access';
import { page } from '../common/input';
import { fail } from '../common/errors';
import { audit, TransactionService } from '../common/transaction.service';
import { PrismaService } from '../prisma.service';
import { activeUser, uniqueIdentity } from './data';
@Injectable()
export class PeopleService {
  constructor(private readonly prisma: PrismaService, private readonly tx: TransactionService) {}
  list(actor: Actor, role: Role, pageNumber?: string) {
    requireRole(actor, Role.OWNER);
    return this.prisma.user.findMany({ where: { role }, select: { id: true, phone: true, role: true, status: true, profile: true }, ...page(pageNumber), orderBy: { createdAt: 'desc' } });
  }
  async create(actor: Actor, input: { phone: string; fullName: string; cccd: string; password: string; role: 'PT' | 'MEMBER' }, key?: string) {
    requireRole(actor, Role.OWNER);
    const passwordHash = await bcrypt.hash(input.password, 12);
    return this.tx.command(actor, 'profile.create', key, input, async db => {
      await uniqueIdentity(db, input.phone, input.cccd);
      if (await db.customer.findUnique({ where: { phone: input.phone } })) fail('CUSTOMER_EXISTS', 'Khách đã có hồ sơ. Hãy dùng chuyển đổi Trial.');
      const user = await db.user.create({ data: { phone: input.phone, role: input.role, passwordHash, profile: { create: { fullName: input.fullName, cccd: input.cccd } } } });
      if (input.role === Role.MEMBER) await db.customer.create({ data: { phone: input.phone, fullName: input.fullName, trialUsedEver: false, status: 'MEMBER', memberUserId: user.id } });
      await audit(db, actor, 'PROFILE_CREATE', 'user', user.id);
      return { id: user.id, role: user.role };
    });
  }
  update(actor: Actor, userId: string, input: { fullName?: string; cccd?: string; status?: AccountStatus; dob?: string; gender?: string; address?: string; reason: string }, key?: string) {
    requireRole(actor, Role.OWNER);
    return this.tx.command(actor, 'profile.update', key, { userId, input }, async db => {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user || user.role === Role.OWNER) fail('INVALID_PROFILE', 'Chỉ chỉnh sửa hồ sơ Member hoặc PT.', 400);
      if (input.cccd) await uniqueIdentity(db, user.phone, input.cccd, userId);
      const { reason, status, dob, ...profile } = input;
      await db.profile.update({ where: { userId }, data: { ...profile, ...(dob ? { dob: new Date(dob) } : {}) } });
      if (input.fullName) await db.customer.updateMany({ where: { memberUserId: userId }, data: { fullName: input.fullName } });
      if (status) {
        await db.user.update({ where: { id: userId }, data: { status } });
        if (status !== 'ACTIVE') await db.session.updateMany({ where: { userId }, data: { revokedAt: new Date() } });
      }
      await audit(db, actor, 'PROFILE_UPDATE', 'user', userId, reason, undefined, { fields: Object.keys(input).filter(k => k !== 'reason') });
      return { id: userId };
    });
  }
  assign(actor: Actor, memberId: string, ptId: string | null, reason: string, key?: string) {
    requireRole(actor, Role.OWNER);
    return this.tx.command(actor, 'assignment.change', key, { memberId, ptId, reason }, async db => {
      await activeUser(db, memberId, Role.MEMBER);
      if (ptId) await activeUser(db, ptId, Role.PT);
      const previous = await db.ptAssignment.findMany({ where: { memberId, status: 'ACTIVE' } });
      await db.ptAssignment.updateMany({ where: { memberId, status: 'ACTIVE' }, data: { status: 'ENDED', endAt: new Date() } });
      const assignment = ptId ? await db.ptAssignment.create({ data: { memberId, ptId, reason, changedBy: actor.sub } }) : null;
      await audit(db, actor, ptId ? 'PT_ASSIGN' : 'PT_CANCEL', 'member', memberId, reason, { assignmentIds: previous.map(item => item.id) }, { assignmentId: assignment?.id ?? null });
      return { assignment };
    });
  }
  async myMembers(actor: Actor) {
    requireRole(actor, Role.PT);
    const assignments = await this.prisma.ptAssignment.findMany({ where: { ptId: actor.sub, status: 'ACTIVE' } });
    return this.prisma.user.findMany({ where: { id: { in: assignments.map(a => a.memberId) } }, select: { id: true, profile: { select: { fullName: true } } } });
  }
  async myPt(actor: Actor) {
    requireRole(actor, Role.MEMBER);
    const assignment = await this.prisma.ptAssignment.findFirst({ where: { memberId: actor.sub, status: 'ACTIVE' } });
    if (!assignment) return null;
    const pt = await this.prisma.user.findUnique({ where: { id: assignment.ptId }, select: { id: true, profile: { select: { fullName: true } } } });
    return { assignment, pt };
  }
  async history(actor: Actor, memberId: string) {
    requireRole(actor, Role.OWNER);
    const rows = await this.prisma.ptAssignment.findMany({ where: { memberId }, orderBy: { startAt: 'desc' } });
    const profiles = await this.prisma.profile.findMany({ where: { userId: { in: [...new Set(rows.map(row => row.ptId))] } }, select: { userId: true, fullName: true } });
    const names = new Map(profiles.map(profile => [profile.userId, profile.fullName]));
    return rows.map(row => ({ ...row, ptName: names.get(row.ptId) ?? 'PT nội bộ' }));
  }
}
