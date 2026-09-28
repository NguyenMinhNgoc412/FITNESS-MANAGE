import { membershipState, overlaps } from './rules';
import { parse, phone, membershipInput } from '../common/input';
import { Role } from '@prisma/client';
import { requireRole, requireSelfOrOwner, Actor } from '../common/access';
import { formInput } from '../ai/ai.controller';

const now = new Date('2026-09-24T08:00:00Z');
describe('SOT business boundaries', () => {
  it('normalizes domestic and +84 phone identities', () => {
    expect(parse(phone, '+84 900 000 001')).toBe(parse(phone, '0900-000-001'));
  });
  it('handles end time as an exclusive boundary without disabling account', () => {
    expect(membershipState({ mode: 'TIME_BASED', status: 'ACTIVE', startAt: new Date(0), endAt: now, totalSessions: null, usedSessions: 0 }, now)).toBe('EXPIRED');
  });
  it('does not confuse pending, cancelled and exhausted package', () => {
    const value = { mode: 'SESSION_BASED' as const, status: 'ACTIVE', startAt: new Date(0), endAt: null, totalSessions: 3, usedSessions: 3 };
    expect(membershipState(value, now)).toBe('EXHAUSTED');
    expect(membershipState({ ...value, startAt: new Date(now.getTime() + 1000) }, now)).toBe('PENDING');
    expect(membershipState({ ...value, status: 'CANCELLED' }, now)).toBe('CANCELLED');
  });
  it('allows adjacent intervals and rejects nested intervals', () => {
    expect(overlaps(new Date(0), new Date(10), new Date(10), new Date(20))).toBe(false);
    expect(overlaps(new Date(0), new Date(20), new Date(5), new Date(10))).toBe(true);
  });
  it('rejects ambiguous quota/time packages', () => {
    expect(membershipInput.safeParse({ name: 'Test', mode: 'SESSION_BASED', startAt: now.toISOString(), totalSessions: 5, endAt: now.toISOString() }).success).toBe(false);
  });
  it.each([Role.PT, Role.MEMBER])('enforces Owner mutation at service boundary: %s', role => {
    expect(() => requireRole({ sub: 'self', role, sessionId: 'session' }, Role.OWNER)).toThrow();
  });
  it('enforces same-Member data scope', () => {
    const actor: Actor = { sub: 'self', role: Role.MEMBER, sessionId: 'session' };
    expect(() => requireSelfOrOwner(actor, 'someone-else')).toThrow();
    expect(() => requireSelfOrOwner(actor, 'self')).not.toThrow();
  });
  it.each(['video', 'base64', 'mediaUrl', 'thumbnail', 'memberId'])('rejects AI field %s before any outbound request', key => {
    expect(formInput.safeParse({ schemaVersion: '1.0', exercise: 'SQUAT', status: 'POSE_NOT_DETECTED', reps: 0, metrics: { minKneeAngle: 0, detectedRatio: 0 }, issues: [], [key]: 'forbidden' }).success).toBe(false);
  });
});
