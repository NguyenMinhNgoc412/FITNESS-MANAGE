// After web export: pnpm --package=@playwright/test dlx -c "node scripts/design-system-regression.cjs"
// All API data is synthetic; no real accounts, database writes or camera access.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { randomBytes } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const toolBin = process.env.PATH.split(path.delimiter).find(p => fs.existsSync(path.resolve(p, '../@playwright/test/package.json')));
if (!toolBin) throw new Error('Run through the documented pnpm dlx command.');
const testRequire = createRequire(fs.realpathSync(path.resolve(toolBin, '../@playwright/test/package.json')));
const { chromium } = testRequire('playwright');
const { expect } = testRequire('@playwright/test');
const build = path.join(root, 'apps/app/dist-sot-web');
const output = path.join(root, '.local/design-system-fixes');
fs.mkdirSync(output, { recursive: true });
const mime = { '.js': 'text/javascript', '.html': 'text/html', '.wasm': 'application/wasm', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  const file = path.resolve(build, '.' + new URL(req.url, 'http://localhost').pathname);
  if (file !== build && !file.startsWith(build + path.sep)) { res.writeHead(403); return res.end(); }
  const chosen = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(build, 'index.html');
  res.setHeader('Content-Type', mime[path.extname(chosen)] ?? 'application/octet-stream');
  fs.createReadStream(chosen).pipe(res);
});
let browser, activePage, stage = 'setup';
const waitSignal = promise => Promise.race([promise, new Promise((_, reject) => {
  const timer = setTimeout(() => reject(new Error('Expected synthetic request was not sent')), 15000);
  timer.unref();
})]);
const memberId = '111111111111111111111111', ptId = '222222222222222222222222';
const membershipId = '333333333333333333333333', bookingId = '444444444444444444444444';
const person = { id: memberId, phone: '0900000000', role: 'MEMBER', status: 'ACTIVE', profile: { fullName: 'Member kiểm thử' } };
const membership = { id: membershipId, name: 'Gói kiểm thử', mode: 'SESSION_BASED', effectiveStatus: 'ACTIVE', status: 'ACTIVE', totalSessions: 30, usedSessions: 7, remainingSessions: 23 };
const booking = { id: bookingId, memberId, ptId, memberName: person.profile.fullName, ptName: 'PT kiểm thử', startAt: '2026-10-20T00:00:00.000Z', endAt: '2026-10-20T01:00:00.000Z', status: 'SCHEDULED' };

