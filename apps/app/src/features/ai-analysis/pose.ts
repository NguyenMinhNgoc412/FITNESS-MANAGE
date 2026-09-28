import { requireOptionalNativeModule } from 'expo';
import { Sample } from './algorithm';
type PoseModule = { analyze(uri: string): Promise<Sample[]>; cancel(): void };
export async function extractPose(uri: string, signal: AbortSignal, progress: (stage: string) => void): Promise<Sample[]> {
  const module = requireOptionalNativeModule<PoseModule>('FitnessPose');
  if (!module) throw new Error('Cần bản cài Development Build để chạy AI trên thiết bị này.');
  if (signal.aborted) throw new Error('Đã hủy phân tích.');
  const cancel = () => module.cancel();
  signal.addEventListener('abort', cancel);
  progress('Đang nhận diện tư thế trên thiết bị…');
  try { return await module.analyze(uri); }
  finally { signal.removeEventListener('abort', cancel); }
}
