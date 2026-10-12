import { Role } from '@prisma/client';
import { CheckinsService, CheckinInput } from './checkins.service';
import { CustomersService } from './customers.service';
import { checkinDayRange } from './checkin-day';
import { ExternalPtService } from './external-pt.service';

describe('one check-in per local day', () => {
  const owner = { sub: 'owner-fixture', role: Role.OWNER, sessionId: 'fixture-session' };
  const input: CheckinInput = { memberId: 'member-fixture', membershipId: 'package-fixture', context: 'SELF_TRAINING', method: 'PHONE' };
  const db = {
    user: { findUnique: jest.fn() }, customer: { findFirst: jest.fn(), findUnique: jest.fn() },
    membership: { findUnique: jest.fn(), update: jest.fn() },
    memberCheckin: { findFirst: jest.fn(), create: jest.fn() },
    trialEntitlement: { findUnique: jest.fn(), update: jest.fn() },
    ptAttendanceLog: { findFirst: jest.fn(), create: jest.fn() },
    externalPtRequest: { findUnique: jest.fn(), update: jest.fn() },
    externalPtPass: { findUnique: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn() },
  };
  const tx = { command: jest.fn((_actor, _action, _key, _input, work) => work(db, 'fixture-command')) };
  const memberships = { alert: jest.fn() };
  const service = new CheckinsService({} as never, tx as never, {} as never, memberships as never);
  const customers = new CustomersService({} as never, tx as never, {} as never);
  const external = new ExternalPtService({} as never, tx as never, service, {} as never);
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-09T05:00:00Z'));
    jest.clearAllMocks();
    db.user.findUnique.mockResolvedValue({ role: Role.MEMBER, status: 'ACTIVE' });
    db.customer.findFirst.mockResolvedValue({ id: 'customer-fixture' });
    db.memberCheckin.findFirst.mockResolvedValue(null);
    db.memberCheckin.create.mockResolvedValue({ id: 'log-fixture' });
    db.membership.findUnique.mockResolvedValue({ id: input.membershipId, memberId: input.memberId, mode: 'SESSION_BASED', status: 'ACTIVE', startAt: new Date('2026-01-01Z'), totalSessions: 10, usedSessions: 0 });
  });
  afterEach(() => jest.useRealTimers());
  it.each([
    ['2026-10-09T16:59:59.999Z', '2026-10-08T17:00:00.000Z', '2026-10-09T17:00:00.000Z'],
    ['2026-10-09T17:00:00.000Z', '2026-10-09T17:00:00.000Z', '2026-10-10T17:00:00.000Z'],
    ['2026-12-31T17:00:00.000Z', '2026-12-31T17:00:00.000Z', '2027-01-01T17:00:00.000Z'],
  ])('uses UTC+7 calendar day at %s', (now, start, end) => {
    const range = checkinDayRange(new Date(now));
    expect(range.gte.toISOString()).toBe(start);
    expect(range.lt.toISOString()).toBe(end);
  });
  it.each(['SELF_TRAINING', 'WITH_INTERNAL_PT', 'WITH_EXTERNAL_PT'])('rejects existing daily log before consuming in %s', async context => {
    db.memberCheckin.findFirst.mockResolvedValue({ id: 'morning-log', checkedInAt: new Date('2026-10-09T00:00:00Z'), context: 'TRIAL' });
    await expect(service.consumeIn(db as never, owner, { ...input, context, membershipId: 'different-package', method: 'QR' }, 'new-command')).rejects.toMatchObject({ response: { code: 'ALREADY_CHECKED_IN_TODAY' } });
    expect(db.membership.update).not.toHaveBeenCalled();
    expect(db.memberCheckin.create).not.toHaveBeenCalled();
    expect(db.memberCheckin.findFirst).toHaveBeenCalledWith({ where: { OR: [{ memberId: input.memberId }, { customerId: 'customer-fixture' }], checkedInAt: checkinDayRange(new Date()) } });
  });
  it('records exactly the timestamp used by the daily guard', async () => {
    await service.member(owner, input, 'new-key-fixture');
    expect(db.membership.update).toHaveBeenCalledTimes(1);
    expect(db.memberCheckin.create).toHaveBeenCalledWith({ data: expect.objectContaining({ checkedInAt: new Date(), memberId: input.memberId }) });
  });
  it('rejects Trial repeat without changing quota, even after its last session', async () => {
    db.customer.findUnique.mockResolvedValue({ id: 'customer-fixture', status: 'TRIAL' });
    db.trialEntitlement.findUnique.mockResolvedValue({ usedSessions: 3, status: 'EXHAUSTED' });
    db.memberCheckin.findFirst.mockResolvedValue({ id: 'trial-log' });
    await expect(customers.checkin(owner, 'customer-fixture', 'new-key-fixture')).rejects.toMatchObject({ response: { code: 'ALREADY_CHECKED_IN_TODAY' } });
    expect(db.trialEntitlement.update).not.toHaveBeenCalled();
    expect(db.memberCheckin.create).not.toHaveBeenCalled();
  });
  it('rejects PT repeat independently without creating a log', async () => {
    db.user.findUnique.mockResolvedValue({ role: Role.PT, status: 'ACTIVE' });
    db.ptAttendanceLog.findFirst.mockResolvedValue({ id: 'pt-log' });
    await expect(service.pt({ ...owner, role: Role.PT }, 'new-key-fixture')).rejects.toMatchObject({ response: { code: 'ALREADY_CHECKED_IN_TODAY' } });
    expect(db.ptAttendanceLog.create).not.toHaveBeenCalled();
  });
  it('does not consume an external pass for a pending request after another daily check-in', async () => {
    db.externalPtRequest.findUnique.mockResolvedValue({ memberId: input.memberId, membershipId: input.membershipId, passId: 'pass-fixture', initiatedBy: owner.sub, status: 'PENDING' });
    db.externalPtPass.findUnique.mockResolvedValue({ id: 'pass-fixture', status: 'ACTIVE', usedUses: 0, totalUses: 3 });
    db.memberCheckin.findFirst.mockResolvedValue({ id: 'existing-self-training' });
    await expect(external.confirm({ ...owner, sub: input.memberId, role: Role.MEMBER }, 'request-fixture', 'new-key-fixture')).rejects.toMatchObject({ response: { code: 'ALREADY_CHECKED_IN_TODAY' } });
    expect(db.externalPtPass.update).not.toHaveBeenCalled();
    expect(db.membership.update).not.toHaveBeenCalled();
    expect(db.externalPtRequest.update).not.toHaveBeenCalled();
  });
});
