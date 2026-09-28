import type { PoseLandmarker } from '@mediapipe/tasks-vision';
import { Sample } from './algorithm';
type Vision = typeof import('@mediapipe/tasks-vision');
let visionPromise: Promise<Vision> | undefined;
function loadVision(): Promise<Vision> {
  visionPromise ??= new Promise<Vision>((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module'; script.src = '/pose-loader.mjs';
    script.onload = () => resolve((globalThis as typeof globalThis & { fitnessVision: Vision }).fitnessVision);
    script.onerror = () => { script.remove(); visionPromise = undefined; reject(new Error('Không nạp được mô hình local.')); };
    document.head.appendChild(script);
  });
  return visionPromise;
}
export async function extractPose(uri: string, signal: AbortSignal, progress: (stage: string) => void): Promise<Sample[]> {
  if (!uri.startsWith('blob:')) throw new Error('Chỉ xử lý video local.');
  const video = document.createElement('video');
  video.muted = true; video.playsInline = true; video.preload = 'auto';
  let landmarker: PoseLandmarker | undefined;
  const event = (name: string) => new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error('Không đọc được video.')), 15000);
    const cleanup = () => { clearTimeout(timer); video.removeEventListener(name, done); video.removeEventListener('error', error); signal.removeEventListener('abort', cancelled); };
    const finish = (e?: Error) => { cleanup(); e ? reject(e) : resolve(); };
    const done = () => finish(), error = () => finish(new Error('Video không đọc được.')), cancelled = () => finish(new Error('Đã hủy phân tích.'));
    video.addEventListener(name, done, { once: true }); video.addEventListener('error', error, { once: true }); signal.addEventListener('abort', cancelled, { once: true });
    if (signal.aborted) cancelled();
  });
  try {
    const loaded = event('loadeddata'); video.src = uri; video.load(); await loaded;
    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.duration > 120) throw new Error('Chọn video dài tối đa 2 phút.');
    progress('Đang nạp mô hình trên thiết bị…');
    const vision = await loadVision();
    landmarker = await vision.PoseLandmarker.createFromOptions(await vision.FilesetResolver.forVisionTasks('/mediapipe/wasm'), {
      baseOptions: { modelAssetPath: '/mediapipe/pose_landmarker_lite.task', delegate: 'CPU' },
      runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: 0.6, minPosePresenceConfidence: 0.6,
    });
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Trình duyệt không hỗ trợ xử lý video.');
    const samples: Sample[] = [];
    for (let time = 0.1; time < video.duration; time += 0.1) {
      if (signal.aborted) throw new Error('Đã hủy phân tích.');
      const sought = event('seeked'); video.currentTime = time; await sought;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const result = landmarker.detectForVideo(canvas, Math.round(time * 1000));
      const landmarks = result.landmarks[0];
      let angle = 0, visibility = 0;
      if (landmarks) {
        const side = ([23, 25, 27].reduce((sum, i) => sum + landmarks[i].visibility, 0) >= [24, 26, 28].reduce((sum, i) => sum + landmarks[i].visibility, 0)) ? [23, 25, 27] : [24, 26, 28];
        const [a, b, c] = side.map(i => landmarks[i]);
        visibility = Math.min(a.visibility, b.visibility, c.visibility);
        const ux = (a.x - b.x) * canvas.width, uy = (a.y - b.y) * canvas.height, vx = (c.x - b.x) * canvas.width, vy = (c.y - b.y) * canvas.height;
        const denominator = Math.hypot(ux, uy) * Math.hypot(vx, vy);
        angle = denominator ? Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / denominator))) * 180 / Math.PI : 0;
      }
      samples.push({ timeMs: Math.round(time * 1000), kneeAngle: angle, visibility });
      progress('Đang phân tích: ' + Math.round(time / video.duration * 100) + '%');
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    return samples;
  } finally { landmarker?.close(); video.pause(); video.removeAttribute('src'); video.load(); }
}
