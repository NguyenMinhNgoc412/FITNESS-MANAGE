import { Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, Role, ScheduleStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
export function resolveAttendanceStatus(memberPresent: boolean, ptPresent: boolean, windowEnded: boolean): AttendanceStatus {
  if (memberPresent && ptPresent) return AttendanceStatus.MATCHED;
  if (!windowEnded) return AttendanceStatus.NEEDS_REVIEW;
  if (memberPresent) return AttendanceStatus.MEMBER_ONLY;
  if (ptPresent) return AttendanceStatus.PT_ONLY;
  return AttendanceStatus.MISSING;
}
@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}
  async reconcileSchedule(scheduleId: string, evaluatedAt = new Date()) {
    const schedule = await this.prisma.trainingSchedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Không tìm thấy lịch để đối soát.');
    if (schedule.status === ScheduleStatus.CANCELLED) return null;
    const withinWindow = { gte: schedule.windowStart, lte: schedule.windowEnd };
    const [memberCheckin, ptCheckin] = await Promise.all([
      this.prisma.checkin.findFirst({ where: { actorUserId: schedule.memberId, actorRole: Role.MEMBER, checkedInAt: withinWindow }, orderBy: { checkedInAt: 'asc' } }),
      this.prisma.checkin.findFirst({ where: { actorUserId: schedule.ptId, actorRole: Role.PT, checkedInAt: withinWindow }, orderBy: { checkedInAt: 'asc' } }),
    ]);
    const status = resolveAttendanceStatus(Boolean(memberCheckin), Boolean(ptCheckin), evaluatedAt > schedule.windowEnd);
    return this.prisma.attendanceReconciliation.upsert({ where: { scheduleId }, create: { scheduleId, memberId: schedule.memberId, ptId: schedule.ptId, memberCheckinId: memberCheckin?.id, ptCheckinId: ptCheckin?.id, status, evaluatedAt }, update: { memberCheckinId: memberCheckin?.id, ptCheckinId: ptCheckin?.id, status, evaluatedAt } });
  }
  async reviewList() {
    return this.prisma.attendanceReconciliation.findMany({ where: { status: { in: [AttendanceStatus.MEMBER_ONLY, AttendanceStatus.NEEDS_REVIEW] } }, include: { schedule: true, memberCheckin: true, ptCheckin: true }, orderBy: { evaluatedAt: 'desc' } });
  }
  async detail(scheduleId: string) {
    const result = await this.prisma.attendanceReconciliation.findUnique({ where: { scheduleId }, include: { schedule: true, memberCheckin: true, ptCheckin: true } });
    if (!result) throw new NotFoundException('Chưa có kết quả đối soát cho lịch này.');
    return result;
  }
}
