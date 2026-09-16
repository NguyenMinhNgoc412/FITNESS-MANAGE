import { BadRequestException } from '@nestjs/common';
import { WindowType } from '@prisma/client';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../prisma.service';
import { SchedulesService } from './schedules.service';
describe('SchedulesService', () => {
  const service = new SchedulesService({} as PrismaService, {} as AuditService);
  it('từ chối flexible window dài hơn 2 giờ', async () => {
    await expect(service.create('owner-1', { memberId: 'member-1', ptId: 'pt-1', windowType: WindowType.FLEXIBLE, windowStart: '2026-09-17T08:00:00.000Z', windowEnd: '2026-09-17T10:01:00.000Z' })).rejects.toThrow(BadRequestException);
  });
});
