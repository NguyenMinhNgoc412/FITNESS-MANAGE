import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const service = fileURLToPath(new URL('../services/ai/', import.meta.url));
const python = fileURLToPath(new URL(
  process.platform === 'win32'
    ? '../services/ai/.venv/Scripts/python.exe'
    : '../services/ai/.venv/bin/python',
  import.meta.url,
));
const mode = process.argv[2];
const commands = {
  dev: ['-m', 'uvicorn', 'app.main:app', '--app-dir', service, '--host', '0.0.0.0', '--port', '8000'],
  test: ['-m', 'unittest', 'discover', '-s', 'tests', '-v'],
};

if (!Object.hasOwn(commands, mode)) {
  console.error('Cách dùng: node scripts/ai.mjs <dev|test>');
  process.exitCode = 1;
} else if (!existsSync(python)) {
  console.error('Thiếu services/ai/.venv. Tạo Python virtual environment và cài services/ai/requirements.txt theo README.md.');
  process.exitCode = 1;
} else {
  if (mode === 'dev' && existsSync(service + '.env')) commands.dev.push('--env-file', service + '.env');
  const child = spawn(python, commands[mode], {
    cwd: mode === 'test' ? service : root,
    stdio: 'inherit',
    shell: false,
  });
  child.on('error', () => {
    console.error('Không thể chạy Python trong services/ai/.venv. Kiểm tra lại virtual environment.');
    process.exitCode = 1;
  });
  child.on('exit', (code) => { process.exitCode = code ?? 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => { child.kill(signal); });
  }
}
