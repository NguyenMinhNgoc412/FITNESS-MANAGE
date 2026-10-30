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
import { seedExercises } from '../prisma/exercise-seed';
import { todayVn } from '../src/domain/workout-rules';

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

  it('workout self CRUD, replay/races, revisions, rollback, progress and zero operational side effects', async () => {
    const member = await createPerson('MEMBER'), other = await createPerson('MEMBER'), date = todayVn();
    const counts = async () => Promise.all([prisma.membership.count(), prisma.memberCheckin.count(), prisma.ptAttendanceLog.count(), prisma.booking.count(), prisma.externalPtPass.count(), prisma.auditLog.count()]);
    const before = await counts();
    const input = { workoutDate: date, title: 'Fixture workout', note: '', exercises: [{ id: randomUUID(), source: 'CUSTOM', displayName: 'Squat', sets: [{ id: randomUUID(), reps: 10, weightKg: 20 }, { id: randomUUID(), reps: 8, weightKg: 25 }, { id: randomUUID(), reps: 12, weightKg: null }] }] };
    const key = randomUUID();
    const created = await Promise.all([request('/members/me/workouts', member.accessToken, 'POST', input, key), request('/members/me/workouts', member.accessToken, 'POST', input, key)]);
    expect(created.map(v => v.status)).toEqual([201, 201]); expect(created[0].data.id).toBe(created[1].data.id);
    const path = '/members/me/workouts/' + created[0].data.id;
    expect((await request(path, other.accessToken)).status).toBe(404);
    expect((await request(path + '/revisions', other.accessToken)).status).toBe(404);
    expect((await request(path, other.accessToken, 'PATCH', { expectedVersion: 1, input })).status).toBe(404);
    expect((await request(path + '/archive', other.accessToken, 'POST', { expectedVersion: 1 })).status).toBe(404);
    expect((await request('/members/me/workouts', member.accessToken, 'POST', { ...input, title: 'Changed' }, key)).data.code).toBe('IDEMPOTENCY_CONFLICT');
    const race = await Promise.all([request(path, member.accessToken, 'PATCH', { expectedVersion: 1, input: { ...input, title: 'A' } }), request(path, member.accessToken, 'PATCH', { expectedVersion: 1, input: { ...input, title: 'B' } })]);
    expect(race.map(v => v.status).sort()).toEqual([200, 409]);
    expect((await request(path + '/revisions', member.accessToken)).data.total).toBe(2);
    const complete = await request(path + '/complete', member.accessToken, 'POST', { expectedVersion: 2 }); expect(complete.status).toBe(201);
    const progress = await request('/members/me/workout-progress?from=' + date + '&to=' + date, member.accessToken);
    expect(progress.data.totalSessions).toBe(1); expect(progress.data.series[0].points[0]).toMatchObject({ reps: 30, maxWeightKg: 25 });
    const invalid = await request(path, member.accessToken, 'PATCH', { expectedVersion: 3, input: { ...input, exercises: [] } }); expect(invalid.status).toBe(400);
    expect((await request(path + '/revisions', member.accessToken)).data.total).toBe(3);
    const archiveRace = await Promise.all([request(path + '/archive', member.accessToken, 'POST', { expectedVersion: 3 }), request(path, member.accessToken, 'PATCH', { expectedVersion: 3, input })]);
    expect(archiveRace.filter(v => v.status < 300)).toHaveLength(1); expect(archiveRace.filter(v => v.status === 409)).toHaveLength(1);
    let current = (await request(path, member.accessToken)).data;
    if (current.status !== 'ARCHIVED') { expect((await request(path + '/archive', member.accessToken, 'POST', { expectedVersion: current.version })).status).toBe(201); current = (await request(path, member.accessToken)).data; }
    expect((await request(path, member.accessToken, 'PATCH', { expectedVersion: current.version, input })).data.code).toBe('WORKOUT_STATE_CONFLICT');
    expect((await request('/members/me/workout-progress?from=' + date + '&to=' + date, member.accessToken)).data.totalSessions).toBe(0);
    expect(await counts()).toEqual(before);
  });

  it('measurement daily concurrency, idempotency, independent metrics, archive and self privacy', async () => {
    const member = await createPerson('MEMBER'), other = await createPerson('MEMBER');
    const input = { measurementDate: '2026-01-01', weightKg: 70, heightCm: 170 };
    const raced = await Promise.all([request('/members/me/body-measurements', member.accessToken, 'POST', input), request('/members/me/body-measurements', member.accessToken, 'POST', input)]);
    expect(raced.map(v => v.status).sort()).toEqual([201, 409]); expect(raced.find(v => v.status === 409)?.data.code).toBe('MEASUREMENT_DATE_CONFLICT');
    const first = raced.find(v => v.status === 201)!.data;
    const key = randomUUID(), laterInput = { measurementDate: '2026-01-10', weightKg: 69.5, heightCm: null };
    const later = await request('/members/me/body-measurements', member.accessToken, 'POST', laterInput, key);
    expect((await request('/members/me/body-measurements', member.accessToken, 'POST', laterInput, key)).data.id).toBe(later.data.id);
    const path = '/members/me/body-measurements/' + later.data.id;
    expect((await request(path, other.accessToken)).status).toBe(404);
    expect((await request(path + '/revisions', other.accessToken)).status).toBe(404);
    expect((await request(path, other.accessToken, 'PATCH', { expectedVersion: 1, weightKg: 1, heightCm: null })).status).toBe(404);
    expect((await request(path + '/archive', other.accessToken, 'POST', { expectedVersion: 1 })).status).toBe(404);
    const progressPath = '/members/me/body-measurement-progress?from=2026-01-01&to=2026-01-10';
    const p = (await request(progressPath, member.accessToken)).data;
    expect(p.weight.comparison.delta).toBe(-0.5); expect(p.height.latest).toEqual({ date: '2026-01-01', value: 170 }); expect(p.height.comparison).toBeNull();
    const race = await Promise.all([request(path, member.accessToken, 'PATCH', { expectedVersion: 1, weightKg: 69.4, heightCm: null }), request(path + '/archive', member.accessToken, 'POST', { expectedVersion: 1 })]);
    expect(race.filter(v => v.status < 300)).toHaveLength(1); expect(race.filter(v => v.status === 409)).toHaveLength(1);
    const latest = (await request(path, member.accessToken)).data;
    if (latest.status === 'ACTIVE') await request(path + '/archive', member.accessToken, 'POST', { expectedVersion: latest.version });
    expect((await request(progressPath, member.accessToken)).data.weight.latest.value).toBe(70);
    expect((await request('/members/me/body-measurements', member.accessToken, 'POST', laterInput)).status).toBe(201);
    const row = await prisma.bodyMeasurement.findUniqueOrThrow({ where: { id: first.id } }); expect(row.weightUnits).toBe(7000); expect(row.heightUnits).toBe(1700);
    expect((await request('/members/me/body-measurements/' + first.id, member.accessToken, 'PATCH', { expectedVersion: 1, weightKg: 71 })).status).toBe(400);
    const revision = await request(path + '/revisions', member.accessToken); expect(revision.data.items[0].snapshot.weightUnits).toBeUndefined();
    expect(await prisma.auditLog.count({ where: { resourceType: { in: ['workout', 'measurement'] } } })).toBe(0);
  });

  it('catalog seed idempotence, search, immutable snapshots and archived entry editing', async () => {
    await seedExercises(prisma); await seedExercises(prisma);
    expect(await prisma.exerciseCatalog.count()).toBe(20); expect(await prisma.exerciseCatalogVersion.count()).toBe(20);
    const member = await createPerson('MEMBER');
    expect((await request('/exercise-library?q=.', member.accessToken)).data.total).toBe(0);
    const list = await request('/exercise-library?muscleGroup=CHEST&equipment=DUMBBELL&q=day%20nguc', member.accessToken); expect(list.data.total).toBe(1);
    const e = list.data.items[0]; const detail = await request('/exercise-library/' + e.id, member.accessToken); expect(detail.data.steps.length).toBeGreaterThan(0);
    const input = { workoutDate: todayVn(), exercises: [{ id: randomUUID(), source: 'CATALOG', catalogExerciseId: e.id, contentVersion: 1, sets: [{ id: randomUUID(), reps: 10, weightKg: null }] }] };
    const result = await request('/members/me/workouts', member.accessToken, 'POST', input); expect(result.status).toBe(201);
    await prisma.exerciseCatalog.update({ where: { id: e.id }, data: { status: 'ARCHIVED' } });
    expect((await request('/exercise-library/' + e.id, member.accessToken)).status).toBe(404);
    expect((await request('/members/me/workouts', member.accessToken, 'POST', input)).data.code).toBe('CATALOG_VERSION_CONFLICT');
    const updated = await request('/members/me/workouts/' + result.data.id, member.accessToken, 'PATCH', { expectedVersion: 1, input }); expect(updated.status).toBe(200);
    expect(updated.data.exercises[0].displayName).toBe(detail.data.nameVi);
    await seedExercises(prisma); expect((await prisma.exerciseCatalog.findUniqueOrThrow({ where: { id: e.id } })).status).toBe('ARCHIVED');
    expect((await request('/members/me/workouts', member.accessToken, 'POST', { ...input, exercises: [{ ...input.exercises[0], displayName: 'Forged snapshot' }] })).status).toBe(400);
  });

  it('paginates workouts, measurements and private revisions beyond twenty with server-side filters', async () => {
    const member = await createPerson('MEMBER');
    const fixtures = Array.from({ length: 21 }, (_, i) => ({ memberId: member.id, workoutDate: '2026-01-' + String(i + 1).padStart(2, '0'), title: 'Generated pagination fixture', status: i % 2 ? 'DRAFT' : 'COMPLETED', exercises: [] }));
    await prisma.workoutSession.createMany({ data: fixtures });
    await prisma.bodyMeasurement.createMany({ data: fixtures.map((f, i) => ({ memberId: f.memberId, measurementDate: f.workoutDate, weightUnits: 7000 + i, heightUnits: null })) });
    const query = '?from=2026-01-01&to=2026-01-21&page=2';
    const page = await request('/members/me/workouts' + query, member.accessToken);
    expect(page.data.total).toBe(21); expect(page.data.items).toHaveLength(1); expect(page.data.items[0].workoutDate).toBe('2026-01-01');
    expect((await request('/members/me/workouts' + query + '&status=COMPLETED', member.accessToken)).data.total).toBe(11);
    expect((await request('/members/me/body-measurements' + query, member.accessToken)).data.items).toHaveLength(1);
    const record = page.data.items[0];
    await prisma.workoutSession.update({ where: { id: record.id }, data: { version: 21 } });
    await prisma.workoutRevision.createMany({ data: Array.from({ length: 21 }, (_, i) => ({ memberId: member.id, actorId: member.id, sessionId: record.id, version: i + 1, action: 'FIXTURE', snapshot: { ...record, version: i + 1 } })) });
    const revisions = await request('/members/me/workouts/' + record.id + '/revisions?page=2', member.accessToken);
    expect(revisions.data.total).toBe(21); expect(revisions.data.items[0].version).toBe(1);
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
    const ptQr = await request('/pt/me/qr', pt.accessToken);
    expect((await request('/checkins/pt', owner.accessToken, 'POST', { token: ptQr.data.token })).status).toBe(201);
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
    const ptQr = await request('/pt/me/qr', pt.accessToken);
    expect((await request('/checkins/pt', owner.accessToken, 'POST', { token: ptQr.data.token })).status).toBe(201);
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

  it('keeps CRM booking history attached to both Members after reassignment', async () => {
    const a = await createPerson('MEMBER'), b = await createPerson('MEMBER'), pt = await createPerson('PT');
    const customerA = await prisma.customer.findFirstOrThrow({ where: { memberUserId: a.id } });
    const customerB = await prisma.customer.findFirstOrThrow({ where: { memberUserId: b.id } });
    for (const member of [a, b]) expect((await request('/members/' + member.id + '/pt-assignment', owner.accessToken, 'POST', { ptId: pt.id, reason: 'CRM fixture assignment' })).status).toBe(201);
    const body = { memberId: a.id, ptId: pt.id, startAt: '2027-03-01T01:00:00Z', endAt: '2027-03-01T02:00:00Z' };
    const booking = await request('/bookings', owner.accessToken, 'POST', body);
    expect(booking.status).toBe(201);
    const edited = await request('/bookings/' + booking.data.id, owner.accessToken, 'PATCH', { ...body, memberId: b.id, reason: 'CRM fixture transfer' });
    expect(edited.status).toBe(200);
    for (const customer of [customerA, customerB]) {
      const response = await request('/customers/' + customer.id + '/history', owner.accessToken);
      expect(response.status).toBe(200);
      expect(response.data.some((row: { action: string }) => row.action === 'BOOKING_CREATE')).toBe(true);
      expect(response.data.some((row: { action: string; reason?: string }) => row.action === 'BOOKING_EDIT' && row.reason === 'CRM fixture transfer')).toBe(true);
      expect(response.data.every((row: object) => !('before' in row) && !('after' in row) && !('actorId' in row))).toBe(true);
    }
    const first = await request('/customers/' + customerA.id + '/history', owner.accessToken);
    const second = await request('/customers/' + customerA.id + '/history', owner.accessToken);
    expect(first.data.map((row: { id: string }) => row.id)).toEqual(second.data.map((row: { id: string }) => row.id));
    const indexes = await prisma.$runCommandRaw({ listIndexes: 'audit_logs' });
    const names = (indexes.cursor as { firstBatch: { name: string }[] }).firstBatch.map(index => index.name);
    expect(names).toEqual(expect.arrayContaining(['audit_booking_member_before', 'audit_booking_member_after']));
  });

  it('paginates CRM check-ins past 100 rows and restricts official profile data to Owner', async () => {
    const member = await createPerson('MEMBER'), other = await createPerson('MEMBER'), pt = await createPerson('PT');
    const customer = await prisma.customer.findFirstOrThrow({ where: { memberUserId: member.id } });
    const start = Date.UTC(2026, 9, 20);
    await prisma.memberCheckin.createMany({ data: Array.from({ length: 121 }, (_, n) => ({
      memberId: member.id, ...(n < 120 ? { customerId: customer.id } : {}), subjectType: 'MEMBER' as const,
      context: 'SELF_TRAINING' as const, method: 'PHONE' as const, operatorId: owner.user.id,
      idempotencyKey: randomUUID(), checkedInAt: new Date(start - n * 86400000),
    })) });
    await prisma.memberCheckin.create({ data: { memberId: other.id, subjectType: 'MEMBER', context: 'SELF_TRAINING', method: 'PHONE', operatorId: owner.user.id, idempotencyKey: randomUUID() } });
    const fourth = await request('/customers/' + customer.id + '/checkins?page=4', owner.accessToken);
    const fifth = await request('/customers/' + customer.id + '/checkins?page=5', owner.accessToken);
    expect(fourth.status).toBe(200); expect(fourth.data).toHaveLength(30);
    expect(fifth.status).toBe(200); expect(fifth.data).toHaveLength(1);
    expect(fifth.data[0].checkedInAt).toBe(new Date(start - 120 * 86400000).toISOString());
    expect((await request('/customers/' + customer.id + '/checkins?page=0', owner.accessToken)).status).toBe(400);
    for (const token of [member.accessToken, pt.accessToken]) {
      expect((await request('/customers/' + customer.id, token)).status).toBe(403);
      expect((await request('/customers/' + customer.id + '/checkins', token)).status).toBe(403);
    }
    expect((await request('/people/' + member.id, owner.accessToken, 'PATCH', { status: 'LOCKED', reason: 'CRM fixture lock' })).status).toBe(200);
    const official = await request('/customers/' + customer.id, owner.accessToken);
    expect(official.status).toBe(200);
    expect(official.data.member.status).toBe('LOCKED');
    expect(official.data.member.profile.cccd === member.cccd).toBe(true);
    expect('passwordHash' in official.data.member).toBe(false);
  });

  it('filters Sales queues before pagination and keeps closed records available explicitly', async () => {
    const member = await createPerson('MEMBER');
    await prisma.salesAlert.createMany({ data: Array.from({ length: 35 }, (_, n) => ({ sourceKey: 'crm-closed-' + randomUUID(), memberId: member.id, type: 'TRIAL_FINAL', status: 'CLOSED_NOT_CONTINUING', triggeredAt: new Date(Date.now() + n) })) });
    const open = await prisma.salesAlert.create({ data: { sourceKey: 'crm-open-' + randomUUID(), memberId: member.id, type: 'MEMBERSHIP_EXPIRING_SESSION', triggeredAt: new Date('2020-01-01T00:00:00Z') } });
    const queue = await request('/sales-alerts', owner.accessToken);
    expect(queue.status).toBe(200);
    expect(queue.data.every((row: { status: string }) => row.status === 'OPEN')).toBe(true);
    expect(queue.data.some((row: { id: string }) => row.id === open.id)).toBe(true);
    const closed = await request('/sales-alerts?status=CLOSED_NOT_CONTINUING&page=2', owner.accessToken);
    expect(closed.status).toBe(200); expect(closed.data).toHaveLength(5);
    expect(closed.data.every((row: { status: string }) => row.status === 'CLOSED_NOT_CONTINUING')).toBe(true);
    expect((await request('/sales-alerts?status=UNKNOWN', owner.accessToken)).status).toBe(400);
    expect((await request('/sales-alerts?status=ALL', owner.accessToken)).status).toBe(200);
    expect((await request('/sales-alerts', member.accessToken)).status).toBe(403);
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
