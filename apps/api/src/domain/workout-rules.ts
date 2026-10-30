import { z } from 'zod';
import { fail } from '../common/errors';
import { id } from '../common/input';

export const muscleGroups = ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'QUADRICEPS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'CORE'] as const;
export const equipmentCodes = ['NONE', 'DUMBBELL', 'BENCH', 'CABLE', 'MACHINE', 'BARBELL'] as const;
export const todayVn = (now = new Date()) => new Date(now.getTime() + 7 * 3600000).toISOString().slice(0, 10);
export const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();
export const searchName = (name: string) => normalizeName(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
// Prisma's MongoDB `contains` compiles to regex: escape all user metacharacters.
export const literalSearch = (name: string) => searchName(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const decimal = (max: number, digits: number, positive = false) => z.number().finite().min(positive ? 1 / 10 ** digits : 0).max(max)
  .refine(n => Math.abs(n * 10 ** digits - Math.round(n * 10 ** digits)) < 0.000001, 'Sai độ chính xác.');
export const businessDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => {
  const date = new Date(s + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === s && s >= '1900-01-01';
});
const pastDate = businessDate.refine(s => s <= todayVn(), 'Ngày không được ở tương lai.');
const setInput = z.object({ id: z.string().uuid(), reps: z.number().int().min(1).max(1000).nullable(), weightKg: decimal(1000, 2).nullable() }).strict();
const entryBase = { id: z.string().uuid(), sets: z.array(setInput).max(30) };
export const exerciseInput = z.discriminatedUnion('source', [
  z.object({ ...entryBase, source: z.literal('CUSTOM'), displayName: z.string().trim().min(1).max(100) }).strict(),
  z.object({ ...entryBase, source: z.literal('CATALOG'), catalogExerciseId: id, contentVersion: z.number().int().positive() }).strict(),
]);
export const workoutInput = z.object({
  workoutDate: pastDate, title: z.string().trim().max(100).default(''), note: z.string().max(1000).default(''),
  exercises: z.array(exerciseInput).max(30),
}).strict().superRefine((v, ctx) => {
  if (new Set(v.exercises.map(e => e.id)).size !== v.exercises.length || v.exercises.some(e => new Set(e.sets.map(s => s.id)).size !== e.sets.length))
    ctx.addIssue({ code: 'custom', message: 'Id bài/hiệp trùng.' });
});
export const versionInput = z.object({ expectedVersion: z.number().int().positive() }).strict();
export const workoutPatch = z.object({ expectedVersion: z.number().int().positive(), input: workoutInput }).strict();
const measurements = { weightKg: decimal(500, 2, true).nullable(), heightCm: decimal(300, 1, true).nullable() };
export const measurementInput = z.object({ measurementDate: pastDate, ...measurements }).strict().refine(v => v.weightKg !== null || v.heightCm !== null);
export const measurementPatch = z.object({ expectedVersion: z.number().int().positive(), ...measurements }).strict().refine(v => v.weightKg !== null || v.heightCm !== null);
export function checked<S extends z.ZodTypeAny>(schema: S, input: unknown): z.output<S> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return parsed.data;
  const field = parsed.error.issues[0]?.path.map(p => typeof p === 'number' ? p + 1 : p).join(' / ');
  return fail('INVALID_INPUT', 'Kiểm tra ' + (field || 'dữ liệu') + ': ngày hợp lệ không ở tương lai, tên/hiệp/số lần và đơn vị kg/cm đúng giới hạn.', 400);
}
export type WorkoutInput = z.infer<typeof workoutInput>;
export type Entry = WorkoutInput['exercises'][number] & { displayName: string; normalizedName: string; catalogSnapshot?: CatalogContent };
export type CatalogContent = {
  nameVi: string; nameEn: string; aliases: string[]; primaryMuscleGroup: string; secondaryMuscleGroups: string[]; equipmentCodes: string[];
  description: string; steps: string[]; techniqueNotes: string[]; sourceUrls: string[]; reviewedAt: string;
};
export function requireEditableVersion(version: number, expected: number, status: string, archivedCode: string) {
  if (version !== expected) fail('CONCURRENT_CHANGE', 'Bản ghi đã thay đổi. Tải bản mới để đối chiếu, nội dung bạn nhập chưa được ghi đè.');
  if (status === 'ARCHIVED') fail(archivedCode, 'Bản đã lưu trữ không thể sửa.');
}
export function completeWorkout(entries: Entry[]) {
  if (!entries.length || entries.some(e => !e.sets.length || e.sets.some(s => s.reps === null)))
    fail('WORKOUT_INCOMPLETE', 'Hoàn tất cần ít nhất một bài, mỗi bài có hiệp và số lần hợp lệ.', 400);
}
const rangeFields = { from: businessDate.optional(), to: businessDate.optional(), page: z.coerce.number().int().min(1).max(10000).default(1) };
export function rangeQuery<S extends z.ZodRawShape = Record<never, never>>(raw: unknown, extra?: S) {
  const schema = z.object(extra ?? ({} as S)).extend(rangeFields).strict();
  const q = checked(schema, raw);
  const to = q.to ?? todayVn();
  const from = q.from ?? new Date(new Date(to + 'T00:00:00Z').getTime() - 29 * 86400000).toISOString().slice(0, 10);
  const days = (Date.parse(to) - Date.parse(from)) / 86400000;
  if (days < 0 || days >= 366) fail('INVALID_INPUT', 'Chọn khoảng ngày từ 1 đến 366 ngày.', 400);
  const page = q.page ?? 1;
  return { ...q, from, to, page, skip: (page - 1) * 20 };
}
export function measurementProgress(records: { measurementDate: string; weightUnits: number | null; heightUnits: number | null }[], from: string, to: string) {
  const series = (field: 'weightUnits' | 'heightUnits', factor: number, unit: string) => {
    const points = records.filter(r => r[field] !== null).map(r => ({ date: r.measurementDate, value: r[field]! / factor })).sort((a, b) => a.date.localeCompare(b.date));
    const first = points[0], last = points.at(-1);
    return { unit, points, latest: last ?? null, comparison: points.length < 2 ? null : { firstDate: first.date, lastDate: last!.date, delta: Math.round((last!.value - first.value) * factor) / factor } };
  };
  return { from, to, timeZone: 'UTC+7', weight: series('weightUnits', 100, 'kg'), height: series('heightUnits', 10, 'cm') };
}
export function workoutProgress(records: { workoutDate: string; exercises: unknown }[], from: string, to: string, groupBy: 'week' | 'month', filter?: { exerciseName?: string; catalogExerciseId?: string }) {
  const bucketKey = (day: string) => {
    if (groupBy === 'month') return day.slice(0, 7);
    const d = new Date(day + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7); return d.toISOString().slice(0, 10);
  };
  const buckets: Record<string, number> = {};
  for (let t = Date.parse(from); t <= Date.parse(to); t += 86400000) buckets[bucketKey(new Date(t).toISOString().slice(0, 10))] = 0;
  const groups = new Map<string, { groupKey: string; label: string; points: Map<string, { date: string; reps: number; maxWeightKg: number | null }> }>();
  for (const r of [...records].sort((a, b) => a.workoutDate.localeCompare(b.workoutDate))) {
    buckets[bucketKey(r.workoutDate)]++;
    for (const e of r.exercises as Entry[]) {
      if (filter?.catalogExerciseId && (e.source !== 'CATALOG' || e.catalogExerciseId !== filter.catalogExerciseId)) continue;
      if (filter?.exerciseName && (e.source !== 'CUSTOM' || e.normalizedName !== normalizeName(filter.exerciseName))) continue;
      const key = e.source === 'CATALOG' ? 'catalog:' + e.catalogExerciseId : 'custom:' + e.normalizedName;
      if (!groups.has(key)) groups.set(key, { groupKey: key, label: e.displayName, points: new Map() });
      const g = groups.get(key)!; g.label = e.displayName;
      const p = g.points.get(r.workoutDate) ?? { date: r.workoutDate, reps: 0, maxWeightKg: null };
      for (const set of e.sets) { p.reps += set.reps ?? 0; if (set.weightKg !== null) p.maxWeightKg = Math.max(p.maxWeightKg ?? 0, set.weightKg); }
      g.points.set(r.workoutDate, p);
    }
  }
  return { from, to, timeZone: 'UTC+7', groupBy, totalSessions: records.length, metric: 'Buổi đã ghi nhật ký (không phải lượt đến gym)', buckets: Object.entries(buckets).map(([date, count]) => ({ date, count })), series: [...groups.values()].map(g => ({ ...g, points: [...g.points.values()] })) };
}
