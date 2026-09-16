import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountStatus, AssignmentStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../prisma.service';
import { CreatePtDto, UpdatePtDto } from './dto';
@Injectable()
export class PtService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}
  private readonly safeSelect = { id: true, fullName: true, email: true, phone: true, role: true, status: true, createdAt: true, ptProfile: true } as const;
  list() {
    return this.prisma.user.findMany({ where: { role: Role.PT }, select: this.safeSelect, orderBy: { createdAt: 'desc' } });
  }
  async create(actorId: string, dto: CreatePtDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email }, select: { id: true } });
    if (exists) throw new BadRequestException('Email đã được sử dụng.');
    return this.prisma.$transaction(async (tx) => {
      const pt = await tx.user.create({ data: { fullName: dto.fullName, email: dto.email, phone: dto.phone, passwordHash: await bcrypt.hash(dto.password, 12), role: Role.PT, ptProfile: { create: { specialization: dto.specialization, note: dto.note } } }, select: this.safeSelect });
      await this.audit.append(actorId, 'PT_CREATED', 'USER', pt.id, { status: pt.status }, tx);
      return pt;
    });
  }
  async update(actorId: string, ptId: string, dto: UpdatePtDto) {
    const pt = await this.prisma.user.findFirst({ where: { id: ptId, role: Role.PT }, include: { ptProfile: true } });
    if (!pt) throw new NotFoundException('Không tìm thấy PT.');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id: ptId }, data: { fullName: dto.fullName, phone: dto.phone, status: dto.status, ptProfile: { update: { specialization: dto.specialization, note: dto.note } } }, select: this.safeSelect });
      if (dto.status && dto.status !== pt.status) await this.audit.append(actorId, 'PT_STATUS_CHANGED', 'USER', ptId, { from: pt.status, to: dto.status }, tx);
      return updated;
    });
  }
  async listActiveMembers(ptId: string, actorId: string, actorRole: Role) {
    if (actorRole === Role.PT && actorId !== ptId) throw new NotFoundException('Không tìm thấy dữ liệu trong phạm vi truy cập.');
    const assignments = await this.prisma.assignment.findMany({ where: { ptId, status: AssignmentStatus.ACTIVE }, include: { member: { include: { user: { select: { id: true, fullName: true, email: true, status: true } } } } }, orderBy: { startedAt: 'desc' } });
    return assignments.map(({ member, startedAt }) => ({ ...member.user, goal: member.goal, assignedAt: startedAt }));
  }
  async ensureActive(ptId: string) {
    const pt = await this.prisma.user.findFirst({ where: { id: ptId, role: Role.PT, status: AccountStatus.ACTIVE }, select: { id: true } });
    if (!pt) throw new BadRequestException('PT được chọn không tồn tại hoặc không hoạt động.');
  }
}
