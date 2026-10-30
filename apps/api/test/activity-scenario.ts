import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { randomBytes, randomUUID } from 'crypto';
import { execFileSync, spawn } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { ApiExceptionFilter } from '../src/common/errors';
import { ensureIndexes } from '../prisma/indexes';
import { seedExercises } from '../prisma/exercise-seed';
import { NotificationsScheduler } from '../src/domain/notifications.scheduler';
import { SalesAlertsScheduler } from '../src/domain/sales-alerts.scheduler';

// A persistent, isolated scenario, not a production seed. No secrets in reports/files/stdout.
// Every run requires an EMPTY local fitness_test_activity_* database; nothing is dropped.
const runId = new Date().toISOString().replace(/\D/g, '').slice(0, 17);
const databaseUrl = process.env.SCENARIO_DATABASE_URL ?? `mongodb://127.0.0.1:27031/fitness_test_activity_${runId}?replicaSet=workouttest`;
const target = new URL(databaseUrl);
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || target.protocol !== 'mongodb:' || !/^\/fitness_test_activity_[a-z0-9_]+$/i.test(target.pathname) || target.username || target.password) throw Error('SCENARIO_REQUIRES_EMPTY_LOCAL_TEST_DATABASE');
const root = resolve(__dirname, '../../..'), output = resolve(root, '.local/activity-scenario', runId);
mkdirSync(output, { recursive: true });
const password = process.env.SCENARIO_PASSWORD ?? randomBytes(24).toString('hex');
const DAY = 86400000, today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
const dateBefore = (days: number) => new Date(Date.parse(today) - days * DAY).toISOString().slice(0, 10);
const local = (date: string, time = '12:00:00') => new Date(`${date}T${time}+07:00`);
const localDay = (value: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
const shiftMonths = (date: string, months: number) => {
  const [y, m, d] = date.split('-').map(Number); const dest = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(dest.getUTCFullYear(), dest.getUTCMonth() + 1, 0)).getUTCDate(); dest.setUTCDate(Math.min(d, last)); return dest.toISOString().slice(0, 10);
};
type Account = { id: string; phone: string; token: string; alias: string };
type Visit = { when: Date; kind: 'member' | 'trial' | 'pt' };
type Exercise = { id: string; source: 'CUSTOM' | 'CATALOG'; displayName: string; catalogExerciseId?: string; contentVersion?: number; sets: { id: string; reps: number | null; weightKg: number | null }[] };
type Workout = { id: string; workoutDate: string; status: string; exercises: Exercise[]; version: number };
type Measurement = { id: string; measurementDate: string; status: string; weightKg: number | null; heightCm: number | null; version: number };
type Member = Account & { packageId: string; mode: string; expectedState: string; used: number; workouts: Workout[]; measurements: Measurement[] };
const visits: Visit[] = [], members: Member[] = [], pts: Account[] = [];
const packageOracle = new Map<string, { name: string; mode: string; memberIds: Set<string>; registrations: number }>();
const report: Record<string, unknown> = { runId, database: target.pathname.slice(1), status: 'RUNNING', today, notes: ['Synthetic data only; historical check-ins are explicit coherent fixtures, not time-travel API commands.', 'Dataset retained; no password, phone, identity card, JWT or refresh token in artifacts.'] };
let stage = 'setup', app: INestApplication | undefined, db: PrismaService, base = '', owner: Account;
let assertions = 0, requests = 0, sequence = 0;
function check(condition: unknown, label: string): asserts condition { assertions++; if (!condition) throw Error('ASSERTION: ' + label); }
const equal = (a: unknown, b: unknown, label: string) => check(JSON.stringify(a) === JSON.stringify(b), label);
const mark = (name: string) => { stage = name; console.info('SCENARIO_STAGE ' + name); };
async function request(path: string, token?: string, method = 'GET', body?: unknown, key: string = randomUUID()): Promise<{ status: number; data: any }> {
  requests++;
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), 'Idempotency-Key': key }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30000) });
  return { status: response.status, data: await response.json() };
}
async function ok(path: string, token: string, method = 'GET', body?: unknown, status = method === 'POST' ? 201 : 200, key?: string) {
  const r = await request(path, token, method, body, key); check(r.status === status, method + ' ' + path.replace(/[a-f0-9]{24}/g, ':id') + ' status ' + r.status); return r.data;
}
const identity = () => { const n = ++sequence; return { phone: '09' + String(n).padStart(8, '0'), cccd: '98' + String(n).padStart(10, '0') }; };
async function login(phone: string) { const r = await request('/auth/login', undefined, 'POST', { phone, password }); check(r.status === 200, 'generated login'); return r.data.accessToken as string; }
async function person(role: 'MEMBER' | 'PT', alias: string): Promise<Account> {
  const data = identity(); const created = await ok('/people', owner.token, 'POST', { ...data, fullName: alias, role, password });
  return { id: created.id, phone: data.phone, token: await login(data.phone), alias };
}
function recordPackage(memberId: string, p: { name: string; mode: string }) {
  const key = p.name + ':' + p.mode, g = packageOracle.get(key) ?? { name: p.name, mode: p.mode, memberIds: new Set<string>(), registrations: 0 };
  g.memberIds.add(memberId); g.registrations++; packageOracle.set(key, g);
}
async function packageFor(memberId: string, body: any) { const p = await ok('/members/' + memberId + '/memberships', owner.token, 'POST', body); recordPackage(memberId, body); return p; }
const totals = [15, 30, 45], monthLengths = [3, 6, 12];

