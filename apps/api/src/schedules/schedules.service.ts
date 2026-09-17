import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountStatus, AssignmentStatus, Role, ScheduleChangeRequestStatus, ScheduleStatus, WindowType } from '@prisma/client';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../prisma.service';
import { CreateScheduleChangeRequestDto, CreateScheduleDto, ReviewScheduleChangeRequestDto, UpdateScheduleDto } from './dto';
@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}
  async create(actorId: string, dto: CreateScheduleDto) {
    const { windowStart, windowEnd } = this.validateWindow(dto.windowType, dto.windowStart, dto.windowEnd, true);
    const assignment = await this.prisma.assignment.findFirst({ where: { memberId: dto.memberId, ptId: dto.ptId, status: AssignmentStatus.ACTIVE } });
    if (!assignment) throw new BadRequestException('Lịch phải dùng PT đang được gán cho Member.');
    const pt = await this.prisma.user.findFirst({ where: { id: dto.ptId, role: Role.PT, status: AccountStatus.ACTIVE }, select: { id: true } });
    if (!pt) throw new BadRequestException('PT của lịch không hoạt động.');
    return this.prisma.$transaction(async (tx) => {
      const schedule = await tx.trainingSchedule.create({ data: { memberId: dto.memberId, ptId: dto.ptId, windowType: dto.windowType, windowStart, windowEnd, createdById: actorId } });
      await this.audit.append(actorId, 'SCHEDULE_CREATED', 'SCHEDULE', schedule.id, { memberId: dto.memberId, ptId: dto.ptId, windowType: dto.windowType }, tx);
      return schedule;
    });
  }
  async list(actorId: string, role: Role) {
    const scope = role === Role.OWNER_ADMIN ? {} : role === Role.PT ? { ptId: actorId } : { memberId: actorId };
    return this.prisma.trainingSchedule.findMany({
      where: scope,
      include: {
        member: { select: { user: { select: { fullName: true, phone: true } } } },
        pt: { select: { user: { select: { fullName: true } } } },
      },
      orderBy: { windowStart: 'asc' },
    });
  }
  async update(actorId: string, scheduleId: string, dto: UpdateScheduleDto) {
    const current = await this.prisma.trainingSchedule.findUnique({ where: { id: scheduleId } });
    if (!current) throw new NotFoundException('Không tìm thấy lịch.');
    if (current.status === ScheduleStatus.COMPLETED) throw new BadRequestException('Không sửa lịch đã hoàn thành để bảo toàn lịch sử.');
    const type = dto.windowType ?? current.windowType;
    const { windowStart, windowEnd } = this.validateWindow(type, dto.windowStart ?? current.windowStart.toISOString(), dto.windowEnd ?? current.windowEnd.toISOString(), Boolean(dto.windowStart));
    return this.prisma.$transaction(async (tx) => {
      const schedule = await tx.trainingSchedule.update({ where: { id: scheduleId }, data: { windowType: type, windowStart, windowEnd, status: dto.status } });
      await this.audit.append(actorId, 'SCHEDULE_UPDATED', 'SCHEDULE', scheduleId, { status: dto.status, windowType: type }, tx);
      return schedule;
    });
  }
  async listChangeRequests(actorId: string, role: Role) {
    const where = role === Role.OWNER_ADMIN ? {} : { requesterId: actorId };
    return this.prisma.scheduleChangeRequest.findMany({
      where,
      include: { schedule: { include: { member: { select: { user: { select: { fullName: true, phone: true } } } }, pt: { select: { user: { select: { fullName: true } } } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  async requestChange(actorId: string, scheduleId: string, dto: CreateScheduleChangeRequestDto) {
    const schedule = await this.prisma.trainingSchedule.findFirst({ where: { id: scheduleId, memberId: actorId, status: ScheduleStatus.SCHEDULED } });
    if (!schedule) throw new NotFoundException('Không tìm thấy lịch có thể yêu cầu đổi.');
    const { windowStart, windowEnd } = this.validateWindow(schedule.windowType, dto.requestedStart, dto.requestedEnd, true);
    const pending = await this.prisma.scheduleChangeRequest.findFirst({ where: { scheduleId, status: ScheduleChangeRequestStatus.PENDING }, select: { id: true } });
    if (pending) throw new BadRequestException('Lịch này đang có yêu cầu đổi chờ Owner xử lý.');
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.scheduleChangeRequest.create({ data: { scheduleId, requesterId: actorId, requestedStart: windowStart, requestedEnd: windowEnd, reason: dto.reason } });
      await this.audit.append(actorId, 'SCHEDULE_CHANGE_REQUESTED', 'SCHEDULE_CHANGE_REQUEST', request.id, { scheduleId, requestedStart: windowStart.toISOString(), requestedEnd: windowEnd.toISOString() }, tx);
      return request;
    });
  }
  async reviewChange(actorId: string, requestId: string, dto: ReviewScheduleChangeRequestDto) {
    if (dto.status !== ScheduleChangeRequestStatus.APPROVED && dto.status !== ScheduleChangeRequestStatus.REJECTED) throw new BadRequestException('Chỉ có thể duyệt hoặc từ chối yêu cầu đổi lịch.');
    const request = await this.prisma.scheduleChangeRequest.findUnique({ include: { schedule: true }, where: { id: requestId } });
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu đổi lịch.');
    if (request.status !== ScheduleChangeRequestStatus.PENDING) throw new BadRequestException('Yêu cầu này đã được xử lý.');
    if (request.schedule.status !== ScheduleStatus.SCHEDULED) throw new BadRequestException('Chỉ có thể đổi lịch đang chờ thực hiện.');
    if (dto.status === ScheduleChangeRequestStatus.APPROVED) this.validateWindow(request.schedule.windowType, request.requestedStart.toISOString(), request.requestedEnd.toISOString(), true);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.scheduleChangeRequest.updateMany({ where: { id: requestId, status: ScheduleChangeRequestStatus.PENDING }, data: { status: dto.status, reviewerId: actorId, reviewedAt: new Date(), reviewNote: dto.reviewNote } });
      if (!updated.count) throw new BadRequestException('Yêu cầu này vừa được xử lý.');
      if (dto.status === ScheduleChangeRequestStatus.APPROVED) await tx.trainingSchedule.update({ where: { id: request.scheduleId }, data: { windowStart: request.requestedStart, windowEnd: request.requestedEnd } });
      await this.audit.append(actorId, dto.status === ScheduleChangeRequestStatus.APPROVED ? 'SCHEDULE_CHANGE_APPROVED' : 'SCHEDULE_CHANGE_REJECTED', 'SCHEDULE_CHANGE_REQUEST', requestId, { scheduleId: request.scheduleId, reviewNote: dto.reviewNote }, tx);
      return tx.scheduleChangeRequest.findUniqueOrThrow({ where: { id: requestId } });
    });
  }
  private validateWindow(windowType: WindowType, rawStart: string, rawEnd: string, requiresAdvanceNotice: boolean) {
    const windowStart = new Date(rawStart); const windowEnd = new Date(rawEnd);
    if (Number.isNaN(windowStart.valueOf()) || Number.isNaN(windowEnd.valueOf()) || windowEnd <= windowStart) throw new BadRequestException('Khung giờ không hợp lệ.');
    if (requiresAdvanceNotice && windowStart.valueOf() < Date.now() + 2 * 60 * 60 * 1000) throw new BadRequestException('Giờ bắt đầu phải cách ít nhất 2 giờ.');
    if (windowType === WindowType.FLEXIBLE && windowEnd.valueOf() - windowStart.valueOf() > 2 * 60 * 60 * 1000) throw new BadRequestException('Khung lịch linh hoạt tối đa là 2 giờ.');
    return { windowStart, windowEnd };
  }
}
