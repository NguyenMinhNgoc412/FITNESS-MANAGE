import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';
const pnpm = isWindows ? 'pnpm.cmd' : 'pnpm';
const services = [
  { name: 'API', command: pnpm, args: ['dev:api'] },
  { name: 'AI', command: process.execPath, args: ['scripts/ai.mjs', 'dev'] },
  { name: 'EXPO', command: pnpm, args: ['dev:app'] },
];

const children = services.map(({ name, command, args }) => {
  const stdio = name === 'EXPO' ? 'inherit' : ['ignore', 'inherit', 'inherit'];
  const child = spawn(command, args, { cwd: process.cwd(), stdio, shell: isWindows });
  return { name, child };
});

let stopping = false;
async function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  await Promise.all(children.map(({ child }) => new Promise((resolve) => {
    if (!child.pid || child.exitCode !== null) return resolve();
    if (isWindows) {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      killer.on('exit', resolve);
      killer.on('error', resolve);
    } else {
      child.kill('SIGTERM');
      child.once('exit', resolve);
    }
  })));
  process.exit(exitCode);
}

for (const { name, child } of children) {
  child.on('error', (error) => {
    console.error(`[${name}] Không thể khởi động: ${error.message}`);
    void stop(1);
  });
  child.on('exit', (code) => {
    if (!stopping) {
      if (code !== 0) console.error(`[${name}] Đã dừng với mã ${code}. Đang dừng các service còn lại.`);
      void stop(code ?? 0);
    }
  });
}

process.on('SIGINT', () => void stop(0));
process.on('SIGTERM', () => void stop(0));
