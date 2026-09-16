import { ConflictException, Injectable } from '@nestjs/common';
import { Role, ScheduleStatus } from '@prisma/client';
import { AttendanceService } from '../attendance/attendance.service';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../prisma.service';
@Injectable()
export class CheckinsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly attendance: AttendanceService) {}
  async createSelf(actorId: string, role: Role, idempotencyKey: string) {
    const existing = await this.prisma.checkin.findUnique({ where: { idempotencyKey } });
    if (existing) {
      if (existing.actorUserId !== actorId) throw new ConflictException('Idempotency key đã được dùng bởi tài khoản khác.');
      return { checkin: existing, idempotentReplay: true };
    }
    const checkedInAt = new Date();
    const schedules = await this.prisma.trainingSchedule.findMany({ where: { ...(role === Role.MEMBER ? { memberId: actorId } : { ptId: actorId }), status: ScheduleStatus.SCHEDULED, windowStart: { lte: checkedInAt }, windowEnd: { gte: checkedInAt } }, select: { id: true } });
    const scheduleId = schedules.length === 1 ? schedules[0].id : null;
    const checkin = await this.prisma.$transaction(async (tx) => {
      const created = await tx.checkin.create({ data: { actorUserId: actorId, actorRole: role, checkedInAt, scheduleId, idempotencyKey } });
      await this.audit.append(actorId, 'SELF_CHECKIN_CREATED', 'CHECKIN', created.id, { role, scheduleId }, tx);
      return created;
    });
    await Promise.all(schedules.map(({ id }) => this.attendance.reconcileSchedule(id, checkedInAt)));
    return { checkin, idempotentReplay: false };
  }
  async ownHistory(actorId: string) { return this.prisma.checkin.findMany({ where: { actorUserId: actorId }, orderBy: { checkedInAt: 'desc' } }); }
}
