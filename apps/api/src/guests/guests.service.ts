import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountStatus, AssignmentStatus, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../prisma.service';
import { ConvertGuestDto, CreateGuestDto } from './dto';
@Injectable()
export class GuestsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}
  async create(actorId: string, dto: CreateGuestDto) {
    const trialAt = dto.trialAt ? new Date(dto.trialAt) : new Date();
    const contactFilter = [dto.phone ? { phone: dto.phone } : undefined, dto.email ? { email: dto.email } : undefined].filter(Boolean) as { phone?: string; email?: string }[];
    const possibleDuplicateCount = contactFilter.length ? await this.prisma.guestTrial.count({ where: { OR: contactFilter } }) : 0;
    const guest = await this.prisma.$transaction(async (tx) => {
      const created = await tx.guestTrial.create({ data: { displayName: dto.displayName, phone: dto.phone, email: dto.email, note: dto.note, trialAt, createdById: actorId } });
      await this.audit.append(actorId, 'GUEST_TRIAL_CREATED', 'GUEST_TRIAL', created.id, { trialAt }, tx);
      return created;
    });
    return { guest, possibleDuplicateCount };
  }
  async list() { return this.prisma.guestTrial.findMany({ orderBy: { trialAt: 'desc' } }); }
  async convert(actorId: string, guestId: string, dto: ConvertGuestDto) {
    const prior = await this.prisma.guestTrial.findUnique({ where: { conversionIdempotencyKey: dto.idempotencyKey } });
    if (prior) {
      if (prior.id !== guestId) throw new ConflictException('Idempotency key đã được dùng cho Guest khác.');
      return this.conversionResult(prior, true);
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        const duplicateAttempt = await tx.guestTrial.findUnique({ where: { conversionIdempotencyKey: dto.idempotencyKey } });
        if (duplicateAttempt) {
          if (duplicateAttempt.id !== guestId) throw new ConflictException('Idempotency key đã được dùng cho Guest khác.');
          return this.conversionResult(duplicateAttempt, true);
        }
        const guest = await tx.guestTrial.findUnique({ where: { id: guestId } });
        if (!guest) throw new NotFoundException('Không tìm thấy Guest.');
        if (guest.convertedMemberId) throw new BadRequestException('Guest đã được chuyển thành Member.');
        const existingEmail = await tx.user.findUnique({ where: { email: dto.email }, select: { id: true } });
        if (existingEmail) throw new BadRequestException('Email đã được sử dụng bởi tài khoản khác.');
        const pt = await tx.user.findFirst({ where: { id: dto.ptId, role: Role.PT, status: AccountStatus.ACTIVE }, select: { id: true } });
        if (!pt) throw new BadRequestException('PT được chọn không tồn tại hoặc không hoạt động.');
        const member = await tx.user.create({ data: { fullName: dto.fullName, email: dto.email, phone: dto.phone ?? guest.phone, passwordHash: await bcrypt.hash(dto.password, 12), role: Role.MEMBER, memberProfile: { create: { goal: dto.goal } } } });
        const assignment = await tx.assignment.create({ data: { memberId: member.id, ptId: pt.id, createdById: actorId, status: AssignmentStatus.ACTIVE } });
        const convertedGuest = await tx.guestTrial.update({ where: { id: guestId }, data: { convertedMemberId: member.id, convertedAt: new Date(), conversionIdempotencyKey: dto.idempotencyKey } });
        await this.audit.append(actorId, 'GUEST_CONVERTED', 'GUEST_TRIAL', guestId, { memberId: member.id, assignmentId: assignment.id, ptId: pt.id }, tx);
        return this.conversionResult(convertedGuest, false, assignment.id);
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ConflictException || error instanceof NotFoundException) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Conversion đang được xử lý. Hãy retry với cùng idempotency key.');
      throw error;
    }
  }
  private conversionResult(guest: { id: string; convertedMemberId: string | null; convertedAt: Date | null }, idempotentReplay: boolean, assignmentId?: string) {
    return { guestId: guest.id, memberId: guest.convertedMemberId, convertedAt: guest.convertedAt, assignmentId, idempotentReplay };
  }
}
