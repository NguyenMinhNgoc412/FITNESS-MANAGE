import { z } from 'zod';
export const muscleLabels: Record<string, string> = { CHEST: 'Ngực', BACK: 'Lưng', SHOULDERS: 'Vai', BICEPS: 'Tay trước', TRICEPS: 'Tay sau', QUADRICEPS: 'Đùi trước', HAMSTRINGS: 'Đùi sau', GLUTES: 'Mông', CALVES: 'Bắp chân', CORE: 'Bụng / thân giữa' };
export const equipmentLabels: Record<string, string> = { NONE: 'Không dụng cụ', DUMBBELL: 'Tạ đôi', BENCH: 'Ghế', CABLE: 'Máy cáp', MACHINE: 'Máy tập', BARBELL: 'Tạ đòn' };
export type Collection<T> = { items: T[]; total: number; page: number; pageSize: number };
export type Exercise = { id: string; source: 'CUSTOM' | 'CATALOG'; displayName: string; catalogExerciseId?: string; contentVersion?: number; sets: { id: string; reps: number | null; weightKg: number | null }[] };
export type Workout = { id: string; workoutDate: string; title: string; note: string; status: 'DRAFT' | 'COMPLETED' | 'ARCHIVED'; version: number; exercises: Exercise[] };
export type Measurement = { id: string; measurementDate: string; weightKg: number | null; heightCm: number | null; status: 'ACTIVE' | 'ARCHIVED'; version: number };
export type Revision = { id: string; version: number; action: string; recordedAt: string; snapshot: Workout | Measurement };
const revisionActionLabels: Record<string, string> = { CREATE: 'Tạo mới', UPDATE: 'Cập nhật', COMPLETE: 'Hoàn tất', ARCHIVE: 'Lưu trữ' };
export const revisionActionLabel = (action: string) => revisionActionLabels[action] ?? 'Thay đổi';
export type CatalogSummary = { id: string; nameVi: string; muscleGroups: string[]; equipmentCodes: string[]; currentPublishedVersion: number };
export type CatalogDetail = { id: string; code?: string; contentVersion: number; nameVi: string; nameEn: string; primaryMuscleGroup: string; secondaryMuscleGroups: string[]; equipmentCodes: string[]; description: string; steps: string[]; techniqueNotes: string[]; sourceUrls: string[] };
export type WorkoutProgress = { totalSessions: number; metric: string; buckets: { date: string; count: number }[]; series: { groupKey: string; label: string; points: { date: string; reps: number; maxWeightKg: number | null }[] }[] };
export type MeasurementSeries = { unit: string; points: { date: string; value: number }[]; latest: { date: string; value: number } | null; comparison: { firstDate: string; lastDate: string; delta: number } | null };
export type MeasurementProgress = { weight: MeasurementSeries; height: MeasurementSeries };
export const todayVn = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
export const initialRange = () => { const to = todayVn(); return { from: new Date(Date.parse(to) - 29 * 86400000).toISOString().slice(0, 10), to }; };
export const numericInput = (value: string, max: number, digits: number, positive: boolean, label: string) => {
  if (!value.trim()) return null;
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) throw new Error(label + ' phải là số hợp lệ.');
  const n = Number(normalized);
  if (!Number.isFinite(n) || n > max || n < (positive ? 1 / 10 ** digits : 0)) throw new Error(label + (positive ? ` phải lớn hơn 0 và không quá ${max}.` : ` phải từ 0 đến ${max}.`));
  if (Math.abs(n * 10 ** digits - Math.round(n * 10 ** digits)) > 0.000001) throw new Error(label + (digits === 0 ? ' phải là số nguyên.' : ` chỉ được có tối đa ${digits} chữ số thập phân.`));
  return n;
};
export const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
export function validateRange(from: string, to: string) {
  if (!validDate(from) || !validDate(to) || from < '1900-01-01' || to < from || Date.parse(to) - Date.parse(from) >= 366 * 86400000) throw new Error('Chọn khoảng ngày hợp lệ, tối đa 366 ngày.');
}
export function validatePastDate(value: string) { if (!validDate(value) || value < '1900-01-01' || value > todayVn()) throw new Error('Ngày đo/tập phải hợp lệ và không ở tương lai.'); }
export const workoutFormSchema = z.object({ date: z.string(), title: z.string().trim().max(100), note: z.string().max(1000), exercises: z.array(z.object({ id: z.string(), source: z.enum(['CUSTOM', 'CATALOG']), displayName: z.string().trim().min(1).max(100), catalogExerciseId: z.string().optional(), contentVersion: z.number().optional(), sets: z.array(z.object({ id: z.string(), reps: z.string(), weight: z.string() })).max(30) })).max(30) });
export type WorkoutForm = z.infer<typeof workoutFormSchema>;
export type WorkoutField = 'date' | 'title' | 'note' | 'exercises' | `exercises.${number}.displayName` | `exercises.${number}.sets` | `exercises.${number}.sets.${number}.reps` | `exercises.${number}.sets.${number}.weight`;
export function workoutFieldIssues(raw: WorkoutForm, completed = false): { path: WorkoutField; message: string }[] {
  const issues: { path: WorkoutField; message: string }[] = [];
  try { validatePastDate(raw.date); } catch { issues.push({ path: 'date', message: 'Chọn ngày tập hợp lệ, không ở tương lai.' }); }
  if (raw.title.trim().length > 100) issues.push({ path: 'title', message: 'Tên buổi tối đa 100 ký tự.' });
  if (raw.note.length > 1000) issues.push({ path: 'note', message: 'Ghi chú tối đa 1.000 ký tự.' });
  if (raw.exercises.length > 30 || (completed && !raw.exercises.length)) issues.push({ path: 'exercises', message: completed ? 'Thêm ít nhất một bài, tối đa 30 bài mỗi buổi.' : 'Mỗi buổi tối đa 30 bài.' });
  raw.exercises.forEach((exercise, i) => {
    if (!exercise.displayName.trim() || exercise.displayName.trim().length > 100) issues.push({ path: `exercises.${i}.displayName`, message: `Bài ${i + 1}: nhập tên từ 1 đến 100 ký tự.` });
    if (exercise.sets.length > 30 || (completed && !exercise.sets.length)) issues.push({ path: `exercises.${i}.sets`, message: `Bài ${i + 1}: cần từ 1 đến 30 hiệp khi hoàn tất.` });
    exercise.sets.forEach((set, j) => {
      for (const [key, max, digits, positive, label] of [['reps', 1000, 0, true, 'số lần'], ['weight', 1000, 2, false, 'mức tạ (kg)']] as const) {
        try {
          const number = numericInput(set[key], max, digits, positive, label);
          if (key === 'reps' && completed && number === null) throw new Error('Nhập số lần để hoàn tất buổi tập.');
        } catch (error) { issues.push({ path: `exercises.${i}.sets.${j}.${key}`, message: `Bài ${i + 1}, hiệp ${j + 1}: ${(error as Error).message}` }); }
      }
    });
  });
  return issues;
}
export function workoutPayload(raw: WorkoutForm, completed = false) {
  const v = workoutFormSchema.parse(raw); validatePastDate(v.date);
  const exercises = v.exercises.map(e => ({ id: e.id, ...(e.source === 'CUSTOM' ? { source: 'CUSTOM', displayName: e.displayName } : { source: 'CATALOG', catalogExerciseId: e.catalogExerciseId, contentVersion: e.contentVersion }), sets: e.sets.map(s => ({ id: s.id, reps: numericInput(s.reps, 1000, 0, true, 'Số lần'), weightKg: numericInput(s.weight, 1000, 2, false, 'Mức tạ') })) }));
  if (completed && (!exercises.length || exercises.some(e => !e.sets.length || e.sets.some(s => s.reps === null)))) throw new Error('Buổi hoàn tất cần ít nhất một bài, mỗi bài có hiệp và số lần.');
  return { workoutDate: v.date, title: v.title, note: v.note, exercises };
}
