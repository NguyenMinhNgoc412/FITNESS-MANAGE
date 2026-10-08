import { requireOptionalNativeModule } from 'expo';
import { Sample } from './algorithm';
import { PoseFrame, samplesFromNativeFrames } from './pose-sample';
type PoseModule = { getAnalysisVersion?: () => number; analyze(uri: string): Promise<PoseFrame[]>; cancel(): void };
export async function extractPose(uri: string, signal: AbortSignal, progress: (stage: string) => void): Promise<Sample[]> {
  const module = requireOptionalNativeModule<PoseModule>('FitnessPose');
  if (!module) throw new Error('Cần bản cài Development Build để chạy AI trên thiết bị này.');
  if (signal.aborted) throw new Error('Đã hủy phân tích.');
  if (module.getAnalysisVersion?.() !== 2) throw new Error('Bản cài AI trên thiết bị chưa hỗ trợ phân tích góc. Cần build và cài lại Development Build mới.');
  const cancel = () => module.cancel();
  signal.addEventListener('abort', cancel);
  progress('Đang nhận diện tư thế trên thiết bị…');
  try {
    const frames = await module.analyze(uri);
    if (signal.aborted) throw new Error('Đã hủy phân tích.');
    progress('Đang tính góc và so sánh trên thiết bị…');
    return samplesFromNativeFrames(frames);
  }
  finally { signal.removeEventListener('abort', cancel); }
}
