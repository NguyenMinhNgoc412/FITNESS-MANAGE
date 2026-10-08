import { analyzeSquat, explanationPayload, Sample } from './algorithm';
import { Angles, compareAngles, Landmark, measureAngles } from './measurements';

const missing: Angles = { kneeLeft: null, kneeRight: null, trunk: null, elbowLeft: null, elbowRight: null, armLeft: null, armRight: null };
describe('local squat angle report', () => {
  it('corrects aspect ratio and measures joints, torso and horizontal arms', () => {
    const pose: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0, y: 0, visibility: 0 }));
    const set = (i: number, x: number, y: number) => { pose[i] = { x, y, visibility: 1 }; };
    set(11, 0.2, 0.1); set(13, 0.4, 0.1); set(15, 0.6, 0.1);
    set(23, 0.2, 0.5); set(25, 0.4, 0.5); set(27, 0.4, 0.9);
    const angles = measureAngles(pose, 200, 100);
    expect(angles.kneeLeft).toBeCloseTo(90);
    expect(angles.elbowLeft).toBeCloseTo(180);
    expect(angles.armLeft).toBeCloseTo(0);
    expect(angles.trunk).toBeCloseTo(0);
    expect(angles.kneeRight).toBeNull();
    set(11, 0.4, 0.1);
    expect(measureAngles(pose, 200, 100).trunk).toBeCloseTo(45);
  });
  it('does not call an occluded or degenerate joint correct', () => {
    const pose: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 1 }));
    expect(measureAngles(pose, 640, 480)).toEqual(missing);
    expect(compareAngles(missing, { trunkMax: null }).every(row => row.verdict === 'Không đủ dữ liệu')).toBe(true);
  });
  it('compares against explicit targets and leaves trunk ungraded without a target', () => {
    const angles = { kneeLeft: 100, kneeRight: 110, trunk: 45, elbowLeft: 160, elbowRight: 130, armLeft: 20, armRight: 35 };
    const rows = compareAngles(angles, { trunkMax: null });
    expect(rows.map(row => row.verdict)).toEqual(['Trong mục tiêu tham chiếu', 'Ngoài mục tiêu tham chiếu', 'Chưa có tiêu chí kết luận', 'Trong mục tiêu tham chiếu', 'Trong mục tiêu tham chiếu', 'Ngoài mục tiêu tham chiếu', 'Ngoài mục tiêu tham chiếu']);
    expect(compareAngles(angles, { trunkMax: 40 })[2].verdict).toBe('Ngoài mục tiêu tham chiếu');
  });
  it('records the bottom of each complete rep, preserves reference and minimizes cloud payload', () => {
    const samples: Sample[] = [170, 170, 150, 130, 110, 90, 80, 90, 110, 130, 150, 170, 170, 130, 120, 115, 120, 130, 150, 170].map((kneeAngle, i) => ({ timeMs: i * 100, kneeAngle, visibility: 1, angles: { ...missing, kneeLeft: kneeAngle } }));
    const reference = { trunkMax: 40 };
    const result = analyzeSquat(samples, reference);
    reference.trunkMax = 60;
    expect(result.detail?.reference.trunkMax).toBe(40);
    expect(result.detail?.repetitions.map(rep => [rep.index, rep.bottomTimeMs, rep.kneeAngle])).toEqual([[1, 600, 80], [2, 1500, 115]]);
    const cloud = explanationPayload(result);
    expect(Object.keys(cloud).sort()).toEqual(['exercise', 'issues', 'metrics', 'reps', 'schemaVersion', 'status']);
    expect(JSON.stringify(cloud)).not.toMatch(/detail|trunk|angles|bottomTimeMs/);
    samples[6].visibility = 0;
    expect(analyzeSquat(samples).detail?.repetitions).toHaveLength(1);
  });
  it('rejects invalid targets and produces no comparisons for pose failure', () => {
    expect(() => analyzeSquat([], { trunkMax: NaN })).toThrow();
    const result = analyzeSquat([{ timeMs: 100, kneeAngle: 0, visibility: 0, angles: missing }]);
    expect(result.status).toBe('POSE_NOT_DETECTED');
    expect(result.detail?.repetitions).toEqual([]);
  });
});
