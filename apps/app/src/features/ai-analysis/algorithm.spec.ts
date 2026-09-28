import { analyzeSquat, Sample } from './algorithm';
const samples = (angles: number[], visibility = 1): Sample[] => angles.map((angle, i) => ({ timeMs: i * 100, kneeAngle: angle, visibility }));
describe('on-device squat algorithm', () => {
  it('counts complete repetitions without inventing other form issues', () => {
    const result = analyzeSquat(samples([170, 170, 150, 130, 110, 90, 80, 90, 110, 130, 150, 170, 170]));
    expect(result.status).toBe('COMPLETED'); expect(result.reps).toBe(1); expect(result.issues).toEqual([]);
  });
  it('reports only supported insufficient-depth issue', () => {
    const result = analyzeSquat(samples([170, 170, 150, 130, 120, 115, 115, 120, 130, 150, 170, 170]));
    expect(result.reps).toBe(1); expect(result.issues.map(i => i.code)).toEqual(['INSUFFICIENT_DEPTH']);
  });
  it('reports pose failure with no fabricated feedback on low confidence', () => {
    const result = analyzeSquat(samples(Array(30).fill(90), 0.2));
    expect(result.status).toBe('POSE_NOT_DETECTED'); expect(result.reps).toBe(0); expect(result.issues).toEqual([]);
  });
  it('does not count incomplete or occluded cycles', () => {
    expect(analyzeSquat(samples([170, 170, 150, 130, 110, 90, 80, 90, 100, 110, 110])).reps).toBe(0);
    const frames = samples([170, 170, 150, 130, 110, 90, 80, 90, 110, 130, 150, 170, 170]);
    frames[6].visibility = 0;
    expect(analyzeSquat(frames).reps).toBe(0);
  });
  it('does not count very brief jitter as a repetition', () => {
    expect(analyzeSquat(samples([170, 130, 170, 170, 170, 170, 170, 170, 170, 170])).reps).toBe(0);
  });
  it('network metrics contain no frame, raw landmarks, video URI or identity', () => {
    const result = analyzeSquat(samples(Array(20).fill(170)));
    expect(Object.keys(result).sort()).toEqual(['exercise', 'issues', 'metrics', 'reps', 'schemaVersion', 'status']);
    expect(Object.keys(result.metrics).sort()).toEqual(['detectedRatio', 'minKneeAngle']);
  });
});
