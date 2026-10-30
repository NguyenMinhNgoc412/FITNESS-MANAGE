// Invoked by test/activity-scenario.ts. Credentials arrive only through stdin, never files/argv.
// Proxy only redirects the exported app's /api transport to a REAL isolated Nest/MongoDB API.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const bin = process.env.PATH.split(path.delimiter).find(p => fs.existsSync(path.resolve(p, '../@playwright/test/package.json')));
if (!bin) throw Error('Run through test:activity-scenario with SCENARIO_BROWSER=1.');
const requireTest = createRequire(fs.realpathSync(path.resolve(bin, '../@playwright/test/package.json')));
const { chromium } = requireTest('playwright'), { expect } = requireTest('@playwright/test');
const root = path.resolve(__dirname, '..'), build = path.join(root, 'apps/app/dist-sot-web');
let browser, server, page, stage = 'stdin', config;
const readConfig = () => new Promise((resolve, reject) => { let input = ''; process.stdin.on('data', c => { input += c; }); process.stdin.on('end', () => { try { resolve(JSON.parse(input)); } catch { reject(Error('INVALID_RUNTIME_CONFIG')); } }); });
async function main() {
  config = await readConfig();
  assert.match(config.apiBase, /^http:\/\/127\.0\.0\.1:\d+\/api$/);
  assert(fs.existsSync(path.join(build, 'index.html')), 'Export web before running the scenario.');
  server = http.createServer((req, res) => {
    const file = path.resolve(build, '.' + new URL(req.url, 'http://localhost').pathname);
    if (file !== build && !file.startsWith(build + path.sep)) { res.writeHead(403); return res.end(); }
    const chosen = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(build, 'index.html');
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png' })[path.extname(chosen)] || 'application/octet-stream');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin'); res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp'); fs.createReadStream(chosen).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const contexts = [];
  async function login(phone, width) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, timezoneId: 'Asia/Bangkok' }); contexts.push(context);
    const p = page = await context.newPage();
    p.on('dialog', d => d.accept());
    await p.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.pathname.startsWith('/api/')) {
        const response = await route.fetch({ url: config.apiBase + url.pathname.slice(4) + url.search });
        return route.fulfill({ response, headers: { ...response.headers(), 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS' } });
      }
      if (url.origin !== origin) return route.abort();
      return route.continue();
    });
    await p.goto(origin + '/login');
    await p.getByLabel('Số điện thoại', { exact: true }).fill(phone); await p.getByLabel('Mật khẩu', { exact: true }).fill(config.password);
    const response = p.waitForResponse(r => new URL(r.url()).pathname === '/api/auth/login' && r.status() === 200);
    await p.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    const session = await (await response).json();
    return { page: p, token: session.accessToken, context };
  }
  const get = async (context, token, suffix) => { const r = await context.request.get(config.apiBase + suffix, { headers: { Authorization: 'Bearer ' + token } }); assert.equal(r.status(), 200); return r.json(); };
  stage = 'Member real history and all twenty guide details';
  const member = await login(config.memberPhone, 390), p = member.page;
  await expect(p.getByText('Hoạt động tập luyện', { exact: true }).first()).toBeVisible();
  const click = name => p.getByRole('button', { name, exact: true }).click();
  await click('Bài tập mẫu');
  for (const guide of config.guides) {
    await click('Xem ' + guide.nameVi);
    await expect(p.getByRole('button', { name: 'Chọn bài vào buổi nháp', exact: true })).toBeVisible();
    await expect(p.getByText('Bài mẫu không đồng nghĩa AI hỗ trợ phân tích bài này.', { exact: true })).toBeVisible();
    await click('Đóng chi tiết');
  }
  await click('Mở bộ lọc');
  // All ten primary groups can be selected and each has at least two cards.
  for (const label of ['Ngực', 'Lưng', 'Vai', 'Tay trước', 'Tay sau', 'Đùi trước', 'Đùi sau', 'Mông', 'Bắp chân', 'Bụng / thân giữa']) {
    await p.getByRole('combobox', { name: 'Nhóm cơ', exact: true }).selectOption({ label });
    await expect.poll(() => p.getByRole('button', { name: /^Xem / }).count()).toBeGreaterThanOrEqual(2);
  }
  await p.getByRole('combobox', { name: 'Nhóm cơ', exact: true }).selectOption('');
  await p.getByLabel('Tên bài Việt hoặc Anh', { exact: true }).fill('squat'); await click('Tìm bài tập');
  await click('Xem Squat không tạ');
  await p.screenshot({ path: path.join(config.output, 'member-guide-real-api.png'), fullPage: true });
  const progressPath = '/members/me/workout-progress?' + new URLSearchParams({ from: config.today, to: config.today });
  const before = await get(member.context, member.token, progressPath);
  stage = 'select guide, save/complete in real DB, verify progress delta';
  await click('Chọn bài vào buổi nháp'); await p.getByText('Squat không tạ · bài mẫu', { exact: true }).waitFor();
  await click('Thêm hiệp'); await p.getByLabel('Số lần hiệp 1', { exact: true }).fill('11'); await click('Lưu nháp');
  await p.getByText('Đã lưu nháp. Bạn có thể tiếp tục nhập hoặc hoàn tất buổi tập.', { exact: true }).waitFor();
  await click('Hoàn tất buổi tập'); await p.getByText('Đã lưu. Buổi tập đã hoàn tất.', { exact: true }).waitFor();
  const after = await get(member.context, member.token, progressPath); assert.equal(after.totalSessions, before.totalSessions + 1);
  await click('Đóng buổi tập');
  await click('Tiến bộ'); await expect(p.getByText('Buổi đã ghi nhật ký', { exact: true }).first()).toBeVisible();
  await p.screenshot({ path: path.join(config.output, 'member-progress-real-api.png'), fullPage: true });
  stage = 'Member with no activity and pending package';
  const empty = await login(config.emptyMemberPhone, 390);
  await empty.page.getByText('Chưa có nhật ký trong khoảng này. Tạo buổi tập hoặc chọn khoảng ngày khác.', { exact: true }).waitFor();
  await empty.page.getByRole('button', { name: 'Tiến bộ', exact: true }).click();
  await expect(empty.page.getByText('Chưa có số đo trong khoảng đã chọn.', { exact: true }).first()).toBeVisible();
  await empty.page.getByRole('button', { name: 'Bài tập mẫu', exact: true }).click();
  await expect(empty.page.getByRole('button', { name: /^Xem / }).first()).toBeVisible();
  stage = 'Owner actual monthly report 2026 to 2024 and packages';
  const owner = await login(config.ownerPhone, 1280), o = owner.page;
  await o.getByRole('link', { name: 'Logs / Báo cáo', exact: true }).click();
  const currentYear = Number(config.today.slice(0, 4));
  for (let year = currentYear; year >= 2024; year--) {
    if (year !== currentYear) await o.getByRole('radio', { name: '← ' + year, exact: false }).click();
    await o.getByText('Tháng 2/' + year, { exact: true }).waitFor();
    const oracle = config.monthly.find(r => r.year === year);
    for (const month of oracle.months) {
      const text = `${month.total} lượt vào tập · Member: ${month.member} · Trial: ${month.trial}`;
      await expect(o.getByText(text, { exact: true }).first()).toBeVisible();
    }
  }
  await o.screenshot({ path: path.join(config.output, 'owner-months-real-api.png'), fullPage: true });
  await o.getByRole('link', { name: 'Gói tập', exact: true }).click();
  for (const mode of ['SESSION_BASED', 'TIME_BASED']) {
    const expected = config.packages.filter(pkg => pkg.mode === mode);
    if (!expected.length) continue;
    const group = o.getByTestId('package-stat-group-' + mode), seen = new Set();
    // locator.all() does not wait for the REST response after route navigation.
    await expect(group.getByTestId('package-stat-row').first()).toBeVisible();
    for (;;) {
      for (const row of await group.getByTestId('package-stat-row').all()) {
        const name = (await row.innerText()).split(String.fromCharCode(10))[0], pkg = expected.find(pkg => pkg.name === name);
        assert(pkg, 'Unexpected package group'); seen.add(name);
        await expect(row.getByText(`${pkg.memberCount} người đăng ký · ${pkg.registrations} lần cấp`, { exact: true })).toBeVisible();
      }
      const next = group.getByRole('button', { name: 'Sau', exact: true });
      if (!await next.count() || await next.isDisabled()) break;
      await next.click();
    }
    assert.equal(seen.size, expected.length, 'Package statistics pagination hid a group');
  }
  await o.screenshot({ path: path.join(config.output, 'owner-packages-real-api.png'), fullPage: true });
  for (const context of contexts) await context.close();
  console.log('ACTIVITY_BROWSER_PASS real API/MongoDB: 20 guides, 10 groups, journal/progress write, empty member, Owner reports.');
}
main().catch(async error => {
  // Do not print locators/input values, credentials or response bodies on failure.
  console.error('ACTIVITY_BROWSER_FAIL stage=' + stage + ' kind=' + (error.name || 'Error'));
  if (page && config?.output && !page.isClosed()) await page.screenshot({ path: path.join(config.output, 'browser-failure.png'), fullPage: true }).catch(() => {});
  process.exitCode = 1;
}).finally(async () => { if (browser) await browser.close(); if (server) server.close(); });
