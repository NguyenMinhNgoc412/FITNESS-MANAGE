import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountStatus, AssignmentStatus, Role, ScheduleStatus, WindowType } from '@prisma/client';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../prisma.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto';
@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}
  async create(actorId: string, dto: CreateScheduleDto) {
    const { windowStart, windowEnd } = this.validateWindow(dto.windowType, dto.windowStart, dto.windowEnd);
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
    return this.prisma.trainingSchedule.findMany({ where: scope, orderBy: { windowStart: 'asc' } });
  }
  async update(actorId: string, scheduleId: string, dto: UpdateScheduleDto) {
    const current = await this.prisma.trainingSchedule.findUnique({ where: { id: scheduleId } });
    if (!current) throw new NotFoundException('Không tìm thấy lịch.');
    if (current.status === ScheduleStatus.COMPLETED) throw new BadRequestException('Không sửa lịch đã hoàn thành để bảo toàn lịch sử.');
    const type = dto.windowType ?? current.windowType;
    const { windowStart, windowEnd } = this.validateWindow(type, dto.windowStart ?? current.windowStart.toISOString(), dto.windowEnd ?? current.windowEnd.toISOString());
    return this.prisma.$transaction(async (tx) => {
      const schedule = await tx.trainingSchedule.update({ where: { id: scheduleId }, data: { windowType: type, windowStart, windowEnd, status: dto.status } });
      await this.audit.append(actorId, 'SCHEDULE_UPDATED', 'SCHEDULE', scheduleId, { status: dto.status, windowType: type }, tx);
      return schedule;
    });
  }
  private validateWindow(windowType: WindowType, rawStart: string, rawEnd: string) {
    const windowStart = new Date(rawStart); const windowEnd = new Date(rawEnd);
    if (Number.isNaN(windowStart.valueOf()) || Number.isNaN(windowEnd.valueOf()) || windowEnd <= windowStart) throw new BadRequestException('Khung giờ không hợp lệ.');
    if (windowType === WindowType.FLEXIBLE && windowEnd.valueOf() - windowStart.valueOf() > 2 * 60 * 60 * 1000) throw new BadRequestException('Khung lịch linh hoạt tối đa là 2 giờ.');
    return { windowStart, windowEnd };
  }
}
