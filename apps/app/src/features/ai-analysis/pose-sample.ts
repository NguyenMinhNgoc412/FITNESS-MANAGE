import type { Sample } from './algorithm';
import { Landmark, measureAngles } from './measurements';

export type PoseFrame = { timeMs: number; frameWidth: number; frameHeight: number; landmarks: Landmark[] };
export function sampleFromPose({ timeMs, frameWidth, frameHeight, landmarks }: PoseFrame): Sample {
  const angles = measureAngles(landmarks, frameWidth, frameHeight);
  const quality = (indices: number[]) => Math.min(...indices.map(i => landmarks[i]?.visibility ?? 0));
  const leftQuality = quality([23, 25, 27]), rightQuality = quality([24, 26, 28]);
  const left = angles.kneeLeft !== null && (angles.kneeRight === null || leftQuality >= rightQuality);
  const point = (i: number) => {
    const p = landmarks[i];
    return p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.visibility) && p.visibility! >= 0.6 && p.visibility! <= 1 ? { x: p.x * frameWidth, y: p.y * frameHeight } : null;
  };
  const shoulder = point(left ? 11 : 12), hip = point(left ? 23 : 24), ankle = point(left ? 27 : 28), ankleLeft = point(27), ankleRight = point(28);
  const torsoLength = shoulder && hip ? Math.hypot(shoulder.x - hip.x, shoulder.y - hip.y) : 0;
  let bodyLine: number | null = null;
  if (shoulder && hip && ankle) {
    const ux = shoulder.x - hip.x, uy = shoulder.y - hip.y, vx = ankle.x - hip.x, vy = ankle.y - hip.y;
    const denominator = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    if (denominator > 0) bodyLine = Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / denominator))) * 180 / Math.PI;
  }
  const elbowLeftQuality = quality([11, 13, 15]), elbowRightQuality = quality([12, 14, 16]);
  const elbowLeft = angles.elbowLeft !== null && (angles.elbowRight === null || elbowLeftQuality >= elbowRightQuality);
  return { timeMs, kneeAngle: (left ? angles.kneeLeft : angles.kneeRight) ?? 0, visibility: angles.kneeLeft === null && angles.kneeRight === null ? 0 : left ? leftQuality : rightQuality, angles, motion: {
    stanceRatio: ankleLeft && ankleRight && torsoLength > 0 ? Math.abs(ankleLeft.x - ankleRight.x) / torsoLength : null,
    bodyLine, elbowAngle: elbowLeft ? angles.elbowLeft : angles.elbowRight,
    elbowVisibility: angles.elbowLeft === null && angles.elbowRight === null ? 0 : elbowLeft ? elbowLeftQuality : elbowRightQuality,
  } };
}

export function samplesFromNativeFrames(frames: PoseFrame[]): Sample[] {
  if (!Array.isArray(frames) || frames.length > 1200) throw new Error('Dữ liệu nhận diện trên thiết bị không hợp lệ.');
  let previous = -1;
  return frames.map(frame => {
    if (!frame || !Number.isFinite(frame.timeMs) || frame.timeMs <= previous || frame.timeMs < 0 || frame.timeMs > 120000 || !Number.isFinite(frame.frameWidth) || !Number.isFinite(frame.frameHeight) || frame.frameWidth <= 0 || frame.frameHeight <= 0 || !Array.isArray(frame.landmarks) || frame.landmarks.length > 33) throw new Error('Dữ liệu nhận diện trên thiết bị không hợp lệ.');
    previous = frame.timeMs;
    return sampleFromPose(frame);
  });
}
