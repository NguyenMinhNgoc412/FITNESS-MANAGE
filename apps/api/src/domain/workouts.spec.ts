import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { Actor } from '../common/access';
import { WorkoutsService } from './workouts.service';
import { BodyMeasurementsService } from './body-measurements.service';
import { ExerciseLibraryService } from './exercise-library.service';
import { z } from 'zod';
import { PrismaService } from '../prisma.service';
import { TransactionService } from '../common/transaction.service';
import { checked, completeWorkout, Entry, literalSearch, measurementInput, measurementPatch, measurementProgress, rangeQuery, searchName, todayVn, workoutInput, workoutProgress } from './workout-rules';
import { exerciseContent } from './exercise-content';

const entry = (reps: number | null = 10, weightKg: number | null = null): Entry => ({ id: randomUUID(), source: 'CUSTOM', displayName: 'Squat', normalizedName: 'squat', sets: [{ id: randomUUID(), reps, weightKg }] });
describe('Member workouts: validation, aggregation and privacy', () => {
  it('validates real dates, VN midnight, ranges and rejects unknown fields', () => {
    expect(todayVn(new Date('2026-12-31T17:00:00Z'))).toBe('2027-01-01');
    expect(() => rangeQuery({ from: '2026-02-29', to: '2026-03-01' })).toThrow();
    expect(() => rangeQuery({ from: '2024-01-01', to: '2025-01-01' })).toThrow();
    expect(rangeQuery({ from: '2024-02-29', to: '2024-02-29' }).from).toBe('2024-02-29');
    expect(() => rangeQuery({ memberId: 'forged' })).toThrow();
    expect(() => checked(workoutInput, { workoutDate: '2999-01-01', exercises: [] })).toThrow();
  });
  it('preserves typed query defaults, coercion and strict filters', () => {
    const filters = { status: z.enum(['ACTIVE', 'ARCHIVED', 'ALL']).default('ACTIVE'), groupBy: z.enum(['week', 'month']).default('week') };
    const q = rangeQuery({ from: '2024-02-01', to: '2024-02-29', page: '2' }, filters);
    expect(q.status satisfies 'ACTIVE' | 'ARCHIVED' | 'ALL').toBe('ACTIVE');
    expect(q.groupBy satisfies 'week' | 'month').toBe('week');
    expect(q.page satisfies number).toBe(2);
    expect(q.skip).toBe(20);
    expect(() => rangeQuery({ status: 'DRAFT' }, filters)).toThrow();
    expect(() => rangeQuery({ memberId: 'forged' }, filters)).toThrow();
    expect(() => rangeQuery({ page: 0 }, filters)).toThrow();
  });
  it('allows drafts but completion requires actual reps and sets', () => {
    expect(checked(workoutInput, { workoutDate: '2026-01-01', exercises: [] }).exercises).toEqual([]);
    expect(() => completeWorkout([])).toThrow();
    expect(() => completeWorkout([entry(null)])).toThrow();
    expect(() => completeWorkout([entry(10, 0)])).not.toThrow();
  });
  it('rejects duplicate entry/sets ids and invalid reps', () => {
    const e = entry(); const { normalizedName: _n, ...input } = e;
    expect(workoutInput.safeParse({ workoutDate: '2026-01-01', exercises: [input, input] }).success).toBe(false);
    expect(workoutInput.safeParse({ workoutDate: '2026-01-01', exercises: [{ ...input, sets: [{ id: randomUUID(), reps: 1.5, weightKg: 10 }] }] }).success).toBe(false);
  });
  it('requires one measurement, explicit two nullable fields and exact decimal precision', () => {
    for (const weightKg of [0, -1, NaN, Infinity, 500.01, 70.001]) expect(measurementInput.safeParse({ measurementDate: '2026-01-01', weightKg, heightCm: null }).success).toBe(false);
    expect(measurementInput.safeParse({ measurementDate: '2026-01-01', weightKg: null, heightCm: null }).success).toBe(false);
    expect(measurementInput.safeParse({ measurementDate: '2026-01-01', weightKg: null, heightCm: 170.1 }).success).toBe(true);
    expect(measurementPatch.safeParse({ expectedVersion: 1, weightKg: 70 }).success).toBe(false);
    expect(measurementPatch.safeParse({ expectedVersion: 1, weightKg: 70, heightCm: 170, measurementDate: '2026-01-01' }).success).toBe(false);
  });
  it('keeps independent latest dates, missing data and exact delta', () => {
    const result = measurementProgress([{ measurementDate: '2026-01-10', weightUnits: 6950, heightUnits: null }, { measurementDate: '2026-01-01', weightUnits: 7000, heightUnits: 1700 }], '2026-01-01', '2026-01-10');
    expect(result.weight.comparison?.delta).toBe(-0.5);
    expect(result.height.latest).toEqual({ date: '2026-01-01', value: 170 });
    expect(result.height.comparison).toBeNull();
    expect(measurementProgress([], '', '').weight.latest).toBeNull();
  });
  it('aggregates repeated entries/sessions, preserves null/zero weight and custom/catalog separation', () => {
    const a = entry(10, 20), b = entry(8, 25), c = entry(12), zero = { ...entry(2, 0), displayName: 'Zero', normalizedName: 'zero' };
    const catalog = { ...entry(5), source: 'CATALOG', catalogExerciseId: 'a'.repeat(24), contentVersion: 1 };
    const result = workoutProgress([{ workoutDate: '2026-01-01', exercises: [a, b, catalog, zero] }, { workoutDate: '2026-01-01', exercises: [c] }], '2025-12-29', '2026-01-05', 'week');
    expect(result.totalSessions).toBe(2);
    expect(result.buckets).toEqual([{ date: '2025-12-29', count: 2 }, { date: '2026-01-05', count: 0 }]);
    expect(result.series.find(s => s.groupKey === 'custom:squat')?.points).toEqual([{ date: '2026-01-01', reps: 30, maxWeightKg: 25 }]);
    expect(result.series.find(s => s.groupKey.startsWith('catalog:'))?.points[0].maxWeightKg).toBeNull();
    expect(result.series.find(s => s.groupKey === 'custom:zero')?.points[0].maxWeightKg).toBe(0);
  });
  it('keeps catalog identity across renamed snapshots and filters custom separately', () => {
    const e = { ...entry(), source: 'CATALOG', catalogExerciseId: 'a'.repeat(24), contentVersion: 1 };
    const rows = [{ workoutDate: '2026-01-01', exercises: [e, entry()] }, { workoutDate: '2026-01-02', exercises: [{ ...e, displayName: 'Tên mới' }] }];
    expect(workoutProgress(rows, '2026-01-01', '2026-01-02', 'month', { catalogExerciseId: 'a'.repeat(24) }).series).toHaveLength(1);
    expect(workoutProgress(rows, '2026-01-01', '2026-01-02', 'month', { exerciseName: ' squat ' }).series[0].points).toHaveLength(1);
  });
  it('has 20 sourced text guides in ten groups without prescribed loads', () => {
    expect(exerciseContent).toHaveLength(20);
    expect(new Set(exerciseContent.map(e => e.code)).size).toBe(20);
    const groups = new Map<string, number>();
    for (const e of exerciseContent) {
      groups.set(e.content.primaryMuscleGroup, (groups.get(e.content.primaryMuscleGroup) ?? 0) + 1);
      expect(e.content.steps.length).toBeGreaterThanOrEqual(3);
      expect(e.content.sourceUrls[0]).toMatch(/^https:\/\/(www\.)?(acefitness|nasm)\.org\//);
    }
    expect([...groups.values()]).toEqual(Array(10).fill(2));
    expect(searchName('Đẩy NGỰC')).toBe('day nguc');
    expect(literalSearch('.*(a)')).toBe('\\.\\*\\(a\\)');
  });
  it('enforces role at the service even without HTTP guards', async () => {
    const service = new WorkoutsService({} as PrismaService, {} as TransactionService);
    const measurements = new BodyMeasurementsService({} as PrismaService, {} as TransactionService);
    const library = new ExerciseLibraryService({} as PrismaService);
    for (const role of [Role.OWNER, Role.PT]) {
      const actor: Actor = { sub: 'a'.repeat(24), role, sessionId: 'fixture' };
      await expect(service.list(actor, {})).rejects.toThrow();
      await expect(measurements.list(actor, {})).rejects.toThrow();
      await expect(library.list(actor, {})).rejects.toThrow();
      await expect(service.detail(actor, 'a'.repeat(24))).rejects.toThrow();
      await expect(service.progress(actor, {})).rejects.toThrow();
      await expect(service.revisions(actor, 'a'.repeat(24), {})).rejects.toThrow();
      await expect(measurements.detail(actor, 'a'.repeat(24))).rejects.toThrow();
      await expect(measurements.progress(actor, {})).rejects.toThrow();
      await expect(measurements.revisions(actor, 'a'.repeat(24), {})).rejects.toThrow();
      await expect(library.detail(actor, 'a'.repeat(24))).rejects.toThrow();
      expect(() => service.create(actor, {}, 'fixture-key')).toThrow();
      expect(() => service.update(actor, 'a'.repeat(24), {})).toThrow();
      expect(() => service.transition(actor, 'a'.repeat(24), {}, 'complete')).toThrow();
      expect(() => measurements.create(actor, {}, 'fixture-key')).toThrow();
      expect(() => measurements.update(actor, 'a'.repeat(24), {})).toThrow();
      expect(() => measurements.archive(actor, 'a'.repeat(24), {})).toThrow();
    }
  });
});
