export type Sample = { timeMs: number; kneeAngle: number; visibility: number };
export type Analysis = {
  schemaVersion: '1.0'; exercise: 'SQUAT';
  status: 'COMPLETED' | 'POSE_NOT_DETECTED' | 'INSUFFICIENT_REPS';
  reps: number; metrics: { minKneeAngle: number; detectedRatio: number };
  issues: { code: 'INSUFFICIENT_DEPTH'; confidence: number }[];
};
export function analyzeSquat(samples: Sample[]): Analysis {
  const valid = samples.filter(s => Number.isFinite(s.kneeAngle) && s.kneeAngle > 0 && s.kneeAngle <= 180 && s.visibility >= 0.6);
  const detectedRatio = samples.length ? valid.length / samples.length : 0;
  const base: Analysis = { schemaVersion: '1.0', exercise: 'SQUAT', status: 'POSE_NOT_DETECTED', reps: 0, metrics: { minKneeAngle: valid.length ? Math.min(...valid.map(s => s.kneeAngle)) : 0, detectedRatio }, issues: [] };
  if (valid.length < 10 || detectedRatio < 0.6) return base;
  let standing = false, descending = false, minimum = 180, badReps = 0, startedAt = 0, previousTime = -1;
  for (const sample of samples) {
    if (sample.timeMs <= previousTime) throw new Error('Invalid sample order');
    const gap = previousTime >= 0 && sample.timeMs - previousTime > 500;
    previousTime = sample.timeMs;
    if (gap || sample.visibility < 0.6 || !Number.isFinite(sample.kneeAngle) || sample.kneeAngle <= 0 || sample.kneeAngle > 180) { standing = false; descending = false; continue; }
    if (!standing && sample.kneeAngle >= 160) standing = true;
    if (standing && !descending && sample.kneeAngle < 140) { descending = true; minimum = sample.kneeAngle; startedAt = sample.timeMs; }
    if (descending) {
      minimum = Math.min(minimum, sample.kneeAngle);
      if (sample.kneeAngle >= 160) {
        if (sample.timeMs - startedAt >= 400) { base.reps++; if (minimum > 100) badReps++; }
        descending = false;
      }
    }
  }
  base.status = base.reps ? 'COMPLETED' : 'INSUFFICIENT_REPS';
  if (badReps) base.issues = [{ code: 'INSUFFICIENT_DEPTH', confidence: Math.min(0.95, detectedRatio) }];
  return base;
}
export function localFeedback(result: Analysis) {
  if (result.status === 'POSE_NOT_DETECTED') return 'Chưa nhận diện đủ tư thế. Quay toàn thân, đủ sáng, góc ngang bên hông.';
  if (result.status === 'INSUFFICIENT_REPS') return 'Chưa thấy lần squat hoàn chỉnh từ đứng → hạ người → đứng.';
  if (result.issues.length) return 'Một số lần squat có thể chưa đủ độ sâu. Hạ chậm trong phạm vi thoải mái và nhờ PT kiểm tra khi cần.';
  return 'Chưa phát hiện lỗi độ sâu ở các lần được nhận diện. Kết quả không đánh giá toàn bộ kỹ thuật.';
}
