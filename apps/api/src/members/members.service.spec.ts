import { AccountStatus, Prisma, Role } from '@prisma/client';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../prisma.service';
import { MembersService } from './members.service';

jest.mock('bcryptjs', () => ({ hash: jest.fn() }));

describe('MembersService', () => {
  it('tạo Member, assignment và audit trong cùng transaction', async () => {
    const tx = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue({ id: 'pt-1', status: AccountStatus.ACTIVE }),
        create: jest.fn().mockResolvedValue({ id: 'member-1', fullName: 'Member Test', email: 'member@test.dev', memberProfile: { goal: 'Tăng sức bền' } }),
      },
      assignment: { create: jest.fn().mockResolvedValue({ id: 'assignment-1', memberId: 'member-1', ptId: 'pt-1' }) },
    };
    const prisma = { $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)) } as unknown as PrismaService;
    const audit = { append: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
    const service = new MembersService(prisma, audit);

    await service.createWithInitialAssignment('owner-1', { fullName: 'Member Test', email: 'member@test.dev', password: 'password123', goal: 'Tăng sức bền', ptId: 'pt-1' });

    expect(tx.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ role: Role.MEMBER, memberProfile: { create: { goal: 'Tăng sức bền' } } }) }));
    expect(tx.assignment.create).toHaveBeenCalledWith({ data: expect.objectContaining({ memberId: 'member-1', ptId: 'pt-1', createdById: 'owner-1' }) });
    expect(audit.append).toHaveBeenCalledTimes(2);
  });

  it('đóng assignment cũ, tạo assignment mới và yêu cầu rà soát lịch', async () => {
    const current = { id: 'assignment-old', memberId: 'member-1', ptId: 'pt-old', status: 'ACTIVE' };
    const next = { id: 'assignment-new', memberId: 'member-1', ptId: 'pt-new', startedAt: new Date(), scheduleReviewRequired: true };
    const tx = {
      assignment: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(current),
        update: jest.fn().mockResolvedValue({ ...current, status: 'ENDED' }),
        create: jest.fn().mockResolvedValue(next),
      },
      user: { findFirst: jest.fn().mockResolvedValue({ id: 'pt-new' }) },
    };
    const prisma = {
      assignment: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    } as unknown as PrismaService;
    const audit = { append: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;
    const service = new MembersService(prisma, audit);

    const result = await service.changePt('owner-1', 'member-1', { newPtId: 'pt-new', idempotencyKey: 'change-pt-request-1', reason: 'Không phù hợp mục tiêu' });

    expect(tx.assignment.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'assignment-old' }, data: expect.objectContaining({ status: 'ENDED' }) }));
    expect(tx.assignment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ memberId: 'member-1', ptId: 'pt-new', scheduleReviewRequired: true, idempotencyKey: 'change-pt-request-1' }) }));
    expect(audit.append).toHaveBeenCalledWith('owner-1', 'PT_ASSIGNMENT_CHANGED', 'ASSIGNMENT', 'assignment-new', expect.objectContaining({ oldAssignmentId: 'assignment-old', newPtId: 'pt-new' }), tx);
    expect(result).toEqual(expect.objectContaining({ previousAssignmentId: 'assignment-old', currentPtId: 'pt-new', scheduleReviewRequired: true }));
  });

  it('race đổi PT bị database chặn được trả thành conflict an toàn', async () => {
    const duplicate = new Prisma.PrismaClientKnownRequestError('active assignment conflict', { code: 'P2002', clientVersion: '6.19.3' });
    const prisma = { assignment: { findUnique: jest.fn().mockResolvedValue(null) }, $transaction: jest.fn().mockRejectedValue(duplicate) } as unknown as PrismaService;
    const service = new MembersService(prisma, {} as AuditService);
    await expect(service.changePt('owner-1', 'member-1', { newPtId: 'pt-new', idempotencyKey: 'change-race-1' })).rejects.toThrow(ConflictException);
  });
});
