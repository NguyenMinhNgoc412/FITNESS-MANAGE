import { analyzeSquat, Analysis, Sample } from './algorithm';
import { Angles, Comparison, Reference } from './measurements';

export type Exercise = 'SQUAT' | 'PUSH_UP' | 'LUNGE' | 'UNKNOWN';
export type AutoAnalysis = {
  schemaVersion: '2.0'; exercise: Exercise; status: 'COMPLETED' | 'POSE_NOT_DETECTED' | 'INSUFFICIENT_REPS' | 'UNRECOGNIZED_EXERCISE';
  recognitionScore: number; reps: number; metrics: { detectedRatio: number; minJointAngle: number | null };
  reference: Reference; perRep: { index: number; timeSeconds: number; angles: Angles; bodyLine: number | null }[];
  explanation?: { provider: 'OPENAI' | 'LOCAL'; feedback: string[] };
};
export type StoredAnalysis = Analysis | AutoAnalysis;
export const exerciseLabel = (exercise: string) => ({ SQUAT: 'Squat', PUSH_UP: 'Chống đẩy', LUNGE: 'Lunge', UNKNOWN: 'Chưa xác định', AUTO: 'Video chờ nhận diện' }[exercise] ?? 'Video');
export function analyzeAutomatically(samples: Sample[], reference: Reference = { trunkMax: null }): AutoAnalysis {
  if (reference.trunkMax !== null && (!Number.isFinite(reference.trunkMax) || reference.trunkMax < 0 || reference.trunkMax > 90)) throw new Error('Mục tiêu độ nghiêng thân phải từ 0 đến 90° hoặc để trống.');
  let previous = -1;
  for (const s of samples) { if (!Number.isFinite(s.timeMs) || s.timeMs <= previous) throw new Error('Dữ liệu video không đúng thứ tự.'); previous = s.timeMs; }
  const valid = samples.filter(s => s.angles && s.visibility >= 0.6 && Number.isFinite(s.kneeAngle) && s.kneeAngle > 0 && s.kneeAngle <= 180 && s.angles.trunk !== null);
  const ratio = samples.length ? valid.length / samples.length : 0;
  const base: AutoAnalysis = { schemaVersion: '2.0', exercise: 'UNKNOWN', status: 'POSE_NOT_DETECTED', recognitionScore: 0, reps: 0, metrics: { detectedRatio: ratio, minJointAngle: null }, reference: { ...reference }, perRep: [] };
  if (valid.length < 10 || ratio < 0.6) return base;
  const votes = { SQUAT: 0, PUSH_UP: 0, LUNGE: 0 };
  const kind = (s: Sample): Exercise => {
    const m = s.motion, trunk = s.angles?.trunk;
    if (!m || trunk == null) return 'UNKNOWN';
    if (trunk >= 65 && m.bodyLine !== null && m.bodyLine >= 150 && m.elbowAngle !== null && m.elbowVisibility >= 0.6) return 'PUSH_UP';
    if (trunk < 65 && m.stanceRatio !== null && m.stanceRatio >= 0.8) return 'LUNGE';
    if (trunk < 65 && m.stanceRatio !== null && m.stanceRatio < 0.6) return 'SQUAT';
    return 'UNKNOWN';
  };
  for (const s of valid) { const vote = kind(s); if (vote !== 'UNKNOWN') votes[vote]++; }
  const winner = (Object.keys(votes) as (keyof typeof votes)[]).sort((a, b) => votes[b] - votes[a])[0];
  base.recognitionScore = votes[winner] / valid.length;
  const selected = valid.filter(s => kind(s) === winner);
  const values = selected.map(s => winner === 'PUSH_UP' ? s.motion!.elbowAngle! : s.kneeAngle);
  // Static postures, mixed exercises and small jitter do not identify a workout.
  if (base.recognitionScore < 0.7 || votes[winner] / samples.length < 0.6 || !values.length || Math.max(...values) - Math.min(...values) < 25) { base.status = 'UNRECOGNIZED_EXERCISE'; return base; }
  base.exercise = winner;
  const transformed = samples.map(s => ({ ...s, kneeAngle: winner === 'PUSH_UP' ? s.motion?.elbowAngle ?? 0 : s.kneeAngle, visibility: kind(s) !== winner ? 0 : winner === 'PUSH_UP' ? Math.min(s.visibility, s.motion?.elbowVisibility ?? 0) : s.visibility }));
  const cycles = analyzeSquat(transformed, reference);
  base.reps = cycles.reps; base.status = cycles.status;
  base.metrics.minJointAngle = cycles.metrics.minKneeAngle;
  base.perRep = (cycles.detail?.repetitions ?? []).flatMap(rep => {
    const sample = samples.find(s => s.timeMs === rep.bottomTimeMs);
    return sample?.angles ? [{ index: rep.index, timeSeconds: Math.round(rep.bottomTimeMs / 100) / 10, angles: sample.angles, bodyLine: sample.motion?.bodyLine ?? null }] : [];
  });
  return base;
}