async function seedPeopleAndPackages() {
  mark('30_members_6_package_templates_5_lifecycles');
  for (let i = 0; i < 3; i++) pts.push(await person('PT', 'Scenario PT ' + (i + 1)));
  for (let i = 0; i < 30; i++) {
    const account = await person('MEMBER', 'Scenario Member ' + String(i + 1).padStart(2, '0'));
    const template = i % 6, state = Math.floor(i / 6), session = template < 3;
    const expectedState = state === 0 || state === 1 ? 'ACTIVE' : state === 2 ? session ? 'EXHAUSTED' : 'EXPIRED' : state === 3 ? 'CANCELLED' : 'PENDING';
    let start = dateBefore(30), end = shiftMonths(start, monthLengths[template - 3] ?? 3);
    if (state === 1 && !session) { end = dateBefore(-2); start = shiftMonths(end, -monthLengths[template - 3]); }
    if (state === 2 && !session) { end = dateBefore(1); start = shiftMonths(end, -monthLengths[template - 3]); }
    if (state === 3) { start = dateBefore(60); end = shiftMonths(start, monthLengths[template - 3] ?? 3); }
    if (state === 4) { start = dateBefore(-1); end = shiftMonths(start, monthLengths[template - 3] ?? 3); }
    const body = session ? { name: totals[template] + ' buổi', mode: 'SESSION_BASED', startAt: local(state === 4 ? start : dateBefore(90), '00:00:00').toISOString(), totalSessions: totals[template] }
      : { name: monthLengths[template - 3] + ' tháng', mode: 'TIME_BASED', startAt: local(start, '00:00:00').toISOString(), endAt: local(end, '00:00:00').toISOString() };
    const p = await packageFor(account.id, body);
    const used = session ? state === 2 ? totals[template] : state === 1 ? totals[template] - 2 : state === 4 ? 0 : 2 + i % 3 : state === 4 ? 0 : 3 + i % 3;
    const member: Member = { ...account, packageId: p.id, mode: body.mode, expectedState, used: session ? used : 0, workouts: [], measurements: [] }; members.push(member);
    const legacy = await packageFor(member.id, { name: 'Lịch sử kiểm thử', mode: 'TIME_BASED', startAt: local('2023-12-01', '00:00:00').toISOString(), endAt: local(today, '00:00:00').toISOString() });
    const customer = await db.customer.findFirstOrThrow({ where: { memberUserId: member.id } });
    const occupied = new Set<string>(), rows: Prisma.MemberCheckinCreateManyInput[] = [];
    const add = (when: Date, membershipId: string) => {
      const day = localDay(when); check(!occupied.has(day), 'fixture has only one member visit/day'); occupied.add(day);
      rows.push({ memberId: member.id, customerId: customer.id, subjectType: 'MEMBER', membershipId, context: 'SELF_TRAINING', checkedInAt: when, method: rows.length % 2 ? 'PHONE' : 'QR', operatorId: owner.id, idempotencyKey: randomUUID() }); visits.push({ when, kind: 'member' });
    };
    // Coherent session quota history is seeded first; API has no backdate endpoint.
    for (let n = 0; n < used; n++) add(local(dateBefore(2 + n), n % 2 ? '07:00:00' : '20:30:00'), p.id);
    const boundaries = ['2023-12-31T16:59:59Z', '2023-12-31T17:00:00Z', '2024-02-28T16:59:59Z', '2024-02-28T17:00:00Z', '2024-02-29T17:00:00Z', '2024-12-31T16:59:59Z', '2024-12-31T17:00:00Z', '2025-12-31T16:59:59Z', '2025-12-31T17:00:00Z'];
    boundaries.forEach((s, n) => { const when = new Date(s); if ((i + n) % 3 === 0 && !occupied.has(localDay(when))) add(when, legacy.id); });
    for (let day = 1; day <= 65; day++) if ((day + i) % (2 + i % 5) === 0 && !occupied.has(dateBefore(day))) add(local(dateBefore(day), i % 2 ? '23:59:59' : '00:00:00'), legacy.id);
    if (rows.length) await db.memberCheckin.createMany({ data: rows });
    if (session) await db.membership.update({ where: { id: p.id }, data: { usedSessions: used } });
    if (state === 3) await ok('/memberships/' + p.id + '/cancel', owner.token, 'POST', { reason: 'Synthetic lifecycle scenario' });
    if (i < 12) await ok('/members/' + member.id + '/pt-assignment', owner.token, 'POST', { ptId: pts[i % 3].id, reason: 'Synthetic assignment' });
    if (i < 6) {
      const renewed = { ...body, startAt: local(dateBefore(-1), '00:00:00').toISOString(), ...(session ? {} : { endAt: local(shiftMonths(dateBefore(-1), monthLengths[template - 3]), '00:00:00').toISOString() }) };
      await ok('/memberships/' + p.id + '/renew', owner.token, 'POST', renewed); recordPackage(member.id, renewed);
      if (i === 0) { await ok('/memberships/' + p.id + '/renew', owner.token, 'POST', renewed); recordPackage(member.id, renewed); }
    }
  }
  check(await db.user.count({ where: { role: 'MEMBER' } }) === 30, 'exactly thirty members');
  report.people = { member: 30, pt: 3, owner: 1 };
}

