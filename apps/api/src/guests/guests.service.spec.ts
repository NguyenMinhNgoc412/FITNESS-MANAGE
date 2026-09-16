import * as bcrypt from 'bcryptjs';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../prisma.service';
import { GuestsService } from './guests.service';
jest.mock('bcryptjs', () => ({ hash: jest.fn() }));
describe('GuestsService', () => {
  it('convert Guest tạo Member, assignment và linkage trong một transaction', async () => {
    const tx = {
      guestTrial: {
        findUnique: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'guest-1', displayName: 'Guest', phone: '0900', convertedMemberId: null }),
        update: jest.fn().mockResolvedValue({ id: 'guest-1', convertedMemberId: 'member-1', convertedAt: new Date() }),
      },
      user: { findUnique: jest.fn().mockResolvedValue(null), findFirst: jest.fn().mockResolvedValue({ id: 'pt-1' }), create: jest.fn().mockResolvedValue({ id: 'member-1' }) },
      assignment: { create: jest.fn().mockResolvedValue({ id: 'assignment-1' }) },
    };
    const prisma = { guestTrial: { findUnique: jest.fn().mockResolvedValue(null) }, $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)) } as unknown as PrismaService;
    const audit = { append: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
    const service = new GuestsService(prisma, audit);
    const result = await service.convert('owner-1', 'guest-1', { fullName: 'New Member', email: 'new@test.dev', password: 'password123', goal: 'Sức khoẻ', ptId: 'pt-1', idempotencyKey: 'guest-convert-1' });
    expect(tx.assignment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ memberId: 'member-1', ptId: 'pt-1' }) }));
    expect(tx.guestTrial.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'guest-1' }, data: expect.objectContaining({ convertedMemberId: 'member-1', conversionIdempotencyKey: 'guest-convert-1' }) }));
    expect(result).toEqual(expect.objectContaining({ memberId: 'member-1', assignmentId: 'assignment-1' }));
  });
  it('retry conversion không tạo Member thứ hai', async () => {
    const prior = { id: 'guest-1', convertedMemberId: 'member-1', convertedAt: new Date() };
    const prisma = { guestTrial: { findUnique: jest.fn().mockResolvedValue(prior) }, $transaction: jest.fn() } as unknown as PrismaService;
    const service = new GuestsService(prisma, {} as AuditService);
    await expect(service.convert('owner-1', 'guest-1', { fullName: 'Member', email: 'member@test.dev', password: 'password123', goal: 'Fitness', ptId: 'pt-1', idempotencyKey: 'guest-convert-1' })).resolves.toEqual(expect.objectContaining({ memberId: 'member-1', idempotentReplay: true }));
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
