// After web export: pnpm --package=@playwright/test dlx -c "node scripts/crm-regression.cjs"
// API responses are synthetic. No real account, business DB, identity document or media.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { randomBytes } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const bin = process.env.PATH.split(path.delimiter).find(p => fs.existsSync(path.resolve(p, '../@playwright/test/package.json')));
if (!bin) throw new Error('Run through the documented pnpm dlx command.');
const testRequire = createRequire(fs.realpathSync(path.resolve(bin, '../@playwright/test/package.json')));
const { chromium } = testRequire('playwright'), { expect } = testRequire('@playwright/test');
const build = path.join(root, 'apps/app/dist-sot-web'), output = path.join(root, '.local/crm-fixes');
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin'); res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  const file = path.resolve(build, '.' + new URL(req.url, 'http://localhost').pathname);
  if (file !== build && !file.startsWith(build + path.sep)) { res.writeHead(403); return res.end(); }
  const chosen = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(build, 'index.html');
  res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.html': 'text/html', '.wasm': 'application/wasm', '.png': 'image/png' })[path.extname(chosen)] ?? 'application/octet-stream');
  fs.createReadStream(chosen).pipe(res);
});
const cid = '111111111111111111111111', mid = '222222222222222222222222';
const otherCid = '333333333333333333333333', otherMid = '444444444444444444444444', trialId = '555555555555555555555555';
const makeId = n => n.toString(16).padStart(24, '0');
const checkins = Array.from({ length: 121 }, (_, n) => ({ id: makeId(n + 500), checkedInAt: new Date(Date.UTC(2026, 9, 20 - n)).toISOString(), context: 'SELF_TRAINING' }));
const customer = { id: cid, memberUserId: mid, fullName: 'CRM Member fixture', phone: 'synthetic-contact', status: 'MEMBER', member: { id: mid, status: 'LOCKED', profile: { fullName: 'Official CRM Member fixture', cccd: 'Synthetic identity' } }, checkins: checkins.slice(0, 100) };
const other = { ...customer, id: otherCid, memberUserId: otherMid, fullName: 'Other CRM Member fixture', member: { id: otherMid, status: 'INACTIVE', profile: { fullName: 'Other official fixture', cccd: null } }, checkins: [] };
const trial = { id: trialId, fullName: 'CRM Trial fixture', phone: 'synthetic-trial', status: 'TRIAL', member: null, trial: { totalSessions: 3, usedSessions: 0, status: 'ACTIVE' }, checkins: [] };
const bookingRows = Array.from({ length: 31 }, (_, n) => ({ id: makeId(n + 100), memberId: mid, ptId: makeId(9), ptName: 'PT fixture', status: 'SCHEDULED', startAt: new Date(Date.UTC(2026, 9, 20 - n, 1)).toISOString(), endAt: new Date(Date.UTC(2026, 9, 20 - n, 2)).toISOString() }));
const alerts = [
  ...Array.from({ length: 35 }, (_, n) => ({ id: makeId(n + 900), type: 'TRIAL_FINAL', status: 'CLOSED_NOT_CONTINUING', customerName: 'Closed CRM fixture', customerId: cid, triggeredAt: '2026-10-20T00:00:00Z' })),
  ...Array.from({ length: 31 }, (_, n) => ({ id: makeId(n + 1000), type: 'MEMBERSHIP_EXPIRING_SESSION', status: 'OPEN', customerName: 'Open CRM fixture', customerId: cid, triggeredAt: '2020-01-01T00:00:00Z' })),
];
let browser, page, stage = 'setup';
async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Asia/Bangkok' });
  page = await context.newPage();
  let failCheckins = false;
  const seen = [];
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname.startsWith('/api/')) {
      let body = [];
      const number = Number(url.searchParams.get('page') ?? 1), slice = rows => rows.slice((number - 1) * 30, number * 30);
      if (url.pathname === '/api/auth/login') body = { accessToken: randomBytes(32).toString('hex'), refreshToken: randomBytes(32).toString('hex'), user: { id: mid, role: 'OWNER' } };
      else if (url.pathname === '/api/dashboard') body = { checkins: 0, trials: 0, alerts: 31, trialFinal: 0, membershipExpiring: 31, bookingsToday: 0, ptsToday: 0, bookings: [] };
      else if (url.pathname === '/api/customers/search') body = [customer, other, trial];
      else if (url.pathname === '/api/customers/' + cid) body = customer;
      else if (url.pathname === '/api/customers/' + otherCid) body = other;
      else if (url.pathname === '/api/customers/' + trialId) body = trial;
      else if (url.pathname.endsWith('/checkins') && url.pathname.startsWith('/api/customers/')) {
        seen.push({ type: 'checkins', number });
        if (failCheckins) return route.fulfill({ status: 503, json: { message: 'Không tải được check-in fixture.' } });
        body = url.pathname.includes(cid) ? slice(checkins) : [];
      }
      else if (url.pathname === '/api/bookings') {
        assert(url.searchParams.has('memberId'), 'CRM booking read must stay Member-scoped');
        seen.push({ type: 'booking', number, member: url.searchParams.get('memberId') });
        body = url.searchParams.get('memberId') === mid ? slice(bookingRows) : [];
      }
      else if (url.pathname === '/api/sales-alerts') {
        const status = url.searchParams.get('status') ?? 'OPEN'; seen.push({ type: 'alerts', number, status });
        body = slice(alerts.filter(row => status === 'ALL' || row.status === status));
      }
      if (request.method() !== 'GET' && url.pathname !== '/api/auth/login') return route.fulfill({ status: 409, json: { message: 'Fixture only; no mutation.' } });
      return route.fulfill({ json: body });
    }
    if (url.origin !== origin) return route.abort();
    return route.continue();
  });
  await page.goto(origin + '/login');
  await page.getByLabel('Số điện thoại', { exact: true }).fill('0900000000');
  await page.getByLabel('Mật khẩu', { exact: true }).fill(randomBytes(16).toString('hex'));
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.waitForURL('**/owner');
  await page.getByRole('link', { name: 'Khách hàng', exact: true }).click();
  await page.getByRole('button', { name: /^Xem chi tiết CRM Member fixture/ }).click();
  stage = 'official profile';
  await page.getByText('Trạng thái tài khoản: Đã khóa', { exact: true }).waitFor();
  assert((await page.getByText(/^CCCD:/).innerText()).endsWith('Synthetic identity'));
  await page.screenshot({ path: path.join(output, 'official-profile.png') });
  stage = '31 bookings with independent pagination';
  await page.getByRole('radio', { name: /Booking/ }).click();
  const bookings = page.getByTestId('customer-bookings');
  await expect(bookings.getByText('Đã lên lịch', { exact: true })).toHaveCount(30);
  await bookings.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(bookings.getByText('Đã lên lịch', { exact: true })).toHaveCount(1);
  await expect(bookings.getByRole('button', { name: 'Trang sau', exact: true })).toBeDisabled();
  stage = '121 check-ins, retry and independent page';
  await page.getByRole('radio', { name: /Check-in/ }).click();
  const logs = page.getByTestId('customer-checkins');
  await expect(logs.getByText('Tự tập', { exact: true })).toHaveCount(30);
  failCheckins = true;
  await logs.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await logs.getByText('Không tải được check-in fixture.', { exact: true }).waitFor();
  failCheckins = false;
  await logs.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(logs.getByText('Tự tập', { exact: true })).toHaveCount(30);
  for (let number = 3; number <= 5; number++) {
    await logs.getByRole('button', { name: 'Trang sau', exact: true }).click();
    await expect(logs.getByText('Trang ' + number, { exact: true })).toBeVisible();
    await expect(logs.getByText('Tự tập', { exact: true })).toHaveCount(number === 5 ? 1 : 30);
  }
  await expect(logs.getByRole('button', { name: 'Trang sau', exact: true })).toBeDisabled();
  await page.getByRole('radio', { name: /Booking/ }).click();
  await expect(bookings.getByText('Trang 2', { exact: true })).toBeVisible();
  stage = 'switching customer resets data and pages';
  await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
  await page.getByRole('button', { name: /Xem chi tiết Other CRM Member fixture/ }).click();
  await page.getByText('Trạng thái tài khoản: Ngừng hoạt động', { exact: true }).waitFor();
  await page.getByRole('radio', { name: /Booking/ }).click();
  await expect(bookings.getByText('Trang 1', { exact: true })).toBeVisible();
  await expect(bookings.getByText('Đã lên lịch', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
  await page.getByRole('button', { name: /Xem chi tiết CRM Trial fixture/ }).click();
  await page.getByText('Họ tên: CRM Trial fixture', { exact: true }).waitFor();
  assert.equal(await page.getByText('Thông tin Member chính thức', { exact: true }).count(), 0);
  await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
  stage = 'Sales default OPEN, closed/all filters and reset to page 1';
  await page.getByRole('link', { name: 'Sales / Cảnh báo', exact: true }).click();
  await expect(page.getByText('Open CRM fixture', { exact: true })).toHaveCount(30);
  assert.equal(await page.getByText('Closed CRM fixture', { exact: true }).count(), 0);
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page.getByText('Open CRM fixture', { exact: true })).toHaveCount(1);
  const filters = page.getByText('Lọc trạng thái', { exact: true }).locator('..');
  await filters.getByRole('radio', { name: /Không tiếp tục/ }).click();
  await expect(page.getByText('Trang 1', { exact: true })).toBeVisible();
  await expect(page.getByText('Closed CRM fixture', { exact: true })).toHaveCount(30);
  await expect(page.getByRole('button', { name: 'Trang trước', exact: true })).toBeDisabled();
  await filters.getByRole('radio', { name: /Đã liên hệ/ }).click();
  await page.getByText('Không có cảnh báo ở trạng thái đã chọn. Chọn trạng thái khác để xem lịch sử chăm sóc.', { exact: true }).waitFor();
  await filters.getByRole('radio', { name: /Tất cả/ }).click();
  await expect(page.getByText('Closed CRM fixture', { exact: true })).toHaveCount(30);
  assert(seen.some(row => row.type === 'booking' && row.number === 2 && row.member === mid));
  assert(seen.some(row => row.type === 'checkins' && row.number === 5));
  assert(seen.some(row => row.type === 'alerts' && row.number === 1 && row.status === 'CLOSED_NOT_CONTINUING'));
  await page.screenshot({ path: path.join(output, 'sales-filters.png') });
  console.log('CRM browser regression passed: official Owner profile, 31 bookings/121 check-ins, retry, independent/reset pagination, Trial scope and OPEN/closed/ALL Sales filters. API mocked.');
  await context.close();
}
main().catch(async error => {
  console.error('CRM regression failed at ' + stage + ': ' + error.message);
  if (page && !page.isClosed()) await page.screenshot({ path: path.join(output, 'failure.png') }).catch(() => undefined);
  process.exitCode = 1;
}).finally(async () => { if (browser) await browser.close(); server.close(); });