async function seedTrialAndPtHistory() {
  mark('trial_pt_history_and_today_idempotency');
  for (let i = 0; i < 3; i++) {
    const fields = identity();
    const trial = await ok('/customers/trials', owner.token, 'POST', { fullName: 'Scenario Trial ' + (i + 1), phone: fields.phone });
    for (let n = 0; n < i; n++) {
      const when = local(dateBefore(n + 1));
      await db.memberCheckin.create({ data: { customerId: trial.id, subjectType: 'TRIAL', context: 'TRIAL', checkedInAt: when, method: 'PHONE', operatorId: owner.id, idempotencyKey: randomUUID() } }); visits.push({ when, kind: 'trial' });
    }
    await db.trialEntitlement.update({ where: { customerId: trial.id }, data: { usedSessions: i } });
    const last = await ok('/customers/' + trial.id + '/trial-checkin', owner.token, 'POST', {}); visits.push({ when: new Date(last.checkedInAt), kind: 'trial' });
  }
  for (let i = 0; i < pts.length; i++) {
    for (let n = 1; n <= 65; n++) if ((n + i) % (2 + i) === 0) { const when = local(dateBefore(n), '05:00:00'); await db.ptAttendanceLog.create({ data: { ptId: pts[i].id, checkedInAt: when, source: 'QR', idempotencyKey: randomUUID() } }); visits.push({ when, kind: 'pt' }); }
    const qr = await ok('/pt/me/qr', pts[i].token);
    const key = randomUUID(), path = '/checkins/pt';
    const current = await ok(path, owner.token, 'POST', { token: qr.token }, 201, key); visits.push({ when: new Date(current.checkedInAt), kind: 'pt' });
    equal((await ok(path, owner.token, 'POST', { token: qr.token }, 201, key)).id, current.id, 'PT replay identity');
    check((await request(path, owner.token, 'POST', { token: qr.token })).data.code === 'ALREADY_CHECKED_IN_TODAY', 'PT daily guard');
  }
  for (let i = 0; i < members.length; i++) {
    const m = members[i], key = randomUUID();
    let bookingId: string | undefined;
    if (i < 12 && i % 2 === 0) {
      const hour = String(9 + Math.floor(i / 3)).padStart(2, '0');
      const booking = await ok('/bookings', owner.token, 'POST', { memberId: m.id, ptId: pts[i % 3].id, startAt: local(today, hour + ':00:00').toISOString(), endAt: local(today, hour + ':45:00').toISOString() }); bookingId = booking.id;
    }
    const qrToken = i < 12 && i % 3 === 0 ? (await ok('/members/me/qr', m.token)).token : undefined;
    const body = { memberId: m.id, membershipId: m.packageId, context: bookingId ? 'WITH_INTERNAL_PT' : 'SELF_TRAINING', ...(bookingId ? { bookingId } : {}), method: qrToken ? 'QR' : 'PHONE', ...(qrToken ? { qrToken } : {}) };
    if (m.expectedState === 'ACTIVE') {
      const [current, concurrent] = await Promise.all([ok('/checkins/member', owner.token, 'POST', body, 201, key), ok('/checkins/member', owner.token, 'POST', body, 201, key)]);
      equal(current.id, concurrent.id, 'simultaneous replay creates one visit'); visits.push({ when: new Date(current.checkedInAt), kind: 'member' }); if (m.mode === 'SESSION_BASED') m.used++;
      equal((await ok('/checkins/member', owner.token, 'POST', body, 201, key)).id, current.id, 'Member replay identity');
      const qr = await ok('/members/me/qr', m.token);
      const duplicate = await request('/checkins/member', owner.token, 'POST', { ...body, method: 'QR', qrToken: qr.token }); check(duplicate.data.code === 'ALREADY_CHECKED_IN_TODAY', 'QR/phone daily guard');
    } else { const denied = await request('/checkins/member', owner.token, 'POST', body); check(denied.status === 409 && denied.data.code === 'MEMBERSHIP_INVALID', 'invalid package cannot consume'); }
    const packages = await ok('/members/' + m.id + '/memberships', m.token), current = packages.find((p: any) => p.id === m.packageId);
    equal(current.effectiveStatus, m.expectedState, 'package effective state');
    if (m.mode === 'SESSION_BASED') { equal(current.usedSessions, m.used, 'quota matches successful visits'); check(current.remainingSessions >= 0, 'nonnegative quota'); }
  }
}

