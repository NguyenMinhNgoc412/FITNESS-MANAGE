import { Role } from '@prisma/client';
import { AttendanceService } from '../attendance/attendance.service';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../prisma.service';
import { CheckinsService } from './checkins.service';
describe('CheckinsService', () => {
  it('trả lại raw check-in cũ khi retry cùng idempotency key', async () => {
    const existing = { id: 'checkin-1', actorUserId: 'member-1', idempotencyKey: 'checkin-request-1' };
    const prisma = { checkin: { findUnique: jest.fn().mockResolvedValue(existing) } } as unknown as PrismaService;
    const service = new CheckinsService(prisma, {} as AuditService, {} as AttendanceService);
    await expect(service.createSelf('member-1', Role.MEMBER, 'checkin-request-1')).resolves.toEqual({ checkin: existing, idempotentReplay: true });
  });
});
