import { BadRequestException } from '@nestjs/common';
import { ScheduleChangeRequestStatus, WindowType } from '@prisma/client';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../prisma.service';
import { SchedulesService } from './schedules.service';
describe('SchedulesService', () => {
  const service = new SchedulesService({} as PrismaService, {} as AuditService);
  it('từ chối flexible window dài hơn 2 giờ', async () => {
    await expect(service.create('owner-1', { memberId: 'member-1', ptId: 'pt-1', windowType: WindowType.FLEXIBLE, windowStart: '2026-09-17T08:00:00.000Z', windowEnd: '2026-09-17T10:01:00.000Z' })).rejects.toThrow(BadRequestException);
  });
  it('từ chối lịch bắt đầu trước thời hạn báo trước 2 giờ', async () => {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    await expect(service.create('owner-1', { memberId: 'member-1', ptId: 'pt-1', windowType: WindowType.FIXED, windowStart: start.toISOString(), windowEnd: end.toISOString() })).rejects.toThrow(BadRequestException);
  });
  it('chỉ cập nhật lịch khi Owner duyệt yêu cầu đang chờ', async () => {
    const requestedStart = new Date(Date.now() + 3 * 60 * 60 * 1000); const requestedEnd = new Date(requestedStart.getTime() + 60 * 60 * 1000);
    const tx = { scheduleChangeRequest: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'request-1', status: ScheduleChangeRequestStatus.APPROVED }) }, trainingSchedule: { update: jest.fn().mockResolvedValue({}) }, auditEvent: { create: jest.fn() } };
    const prisma = { scheduleChangeRequest: { findUnique: jest.fn().mockResolvedValue({ id: 'request-1', status: ScheduleChangeRequestStatus.PENDING, scheduleId: 'schedule-1', requestedStart, requestedEnd, schedule: { status: 'SCHEDULED', windowType: WindowType.FIXED } }) }, $transaction: (callback: (client: typeof tx) => unknown) => callback(tx) };
    const audit = { append: jest.fn().mockResolvedValue(undefined) };
    const reviewService = new SchedulesService(prisma as unknown as PrismaService, audit as unknown as AuditService);
    await reviewService.reviewChange('owner-1', 'request-1', { status: 'APPROVED' });
    expect(tx.trainingSchedule.update).toHaveBeenCalledWith({ where: { id: 'schedule-1' }, data: { windowStart: requestedStart, windowEnd: requestedEnd } });
    expect(audit.append).toHaveBeenCalledWith('owner-1', 'SCHEDULE_CHANGE_APPROVED', 'SCHEDULE_CHANGE_REQUEST', 'request-1', expect.any(Object), tx);
  });
});