async function addWorkout(m: Member, date: string, entries: any[], finish: boolean, archive: boolean) {
  const raw = { workoutDate: date, title: 'Scenario buổi tập', note: '', exercises: entries };
  const created = await ok('/members/me/workouts', m.token, 'POST', raw);
  let version = 1, status = 'DRAFT';
  if (finish) { await ok('/members/me/workouts/' + created.id + '/complete', m.token, 'POST', { expectedVersion: version }); status = 'COMPLETED'; version++; }
  if (archive) { await ok('/members/me/workouts/' + created.id + '/archive', m.token, 'POST', { expectedVersion: version }); status = 'ARCHIVED'; version++; }
  // Expected data comes from fixture input + independently fetched catalog, not progress output.
  const exercises = entries.map(e => ({ ...e, displayName: e.source === 'CUSTOM' ? e.displayName.trim() : guides.find(g => g.id === e.catalogExerciseId).nameVi }));
  m.workouts.push({ id: created.id, workoutDate: date, exercises, status, version });
}
let guides: any[] = [];
async function seedWorkoutsAndMeasurements() {
  mark('multi_day_journals_measurements_all_20_guides');
  await seedExercises(db); await seedExercises(db);
  const catalog = await ok('/exercise-library', members[0].token); check(catalog.total === 20, 'twenty guides');
  for (const item of catalog.items) {
    const detail = await ok('/exercise-library/' + item.id, members[0].token); check(detail.steps.length >= 3 && detail.sourceUrls.length > 0, 'guide has instructions and source'); guides.push(detail);
  }
  const counts = await operationalCounts();
  for (let i = 0; i < members.length - 1; i++) {
    const m = members[i], length = i === 0 ? 35 : 8 + i % 5;
    for (let n = 0; n < length; n++) {
      const guide = guides[(i * 3 + n) % guides.length], weight = n % 4 === 0 ? null : n % 4 === 1 ? 0 : 10 + i + n / 2;
      const sets = [{ id: randomUUID(), reps: 10 + n, weightKg: weight }, { id: randomUUID(), reps: 8, weightKg: n % 2 ? 15 : null }];
      const entries: any[] = [{ id: randomUUID(), source: 'CATALOG', catalogExerciseId: guide.id, contentVersion: guide.contentVersion, sets }];
      if (n % 3 === 0) entries.push({ id: randomUUID(), source: 'CUSTOM', displayName: guide.nameVi, sets: [{ id: randomUUID(), reps: 5, weightKg: null }] });
      await addWorkout(m, dateBefore(n * 3), entries, n % 6 !== 0, n % 7 === 0);
      const number = i === 0 ? n : n * 2;
      let weightKg: number | null = n % 4 === 0 ? null : (6000 + i * 50 + (i % 3 - 1) * number * 5) / 100;
      const heightCm = n % 4 === 0 || n % 5 === 0 ? (1600 + i * 2 + Math.floor(n / 10)) / 10 : null;
      const measurementDate = dateBefore(n * 3), created = await ok('/members/me/body-measurements', m.token, 'POST', { measurementDate, weightKg, heightCm });
      let status = 'ACTIVE', version = 1;
      if (n % 5 === 1 && weightKg !== null) { weightKg = Math.round((weightKg + 0.15) * 100) / 100; await ok('/members/me/body-measurements/' + created.id, m.token, 'PATCH', { expectedVersion: version, weightKg, heightCm }); version++; }
      if (n % 7 === 0) { await ok('/members/me/body-measurements/' + created.id + '/archive', m.token, 'POST', { expectedVersion: version }); status = 'ARCHIVED'; version++; }
      m.measurements.push({ id: created.id, measurementDate, weightKg, heightCm, status, version });
    }
  }
  // Every catalog exercise is also added/completed by one Member, plus same-day sessions.
  for (let n = 0; n < guides.length; n++) await addWorkout(members[0], dateBefore(n), [{ id: randomUUID(), source: 'CATALOG', catalogExerciseId: guides[n].id, contentVersion: guides[n].contentVersion, sets: [{ id: randomUUID(), reps: 10, weightKg: n % 2 ? 0 : null }] }], true, false);
  for (const day of ['2024-02-28', '2024-02-29', '2024-03-01', '2025-12-31', '2026-01-01']) await addWorkout(members[0], day, [{ id: randomUUID(), source: 'CUSTOM', displayName: 'Mốc thời gian', sets: [{ id: randomUUID(), reps: 12, weightKg: null }] }], true, false);
  equal(await operationalCounts(), counts, 'journals/measurements never mutate operations');
}
const operationalCounts = () => Promise.all([db.membership.count(), db.memberCheckin.count(), db.ptAttendanceLog.count(), db.booking.count(), db.externalPtPass.count()]);
const sorted = (items: any[], key: (v: any) => string) => [...items].sort((a, b) => key(a).localeCompare(key(b)));

