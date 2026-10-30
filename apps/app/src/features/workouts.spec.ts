import { numericInput, validateRange, WorkoutForm, workoutFieldIssues, workoutPayload } from './workouts';
describe('workout form payloads', () => {
  it('distinguishes omitted/bodyweight load and rejects malformed inputs without silent rounding', () => {
    expect(numericInput('', 1000, 2, false, 'Tạ')).toBeNull();
    expect(numericInput('0', 1000, 2, false, 'Tạ')).toBe(0);
    expect(numericInput('69,5', 500, 2, true, 'Cân nặng')).toBe(69.5);
    for (const value of ['abc', '-1', 'Infinity', '1.001', '2kg', '0x10']) expect(() => numericInput(value, 500, 2, true, 'Cân nặng')).toThrow();
  });
  it('strips catalog metadata from payload but keeps id/version and never includes video data', () => {
    const payload = workoutPayload({ date: '2026-01-01', title: ' Buổi A ', note: '', exercises: [{ id: 'entry', source: 'CATALOG', displayName: 'Tên hiển thị', catalogExerciseId: 'a'.repeat(24), contentVersion: 1, sets: [{ id: 'set', reps: '10', weight: '' }] }] }, true);
    expect(payload.exercises[0]).toEqual({ id: 'entry', source: 'CATALOG', catalogExerciseId: 'a'.repeat(24), contentVersion: 1, sets: [{ id: 'set', reps: 10, weightKg: null }] });
    expect(payload.title).toBe('Buổi A');
  });
  it('does not complete empty drafts or malformed dates/ranges', () => {
    expect(() => workoutPayload({ date: '2026-01-01', title: '', note: '', exercises: [] }, true)).toThrow();
    expect(() => validateRange('2026-02-30', '2026-03-01')).toThrow();
    expect(() => validateRange('2026-01-02', '2026-01-01')).toThrow();
    expect(() => validateRange('2026-01-01', '2026-12-31')).not.toThrow();
  });
  it('locates invalid cells without treating missing or zero load as an error', () => {
    const form: WorkoutForm = { date: '2026-01-01', title: '', note: '', exercises: [{ id: 'one', source: 'CUSTOM', displayName: 'Squat', sets: [{ id: 'a', reps: '10', weight: '' }, { id: 'b', reps: '2.5', weight: '0' }] }, { id: 'two', source: 'CUSTOM', displayName: '', sets: [{ id: 'c', reps: '8', weight: '1.001' }] }] };
    const issues = workoutFieldIssues(form);
    expect(issues.map(e => e.path)).toEqual(['exercises.0.sets.1.reps', 'exercises.1.displayName', 'exercises.1.sets.0.weight']);
    expect(issues[0].message).toContain('Bài 1, hiệp 2');
    expect(issues[2].message).toContain('Bài 2, hiệp 1');
  });
  it('allows incomplete drafts and identifies the missing data required to complete', () => {
    const form: WorkoutForm = { date: '2026-01-01', title: '', note: '', exercises: [{ id: 'one', source: 'CUSTOM', displayName: 'Squat', sets: [{ id: 'a', reps: '', weight: '' }] }] };
    expect(workoutFieldIssues(form)).toEqual([]);
    expect(workoutFieldIssues(form, true).map(e => e.path)).toEqual(['exercises.0.sets.0.reps']);
    form.exercises[0].sets = [];
    expect(workoutFieldIssues(form, true)[0].path).toBe('exercises.0.sets');
    form.exercises = [];
    expect(workoutFieldIssues(form, true)[0].path).toBe('exercises');
  });
});
