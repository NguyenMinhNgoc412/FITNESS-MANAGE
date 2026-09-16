import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountStatus, AssignmentStatus, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../prisma.service';
import { ChangePtDto, CreateMemberDto, UpdateMemberDto } from './dto';
@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}
  list() {
    return this.prisma.user.findMany({
      where: { role: Role.MEMBER },
      select: { id: true, fullName: true, email: true, phone: true, status: true, createdAt: true, memberProfile: { select: { goal: true, assignments: { where: { status: AssignmentStatus.ACTIVE }, select: { ptId: true, startedAt: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  async update(actorId: string, memberId: string, dto: UpdateMemberDto) {
    const member = await this.prisma.user.findFirst({ where: { id: memberId, role: Role.MEMBER }, select: { id: true, status: true } });
    if (!member) throw new NotFoundException('Không tìm thấy Member.');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: memberId },
        data: { fullName: dto.fullName, phone: dto.phone, status: dto.status, memberProfile: dto.goal === undefined ? undefined : { update: { goal: dto.goal } } },
        select: { id: true, fullName: true, email: true, phone: true, status: true, memberProfile: { select: { goal: true } } },
      });
      if (dto.status && dto.status !== member.status) await this.audit.append(actorId, 'MEMBER_STATUS_CHANGED', 'USER', memberId, { from: member.status, to: dto.status }, tx);
      return updated;
    });
  }
  async createWithInitialAssignment(actorId: string, dto: CreateMemberDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const conflict = await tx.user.findUnique({ where: { email: dto.email }, select: { id: true } });
        if (conflict) throw new BadRequestException('Email đã được sử dụng.');
        const pt = await tx.user.findFirst({ where: { id: dto.ptId, role: Role.PT, status: AccountStatus.ACTIVE }, select: { id: true } });
        if (!pt) throw new BadRequestException('PT được chọn không tồn tại hoặc không hoạt động.');
        const member = await tx.user.create({ data: { fullName: dto.fullName, email: dto.email, phone: dto.phone, passwordHash: await bcrypt.hash(dto.password, 12), role: Role.MEMBER, memberProfile: { create: { goal: dto.goal } } }, include: { memberProfile: true } });
        const assignment = await tx.assignment.create({ data: { memberId: member.id, ptId: pt.id, createdById: actorId, status: AssignmentStatus.ACTIVE } });
        await this.audit.append(actorId, 'MEMBER_REGISTERED', 'USER', member.id, { ptId: pt.id }, tx);
        await this.audit.append(actorId, 'INITIAL_PT_ASSIGNED', 'ASSIGNMENT', assignment.id, { memberId: member.id, ptId: pt.id }, tx);
        return { member: { id: member.id, fullName: member.fullName, email: member.email, goal: member.memberProfile?.goal }, assignment };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw error;
    }
  }
  async currentPt(memberId: string, actorId: string, role: Role) {
    if (role === Role.MEMBER && actorId !== memberId) throw new NotFoundException('Không tìm thấy dữ liệu trong phạm vi truy cập.');
    const assignment = await this.prisma.assignment.findFirst({ where: { memberId, status: AssignmentStatus.ACTIVE, ...(role === Role.PT ? { ptId: actorId } : {}) }, include: { pt: { include: { user: { select: { id: true, fullName: true, email: true } } } } } });
    if (!assignment) throw new NotFoundException('Member chưa có PT đang phụ trách.');
    return { pt: assignment.pt.user, assignedAt: assignment.startedAt };
  }
  async changePt(actorId: string, memberId: string, dto: ChangePtDto) {
    const previousAttempt = await this.prisma.assignment.findUnique({ where: { idempotencyKey: dto.idempotencyKey } });
    if (previousAttempt) {
      if (previousAttempt.memberId !== memberId) throw new ConflictException('Idempotency key đã được dùng cho Member khác.');
      return this.changeResult(previousAttempt, true);
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        const priorAttempt = await tx.assignment.findUnique({ where: { idempotencyKey: dto.idempotencyKey } });
        if (priorAttempt) {
          if (priorAttempt.memberId !== memberId) throw new ConflictException('Idempotency key đã được dùng cho Member khác.');
          return this.changeResult(priorAttempt, true);
        }
        const current = await tx.assignment.findFirst({ where: { memberId, status: AssignmentStatus.ACTIVE } });
        if (!current) throw new NotFoundException('Không tìm thấy assignment hiện tại của Member.');
        if (current.ptId === dto.newPtId) throw new BadRequestException('PT mới phải khác PT hiện tại.');
        const newPt = await tx.user.findFirst({ where: { id: dto.newPtId, role: Role.PT, status: AccountStatus.ACTIVE }, select: { id: true } });
        if (!newPt) throw new BadRequestException('PT mới không tồn tại hoặc không hoạt động.');
        const effectiveAt = new Date();
        await tx.assignment.update({ where: { id: current.id }, data: { status: AssignmentStatus.ENDED, endedAt: effectiveAt } });
        const next = await tx.assignment.create({ data: { memberId, ptId: newPt.id, createdById: actorId, startedAt: effectiveAt, status: AssignmentStatus.ACTIVE, changeReason: dto.reason, idempotencyKey: dto.idempotencyKey, scheduleReviewRequired: true } });
        await this.audit.append(actorId, 'PT_ASSIGNMENT_CHANGED', 'ASSIGNMENT', next.id, { memberId, oldAssignmentId: current.id, oldPtId: current.ptId, newPtId: newPt.id, scheduleReviewRequired: true }, tx);
        return this.changeResult(next, false, current.id);
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof ConflictException) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Yêu cầu đổi PT đang được xử lý. Hãy retry với cùng idempotency key.');
      throw error;
    }
  }
  private changeResult(assignment: { id: string; memberId: string; ptId: string; startedAt: Date; scheduleReviewRequired: boolean }, idempotentReplay: boolean, previousAssignmentId?: string) {
    return { assignmentId: assignment.id, memberId: assignment.memberId, currentPtId: assignment.ptId, effectiveAt: assignment.startedAt, previousAssignmentId, idempotentReplay, scheduleReviewRequired: assignment.scheduleReviewRequired };
  }
}