async function verifyOwnerReports() {
  mark('owner_reports_vs_independent_oracle');
  const actual = await ok('/reports/packages', owner.token);
  const expected = [...packageOracle.values()].map(g => ({ name: g.name, mode: g.mode, memberCount: g.memberIds.size, registrations: g.registrations }));
  equal(sorted(actual, p => p.name + p.mode), sorted(expected, p => p.name + p.mode), 'unique package members and renewal registrations');
  const monthly: any[] = [];
  for (const year of [2023, 2024, 2025, 2026, 2027]) {
    const expectedMonths = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, member: 0, trial: 0, total: 0, pt: 0 }));
    for (const visit of visits) { const [y, m] = localDay(visit.when).split('-').map(Number); if (y === year) { expectedMonths[m - 1][visit.kind]++; if (visit.kind !== 'pt') expectedMonths[m - 1].total++; } }
    const result = await ok('/reports/checkins?year=' + year, owner.token); equal(result.months, expectedMonths, 'twelve monthly bins ' + year); monthly.push({ year, months: result.months });
  }
  // Explicit report reads must not refresh/write operational data.
  const before = await operationalCounts(); await ok('/reports/checkins?year=2024', owner.token); await ok('/reports/packages', owner.token); equal(await operationalCounts(), before, 'reports read only');
  await ok('/sales-alerts?status=ALL', owner.token);
  const dashboard = await ok('/dashboard', owner.token);
  equal(dashboard.checkins, visits.filter(v => v.kind !== 'pt' && localDay(v.when) === today).length, 'today dashboard UTC+7 total');
  equal(dashboard.trials, 2, 'two active trials and one exhausted trial');
  equal(dashboard.bookingsToday, 6, 'six individual PT bookings today'); equal(dashboard.ptsToday, 3, 'three PTs with bookings, attendance remains independent');
  report.packages = expected; report.monthly = monthly; report.dashboard = { checkins: dashboard.checkins, trials: dashboard.trials, alerts: dashboard.alerts };
}