export function autoComparisons(result: AutoAnalysis, rep: AutoAnalysis['perRep'][number]): Comparison[] {
  const row = (label: string, value: number | null, reference: string, pass: boolean | null, advice: string): Comparison => ({ label, value, reference, verdict: value === null ? 'Không đủ dữ liệu' : pass === null ? 'Chưa có tiêu chí kết luận' : pass ? 'Trong mục tiêu tham chiếu' : 'Ngoài mục tiêu tham chiếu', advice: value === null ? 'Điểm cơ thể chưa đủ rõ.' : pass === false ? advice : '' });
  const a = rep.angles, push = result.exercise === 'PUSH_UP';
  return [
    ...(['Left', 'Right'] as const).map((side, i) => {
      const value = a[(push ? 'elbow' : 'knee') + side as keyof Angles];
      return row((push ? 'Khuỷu tay ' : 'Gối ') + (i ? 'phải' : 'trái'), value, '≤100° tại điểm thấp nhất; mục tiêu heuristic của app', value === null ? null : value <= 100, 'Biên độ có thể chưa đạt mục tiêu app. Thực hiện chậm trong phạm vi thoải mái và đối chiếu với PT.');
    }),
    row('Độ nghiêng thân', a.trunk, result.reference.trunkMax === null ? 'Chỉ đo; chưa có mục tiêu phù hợp với biến thể' : 'Mục tiêu bạn nhập: ≤' + result.reference.trunkMax + '° so với phương thẳng đứng', a.trunk === null || result.reference.trunkMax === null ? null : a.trunk <= result.reference.trunkMax, 'Độ nghiêng thân vượt mục tiêu bạn nhập; kiểm tra lại với PT.'),
    ...(push ? [row('Đường vai–hông–cổ chân', rep.bodyLine, '≥160°; mục tiêu gần thẳng của app, không đo độ cong cột sống', rep.bodyLine === null ? null : rep.bodyLine >= 160, 'Đường vai–hông–cổ chân chưa gần thẳng theo mục tiêu. Giữ cơ thể ổn định khi hạ và đẩy.')] : [
      row('Khuỷu tay trái', a.elbowLeft, 'Chỉ đo; không suy ra biến thể/tư thế tay chuẩn từ tên bài', null, ''),
      row('Khuỷu tay phải', a.elbowRight, 'Chỉ đo; không suy ra biến thể/tư thế tay chuẩn từ tên bài', null, ''),
    ]),
    row('Độ nghiêng tay trái', a.armLeft, 'Chỉ đo so với phương ngang; chưa xác định biến thể tay', null, ''),
    row('Độ nghiêng tay phải', a.armRight, 'Chỉ đo so với phương ngang; chưa xác định biến thể tay', null, ''),
  ];
}
export function autoFeedback(result: AutoAnalysis): string[] {
  if (result.status === 'POSE_NOT_DETECTED') return ['Chưa nhận diện đủ tư thế. Quay toàn thân, đủ sáng, góc ngang bên hông.'];
  if (result.exercise === 'UNKNOWN') return ['Chưa xác định được bài tập. Có thể video chưa đủ rõ, có nhiều động tác hoặc bài chưa được hỗ trợ. Quay một bài trong mỗi video, thấy rõ hai chân và tay.'];
  const summary = 'Bài được nhận diện: ' + exerciseLabel(result.exercise) + '. ' + result.reps + ' lần hoàn chỉnh. Điểm hỗ trợ nhận diện ' + Math.round(result.recognitionScore * 100) + '% là heuristic, không phải xác suất đúng.';
  if (result.status !== 'COMPLETED') return [summary, 'Chưa thấy chu kỳ hoàn chỉnh. Quay cả lúc bắt đầu, hạ người và trở về tư thế đầu.'];
  const outside = result.perRep.flatMap(rep => autoComparisons(result, rep).filter(row => row.verdict === 'Ngoài mục tiêu tham chiếu').map(row => 'Lần ' + rep.index + ' (' + rep.timeSeconds + ' giây): ' + row.label + ' ' + Math.round(row.value!) + '°. ' + row.advice));
  return [summary, ...(outside.length ? outside.slice(0, 3) : ['Các chỉ số có mục tiêu trong những lần được nhận diện chưa cho thấy vượt ngưỡng app. Điều này không xác nhận toàn bộ kỹ thuật đúng.']), 'Các góc 2D và ngưỡng app chưa được kiểm chứng trên video người thật; không đánh giá độ cong lưng, đầu gối đổ vào trong, tạ hay tải tập.'];
}
export function automaticPayload(result: AutoAnalysis) {
  const number = (value: number | null) => value === null ? null : Math.round(value * 10) / 10;
  return { schemaVersion: result.schemaVersion, exercise: result.exercise, status: result.status, recognitionScore: number(result.recognitionScore), reps: result.reps, metrics: { detectedRatio: number(result.metrics.detectedRatio), minJointAngle: number(result.metrics.minJointAngle) }, reference: { trunkMax: result.reference.trunkMax }, perRep: result.perRep.slice(0, 10).map(rep => ({ index: rep.index, timeSeconds: rep.timeSeconds, angles: Object.fromEntries(Object.entries(rep.angles).map(([key, value]) => [key, number(value)])), bodyLine: number(rep.bodyLine) })) };
}