async function colors(locator) {
  return locator.evaluate(el => ({
    text: getComputedStyle(el.querySelector('[dir]') ?? el).color,
    background: getComputedStyle(el).backgroundColor,
  }));
}

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const role of ['OWNER', 'PT', 'MEMBER']) {
    const context = await browser.newContext({ viewport: { width: role === 'OWNER' ? 1440 : 390, height: 844 }, timezoneId: 'Asia/Bangkok' });
    const page = activePage = await context.newPage();
    let releaseMutation, markMutation, mutationStarted, holdMutation = false, packageWrites = 0;
    let bookingMode = 'success', releaseBookings, markBookings, bookingsStarted, checkinWrites = 0;
    const holdNextMutation = () => { holdMutation = true; mutationStarted = new Promise(resolve => { markMutation = resolve; }); };
    const releaseHeldMutation = () => { holdMutation = false; if (releaseMutation) releaseMutation(); };
    await page.route('**/*', async route => {
      const req = route.request(), url = new URL(req.url());
      if (url.pathname.startsWith('/api/')) {
        let body = [];
        if (url.pathname === '/api/auth/login') body = { accessToken: randomBytes(32).toString('hex'), refreshToken: randomBytes(32).toString('hex'), user: { id: memberId, role } };
        else if (url.pathname === '/api/auth/me') body = { ...person, role };
        else if (url.pathname === '/api/dashboard') body = { checkins: 3, trials: 1, alerts: 2, trialFinal: 1, membershipExpiring: 1, bookingsToday: 1, ptsToday: 1, bookings: [booking] };
        else if (url.pathname === '/api/pt/me/qr') body = { token: 'synthetic-pt-qr-for-layout-only', expiresIn: 120 };
        else if (url.pathname === '/api/people') body = [url.searchParams.get('role') === 'PT' ? { ...person, id: ptId, role: 'PT', profile: { fullName: 'PT kiểm thử' } } : person];
        else if (url.pathname === '/api/customers/search') body = [{ id: '555555555555555555555555', memberUserId: memberId, fullName: person.profile.fullName, phone: person.phone, status: 'MEMBER' }];
        else if (url.pathname === '/api/bookings') {
          if (bookingMode === 'loading') { markBookings(); await new Promise(resolve => { releaseBookings = resolve; }); }
          if (bookingMode === 'error') return route.fulfill({ status: 503, json: { message: 'Không tải được booking kiểm thử.' } });
          body = bookingMode === 'empty' ? [] : [booking];
        }
        else if (url.pathname.endsWith('/memberships')) body = [membership];
        else if (url.pathname === '/api/members/me/pt') body = null;
        if (req.method() !== 'GET' && url.pathname !== '/api/auth/login') {
          if (url.pathname.endsWith('/memberships') || url.pathname.endsWith('/renew')) packageWrites++;
          if (url.pathname === '/api/checkins/member') checkinWrites++;
          if (holdMutation) { markMutation(); await new Promise(resolve => { releaseMutation = resolve; }); }
          return route.fulfill({ status: 409, json: { message: 'Phản hồi kiểm thử; không ghi dữ liệu.' } });
        }
        return route.fulfill({ json: body });
      }
      if (url.origin !== origin) return route.abort();
      return route.continue();
    });
    stage = role + ' login';
    await page.goto(origin + '/login');
    await page.getByLabel('Số điện thoại', { exact: true }).fill(person.phone);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(randomBytes(16).toString('hex'));
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.waitForURL('**/' + role.toLowerCase());
    if (role === 'OWNER') {
      stage = 'package activation and renewal keep preset/input/submit locked';
      await page.getByRole('link', { name: 'Gói tập', exact: true }).click();
      await page.getByRole('radio', { name: /Member kiểm thử/ }).click();
      await page.getByRole('radio', { name: /Hội viên 15 buổi/ }).click();
      for (const action of ['Kích hoạt gói', 'Gia hạn gói']) {
        if (action === 'Gia hạn gói') {
          await page.getByRole('radio', { name: /Gia hạn/, exact: false }).click();
          await page.getByRole('radio', { name: /Hội viên 15 buổi/ }).last().click();
        }
        const button = page.getByRole('button', { name: action, exact: true });
        const style = await colors(button);
        assert.equal(style.background, 'rgb(40, 100, 181)');
        holdNextMutation();
        await button.click(); await waitSignal(mutationStarted);
        const parent = button.locator('..');
        await expect(parent.getByRole('radio', { name: /Hội viên 3 tháng/ })).toBeDisabled();
        await expect(parent.getByLabel('Ngày bắt đầu', { exact: true })).toBeDisabled();
        await expect(button).toBeDisabled();
        const before = packageWrites;
        await parent.getByRole('radio', { name: /Hội viên 3 tháng/ }).evaluate(el => el.click());
        await expect(button).toBeDisabled();
        assert.equal(packageWrites, before, 'Changing a preset submitted another command');
        releaseHeldMutation();
        await expect(button).toBeEnabled();
        await expect(parent.getByRole('radio', { name: /Hội viên 3 tháng/ })).toBeEnabled();
      }
      stage = 'destructive package / PT / booking confirmations';
      await page.getByRole('radio', { name: /Hủy gói/ }).click();
      const cancel = page.getByRole('button', { name: 'Xác nhận hủy gói', exact: true });
      await expect(cancel).toBeVisible();
      assert.deepEqual(await colors(cancel), { text: 'rgb(173, 48, 45)', background: 'rgb(251, 237, 236)' });
      await page.getByRole('link', { name: 'PT & Member', exact: true }).click();
      await page.getByRole('radio', { name: /Hội viên/ }).click();
      await page.getByRole('radio', { name: /Member kiểm thử/ }).click();
      assert.deepEqual(await colors(page.getByRole('button', { name: 'Xác nhận hủy PT', exact: true })), { text: 'rgb(173, 48, 45)', background: 'rgb(251, 237, 236)' });
      await page.getByRole('link', { name: 'Lịch tập', exact: true }).click();
      await page.getByRole('button', { name: 'Hủy lịch', exact: true }).click();
      assert.deepEqual(await colors(page.getByRole('button', { name: 'Xác nhận hủy lịch', exact: true })), { text: 'rgb(173, 48, 45)', background: 'rgb(251, 237, 236)' });
      stage = 'Owner short-screen sidebar and drawer scroll to Settings';
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 480 });
        if (width === 390) await page.getByRole('button', { name: 'Mở menu', exact: true }).click();
        const settings = page.getByRole('link', { name: 'Cài đặt', exact: true });
        await settings.scrollIntoViewIfNeeded();
        const box = await settings.boundingBox();
        assert(box && box.y >= 0 && box.y + box.height <= 480, 'Settings is clipped');
        await page.screenshot({ path: path.join(output, 'owner-menu-' + width + '.png') });
        await settings.click();
        await page.waitForURL('**/owner/settings');
        if (width === 390) await expect(page.getByRole('button', { name: 'Mở menu', exact: true })).toBeVisible();
      }
      await page.setViewportSize({ width: 1440, height: 844 });
      stage = 'counter booking loading/error/retry/empty, self-training independent';
      bookingMode = 'loading'; bookingsStarted = new Promise(resolve => { markBookings = resolve; });
      await page.getByRole('link', { name: 'Check-in', exact: true }).click();
      await page.getByLabel('Số điện thoại', { exact: true }).fill(person.phone);
      await page.getByRole('button', { name: 'Tra cứu', exact: true }).click();
      await waitSignal(bookingsStarted);
      await page.getByRole('radio', { name: /PT nội bộ/ }).click();
      const checkin = page.getByRole('button', { name: 'Xác nhận vào tập', exact: true });
      await expect(page.getByLabel('Đang tải', { exact: true }).first()).toBeVisible();
      await expect(checkin).toBeDisabled();
      bookingMode = 'error'; releaseBookings();
      await page.getByText('Không tải được booking kiểm thử.', { exact: true }).waitFor();
      await expect(checkin).toBeDisabled();
      await page.getByRole('radio', { name: /Tự tập/ }).click();
      await expect(checkin).toBeEnabled();
      await page.getByRole('radio', { name: /PT nội bộ/ }).click();
      bookingMode = 'empty';
      await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
      await page.getByText('Member chưa có booking PT nội bộ phù hợp. Tạo hoặc kiểm tra lịch trong mục Lịch tập trước khi xác nhận.', { exact: true }).waitFor();
      await expect(checkin).toBeDisabled();
      assert.equal(checkinWrites, 0);
      // Reopen the counter to trigger a fresh successful booking read.
      bookingMode = 'success';
      await page.getByRole('link', { name: 'Tổng quan', exact: true }).click();
      await page.getByRole('link', { name: 'Check-in', exact: true }).click();
      await page.getByLabel('Số điện thoại', { exact: true }).fill(person.phone);
      await page.getByRole('button', { name: 'Tra cứu', exact: true }).click();
      await page.getByRole('radio', { name: /PT nội bộ/ }).click();
      await expect(page.getByRole('radio', { name: /20\/10\/2026/ })).toBeVisible();
      await expect(checkin).toBeEnabled();
      await page.screenshot({ path: path.join(output, 'counter-recovered.png'), fullPage: true });
    } else {
      stage = role + ' retains read-only schedule';
      await page.getByRole('link', { name: 'Lịch', exact: true }).click();
      await page.getByText('Lịch do chủ phòng tập quản lý. Liên hệ chủ phòng tập khi cần thay đổi.', { exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Tạo booking', exact: true }).count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Hủy lịch', exact: true }).count(), 0);
    }
    await context.close();
    console.log(role + ' design-system checks passed');
  }
}
main().catch(async error => {
  console.error('Design-system regression failed at: ' + stage + '\n' + error.message);
  if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => undefined);
  process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close();
  server.close();
});