function expectedSeries(m: Member, from: string, to: string) {
  const rows = m.workouts.filter(w => w.status === 'COMPLETED' && w.workoutDate >= from && w.workoutDate <= to);
  const groups = new Map<string, Map<string, { date: string; reps: number; maxWeightKg: number | null }>>();
  for (const w of rows) for (const e of w.exercises) {
    const group = e.source === 'CATALOG' ? 'catalog:' + e.catalogExerciseId : 'custom:' + e.displayName.trim().toLowerCase().replace(/\s+/g, ' ');
    const dates = groups.get(group) ?? new Map(); const point = dates.get(w.workoutDate) ?? { date: w.workoutDate, reps: 0, maxWeightKg: null };
    point.reps += e.sets.reduce((sum, s) => sum + (s.reps ?? 0), 0);
    const weights = e.sets.filter(s => s.weightKg !== null).map(s => s.weightKg!); if (weights.length) point.maxWeightKg = Math.max(point.maxWeightKg ?? 0, ...weights);
    dates.set(w.workoutDate, point); groups.set(group, dates);
  }
  return { rows, groups: sorted([...groups].map(([groupKey, dates]) => ({ groupKey, points: sorted([...dates.values()], p => p.date) })), p => p.groupKey) };
}
async function verifyMemberStatistics() {
  mark('30_member_week_month_progress_measurements_privacy');
  const ranges = [[dateBefore(365), today], [dateBefore(29), today], ['2024-02-28', '2024-03-01'], ['2025-12-31', '2026-01-01']];
  for (const m of members) {
    for (const [from, to] of ranges.slice(0, m === members[0] ? 4 : 2)) {
      const expected = expectedSeries(m, from, to);
      for (const groupBy of ['week', 'month']) {
        const p = await ok('/members/me/workout-progress?' + new URLSearchParams({ from, to, groupBy }), m.token);
        equal(p.totalSessions, expected.rows.length, m.alias + ' completed session count');
        equal(sorted(p.series.map((s: any) => ({ groupKey: s.groupKey, points: sorted(s.points, point => point.date) })), s => s.groupKey), expected.groups, m.alias + ' exact per-exercise points');
        equal(p.buckets.reduce((sum: number, b: any) => sum + b.count, 0), expected.rows.length, m.alias + ' bucket sum');
        for (const bucket of p.buckets) {
          const until = groupBy === 'month' ? shiftMonths(bucket.date + '-01', 1) : new Date(Date.parse(bucket.date) + 7 * DAY).toISOString().slice(0, 10);
          equal(bucket.count, expected.rows.filter(w => w.workoutDate >= (groupBy === 'month' ? bucket.date + '-01' : bucket.date) && w.workoutDate < until).length, m.alias + ' bucket boundaries');
        }
      }
      const measurements = await ok('/members/me/body-measurement-progress?' + new URLSearchParams({ from, to }), m.token);
      for (const [name, field, factor] of [['weight', 'weightKg', 100], ['height', 'heightCm', 10]] as const) {
        const points = sorted(m.measurements.filter(r => r.status === 'ACTIVE' && r.measurementDate >= from && r.measurementDate <= to && r[field] !== null).map(r => ({ date: r.measurementDate, value: r[field] })), p => p.date);
        equal(measurements[name].points, points, m.alias + ' no missing-value interpolation ' + name);
        equal(measurements[name].latest, points.at(-1) ?? null, m.alias + ' latest dated ' + name);
        equal(measurements[name].comparison, points.length > 1 ? { firstDate: points[0].date, lastDate: points.at(-1)!.date, delta: Math.round((points.at(-1)!.value - points[0].value) * factor) / factor } : null, m.alias + ' exact delta ' + name);
      }
    }
    equal((await ok('/exercise-library', m.token)).total, 20, 'library available regardless of package state');
  }
  for (const m of [members[0], members[29]]) {
    const all = m.workouts.filter(w => w.workoutDate >= dateBefore(365)), actual: string[] = [];
    for (let page = 1; page <= Math.ceil(all.length / 20); page++) { const result = await ok('/members/me/workouts?' + new URLSearchParams({ from: dateBefore(365), to: today, status: 'ALL', page: String(page) }), m.token); equal(result.total, all.length, 'full history total'); actual.push(...result.items.map((r: any) => r.id)); }
    equal(actual.length, all.length, 'pagination reaches all rows'); equal(new Set(actual).size, actual.length, 'pagination no duplicate ids');
  }
  for (const token of [owner.token, pts[0].token]) for (const path of ['/members/me/workout-progress', '/members/me/body-measurement-progress', '/exercise-library']) check((await request(path, token)).status === 403, 'Owner/PT cannot read member activity');
  for (let i = 0; i < members.length; i++) { const target = members[(i + 1) % members.length].workouts[0]; if (target) check((await request('/members/me/workouts/' + target.id, members[i].token)).status === 404, 'cross-member activity hidden'); }
  check((await request('/members/me/workout-progress?from=2024-01-01&to=2026-01-01', members[0].token)).status === 400, 'oversized range rejected');
  check((await request('/exercise-library?q=%5B', members[0].token)).data.total === 0, 'literal regex bracket does not throw or match all');
  for (const guide of guides) {
    const result = await ok('/exercise-library?q=' + encodeURIComponent(guide.nameEn.toUpperCase()), members[0].token);
    check(result.items.some((e: any) => e.id === guide.id), 'English search finds every guide');
  }
  for (const group of ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'QUADRICEPS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'CORE']) {
    for (const equipment of ['NONE', 'DUMBBELL', 'BENCH', 'CABLE', 'MACHINE', 'BARBELL']) {
      const expected = guides.filter(g => (g.primaryMuscleGroup === group || g.secondaryMuscleGroups.includes(group)) && g.equipmentCodes.includes(equipment)).map(g => g.id).sort();
      const result = await ok('/exercise-library?' + new URLSearchParams({ muscleGroup: group, equipment }), members[0].token);
      equal(result.items.map((g: any) => g.id).sort(), expected, 'all sixty group/equipment filter combinations');
    }
  }
  const packages = await db.membership.findMany(), logs = await db.memberCheckin.findMany();
  const seen = new Set<string>();
  for (const log of logs) {
    const dayKey = (log.memberId ?? log.customerId) + ':' + localDay(log.checkedInAt); check(!seen.has(dayKey), 'all fixtures and real visits satisfy daily uniqueness'); seen.add(dayKey);
    if (log.membershipId) {
      const p = packages.find(item => item.id === log.membershipId)!; check(!!p && log.checkedInAt >= p.startAt, 'visit package has started');
      if (p.mode === 'TIME_BASED') check(!!p.endAt && log.checkedInAt < p.endAt, 'historical time-based visit was inside validity');
    }
  }
  for (const p of packages.filter(p => p.mode === 'SESSION_BASED')) equal(p.usedSessions, logs.filter(log => log.membershipId === p.id).length, 'every session counter equals actual successful check-in logs');
}

