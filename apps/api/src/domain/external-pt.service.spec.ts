import { Role } from '@prisma/client';
import { ExternalPtService } from './external-pt.service';

describe('External PT confirmation outbox', () => {
  it('commits the confirmation request without waiting for push or consuming quota', async () => {
    const input = { phone: 'synthetic-phone', membershipId: 'synthetic-package', passId: 'synthetic-pass' };
    const owner = { sub: 'synthetic-owner', role: Role.OWNER, sessionId: 'synthetic-session' };
    const request = { id: 'synthetic-request', status: 'PENDING' };
    const db = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'synthetic-member', role: Role.MEMBER, status: 'ACTIVE' }) },
      customer: { findFirst: jest.fn().mockResolvedValue(null) },
      memberCheckin: { findFirst: jest.fn().mockResolvedValue(null) },
      membership: { findUnique: jest.fn().mockResolvedValue({ memberId: 'synthetic-member', mode: 'SESSION_BASED', status: 'ACTIVE', startAt: new Date(0), usedSessions: 0, totalSessions: 10 }) },
      externalPtPass: { findUnique: jest.fn().mockResolvedValue({ id: input.passId, memberId: 'synthetic-member', status: 'ACTIVE', usedUses: 0, totalUses: 3 }), update: jest.fn() },
      externalPtRequest: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(request) },
    };
    const notifications = { enqueue: jest.fn().mockResolvedValue(undefined), deliver: jest.fn(() => new Promise(() => undefined)) };
    const tx = { command: jest.fn((_actor, _action, _key, _input, work) => work(db)) };
    const service = new ExternalPtService({} as never, tx as never, {} as never, notifications as never);
    await expect(service.initiate(owner, input, 'synthetic-key')).resolves.toEqual(request);
    expect(notifications.enqueue).toHaveBeenCalledWith(db, ['synthetic-member'], 'EXTERNAL_PT_CONFIRM', request.id);
    expect(notifications.deliver).not.toHaveBeenCalled();
    expect(db.externalPtPass.update).not.toHaveBeenCalled();
  });
});
