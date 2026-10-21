import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { CheckinsService } from './checkins.service';

describe('PT QR attendance', () => {
  const owner = { sub: '111111111111111111111111', role: Role.OWNER, sessionId: 'synthetic-session' };
  const pt = { ...owner, sub: '222222222222222222222222', role: Role.PT };
  const member = { ...owner, sub: '333333333333333333333333', role: Role.MEMBER };
  const jwt = new JwtService();
  const db = {
    user: { findUnique: jest.fn(), findFirst: jest.fn() },
    ptAttendanceLog: { findFirst: jest.fn(), create: jest.fn() },
    auditLog: { create: jest.fn() },
  };
  const tx = { command: jest.fn((_actor, _action, _key, _input, work) => work(db, 'synthetic-command')) };
  const memberships = { list: jest.fn() };
  const service = new CheckinsService(db as never, tx as never, jwt, memberships as never);
  let previousSecret: string | undefined;
  beforeAll(() => { previousSecret = process.env.JWT_QR_SECRET; process.env.JWT_QR_SECRET = 'synthetic-test-only-qr-secret'; });
  afterAll(() => { if (previousSecret === undefined) delete process.env.JWT_QR_SECRET; else process.env.JWT_QR_SECRET = previousSecret; });
  beforeEach(() => {
    jest.clearAllMocks();
    db.user.findUnique.mockResolvedValue({ role: Role.PT, status: 'ACTIVE' });
    db.user.findFirst.mockResolvedValue({ id: pt.sub, profile: { fullName: 'Synthetic PT' } });
    db.ptAttendanceLog.findFirst.mockResolvedValue(null);
    db.ptAttendanceLog.create.mockResolvedValue({ id: 'synthetic-log', ptId: pt.sub, source: 'QR' });
  });
  it('issues an expiring PT-only token and resolves the minimal PT identity', async () => {
    const qr = await service.qr(pt);
    const claims = await jwt.verifyAsync(qr.token, { secret: process.env.JWT_QR_SECRET });
    expect(claims.kind).toBe('pt-attendance');
    expect(claims.exp - claims.iat).toBe(120);
    expect(Object.keys(claims).sort()).toEqual(['exp', 'iat', 'kind', 'sub']);
    expect(qr.expiresIn).toBe(120);
    expect(await service.resolve(owner, qr.token)).toEqual({ pt: { id: pt.sub, profile: { fullName: 'Synthetic PT' } } });
    expect(memberships.list).not.toHaveBeenCalled();
  });
  it('records an independent QR log and Owner audit without storing the token', async () => {
    const qr = await service.qr(pt);
    await service.pt(owner, qr.token, 'synthetic-key');
    expect(db.ptAttendanceLog.create).toHaveBeenCalledWith({ data: { ptId: pt.sub, source: 'QR', idempotencyKey: 'synthetic-command', checkedInAt: expect.any(Date) } });
    expect(db.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ actorId: owner.sub, action: 'PT_QR_CHECKIN', resourceId: 'synthetic-log' }) });
    expect(JSON.stringify(db.auditLog.create.mock.calls)).not.toContain(qr.token);
    expect(memberships.list).not.toHaveBeenCalled();
  });
  it.each([Role.PT, Role.MEMBER])('denies attendance mutation and resolving to %s at service boundary', async role => {
    const actor = { ...pt, role };
    expect(() => service.pt(actor, 'synthetic-token', 'synthetic-key')).toThrow();
    await expect(service.resolve(actor, 'synthetic-token')).rejects.toMatchObject({ response: { code: 'FORBIDDEN' } });
    expect(tx.command).not.toHaveBeenCalled();
  });
  it('rejects a Member QR as PT attendance and a PT QR as Member identity', async () => {
    await expect(service.pt(owner, (await service.qr(member)).token, 'synthetic-key')).rejects.toMatchObject({ response: { code: 'INVALID_QR' } });
    await expect(service.qrSubject((await service.qr(pt)).token)).rejects.toMatchObject({ response: { code: 'INVALID_QR' } });
    expect(db.ptAttendanceLog.create).not.toHaveBeenCalled();
  });
  it('rejects expired, forged and malformed QR before writing', async () => {
    const expired = await jwt.signAsync({ sub: pt.sub, kind: 'pt-attendance' }, { secret: process.env.JWT_QR_SECRET, expiresIn: -1 });
    const forged = await jwt.signAsync({ sub: pt.sub, kind: 'pt-attendance' }, { secret: 'different-synthetic-secret', expiresIn: 120 });
    const invalidId = await jwt.signAsync({ sub: 'invalid-id', kind: 'pt-attendance' }, { secret: process.env.JWT_QR_SECRET, expiresIn: 120 });
    for (const token of [expired, forged, invalidId, 'malformed']) {
      await expect(service.pt(owner, token, 'synthetic-key')).rejects.toMatchObject({ response: { code: 'INVALID_QR' } });
      await expect(service.resolve(owner, token)).rejects.toMatchObject({ response: { code: 'INVALID_QR' } });
    }
    expect(db.ptAttendanceLog.create).not.toHaveBeenCalled();
  });
  it('rejects disabled PT at resolution and rechecks account on confirmation', async () => {
    const qr = await service.qr(pt);
    db.user.findFirst.mockResolvedValue(null);
    await expect(service.resolve(owner, qr.token)).rejects.toMatchObject({ response: { code: 'INVALID_QR' } });
    db.user.findUnique.mockResolvedValue({ role: Role.PT, status: 'INACTIVE' });
    await expect(service.pt(owner, qr.token, 'synthetic-key')).rejects.toThrow();
    expect(db.ptAttendanceLog.create).not.toHaveBeenCalled();
  });
  it('rejects another daily attendance without another log or audit', async () => {
    db.ptAttendanceLog.findFirst.mockResolvedValue({ id: 'existing-log' });
    await expect(service.pt(owner, (await service.qr(pt)).token, 'synthetic-key')).rejects.toMatchObject({ response: { code: 'ALREADY_CHECKED_IN_TODAY' } });
    expect(db.ptAttendanceLog.create).not.toHaveBeenCalled();
    expect(db.auditLog.create).not.toHaveBeenCalled();
  });
  it('allows the command layer to replay an old result without checking expired QR again', async () => {
    tx.command.mockImplementationOnce(async () => ({ id: 'previous-log' }));
    expect(await service.pt(owner, 'now-expired-token', 'synthetic-key')).toEqual({ id: 'previous-log' });
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(db.ptAttendanceLog.create).not.toHaveBeenCalled();
  });
});