async function runBrowser() {
  if (process.env.SCENARIO_BROWSER !== '1') { report.browser = 'NOT_RUN (set SCENARIO_BROWSER=1)'; return; }
  mark('real_api_browser_member_all_guides_and_owner_reports');
  const config = { apiBase: base, output, password, ownerPhone: owner.phone, memberPhone: members[0].phone, emptyMemberPhone: members[29].phone, guides: guides.map(g => ({ id: g.id, nameVi: g.nameVi })), today, dashboard: report.dashboard, monthly: report.monthly, packages: report.packages };
  await new Promise<void>((resolveDone, reject) => {
    // Invoke pnpm's JS entry with Node to avoid Windows .cmd quoting/stdin loss.
    const pnpmEntry = process.env.npm_execpath;
    if (!pnpmEntry || !/\.(c?js)$/i.test(pnpmEntry)) return reject(Error('PNPM_ENTRY_REQUIRED'));
    const child = spawn(process.execPath, [pnpmEntry, '--package=@playwright/test', 'dlx', '-c', 'node scripts/activity-scenario-browser.cjs'], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => { stdout += String(chunk); }); child.stderr.on('data', chunk => { stderr += String(chunk); });
    child.on('error', () => reject(Error('BROWSER_PROCESS_FAILED')));
    child.on('exit', code => { if (code === 0 && stdout.includes('ACTIVITY_BROWSER_PASS')) { report.browser = 'PASS real API, all 20 guides, Member/Owner'; resolveDone(); } else { writeFileSync(resolve(output, 'browser-error.txt'), stderr.replaceAll(password, '[REDACTED]').replace(/Bearer\s+[^\s]+/g, 'Bearer [REDACTED]')); reject(Error('BROWSER_SCENARIO_FAILED')); } });
    child.stdin.end(JSON.stringify(config));
  });
}

