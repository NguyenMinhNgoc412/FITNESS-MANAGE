import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';
import { execFileSync } from 'child_process';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { ApiExceptionFilter } from '../src/common/errors';
import { ensureIndexes } from '../prisma/indexes';
import { checkinDayRange } from '../src/domain/checkin-day';

// All fixtures are generated test identities. Never use a real database/account.
const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('Set TEST_DATABASE_URL to an isolated fitness_test_ database.');
const database = new URL(url);
if (!database.pathname.startsWith('/fitness_test_')) throw new Error('Integration tests require a fitness_test_ database.');

describe('SOT core HTTP flows on MongoDB replica set', () => {
  let app: INestApplication, prisma: PrismaService, base: string;
  let owner: { accessToken: string; refreshToken: string; user: { id: string } };
  const password = randomBytes(24).toString('hex');
  let sequence = 0;
  const identity = () => { const n = ++sequence; return { phone: '09' + String(n).padStart(8, '0'), cccd: '99' + String(n).padStart(10, '0') }; };
  const request = async (path: string, token?: string, method = 'GET', body?: unknown, key = randomUUID()) => {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), 'Idempotency-Key': key }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const text = await response.text();
    return { status: response.status, data: text ? JSON.parse(text) : null };
  };
  const createPerson = async (role: 'PT' | 'MEMBER') => {
    const fields = identity();
    const result = await request('/people', owner.accessToken, 'POST', { ...fields, fullName: 'Generated fixture', password, role });
    expect(result.status).toBe(201);
    const login = await request('/auth/login', undefined, 'POST', { phone: fields.phone, password });
    expect(login.status).toBe(200);
    return { ...fields, ...login.data, id: result.data.id };
  };
  const packageBody = (totalSessions = 10) => ({ name: 'Fixture sessions', mode: 'SESSION_BASED', startAt: new Date(Date.now() - 60000).toISOString(), totalSessions });
  const packageFor = async (memberId: string, sessions = 10) => {
    const result = await request('/members/' + memberId + '/memberships', owner.accessToken, 'POST', packageBody(sessions));
    expect(result.status).toBe(201); return result.data;
  };
  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.JWT_ACCESS_SECRET = randomBytes(32).toString('hex');
    process.env.JWT_REFRESH_SECRET = randomBytes(32).toString('hex');
    process.env.JWT_QR_SECRET = randomBytes(32).toString('hex');
    process.env.AI_SERVICE_URL = ''; process.env.AI_SERVICE_TOKEN = '';
    execFileSync(process.execPath, [require.resolve('prisma/build/index.js'), 'db', 'push', '--skip-generate'], { env: process.env, stdio: 'pipe' });
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix('api'); app.useGlobalFilters(new ApiExceptionFilter());
    await app.listen(0, '127.0.0.1'); base = await app.getUrl() + '/api';
    prisma = app.get(PrismaService);
    await ensureIndexes(prisma);
    const fields = identity();
    await prisma.user.create({ data: { phone: fields.phone, role: Role.OWNER, passwordHash: await bcrypt.hash(password, 4), profile: { create: { fullName: 'Generated owner' } } } });
    owner = (await request('/auth/login', undefined, 'POST', { phone: fields.phone, password })).data;
  });
  afterAll(async () => {
    // Only this explicitly named test database is eligible for cleanup.
    if (prisma) await prisma.$runCommandRaw({ dropDatabase: 1 });
    if (app) await app.close();
  });

  it('Trial once per normalized phone, exactly 3 visits, retry and conversion preserve identity/history', async () => {
    const fields = identity();
    const trial = await request('/customers/trials', owner.accessToken, 'POST', { fullName: 'Trial fixture', phone: fields.phone });
    expect(trial.status).toBe(201);
    const customerId = trial.data.id;
    const duplicate = await request('/customers/trials', owner.accessToken, 'POST', { fullName: 'Trial fixture', phone: '+84' + fields.phone.slice(1) });
    expect(duplicate.status).toBe(409);
    for (let visit = 1; visit <= 3; visit++) {
      // Simulate a new local day using only generated test records.
      await prisma.memberCheckin.updateMany({ where: { customerId }, data: { checkedInAt: new Date(Date.now() - 86400000) } });
      const key = randomUUID();
      const attempts = await Promise.all([request('/customers/' + customerId + '/trial-checkin', owner.accessToken, 'POST', {}, key), request('/customers/' + customerId + '/trial-checkin', owner.accessToken, 'POST', {}, key)]);
      expect(attempts.map(r => r.status)).toEqual([201, 201]);
      expect(attempts[0].data.id).toBe(attempts[1].data.id);
      expect((await prisma.trialEntitlement.findUniqueOrThrow({ where: { customerId } })).usedSessions).toBe(visit);
    }
    expect((await request('/customers/' + customerId + '/trial-checkin', owner.accessToken, 'POST', {})).status).toBe(409);
    expect(await prisma.salesAlert.count({ where: { customerId, type: 'TRIAL_FINAL' } })).toBe(1);
    const converted = await request('/customers/' + customerId + '/convert-to-member', owner.accessToken, 'POST', { cccd: fields.cccd, password, membership: packageBody() });
    expect(converted.status).toBe(201);
    expect(converted.data.customer.id).toBe(customerId);
    expect(await prisma.customer.count({ where: { phone: fields.phone } })).toBe(1);
    expect(await prisma.memberCheckin.count({ where: { customerId } })).toBe(3);
  });

  it('blocks PT/Member booking, assignment/package mutations and Owner/PT AI access', async () => {
    for (const role of ['PT', 'MEMBER'] as const) {
      const actor = await createPerson(role);
      for (const [path, method] of [['/bookings', 'POST'], ['/bookings/' + actor.id, 'PATCH'], ['/bookings/' + actor.id + '/cancel', 'POST'], ['/members/' + actor.id + '/pt-assignment', 'POST'], ['/members/' + actor.id + '/memberships', 'POST']]) {
        expect((await request(path, actor.accessToken, method, {})).status).toBe(403);
      }
      if (role === 'PT') expect((await request('/ai/form-analysis', actor.accessToken, 'POST', {})).status).toBe(403);
    }
    expect((await request('/ai/form-analysis', owner.accessToken, 'POST', {})).status).toBe(403);
    expect((await request('/ai-analysis/upload-url', owner.accessToken, 'POST', {})).status).toBe(404);
  });

  it('serializes booking races for both PT and Member; cancellation frees the interval', async () => {
    const pt = await createPerson('PT'), member = await createPerson('MEMBER');
    expect((await request('/members/' + member.id + '/pt-assignment', owner.accessToken, 'POST', { ptId: pt.id, reason: 'Test assignment' })).status).toBe(201);
    const body = { memberId: member.id, ptId: pt.id, startAt: '2027-01-01T08:00:00Z', endAt: '2027-01-01T09:00:00Z' };
    const results = await Promise.all([request('/bookings', owner.accessToken, 'POST', body), request('/bookings', owner.accessToken, 'POST', body)]);
    expect(results.map(r => r.status).sort()).toEqual([201, 409]);
    const booking = results.find(r => r.status === 201)!.data;
    expect((await request('/bookings/' + booking.id, pt.accessToken)).status).toBe(200);
    const unrelated = await createPerson('MEMBER');
    expect((await request('/bookings/' + booking.id, unrelated.accessToken)).status).toBe(404);
    expect((await request('/bookings/' + booking.id + '/cancel', owner.accessToken, 'POST', { reason: 'Member requested' })).status).toBe(201);
    expect((await request('/bookings', owner.accessToken, 'POST', body)).status).toBe(201);
    const customerBookings = await request('/bookings?memberId=' + member.id, owner.accessToken);
    expect(customerBookings.status).toBe(200);
    expect(customerBookings.data.length).toBeGreaterThan(0);
    expect(customerBookings.data.every((item: { memberId: string }) => item.memberId === member.id)).toBe(true);
    const pt2 = await createPerson('PT');
    expect((await request('/members/' + member.id + '/pt-assignment', owner.accessToken, 'PATCH', { ptId: pt2.id, reason: 'Change PT' })).status).toBe(200);
    const overlap = await request('/bookings', owner.accessToken, 'POST', { ...body, ptId: pt2.id });
    expect(overlap.status).toBe(409); expect(overlap.data.code).toBe('BOOKING_MEMBER_TIME_CONFLICT');
    expect(await prisma.ptAssignment.count({ where: { memberId: member.id, status: 'ACTIVE' } })).toBe(1);
    expect(await prisma.ptAssignment.count({ where: { memberId: member.id } })).toBe(2);
  });

  it('atomic self-training quota, signed QR, independent PT log and expired package login', async () => {
    const member = await createPerson('MEMBER'), pt = await createPerson('PT'), membership = await packageFor(member.id, 1);
    const qr = await request('/members/me/qr', member.accessToken);
    expect((await request('/checkins/resolve-qr', owner.accessToken, 'POST', { token: qr.data.token })).status).toBe(201);
    const body = { memberId: member.id, membershipId: membership.id, context: 'SELF_TRAINING', method: 'QR', qrToken: qr.data.token };
    const key = randomUUID();
    const results = await Promise.all([request('/checkins/member', owner.accessToken, 'POST', body, key), request('/checkins/member', owner.accessToken, 'POST', body, key)]);
    expect(results.map(r => r.status)).toEqual([201, 201]);
    expect(await prisma.memberCheckin.count({ where: { memberId: member.id } })).toBe(1);
    expect((await prisma.membership.findUniqueOrThrow({ where: { id: membership.id } })).usedSessions).toBe(1);
    expect((await request('/checkins/member', owner.accessToken, 'POST', body)).status).toBe(409);
    expect((await request('/auth/login', undefined, 'POST', { phone: member.phone, password })).status).toBe(200);
    expect((await request('/pt/me/checkin', pt.accessToken, 'POST', {})).status).toBe(201);
    expect((await request('/pt/me/attendance', pt.accessToken)).status).toBe(200);
    expect(await prisma.ptAttendanceLog.count({ where: { ptId: pt.id } })).toBe(1);
    expect((await request('/pt/' + pt.id + '/attendance', member.accessToken)).status).toBe(403);
  });

  it('different command keys and QR/phone races consume only one daily session', async () => {
    const member = await createPerson('MEMBER'), membership = await packageFor(member.id, 5);
    const qr = await request('/members/me/qr', member.accessToken);
    const body = { memberId: member.id, membershipId: membership.id, context: 'SELF_TRAINING' };
    const results = await Promise.all([
      request('/checkins/member', owner.accessToken, 'POST', { ...body, method: 'QR', qrToken: qr.data.token }),
      request('/checkins/member', owner.accessToken, 'POST', { ...body, method: 'PHONE' }),
    ]);
    expect(results.map(result => result.status).sort()).toEqual([201, 409]);
    expect(results.find(result => result.status === 409)!.data.code).toBe('ALREADY_CHECKED_IN_TODAY');
    await prisma.memberCheckin.updateMany({ where: { memberId: member.id }, data: { checkedInAt: checkinDayRange(new Date()).gte } });
    const secondPackage = await packageFor(member.id, 5);
    const repeated = await request('/checkins/member', owner.accessToken, 'POST', { ...body, membershipId: secondPackage.id, method: 'PHONE' });
    expect(repeated.status).toBe(409);
    expect((await prisma.membership.findUniqueOrThrow({ where: { id: secondPackage.id } })).usedSessions).toBe(0);
    expect((await prisma.membership.findUniqueOrThrow({ where: { id: membership.id } })).usedSessions).toBe(1);
    expect(await prisma.memberCheckin.count({ where: { memberId: member.id } })).toBe(1);
    await prisma.memberCheckin.updateMany({ where: { memberId: member.id }, data: { checkedInAt: new Date(Date.now() - 86400000) } });
    expect((await request('/checkins/member', owner.accessToken, 'POST', { ...body, method: 'PHONE' })).status).toBe(201);
    expect((await prisma.membership.findUniqueOrThrow({ where: { id: membership.id } })).usedSessions).toBe(2);
  });

  it('links Owner internal PT check-in to a booking while PT attendance remains separate', async () => {
    const member = await createPerson('MEMBER'), pt = await createPerson('PT'), membership = await packageFor(member.id, 2);
    await request('/members/' + member.id + '/pt-assignment', owner.accessToken, 'POST', { ptId: pt.id, reason: 'Test assignment' });
    const booking = await request('/bookings', owner.accessToken, 'POST', { memberId: member.id, ptId: pt.id, startAt: '2027-02-01T08:00:00Z', endAt: '2027-02-01T09:00:00Z' });
    expect(booking.status).toBe(201);
    const body = { memberId: member.id, membershipId: membership.id, context: 'WITH_INTERNAL_PT', method: 'PHONE' };
    expect((await request('/checkins/member', owner.accessToken, 'POST', body)).status).toBe(409);
    expect((await request('/checkins/member', member.accessToken, 'POST', { ...body, bookingId: booking.data.id })).status).toBe(403);
    expect((await request('/checkins/member', pt.accessToken, 'POST', { ...body, bookingId: booking.data.id })).status).toBe(403);
    const checkedIn = await request('/checkins/member', owner.accessToken, 'POST', { ...body, bookingId: booking.data.id });
    expect(checkedIn.status).toBe(201);
    expect(checkedIn.data.bookingId).toBe(booking.data.id);
    expect((await prisma.membership.findUniqueOrThrow({ where: { id: membership.id } })).usedSessions).toBe(1);
    expect((await prisma.ptAttendanceLog.count({ where: { ptId: pt.id } }))).toBe(0);
    expect((await request('/members/me/checkins', member.accessToken)).data.some((log: { id: string }) => log.id === checkedIn.data.id)).toBe(true);
    expect((await request('/pt/me/checkin', pt.accessToken, 'POST', {})).status).toBe(201);
    expect((await prisma.ptAttendanceLog.count({ where: { ptId: pt.id } }))).toBe(1);
  });

  it('external confirmation consumes package/pass once; fallback is audited', async () => {
    const member = await createPerson('MEMBER'), membership = await packageFor(member.id);
    const pass = await request('/members/' + member.id + '/external-pt-passes', owner.accessToken, 'POST', { totalUses: 2 });
    const initiated = await request('/external-pt/checkin/initiate', owner.accessToken, 'POST', { phone: member.phone, membershipId: membership.id, passId: pass.data.id });
    expect(initiated.status).toBe(201);
    expect((await prisma.externalPtPass.findUniqueOrThrow({ where: { id: pass.data.id } })).usedUses).toBe(0);
    const other = await createPerson('MEMBER');
    expect((await request('/external-pt/checkin/' + initiated.data.id + '/confirm', other.accessToken, 'POST', {})).status).toBe(404);
    const confirmations = await Promise.all([request('/external-pt/checkin/' + initiated.data.id + '/confirm', member.accessToken, 'POST', {}), request('/external-pt/checkin/' + initiated.data.id + '/confirm', member.accessToken, 'POST', {})]);
    expect(confirmations.map(r => r.status)).toEqual([201, 201]);
    expect((await prisma.externalPtPass.findUniqueOrThrow({ where: { id: pass.data.id } })).usedUses).toBe(1);
    const sameDay = await request('/checkins/member', owner.accessToken, 'POST', { memberId: member.id, membershipId: membership.id, context: 'SELF_TRAINING', method: 'PHONE' });
    expect(sameDay.status).toBe(409);
    expect(sameDay.data.code).toBe('ALREADY_CHECKED_IN_TODAY');
    expect((await prisma.externalPtPass.findUniqueOrThrow({ where: { id: pass.data.id } })).usedUses).toBe(1);
    await prisma.memberCheckin.updateMany({ where: { memberId: member.id }, data: { checkedInAt: new Date(Date.now() - 86400000) } });
    const next = await request('/external-pt/checkin/initiate', owner.accessToken, 'POST', { phone: member.phone, membershipId: membership.id, passId: pass.data.id });
    expect((await request('/external-pt/checkin/' + next.data.id + '/owner-fallback-confirm', owner.accessToken, 'POST', { reason: 'Confirmed at counter; no device', confirmedAtCounter: true, pushUnavailable: true })).status).toBe(201);
    expect(await prisma.auditLog.count({ where: { action: 'EXTERNAL_PT_FALLBACK', resourceId: next.data.id } })).toBe(1);
    expect((await prisma.externalPtPass.findUniqueOrThrow({ where: { id: pass.data.id } })).usedUses).toBe(2);
  });

  it('refresh rotates atomically, revoked and locked sessions are denied', async () => {
    const member = await createPerson('MEMBER');
    const results = await Promise.all([request('/auth/refresh', undefined, 'POST', { refreshToken: member.refreshToken }), request('/auth/refresh', undefined, 'POST', { refreshToken: member.refreshToken })]);
    expect(results.map(r => r.status).sort()).toEqual([200, 401]);
    expect((await request('/auth/me', member.accessToken)).status).toBe(401);
    const next = results.find(r => r.status === 200)!.data;
    await request('/people/' + member.id, owner.accessToken, 'PATCH', { status: 'LOCKED', reason: 'Test lock' });
    expect((await request('/auth/me', next.accessToken)).status).toBe(401);
    expect((await request('/auth/refresh', undefined, 'POST', { refreshToken: next.refreshToken })).status).toBe(401);
  });

  it('does not expose CCCD to assigned PT and rejects duplicate CCCD', async () => {
    const pt = await createPerson('PT'), member = await createPerson('MEMBER');
    await request('/members/' + member.id + '/pt-assignment', owner.accessToken, 'POST', { ptId: pt.id, reason: 'Test scope' });
    const visible = await request('/pt/me/members', pt.accessToken);
    expect(JSON.stringify(visible.data)).not.toContain(member.cccd);
    const fields = identity();
    expect((await request('/people', owner.accessToken, 'POST', { ...fields, cccd: member.cccd, fullName: 'Duplicate fixture', password, role: 'MEMBER' })).status).toBe(409);
  });
});
