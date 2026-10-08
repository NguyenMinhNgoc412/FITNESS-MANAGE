export type Landmark = { x: number; y: number; visibility?: number };
export type Angles = { kneeLeft: number | null; kneeRight: number | null; trunk: number | null; elbowLeft: number | null; elbowRight: number | null; armLeft: number | null; armRight: number | null };
export function measureAngles(pose: Landmark[], width: number, height: number): Angles {
  const point = (i: number) => {
    const p = pose[i];
    return p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.visibility) && (p.visibility ?? 0) >= 0.6 && p.visibility! <= 1 && Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 ? { x: p.x * width, y: p.y * height } : null;
  };
  const joint = (a: number, b: number, d: number) => {
    const p = point(a), q = point(b), r = point(d);
    if (!p || !q || !r) return null;
    const ux = p.x - q.x, uy = p.y - q.y, vx = r.x - q.x, vy = r.y - q.y;
    const denominator = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    return denominator > 0 ? Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / denominator))) * 180 / Math.PI : null;
  };
  const tilt = (a: number, b: number) => {
    const p = point(a), q = point(b);
    return p && q && Math.hypot(p.x - q.x, p.y - q.y) > 0 ? Math.atan2(Math.abs(p.y - q.y), Math.abs(p.x - q.x)) * 180 / Math.PI : null;
  };
  const trunkLeft = tilt(11, 23), trunkRight = tilt(12, 24);
  // Prefer the side with greater minimum visibility; never substitute missing landmarks with zero degrees.
  const quality = (a: number, b: number) => Math.min(pose[a]?.visibility ?? 0, pose[b]?.visibility ?? 0);
  const trunkTilt = trunkLeft === null ? trunkRight : trunkRight === null ? trunkLeft : quality(11, 23) >= quality(12, 24) ? trunkLeft : trunkRight;
  return { kneeLeft: joint(23, 25, 27), kneeRight: joint(24, 26, 28), trunk: trunkTilt === null ? null : 90 - trunkTilt, elbowLeft: joint(11, 13, 15), elbowRight: joint(12, 14, 16), armLeft: tilt(11, 15), armRight: tilt(12, 16) };
}

export type Reference = { trunkMax: number | null };
export type Comparison = { label: string; value: number | null; reference: string; verdict: string; advice: string };
export function compareAngles(angles: Angles, reference: Reference): Comparison[] {
  const row = (label: string, value: number | null, target: string, pass: boolean | null, advice: string): Comparison => ({ label, value, reference: target, verdict: value === null ? 'Không đủ dữ liệu' : pass === null ? 'Chưa có tiêu chí kết luận' : pass ? 'Trong mục tiêu tham chiếu' : 'Ngoài mục tiêu tham chiếu', advice: value === null ? 'Điểm cơ thể bị che hoặc nhận diện chưa đủ rõ.' : pass === false ? advice : '' });
  return [
    row('Gối trái', angles.kneeLeft, 'Góc trong hông–gối–cổ chân ≤100° ở điểm thấp nhất (heuristic app)', angles.kneeLeft === null ? null : angles.kneeLeft <= 100, 'Có thể chưa đủ độ sâu theo mục tiêu app; kiểm tra lại với PT.'),
    row('Gối phải', angles.kneeRight, 'Góc trong hông–gối–cổ chân ≤100° ở điểm thấp nhất (heuristic app)', angles.kneeRight === null ? null : angles.kneeRight <= 100, 'Có thể chưa đủ độ sâu theo mục tiêu app; kiểm tra lại với PT.'),
    row('Độ nghiêng thân', angles.trunk, reference.trunkMax === null ? 'Không có góc chuẩn chung; cần mục tiêu phù hợp do PT hướng dẫn' : 'Mục tiêu bạn nhập: ≤' + reference.trunkMax + '° so với phương thẳng đứng', angles.trunk === null || reference.trunkMax === null ? null : angles.trunk <= reference.trunkMax, 'Thân nghiêng hơn mục tiêu bạn nhập. Đối chiếu biến thể và hướng dẫn PT.'),
    ...(['Left', 'Right'] as const).flatMap((side, i) => [
      row('Khuỷu tay ' + (i ? 'phải' : 'trái'), angles['elbow' + side as 'elbowLeft' | 'elbowRight'], '160–180°; mục tiêu giữ tay gần duỗi của app', angles['elbow' + side as 'elbowLeft' | 'elbowRight'] === null ? null : angles['elbow' + side as 'elbowLeft' | 'elbowRight']! >= 160, 'Khuỷu tay đang gập hơn mục tiêu tay đưa trước.'),
      row('Độ nghiêng tay ' + (i ? 'phải' : 'trái'), angles['arm' + side as 'armLeft' | 'armRight'], '0–20° so với phương ngang; mục tiêu tay đưa trước của app', angles['arm' + side as 'armLeft' | 'armRight'] === null ? null : angles['arm' + side as 'armLeft' | 'armRight']! <= 20, 'Tay chưa gần ngang theo mục tiêu đã chọn. Kiểm tra góc quay trước khi điều chỉnh.'),
    ]),
  ];
}