async function main() {
  process.env.DATABASE_URL = databaseUrl;
  process.env.JWT_ACCESS_SECRET = randomBytes(32).toString('hex'); process.env.JWT_REFRESH_SECRET = randomBytes(32).toString('hex'); process.env.JWT_QR_SECRET = randomBytes(32).toString('hex');
  process.env.AI_SERVICE_URL = ''; process.env.AI_SERVICE_TOKEN = '';
  const bootstrap = new PrismaClient({ datasourceUrl: databaseUrl });
  try { const collections = await bootstrap.$runCommandRaw({ listCollections: 1, nameOnly: true }) as any; check(collections.cursor.firstBatch.length === 0, 'scenario target must be empty; existing dataset never reset'); }
  finally { await bootstrap.$disconnect(); }
  execFileSync(process.execPath, [require.resolve('prisma/build/index.js'), 'db', 'push', '--skip-generate'], { cwd: resolve(root, 'apps/api'), env: process.env, stdio: 'pipe' });
  const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(NotificationsScheduler).useValue({}).overrideProvider(SalesAlertsScheduler).useValue({}).compile();
  app = module.createNestApplication({ logger: false }); app.setGlobalPrefix('api'); app.useGlobalFilters(new ApiExceptionFilter());
  await app.listen(0, '127.0.0.1'); base = await app.getUrl() + '/api'; db = app.get(PrismaService); await ensureIndexes(db);
  const fields = identity();
  const user = await db.user.create({ data: { phone: fields.phone, role: 'OWNER', passwordHash: await bcrypt.hash(password, 4), profile: { create: { fullName: 'Scenario Owner' } } } });
  owner = { id: user.id, phone: fields.phone, token: await login(fields.phone), alias: 'Scenario Owner' };
  await seedPeopleAndPackages(); await seedTrialAndPtHistory(); await seedWorkoutsAndMeasurements(); await verifyOwnerReports(); await verifyMemberStatistics();
  const beforeBrowser = await operationalCounts(); await runBrowser(); equal(await operationalCounts(), beforeBrowser, 'browser activity leaves attendance/quota operations unchanged');
  report.counts = { users: await db.user.count(), members: await db.user.count({ where: { role: 'MEMBER' } }), packages: await db.membership.count(), checkins: await db.memberCheckin.count(), ptAttendance: await db.ptAttendanceLog.count(), workouts: await db.workoutSession.count(), workoutRevisions: await db.workoutRevision.count(), measurements: await db.bodyMeasurement.count(), measurementRevisions: await db.measurementRevision.count(), guides: await db.exerciseCatalog.count() };
  report.perMember = await Promise.all(members.map(async m => ({ alias: m.alias, packageName: (await db.membership.findUniqueOrThrow({ where: { id: m.packageId }, select: { name: true } })).name, verifiedPackageState: m.expectedState, usedSessions: m.mode === 'SESSION_BASED' ? m.used : null, checkins: await db.memberCheckin.count({ where: { memberId: m.id } }), workouts: await db.workoutSession.count({ where: { memberId: m.id } }), measurements: await db.bodyMeasurement.count({ where: { memberId: m.id } }) })));
  report.status = 'PASS';
}
main().catch(error => { report.status = 'FAIL'; report.failedStage = stage; report.failure = error instanceof Error && error.message.startsWith('ASSERTION:') ? error.message : 'SCENARIO_FAILED (inspect stage; sensitive error intentionally suppressed)'; console.error('ACTIVITY_SCENARIO_FAIL ' + stage + ': ' + report.failure); process.exitCode = 1; }).finally(async () => {
  report.assertions = assertions; report.httpRequests = requests; writeFileSync(resolve(output, 'report.json'), JSON.stringify(report, null, 2));
  const table = (report.perMember as any[] | undefined)?.map(m => `| ${m.alias} | ${m.packageName} | ${m.verifiedPackageState} | ${m.usedSessions ?? '—'} | ${m.checkins} | ${m.workouts} | ${m.measurements} |`).join('\n') ?? '';
  writeFileSync(resolve(output, 'report.md'), `# Kiểm thử dữ liệu nhiều ngày\n\nTrạng thái: **${report.status}**. Database test được giữ lại: ${target.pathname.slice(1)}.\n\n${assertions} assertions, ${requests} HTTP requests. Browser: ${report.browser ?? 'chưa hoàn tất'}.\n\nSố liệu tổng: ${JSON.stringify(report.counts ?? {})}.\n\n| Member giả lập | Gói hiện tại | Trạng thái đã đối chiếu | Lượt đã dùng | Check-in | Nhật ký | Số đo |\n|---|---|---|---:|---:|---:|---:|\n${table}\n\nLịch sử check-in quá khứ là fixture nhất quán với quota; thao tác hiện tại và nhật ký/số đo/bài mẫu dùng API thật. Không kiểm chứng kỹ thuật tập trên người thật hoặc camera/native/push. Không có dữ liệu thật, mật khẩu hoặc token trong báo cáo.\n`);
  console.info('ACTIVITY_SCENARIO_REPORT ' + resolve(output, 'report.json')); console.info('DATASET_RETAINED ' + target.pathname.slice(1));
  if (report.status === 'PASS') console.info('ACTIVITY_SCENARIO_PASS ' + JSON.stringify(report.counts));
  if (app) await app.close();
});
