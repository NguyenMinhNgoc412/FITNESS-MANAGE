// Run with: pnpm --package=@playwright/test dlx -c "node scripts/browser-smoke.cjs"
// Uses generated identities and an isolated local MongoDB; never uses saved .env credentials.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { createRequire } = require('node:module');
const { randomBytes } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const apiRequire = createRequire(path.join(root, 'apps/api/package.json'));
const toolBin = process.env.PATH.split(path.delimiter).find(p => fs.existsSync(path.resolve(p, '../@playwright/test/package.json')));
if (!toolBin) throw new Error('Run through the documented pnpm dlx command.');
const { chromium } = createRequire(fs.realpathSync(path.resolve(toolBin, '../@playwright/test/package.json')))('playwright');
apiRequire('ts-node').register({ project: path.join(root, 'apps/api/tsconfig.json') });
const dbName = 'fitness_test_browser_' + Date.now();
process.env.DATABASE_URL = 'mongodb://127.0.0.1:27027/' + dbName + '?replicaSet=rs0&directConnection=true';
for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'JWT_QR_SECRET']) process.env[key] = randomBytes(32).toString('hex');
process.env.AI_SERVICE_URL = ''; process.env.AI_SERVICE_TOKEN = '';
const { AppModule } = require('../apps/api/src/app.module.ts');
const { PrismaService } = require('../apps/api/src/prisma.service.ts');
const { ApiExceptionFilter } = require('../apps/api/src/common/errors.ts');
const { ensureIndexes } = require('../apps/api/prisma/indexes.ts');
const { Test } = apiRequire('@nestjs/testing');
let app, prisma, server, browser, activePage, stage = 'setup';
async function main() {
  execFileSync(process.execPath, [apiRequire.resolve('prisma/build/index.js'), 'db', 'push', '--skip-generate'], { cwd: path.join(root, 'apps/api'), env: process.env, stdio: 'pipe' });
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = module.createNestApplication({ logger: false }); app.setGlobalPrefix('api'); app.useGlobalFilters(new ApiExceptionFilter());
  await app.listen(0, '127.0.0.1'); const apiUrl = await app.getUrl();
  prisma = app.get(PrismaService); await ensureIndexes(prisma);
  const password = randomBytes(20).toString('hex'), passwordHash = await apiRequire('bcryptjs').hash(password, 4);
  const accounts = {};
  for (const [i, role] of ['OWNER', 'PT', 'MEMBER'].entries()) accounts[role] = await prisma.user.create({ data: { phone: '09000000' + (10 + i), role, passwordHash, profile: { create: { fullName: 'Demo ' + role } } } });
  const build = path.join(root, 'apps/app/dist-sot-web');
  const mime = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.wasm': 'application/wasm', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' };
  server = http.createServer((req, res) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin'); res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    const file = path.resolve(build, '.' + new URL(req.url, 'http://localhost').pathname);
    if (file !== build && !file.startsWith(build + path.sep)) { res.writeHead(403); return res.end(); }
    const selected = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(build, 'index.html');
    res.setHeader('Content-Type', mime[path.extname(selected)] ?? 'application/octet-stream');
    fs.createReadStream(selected).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const frontend = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-unsafe-swiftshader'] });
  let forbiddenNetwork = false;
  const unexpectedOrigins = new Set();
  for (const role of ['OWNER', 'PT', 'MEMBER']) {
    stage = role + ' login';
    const context = await browser.newContext({ viewport: role === 'OWNER' ? { width: 1440, height: 1000 } : { width: 390, height: 844 } });
    const page = await context.newPage();
    activePage = page;
    page.setDefaultTimeout(30000);
    await page.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.pathname.startsWith('/api/')) {
        if (/multipart|video\//i.test(request.headers()['content-type'] ?? '') || /"(video|base64|mediaUrl|video_uri)"\s*:/.test(request.postData() ?? '')) forbiddenNetwork = true;
        const response = await route.fetch({ url: apiUrl + url.pathname + url.search });
        return route.fulfill({ response });
      }
      if (!['blob:', 'data:'].includes(url.protocol) && url.origin !== frontend) { forbiddenNetwork = true; unexpectedOrigins.add(url.origin); return route.abort(); }
      return route.continue();
    });
    await page.goto(frontend + '/login');
    await page.getByLabel('Số điện thoại', { exact: true }).fill(accounts[role].phone);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.waitForURL('**/' + role.toLowerCase());
    await page.waitForLoadState('networkidle');
    if (role === 'OWNER') await page.getByText('Việc cần xử lý', { exact: true }).waitFor();
    if (role === 'PT') await page.getByLabel('Đang tải', { exact: true }).first().waitFor({ state: 'hidden' });
    fs.mkdirSync(path.join(root, '.local'), { recursive: true });
    await page.screenshot({ path: path.join(root, '.local/' + role.toLowerCase() + '-sot.png'), fullPage: true });
    if (role === 'OWNER') {
      stage = 'Owner Trial UI';
      await page.getByRole('link', { name: 'Khách hàng', exact: true }).click();
      await page.getByRole('button', { name: '+ Tiếp nhận khách Trial', exact: true }).click();
      await page.getByLabel('Họ tên', { exact: true }).fill('Trial demo');
      await page.getByLabel('SĐT', { exact: true }).fill('0900000099');
      await page.getByRole('button', { name: 'Tạo Trial 3 lượt', exact: true }).click();
      await page.getByRole('radio', { name: /Trial demo/ }).click();
      await page.getByText('○ Trial', { exact: true }).click();
      await page.getByRole('button', { name: 'Check-in Trial', exact: true }).click();
      await page.getByText('Đã dùng 1/3 lượt', { exact: true }).waitFor();
      await page.screenshot({ path: path.join(root, '.local/owner-customers-sot.png'), fullPage: true });
      stage = 'Owner compact navigation';
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole('button', { name: 'Mở menu', exact: true }).click();
      await page.getByRole('link', { name: 'Tổng quan', exact: true }).waitFor();
      await page.screenshot({ path: path.join(root, '.local/owner-mobile-menu-sot.png'), fullPage: true });
    }
    if (role === 'PT') {
      stage = 'PT attendance UI';
      await page.getByRole('button', { name: 'Xác nhận có mặt tại gym', exact: true }).click();
      await page.getByText('Đã thực hiện thành công.', { exact: true }).waitFor();
      if (await page.getByText('Bạn không có quyền thực hiện thao tác này.', { exact: true }).count()) throw new Error('PT own attendance was denied');
      await page.getByRole('link', { name: 'Lịch', exact: true }).click();
      if (await page.getByRole('button', { name: 'Tạo booking', exact: true }).count()) throw new Error('PT mutation control exposed');
    }
    if (role === 'MEMBER') {
      stage = 'Member QR UI';
      await page.getByRole('link', { name: 'Check-in', exact: true }).click();
      await page.getByLabel('Mã QR check-in có thời hạn', { exact: true }).waitFor();
      stage = 'Member local AI UI';
      await page.getByRole('link', { name: 'AI', exact: true }).click();
      stage = 'Member AI ready';
      await page.getByRole('button', { name: 'Chọn video local', exact: true }).waitFor();
      // Generated black video exercises local import/storage/failure, with no user footage.
      const fixture = path.join(root, '.local/blank.webm');
      execFileSync(path.join(root, 'services/ai/.venv/Scripts/python.exe'), [path.join(root, 'scripts/blank-video.py'), fixture], { stdio: 'pipe' });
      const chooser = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: 'Chọn video local', exact: true }).click();
      await (await chooser).setFiles(fixture);
      stage = 'Member AI import';
      await page.getByRole('button', { name: 'Phân tích trên thiết bị', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Phân tích trên thiết bị', exact: true }).click();
      stage = 'Member AI pose';
      await page.getByText('Chưa nhận diện đủ tư thế. Quay toàn thân, đủ sáng, góc ngang bên hông.', { exact: true }).waitFor({ timeout: 120000 });
      page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Xóa phiên và video local', exact: true }).click();
      await page.getByText('Chưa có phiên phân tích. Chọn hoặc quay video để bắt đầu.', { exact: true }).waitFor();
    }
    await context.close();
  }
  if (forbiddenNetwork) throw new Error('Unexpected network destination or media payload: ' + [...unexpectedOrigins].join(', '));
  console.log('Browser E2E passed: Owner Trial, PT attendance/read-only, Member QR/local SQLite/OPFS/MediaPipe failure/delete; no raw-video network payload.');
}
main().catch(async error => { console.error('Browser E2E failed at: ' + stage + ' (' + error.name + ')'); console.error(error.message); if (activePage && !activePage.isClosed()) { console.error(await activePage.locator('body').innerText().catch(() => 'Page unavailable')); await activePage.screenshot({path: path.join(root, '.local/browser-failure.png')}).catch(() => undefined); } process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
  if (prisma && new URL(process.env.DATABASE_URL).pathname === '/' + dbName && dbName.startsWith('fitness_test_browser_')) await prisma.$runCommandRaw({ dropDatabase: 1 });
  if (app) await app.close();
});
