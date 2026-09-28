import { mkdir, copyFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(new URL('../apps/app/package.json', import.meta.url));
const vision = dirname(require.resolve('@mediapipe/tasks-vision'));
const publicDir = join(root, 'apps/app/public/mediapipe');
const androidDir = join(root, 'apps/app/modules/fitness-pose/android/src/main/assets');
const iosDir = join(root, 'apps/app/modules/fitness-pose/ios/Resources');
const response = await fetch('https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task');
if (!response.ok) throw new Error('Cannot download official MediaPipe pose model');
const model = Buffer.from(await response.arrayBuffer());
if (model.length < 1000000 || model.length > 20000000) throw new Error('Unexpected model size');
const expectedHash = '59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a';
if (createHash('sha256').update(model).digest('hex') !== expectedHash) throw new Error('Official model checksum changed; review before updating');
for (const dir of [publicDir, androidDir, iosDir]) {
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'pose_landmarker_lite.task'), model);
}
const wasmDir = join(publicDir, 'wasm');
await copyFile(join(vision, 'vision_bundle.mjs'), join(publicDir, 'vision_bundle.mjs'));
await mkdir(wasmDir, { recursive: true });
for (const name of await readdir(join(vision, 'wasm'))) {
  if (/\.(wasm|js)$/.test(name)) await copyFile(join(vision, 'wasm', name), join(wasmDir, name));
}
console.log('Prepared on-device model. SHA256: ' + createHash('sha256').update(model).digest('hex'));
