import { requireOptionalNativeModule } from 'expo';
import { analyzeSquat, explanationPayload } from './algorithm';
import { extractPose } from './pose';
import { PoseFrame, sampleFromPose, samplesFromNativeFrames } from './pose-sample';

jest.mock('expo', () => ({ requireOptionalNativeModule: jest.fn() }));
const native = { getAnalysisVersion: jest.fn(() => 2), analyze: jest.fn(), cancel: jest.fn() };
const makeFrame = (angle: number, timeMs: number): PoseFrame => {
  const landmarks = Array.from({ length: 29 }, () => ({ x: 0, y: 0, visibility: 0 }));
  const radians = angle * Math.PI / 180;
  for (const offset of [0, 1]) {
    landmarks[11 + offset] = { x: 0.5, y: 0.2, visibility: 1 };
    landmarks[13 + offset] = { x: 0.6, y: 0.2, visibility: 1 };
    landmarks[15 + offset] = { x: 0.7, y: 0.2, visibility: 1 };
    landmarks[23 + offset] = { x: 0.5, y: 0.4, visibility: 1 };
    landmarks[25 + offset] = { x: 0.5, y: 0.6, visibility: 1 };
    landmarks[27 + offset] = { x: 0.5 + Math.sin(radians) * 0.1, y: 0.6 - Math.cos(radians) * 0.2, visibility: 1 };
  }
  return { timeMs, frameWidth: 640, frameHeight: 320, landmarks };
};

beforeEach(() => {
  native.getAnalysisVersion.mockReturnValue(2);
  (requireOptionalNativeModule as jest.Mock).mockReturnValue(native);
});
describe('native and web shared pose metrics', () => {
  it('returns the same per-repetition report from native bridge and web samples without retaining landmarks', async () => {
    const frames = [170, 170, 150, 130, 110, 90, 80, 90, 110, 130, 150, 170, 170].map((angle, i) => makeFrame(angle, (i + 1) * 100));
    native.analyze.mockResolvedValue(frames);
    const samples = await extractPose('file:///synthetic-local.mp4', new AbortController().signal, jest.fn());
    const result = analyzeSquat(samples, { trunkMax: 40 });
    expect(result).toEqual(analyzeSquat(frames.map(sampleFromPose), { trunkMax: 40 }));
    expect(result.reps).toBe(1);
    expect(result.detail?.repetitions[0].bottomTimeMs).toBe(700);
    expect(result.detail?.repetitions[0].angles?.kneeLeft).toBeCloseTo(80);
    expect(result.detail?.repetitions[0].angles?.elbowRight).toBeCloseTo(180);
    expect(result.detail?.repetitions[0].angles?.trunk).toBeCloseTo(0);
    expect(JSON.stringify(samples)).not.toMatch(/landmarks|frameWidth|frameHeight/);
    expect(JSON.stringify(explanationPayload(result))).not.toMatch(/detail|landmarks|file:|trunk/);
  });
  it('uses the clear knee when the other side is occluded despite a higher average visibility', () => {
    const frame = makeFrame(90, 100);
    for (const i of [24, 26, 28]) frame.landmarks[i].visibility = 0.7;
    frame.landmarks[25].visibility = 0.55;
    const sample = sampleFromPose(frame);
    expect(sample.kneeAngle).toBeCloseTo(90);
    expect(sample.visibility).toBe(0.7);
    expect(sample.angles?.kneeLeft).toBeNull();
  });
  it('returns missing metrics for absent pose and rejects malformed native frames', () => {
    const frame = { ...makeFrame(90, 100), landmarks: [] };
    const result = analyzeSquat(samplesFromNativeFrames([frame]));
    expect(result.status).toBe('POSE_NOT_DETECTED');
    expect(result.detail?.repetitions).toEqual([]);
    for (const invalid of [{ ...frame, frameWidth: 0 }, { ...frame, frameHeight: NaN }, { ...frame, timeMs: Infinity }]) expect(() => samplesFromNativeFrames([invalid])).toThrow('Dữ liệu nhận diện');
    expect(() => samplesFromNativeFrames([frame, frame])).toThrow('Dữ liệu nhận diện');
  });
  it('requires a rebuilt binary rather than silently showing an incomplete report', async () => {
    (requireOptionalNativeModule as jest.Mock).mockReturnValue({ analyze: native.analyze, cancel: native.cancel });
    await expect(extractPose('file:///synthetic-local.mp4', new AbortController().signal, jest.fn())).rejects.toThrow('build và cài lại');
    expect(native.analyze).not.toHaveBeenCalled();
    (requireOptionalNativeModule as jest.Mock).mockReturnValue(null);
    await expect(extractPose('file:///synthetic-local.mp4', new AbortController().signal, jest.fn())).rejects.toThrow('Development Build');
  });
  it('cancels native processing, discards a late result and removes the abort listener', async () => {
    const controller = new AbortController();
    let finish!: (frames: PoseFrame[]) => void;
    native.analyze.mockReturnValue(new Promise<PoseFrame[]>(resolve => { finish = resolve; }));
    const pending = extractPose('file:///synthetic-local.mp4', controller.signal, jest.fn());
    controller.abort();
    finish([makeFrame(90, 100)]);
    await expect(pending).rejects.toThrow('Đã hủy phân tích');
    expect(native.cancel).toHaveBeenCalledTimes(1);
    const retry = new AbortController();
    native.analyze.mockResolvedValue([]);
    await extractPose('file:///synthetic-local.mp4', retry.signal, jest.fn());
    retry.abort();
    expect(native.cancel).toHaveBeenCalledTimes(1);
  });
});
