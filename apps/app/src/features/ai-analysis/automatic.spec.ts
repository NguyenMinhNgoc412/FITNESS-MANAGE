import { Sample } from './algorithm';
import { analyzeAutomatically, automaticPayload, autoComparisons } from './automatic';

const cycle = [170, 170, 150, 130, 110, 90, 80, 90, 110, 130, 150, 170, 170];
function frames(exercise: 'SQUAT' | 'PUSH_UP' | 'LUNGE'): Sample[] {
  return cycle.map((angle, i) => ({ timeMs: i * 100, kneeAngle: exercise === 'PUSH_UP' ? 170 : angle, visibility: 1,
    angles: { kneeLeft: exercise === 'PUSH_UP' ? 170 : angle, kneeRight: exercise === 'PUSH_UP' ? 170 : angle, trunk: exercise === 'PUSH_UP' ? 80 : 20, elbowLeft: exercise === 'PUSH_UP' ? angle : 170, elbowRight: null, armLeft: 10, armRight: null },
    motion: { stanceRatio: exercise === 'LUNGE' ? 1 : 0.2, bodyLine: 175, elbowAngle: exercise === 'PUSH_UP' ? angle : 170, elbowVisibility: 1 },
  }));
}
describe('automatic exercise recognition and measured feedback', () => {
  it.each(['SQUAT', 'PUSH_UP', 'LUNGE'] as const)('recognizes %s from motion with one complete cycle', exercise => {
    const result = analyzeAutomatically(frames(exercise));
    expect(result.exercise).toBe(exercise); expect(result.status).toBe('COMPLETED');
    expect(result.reps).toBe(1); expect(result.perRep[0].timeSeconds).toBe(0.6);
    expect(result.metrics.minJointAngle).toBe(80);
  });
  it('leaves static poses and unsupported stance unknown rather than forcing squat', () => {
    const staticFrames = frames('SQUAT').map(s => ({ ...s, kneeAngle: 170 }));
    expect(analyzeAutomatically(staticFrames).status).toBe('UNRECOGNIZED_EXERCISE');
    const unknown = frames('SQUAT').map(s => ({ ...s, motion: { ...s.motion!, stanceRatio: null } }));
    expect(analyzeAutomatically(unknown).exercise).toBe('UNKNOWN');
  });
  it('rejects mixed exercises and reports pose failure without measured conclusions', () => {
    const mixed = [...frames('SQUAT'), ...frames('LUNGE').map(s => ({ ...s, timeMs: s.timeMs + 1300 }))];
    expect(analyzeAutomatically(mixed).exercise).toBe('UNKNOWN');
    const failure = analyzeAutomatically(frames('SQUAT').map(s => ({ ...s, visibility: 0.2 })));
    expect(failure.status).toBe('POSE_NOT_DETECTED'); expect(failure.perRep).toEqual([]);
  });
  it('does not invent complete repetitions from an unfinished motion', () => {
    const incomplete = frames('SQUAT').map((s, i) => i > 6 ? { ...s, kneeAngle: 80 } : s);
    expect(analyzeAutomatically(incomplete).status).toBe('INSUFFICIENT_REPS');
    expect(analyzeAutomatically(incomplete).reps).toBe(0);
  });
  it('uses elbow motion for push-ups and does not grade unknown hand variants', () => {
    const push = analyzeAutomatically(frames('PUSH_UP'));
    expect(autoComparisons(push, push.perRep[0])[0].label).toBe('Khuỷu tay trái');
    const squat = analyzeAutomatically(frames('SQUAT'));
    const rows = autoComparisons(squat, squat.perRep[0]);
    expect(rows.find(row => row.label === 'Khuỷu tay trái')?.verdict).toBe('Chưa có tiêu chí kết luận');
    expect(rows.find(row => row.label === 'Độ nghiêng thân')?.verdict).toBe('Chưa có tiêu chí kết luận');
  });
  it('snapshots the optional PT target and projects only bounded metrics for network', () => {
    const reference = { trunkMax: 10 };
    const result = analyzeAutomatically(frames('SQUAT'), reference); reference.trunkMax = 90;
    expect(autoComparisons(result, result.perRep[0])[2].verdict).toBe('Ngoài mục tiêu tham chiếu');
    result.explanation = { provider: 'LOCAL', feedback: ['local-only'] };
    result.perRep = Array.from({ length: 12 }, (_, i) => ({ ...result.perRep[0], index: i + 1 })); result.reps = 12;
    const payload = automaticPayload(result);
    expect(payload.perRep).toHaveLength(10);
    expect(JSON.stringify(payload)).not.toMatch(/landmarks|video|uri|memberId|local-only|motion|explanation/i);
    expect(new TextEncoder().encode(JSON.stringify(payload)).length).toBeLessThan(8192);
  });
});
