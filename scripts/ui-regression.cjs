// Run after Expo web export with:
// pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"
// API responses and identities are synthetic; no database or saved credentials.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { randomBytes, randomInt } = require('node:crypto');
const { execFileSync } = require('node:child_process');
require('../apps/api/node_modules/ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS', moduleResolution: 'node' } });
const { conversionInput, memberCheckinInput } = require('../apps/api/src/common/input.ts');
const root = path.resolve(__dirname, '..');
const toolBin = process.env.PATH.split(path.delimiter).find(p => fs.existsSync(path.resolve(p, '../@playwright/test/package.json')));
if (!toolBin) throw new Error('Run through the documented pnpm dlx command.');
const { chromium } = createRequire(fs.realpathSync(path.resolve(toolBin, '../@playwright/test/package.json')))('playwright');
const build = path.join(root, 'apps/app/dist-sot-web');
const mime = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.wasm': 'application/wasm', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  // Reproduce Expo's root HTML response, which bypasses Metro's header middleware.
  if (new URL(req.url, 'http://localhost').pathname !== '/') {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  }
  const file = path.resolve(build, '.' + new URL(req.url, 'http://localhost').pathname);
  if (file !== build && !file.startsWith(build + path.sep)) { res.writeHead(403); return res.end(); }
  const selected = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(build, 'index.html');
  res.setHeader('Content-Type', mime[path.extname(selected)] ?? 'application/octet-stream');
  fs.createReadStream(selected).pipe(res);
});
let browser, activePage, stage = 'setup';
async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const frontend = process.env.UI_TEST_URL || 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const customer = { id: randomBytes(12).toString('hex'), fullName: 'Trial UI regression', phone: '09' + randomInt(10000000, 99999999), status: 'TRIAL', trial: { usedSessions: 0, status: 'ACTIVE' }, checkins: [] };
  for (const role of ['OWNER', 'MEMBER']) {
    const context = await browser.newContext({ timezoneId: 'Asia/Bangkok', viewport: role === 'OWNER' ? { width: 1440, height: 1000 } : { width: 390, height: 844 } });
    const page = await context.newPage();
    activePage = page;
    if (process.env.UI_DEBUG) {
      page.on('request', request => { if (/worker|sqlite|wasm/.test(request.url())) console.log('Worker asset: ' + new URL(request.url()).pathname); });
      page.on('pageerror', error => console.log('Page error: ' + error.name + ' ' + error.message));
      page.on('worker', worker => { worker.evaluate(() => ({ isolated: crossOriginIsolated, shared: typeof SharedArrayBuffer })).then(value => console.log('Worker environment: ' + JSON.stringify(value))).catch(() => console.log('Worker environment unavailable')); });
    }
    const id = randomBytes(12).toString('hex');
    const member = { id: randomBytes(12).toString('hex'), phone: '09' + randomInt(10000000, 99999999), role: 'MEMBER', status: 'ACTIVE', profile: { fullName: 'Member UI fixture' } };
    const otherMember = { ...member, id: randomBytes(12).toString('hex'), profile: { fullName: 'Member without package' } };
    const memberCustomer = { id: randomBytes(12).toString('hex'), fullName: 'Customer linked to member', phone: member.phone, status: 'MEMBER', memberUserId: member.id, checkins: [] };
    const ownedPackage = { id: randomBytes(12).toString('hex'), memberId: member.id, name: 'Owned membership fixture', mode: 'SESSION_BASED', startAt: '2026-10-01T00:00:00.000Z', effectiveStatus: 'ACTIVE', totalSessions: 30, usedSessions: 7, remainingSessions: 23, priceVnd: 2100000 };
    const pt = { ...member, id: randomBytes(12).toString('hex'), role: 'PT', profile: { fullName: 'PT UI fixture' } };
    const booking = { id: randomBytes(12).toString('hex'), memberId: member.id, ptId: pt.id, memberName: member.profile.fullName, ptName: pt.profile.fullName, startAt: '2026-10-10T00:00:00.000Z', endAt: '2026-10-10T01:00:00.000Z', status: 'SCHEDULED' };
    let bookingBody, packageBodyCaptured, releaseBooking, markBookingStarted, checkinCount = 0;
    const bookingStarted = new Promise(resolve => { markBookingStarted = resolve; });
    let releaseConversion, markConversionStarted, holdConversion = false;
    const conversionStarted = new Promise(resolve => { markConversionStarted = resolve; });
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (route.request().resourceType() === 'document' && url.searchParams.has('without-isolation')) {
        const response = await route.fetch();
        const headers = { ...response.headers() };
        delete headers['cross-origin-opener-policy']; delete headers['cross-origin-embedder-policy'];
        return route.fulfill({ response, headers });
      }
      if (url.pathname.startsWith('/api/')) {
        const request = route.request();
        assert(!/multipart|video\//i.test(request.headers()['content-type'] ?? ''), 'Unexpected media request');
        assert(!/"(video|base64|mediaUrl|video_uri)"\s*:/.test(request.postData() ?? ''), 'Unexpected raw-video payload');
        let body = [];
        if (url.pathname === '/api/members/me/workouts') body = { items: [], total: 0, page: 1, pageSize: 20 };
        else if (url.pathname === '/api/auth/login') body = { accessToken: randomBytes(32).toString('hex'), refreshToken: randomBytes(32).toString('hex'), user: { id, role } };
        else if (url.pathname === '/api/dashboard') body = { checkins: 0, trials: 1, alerts: 0, trialFinal: 0, membershipExpiring: 0, bookingsToday: 0, ptsToday: 0, bookings: [] };
        else if (url.pathname === '/api/customers/search') body = url.searchParams.get('phone') === member.phone ? [memberCustomer] : [customer, memberCustomer];
        else if (url.pathname === '/api/checkins/member') {
          checkinCount++;
          assert(memberCheckinInput.safeParse(request.postDataJSON()).success, 'Counter check-in violates real API contract');
          return route.fulfill({ status: 409, json: { message: 'Check-in UI fixture; không trừ lượt.' } });
        }
        else if (url.pathname === '/api/customers/' + customer.id) body = customer;
        else if (url.pathname === '/api/customers/' + memberCustomer.id) body = memberCustomer;
        else if (url.pathname === '/api/people') body = url.searchParams.get('role') === 'PT' ? [pt] : [member, otherMember];
        else if (url.pathname === '/api/members/' + member.id + '/memberships') {
          if (request.method() === 'POST') {
            packageBodyCaptured = request.postDataJSON();
            return route.fulfill({ status: 409, json: { message: 'Gói UI fixture; không ghi dữ liệu.' } });
          }
          body = [ownedPackage];
        }
        else if (url.pathname === '/api/bookings') {
          if (request.method() === 'POST') {
            bookingBody = request.postDataJSON(); markBookingStarted();
            await new Promise(resolve => { releaseBooking = resolve; });
            return route.fulfill({ status: 409, json: { message: 'Booking UI fixture; không ghi dữ liệu.' } });
          }
          body = [booking];
        }
        else if (url.pathname.endsWith('/convert-to-member')) {
          assert(conversionInput.safeParse(request.postDataJSON()).success, 'Conversion payload violates the real API contract');
          if (!holdConversion) return route.fulfill({ status: 409, json: { message: 'Phản hồi kiểm tra UI; không ghi dữ liệu.' } });
          markConversionStarted();
          await new Promise(resolve => { releaseConversion = resolve; });
          return route.fulfill({ status: 409, json: { message: 'Phản hồi kiểm tra UI; không ghi dữ liệu.' } });
        } else if (url.pathname === '/api/members/me/pt') body = null;
        else if (url.pathname === '/api/ai/form-analysis') {
          const metrics = request.postDataJSON();
          assert.equal(metrics.schemaVersion, '2.0'); assert.equal(metrics.exercise, 'SQUAT');
          assert(metrics.perRep.length > 0 && metrics.perRep.length <= 10);
          assert(!/landmarks|video|base64|memberId|motion/i.test(JSON.stringify(metrics)));
          body = { schemaVersion: '2.0', exercise: metrics.exercise, status: metrics.status, provider: 'OPENAI', feedback: ['Nhận xét AI kiểm thử từ chỉ số đo.'] };
        }
        return route.fulfill({ json: body });
      }
      if (!['blob:', 'data:'].includes(url.protocol) && url.origin !== frontend) return route.abort();
      return route.continue();
    });
    stage = role + ' login';
    await page.goto(frontend + '/');
    await page.waitForURL('**/login');
    assert(await page.evaluate(() => crossOriginIsolated), 'Root entry failed to load isolated login document');
    await page.getByLabel('Số điện thoại', { exact: true }).fill('09' + randomInt(10000000, 99999999));
    await page.getByLabel('Mật khẩu', { exact: true }).fill(randomBytes(16).toString('hex'));
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.waitForURL('**/' + role.toLowerCase());
    if (role === 'OWNER') {
      stage = 'conversion preserves identity across presets';
      await page.getByRole('link', { name: 'Khách hàng', exact: true }).click();
      const row = page.getByRole('button', { name: /Xem chi tiết Trial UI regression/ });
      await row.click();
      await page.getByRole('dialog').waitFor();
      assert.equal(await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).count(), 1, 'Customer detail is not a popup');
      const cccd = String(randomInt(100000, 999999)) + String(randomInt(100000, 999999));
      const password = randomBytes(16).toString('hex');
      await page.getByLabel('CCCD', { exact: true }).fill(cccd);
      await page.getByLabel('Mật khẩu cấp cho Member (ít nhất 10 ký tự)', { exact: true }).fill(password);
      stage = 'custom conversion payload satisfies real API schema';
      await page.getByLabel('Tên gói', { exact: true }).fill('Synthetic custom package');
      await page.getByLabel('Số lượt (chỉ gói số lượt)', { exact: true }).fill('15');
      const customResponse = page.waitForResponse(response => response.url().endsWith('/convert-to-member'));
      await page.getByRole('button', { name: 'Tạo Member và kích hoạt gói', exact: true }).click();
      await customResponse;
      await page.getByText('Phản hồi kiểm tra UI; không ghi dữ liệu.', { exact: true }).waitFor();
      for (const [name, price] of [[/Hội viên 15 buổi/, '1200000'], [/Hội viên 3 tháng/, '1800000']]) {
        await page.getByRole('radio', { name }).click();
        assert(await page.getByLabel('CCCD', { exact: true }).inputValue() === cccd, 'Identity field was reset');
        assert(await page.getByLabel('Mật khẩu cấp cho Member (ít nhất 10 ký tự)', { exact: true }).inputValue() === password, 'Credential field was reset');
        assert(await page.getByLabel('Giá gói (VNĐ, có thể sửa)', { exact: true }).inputValue() === price, 'New preset price not applied');
        const presetResponse = page.waitForResponse(response => response.url().endsWith('/convert-to-member'));
        await page.getByRole('button', { name: 'Tạo Member và kích hoạt gói', exact: true }).click();
        await presetResponse;
        await page.getByText('Phản hồi kiểm tra UI; không ghi dữ liệu.', { exact: true }).waitFor();
      }
      stage = 'conversion locks preset and form while submitting';
      holdConversion = true;
      await page.getByRole('button', { name: 'Tạo Member và kích hoạt gói', exact: true }).click();
      await Promise.race([conversionStarted, new Promise((_, reject) => setTimeout(() => reject(new Error('Conversion request missing')), 10000))]);
      assert(await page.getByRole('radio', { name: /Hội viên 15 buổi/ }).isDisabled(), 'Preset remains interactive during submit');
      assert(await page.getByLabel('CCCD', { exact: true }).getAttribute('readonly') !== null, 'Identity remains editable during submit');
      releaseConversion();
      await page.getByText('Phản hồi kiểm tra UI; không ghi dữ liệu.', { exact: true }).waitFor();
      assert(await page.getByRole('radio', { name: /Hội viên 15 buổi/ }).isEnabled(), 'Preset remains locked after failure');
      stage = 'customer profile displays linked member membership';
      await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
      await page.getByRole('button', { name: /Xem chi tiết Customer linked to member/ }).click();
      await page.getByText('Owned membership fixture', { exact: true }).waitFor();
      await page.getByText('Còn 23 / 30 lượt', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Xem chi tiết Owned membership fixture', exact: true }).click();
      await page.getByText('Giá ghi nhận: 2.100.000 ₫', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).last().click();
      await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
      stage = 'PT and Member navigation, selected member package and empty state';
      await page.getByRole('link', { name: 'PT & Member', exact: true }).click();
      await page.getByRole('radio', { name: /Hội viên/, exact: false }).click();
      await page.getByRole('button', { name: /Xem chi tiết Member UI fixture/ }).click();
      await page.getByText('Owned membership fixture', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
      await page.getByRole('button', { name: /Xem chi tiết Member without package/ }).click();
      await page.getByText('Member chưa có gói tập.', { exact: true }).waitFor();
      assert.equal(await page.getByText('Owned membership fixture', { exact: true }).count(), 0, 'Previous member package remained visible');
      await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
      stage = 'packages remove duplicate catalog and retain selection prices';
      await page.getByRole('link', { name: 'Gói tập', exact: true }).click();
      assert.equal(await page.getByText('6 gói hội viên mẫu', { exact: true }).count(), 0);
      await page.getByRole('radio', { name: /Member UI fixture/ }).click();
      await page.getByRole('button', { name: 'Thêm gói tập', exact: true }).click();
      await page.getByRole('radio', { name: /Hội viên 15 buổi/ }).waitFor();
      assert((await page.getByRole('radio', { name: /Hội viên 15 buổi/ }).innerText()).includes('1.200.000'));
      stage = 'time-based package uses dates without time fields';
      await page.getByRole('radio', { name: /Theo thời gian/, exact: false }).click();
      assert.equal(await page.getByLabel('Ngày bắt đầu', { exact: true }).getAttribute('type'), 'date');
      assert.equal(await page.getByLabel('Ngày kết thúc (gói thời gian)', { exact: true }).getAttribute('type'), 'date');
      await page.getByLabel('Ngày bắt đầu', { exact: true }).fill('2026-10-10');
      await page.getByLabel('Ngày kết thúc (gói thời gian)', { exact: true }).fill('2027-01-10');
      await page.getByRole('radio', { name: /Hội viên 3 tháng/ }).click();
      assert.equal(await page.getByLabel('Ngày bắt đầu', { exact: true }).getAttribute('type'), 'date');
      await page.getByLabel('Ngày bắt đầu', { exact: true }).fill('2026-10-10');
      await page.getByRole('button', { name: 'Kích hoạt gói', exact: true }).click();
      await page.getByText('Gói UI fixture; không ghi dữ liệu.', { exact: true }).waitFor();
      assert.equal(packageBodyCaptured.mode, 'TIME_BASED');
      assert.equal(packageBodyCaptured.startAt, '2026-10-09T17:00:00.000Z');
      assert.equal(packageBodyCaptured.endAt, '2027-01-09T17:00:00.000Z');
      await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
      stage = 'booking datetime controls, local timezone conversion and pending lock';
      await page.getByRole('link', { name: 'Lịch tập', exact: true }).click();
      await page.getByRole('button', { name: 'Tạo lịch tập', exact: true }).click();
      const start = page.getByLabel('Ngày giờ bắt đầu', { exact: true });
      const end = page.getByLabel('Ngày giờ kết thúc', { exact: true });
      assert.equal(await start.getAttribute('type'), 'datetime-local');
      assert.equal(await end.getAttribute('type'), 'datetime-local');
      await page.getByRole('radio', { name: /Member UI fixture/ }).click();
      await page.getByRole('radio', { name: /PT UI fixture/ }).click();
      await start.fill('2026-10-10T10:15'); await end.fill('2026-10-10T11:15');
      await start.focus(); await start.press('2');
      assert.equal(await start.inputValue(), '2026-10-10T10:15', 'Manual typing changed datetime');
      await page.getByRole('button', { name: 'Tạo booking', exact: true }).click();
      await Promise.race([bookingStarted, new Promise((_, reject) => setTimeout(() => reject(new Error('Booking request missing')), 10000))]);
      assert.equal(bookingBody.startAt, '2026-10-10T03:15:00.000Z');
      assert.equal(bookingBody.endAt, '2026-10-10T04:15:00.000Z');
      assert(await start.isDisabled() && await end.isDisabled(), 'Date controls remain enabled during submit');
      releaseBooking();
      await page.getByText('Booking UI fixture; không ghi dữ liệu.', { exact: true }).waitFor();
      assert(await start.isEnabled());
      await page.getByRole('button', { name: 'Đóng biểu mẫu', exact: true }).click();
      await page.getByTestId('booking-row').click();
      await page.getByRole('button', { name: 'Sửa lịch', exact: true }).click();
      assert.equal(await start.inputValue(), '2026-10-10T07:00');
      assert.equal(await end.inputValue(), '2026-10-10T08:00');
      await page.getByLabel('Lý do chỉnh sửa', { exact: true }).waitFor();
      await page.screenshot({ path: path.join(root, '.local/booking-datetime.png'), fullPage: true });
      await page.getByRole('button', { name: 'Đóng biểu mẫu', exact: true }).click();
      await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
      stage = 'counter missing choices are rejected locally and selected package satisfies API';
      await page.getByRole('link', { name: 'Check-in', exact: true }).click();
      await page.getByLabel('Số điện thoại', { exact: true }).fill(member.phone);
      await page.getByRole('button', { name: 'Tra cứu', exact: true }).click();
      await page.getByRole('radio', { name: /Owned membership fixture/ }).waitFor();
      await page.getByRole('button', { name: 'Xác nhận vào tập', exact: true }).click();
      await page.getByText('Chọn gói tập đang hoạt động trước khi xác nhận vào tập.', { exact: true }).waitFor();
      assert.equal(checkinCount, 0, 'Missing package submitted to API');
      await page.getByRole('radio', { name: /Owned membership fixture/ }).click();
      await page.getByRole('button', { name: 'Xác nhận vào tập', exact: true }).click();
      await page.getByText('Check-in UI fixture; không trừ lượt.', { exact: true }).waitFor();
      assert.equal(checkinCount, 1);
      await page.getByRole('radio', { name: /PT nội bộ/ }).click();
      await page.getByRole('radio', { name: /Owned membership fixture/ }).click();
      await page.getByRole('button', { name: 'Xác nhận vào tập', exact: true }).click();
      await page.getByText('Chọn booking của Member khi tập với PT nội bộ.', { exact: true }).waitFor();
      assert.equal(checkinCount, 1, 'Missing booking submitted to API');
    } else {
      stage = 'Member Home activity and navigation touch targets';
      await page.getByRole('button', { name: 'Nhật ký', exact: true }).waitFor();
      for (const name of ['Mở mã QR check-in →', 'Xem lịch tập', 'Kiểm tra form →']) assert.equal(await page.getByRole('link', { name, exact: true }).count(), 0, 'Duplicate Home shortcut remains');
      for (const name of ['Trang chủ', 'Lịch', 'Check-in', 'AI', 'Tài khoản']) {
        const link = page.getByRole('link', { name, exact: true });
        const box = await link.boundingBox();
        assert(box && box.height >= 48, 'Navigation touch target is too small');
        await link.focus();
        assert(await link.evaluate(el => document.activeElement === el), 'Navigation keyboard focus failed');
      }
      stage = 'AI imports local video and deletion locks competing controls';
      await page.getByRole('link', { name: 'Lịch', exact: true }).click();
      await page.getByTestId('booking-row').click();
      assert.equal(await page.getByRole('button', { name: 'Sửa lịch', exact: true }).count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Hủy lịch', exact: true }).count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Tạo booking', exact: true }).count(), 0);
      await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
      assert.equal(await page.getByRole('button', { name: 'Sửa lịch', exact: true }).count(), 0);
      await page.getByRole('link', { name: 'AI', exact: true }).click();
      assert.equal(await page.getByText('1. Chọn bài', { exact: true }).count(), 0, 'Exercise selection remains in auto flow');
      const fixture = path.join(root, '.local/blank-ui-regression.webm');
      fs.mkdirSync(path.dirname(fixture), { recursive: true });
      execFileSync(path.join(root, 'services/ai/.venv/Scripts/python.exe'), [path.join(root, 'scripts/blank-video.py'), fixture], { stdio: 'pipe' });
      await page.evaluate(() => {
        const original = FileSystemFileHandle.prototype.createWritable;
        FileSystemFileHandle.prototype.createWritable = async function (...args) {
          await new Promise(resolve => { window.releaseUiImport = resolve; });
          return original.apply(this, args);
        };
      });
      const chooser = page.waitForEvent('filechooser');
      stage = 'AI file chooser';
      await page.getByRole('button', { name: 'Chọn video local', exact: true }).click();
      await (await chooser).setFiles(fixture);
      stage = 'AI local file save progress';
      await page.waitForFunction(() => typeof window.releaseUiImport === 'function');
      await page.getByText('Đang lưu video trên thiết bị…', { exact: true }).waitFor();
      assert(await page.getByRole('button', { name: 'Chọn video local', exact: true }).isDisabled(), 'Import is not locked while saving');
      await page.evaluate(() => window.releaseUiImport());
      stage = 'AI SQLite session save';
      const analyze = page.getByRole('button', { name: 'Phân tích trên thiết bị', exact: true });
      await analyze.waitFor();
      await page.getByText('Video đã lưu trên thiết bị. Bấm “Phân tích trên thiết bị” bên dưới để nhận kết quả.', { exact: true }).waitFor();
      stage = 'AI on-device pose produces explicit feedback';
      await analyze.click();
      await page.getByText('Chưa nhận diện đủ tư thế. Quay toàn thân, đủ sáng, góc ngang bên hông.', { exact: true }).waitFor({ timeout: 120000 });
      stage = 'AI detailed angle comparison with synthetic pose samples';
      await page.getByLabel('Mục tiêu độ nghiêng thân tối đa', { exact: true }).fill('40');
      // Isolated algorithm/UI fixture after the real MediaPipe failure check; no human-video accuracy claim.
      await page.evaluate(() => {
        window.fitnessVision.PoseLandmarker.createFromOptions = async () => ({
          close() {},
          detectForVideo(canvas, timeMs) {
            const sequence = [170, 170, 150, 130, 110, 90, 80, 90, 110, 130, 150, 170, 170];
            const angle = sequence[Math.round(timeMs / 100) - 1] ?? 170;
            const radians = angle * Math.PI / 180;
            const pose = Array.from({ length: 33 }, () => ({ x: 0, y: 0, visibility: 0 }));
            for (const offset of [0, 1]) {
              pose[11 + offset] = { x: 0.5, y: 0.2, visibility: 1 };
              pose[13 + offset] = { x: 0.6, y: 0.2, visibility: 1 };
              pose[15 + offset] = { x: 0.7, y: 0.2, visibility: 1 };
              pose[23 + offset] = { x: 0.5, y: 0.4, visibility: 1 };
              pose[25 + offset] = { x: 0.5, y: 0.6, visibility: 1 };
              pose[27 + offset] = { x: 0.5 + Math.sin(radians) * 0.2 * canvas.height / canvas.width, y: 0.6 - Math.cos(radians) * 0.2, visibility: 1 };
            }
            return { landmarks: [pose] };
          },
        });
      });
      await analyze.click();
      await page.getByText('Nhận xét AI kiểm thử từ chỉ số đo.', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Xem góc và so sánh từng lần', exact: true }).click();
      await page.getByRole('button', { name: /^Xem chi tiết Lần 1 ·/ }).click();
      await page.getByText('Gối trái: 80°', { exact: true }).waitFor();
      await page.getByText('Khuỷu tay trái: 180°', { exact: true }).waitFor();
      await page.getByText('Độ nghiêng thân: 0°', { exact: true }).waitFor();
      await page.getByText('Tham chiếu: Mục tiêu bạn nhập: ≤40° so với phương thẳng đứng', { exact: true }).waitFor();
      await page.screenshot({ path: path.join(root, '.local/ai-angle-comparison.png'), fullPage: true });
      await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).last().click();
      await page.getByRole('button', { name: 'Ẩn so sánh từng lần', exact: true }).click();
      stage = 'AI delete cancellation and pending';
      const remove = page.getByRole('button', { name: 'Xóa phiên và video local', exact: true });
      page.once('dialog', dialog => dialog.dismiss());
      await remove.click();
      await page.waitForFunction(() => !document.querySelector('[role="button"][aria-disabled="true"]'));
      assert(await analyze.isEnabled(), 'Cancellation leaves analysis locked');
      await page.evaluate(() => {
        const original = FileSystemDirectoryHandle.prototype.removeEntry;
        FileSystemDirectoryHandle.prototype.removeEntry = async function (...args) {
          await new Promise(resolve => { window.releaseUiDelete = resolve; });
          return original.apply(this, args);
        };
      });
      page.once('dialog', dialog => dialog.accept());
      await remove.click();
      await page.waitForFunction(() => typeof window.releaseUiDelete === 'function');
      assert(await remove.isDisabled(), 'Deletion button remains enabled');
      assert(await analyze.isDisabled(), 'Analysis remains enabled during deletion');
      assert(await page.getByRole('button', { name: 'Chọn video local', exact: true }).isDisabled(), 'Import remains enabled during deletion');
      await page.evaluate(() => window.releaseUiDelete());
      await page.getByText('Chưa có phiên phân tích. Chọn hoặc quay video để bắt đầu.', { exact: true }).waitFor();
      assert(await page.getByRole('button', { name: 'Chọn video local', exact: true }).isEnabled(), 'Deletion leaves import locked');
      stage = 'AI missing isolation reports error and never locks file selection';
      await page.goto(frontend + '/login?without-isolation=1');
      assert(!await page.evaluate(() => crossOriginIsolated), 'Missing-header fixture is isolated');
      await page.getByLabel('Số điện thoại', { exact: true }).fill('09' + randomInt(10000000, 99999999));
      await page.getByLabel('Mật khẩu', { exact: true }).fill(randomBytes(16).toString('hex'));
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      await page.waitForURL('**/member');
      await page.getByRole('link', { name: 'AI', exact: true }).click();
      await page.getByText('Bộ nhớ AI trên web chưa sẵn sàng. Mở trực tiếp trang đăng nhập và đăng nhập lại. Nếu vẫn lỗi, liên hệ chủ phòng tập.', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Chọn video local', exact: true }).click();
      await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'));
      assert(await page.getByRole('button', { name: 'Chọn video local', exact: true }).isEnabled(), 'Unsupported environment leaves import locked');
    }
    await context.close();
  }
  console.log('UI regression passed: packages without duplicate catalog, booking datetime/prefill/timezone/pending and Member read-only, root isolation recovery, conversion/picker/shortcuts, AI local import, real MediaPipe pose-failure, synthetic detailed angle comparisons, delete/cancel/pending and missing-header error. API mocked; no business integration or human-video accuracy claim.');
}
main().catch(async error => { console.error('UI regression failed at ' + stage + ': ' + error.name); if (error.name === 'AssertionError' || error.name === 'Error') console.error(error.message.split('\n')[0]); if (activePage && !activePage.isClosed()) console.error(JSON.stringify(await activePage.evaluate(() => ({ isolation: crossOriginIsolated, feedback: [...document.querySelectorAll('[aria-live="polite"]')].map(el => el.textContent), workers: performance.getEntriesByType('resource').map(item => item.name).filter(name => /worker|sqlite|wasm/.test(name)).map(name => new URL(name).pathname) })).catch(() => ({})))); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
});
