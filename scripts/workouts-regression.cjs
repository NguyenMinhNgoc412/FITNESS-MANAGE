// After web export: pnpm --package=@playwright/test dlx -c "node scripts/workouts-regression.cjs"
// Synthetic API only. No production account, DB, media, or third-party requests.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { randomBytes, randomUUID } = require('node:crypto');
const bin = process.env.PATH.split(path.delimiter).find(p => fs.existsSync(path.resolve(p, '../@playwright/test/package.json')));
if (!bin) throw Error('Use the pnpm dlx command above.');
const req = createRequire(fs.realpathSync(path.resolve(bin, '../@playwright/test/package.json')));
const { chromium } = req('playwright'), { expect } = req('@playwright/test');
const root = path.resolve(__dirname, '..'), build = path.join(root, 'apps/app/dist-sot-web'), out = path.join(root, '.local/workouts');
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((request, response) => {
  const file = path.resolve(build, '.' + new URL(request.url, 'http://localhost').pathname);
  if (!file.startsWith(build + path.sep) && file !== build) { response.writeHead(403); return response.end(); }
  const chosen = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(build, 'index.html');
  response.setHeader('Content-Type', ({ '.js': 'text/javascript', '.html': 'text/html', '.png': 'image/png', '.json': 'application/json', '.wasm': 'application/wasm' })[path.extname(chosen)] || 'application/octet-stream');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin'); response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  fs.createReadStream(chosen).pipe(response);
});
let browser, page, stage = 'setup';
async function main() {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Bangkok' });
  page = await context.newPage();
  const pageErrors = []; page.on('pageerror', e => pageErrors.push(e.message));
  let acceptDialog = true, dialogs = 0;
  page.on('dialog', dialog => { dialogs++; void (acceptDialog ? dialog.accept() : dialog.dismiss()); });
  const memberId = 'a'.repeat(24), workoutId = 'b'.repeat(24), measurementId = 'c'.repeat(24), catalogId = 'd'.repeat(24);
  const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
  const workouts = [], measurements = [], revisions = new Map(), commands = new Map();
  const guide = { id: catalogId, code: 'bodyweight-squat', contentVersion: 1, nameVi: 'Squat không tạ', nameEn: 'Bodyweight squat', primaryMuscleGroup: 'QUADRICEPS', secondaryMuscleGroups: ['GLUTES'], equipmentCodes: ['NONE'], description: 'Hướng dẫn tham khảo kiểm thử.', steps: ['Đứng vững.', 'Hạ thân có kiểm soát.', 'Đứng lên.'], techniqueNotes: ['Không tạo giáo án.'], sourceUrls: ['https://www.acefitness.org/resources/everyone/exercise-library/135/bodyweight-squat/'] };
  let firstCreate = true, held = false, release, startedResolve, conflictNext = false, failNextDetail = false;
  let started = new Promise(r => { startedResolve = r; });
  const createKeys = [], forbiddenWrites = [], servicesRead = [];
  const membership = { id: 'e'.repeat(24), name: 'Gói thử 15 buổi', mode: 'SESSION_BASED', status: 'ACTIVE', effectiveStatus: 'ACTIVE', remainingSessions: 12, totalSessions: 15, usedSessions: 3, startAt: new Date().toISOString() };
  const envelope = (items, p = 1) => ({ items: items.slice((p - 1) * 20, p * 20), total: items.length, page: p, pageSize: 20 });
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url()), p = url.pathname.replace(/^\/api/, ''), method = request.method();
    if (url.pathname.startsWith('/api/')) {
      let data = [], status = 200;
      const body = request.postDataJSON();
      if (method !== 'GET' && !['/auth/login', '/auth/logout'].includes(p) && !p.startsWith('/members/me/workouts') && !p.startsWith('/members/me/body-measurements')) forbiddenWrites.push(p);
      if (p === '/auth/login') data = { accessToken: randomBytes(32).toString('hex'), refreshToken: randomBytes(32).toString('hex'), user: { id: memberId, role: 'MEMBER' } };
      else if (p === '/auth/me') data = { id: memberId, role: 'MEMBER', status: 'ACTIVE', profile: { fullName: 'Generated member' } };
      else if (p === '/members/me/pt') { servicesRead.push(p); data = { pt: { profile: { fullName: 'PT mẫu' } } }; }
      else if (p.endsWith('/memberships')) { servicesRead.push(p); data = [membership]; }
      else if (p === '/members/me/external-pt-passes') { servicesRead.push(p); data = [{ id: 'f'.repeat(24), status: 'ACTIVE', totalUses: 5, usedUses: 1 }]; }
      else if (p === '/external-pt/requests') { servicesRead.push(p); data = []; }
      else if (p === '/members/me/workouts' && method === 'GET') data = envelope(workouts.filter(w => !url.searchParams.get('status') || url.searchParams.get('status') === 'ALL' || w.status === url.searchParams.get('status')));
      else if (p === '/members/me/workouts' && method === 'POST') {
        const key = request.headers()['idempotency-key']; createKeys.push(key);
        startedResolve(); held = true; await new Promise(r => { release = r; }); held = false;
        if (!commands.has(key)) {
          const w = { ...body, id: workoutId, version: 1, status: 'DRAFT' }; workouts.push(w); commands.set(key, w);
          revisions.set(workoutId, [{ id: randomUUID(), version: 1, action: 'CREATE', recordedAt: new Date().toISOString(), snapshot: structuredClone(w) }]);
        }
        if (firstCreate) { firstCreate = false; status = 503; data = { message: 'Mất phản hồi giả lập. Thử lưu lại.' }; } else { data = commands.get(key); status = 201; }
      } else if (p === '/members/me/workout-progress') {
        const completed = workouts.filter(w => w.status === 'COMPLETED');
        data = { totalSessions: completed.length, metric: 'Buổi đã ghi nhật ký', buckets: [{ date: today, count: completed.length }], series: completed.map(w => ({ groupKey: 'custom:squat', label: w.exercises[0].displayName, points: [{ date: today, reps: 10, maxWeightKg: null }] })) };
      } else if (p.startsWith('/members/me/workouts/' + workoutId)) {
        const w = workouts[0];
        if (p.endsWith('/revisions')) data = envelope(revisions.get(workoutId));
        else if (method === 'GET' && failNextDetail) { failNextDetail = false; status = 503; data = { message: 'Không tải được nhật ký. Thử lại.' }; }
        else if (method === 'GET') data = w;
        else if (method === 'PATCH' && conflictNext) { conflictNext = false; status = 409; data = { message: 'Bản ghi đã thay đổi. Tải bản mới để đối chiếu.' }; }
        else {
          assert.equal(body.expectedVersion, w.version);
          if (method === 'PATCH') Object.assign(w, body.input);
          else w.status = p.endsWith('/complete') ? 'COMPLETED' : 'ARCHIVED';
          w.version++; data = w;
          revisions.get(workoutId).unshift({ id: randomUUID(), version: w.version, action: 'UPDATE', recordedAt: new Date().toISOString(), snapshot: structuredClone(w) });
        }
      } else if (p === '/members/me/body-measurements' && method === 'GET') data = envelope(measurements.filter(m => (!url.searchParams.get('from') || m.measurementDate >= url.searchParams.get('from')) && (!url.searchParams.get('to') || m.measurementDate <= url.searchParams.get('to'))));
      else if (p === '/members/me/body-measurements' && method === 'POST') { const m = { ...body, id: measurementId, status: 'ACTIVE', version: 1 }; measurements.push(m); data = m; status = 201; revisions.set(measurementId, []); }
      else if (p.startsWith('/members/me/body-measurements/' + measurementId)) {
        const m = measurements[0];
        if (p.endsWith('/revisions')) data = envelope(revisions.get(measurementId));
        else if (method === 'PATCH') { assert.equal(body.weightKg, 70); assert.equal(body.heightCm, 170); Object.assign(m, body); m.version++; data = m; }
        else data = m;
      } else if (p === '/members/me/body-measurement-progress') {
        const series = (field, unit) => { const points = measurements.filter(m => m[field] !== null).map(m => ({ date: m.measurementDate, value: m[field] })); return { unit, points, latest: points.at(-1) ?? null, comparison: null }; };
        data = { weight: series('weightKg', 'kg'), height: series('heightCm', 'cm') };
      } else if (p === '/exercise-library') data = envelope([{ id: catalogId, nameVi: guide.nameVi, muscleGroups: ['QUADRICEPS', 'GLUTES'], equipmentCodes: ['NONE'], currentPublishedVersion: 1 }]);
      else if (p === '/exercise-library/' + catalogId) data = guide;
      return route.fulfill({ status, json: data, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
    }
    if (url.origin !== origin) return route.abort();
    return route.continue();
  });
  const click = name => page.getByRole('button', { name, exact: true }).click();
  stage = 'login/home shortcut';
  await page.goto(origin); await page.getByLabel('Số điện thoại', { exact: true }).fill('0900000000'); await page.getByLabel('Mật khẩu', { exact: true }).fill(randomBytes(16).toString('hex')); await click('Đăng nhập');
  await page.getByText('Hoạt động tập luyện', { exact: true }).first().waitFor();
  await expect(page.getByRole('link', { name: 'Mở hoạt động tập luyện →', exact: true })).toHaveCount(0);
  await expect(page.getByText('PT chính', { exact: true })).toHaveCount(0);
  assert.equal(servicesRead.length, 0, 'Home fetched account-only services');
  await page.getByRole('link', { name: 'Tài khoản', exact: true }).click();
  await expect(page.getByText('Gói sở hữu', { exact: true })).toBeVisible();
  await expect(page.getByText('PT mẫu', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xem chi tiết Gói thử 15 buổi', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: /Gia hạn|Hủy gói|Kích hoạt gói/ })).toHaveCount(0);
  await click('Đóng chi tiết');
  await expect(page.getByText('Còn 4 / 5 lượt', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Trang chủ', exact: true }).click();
  stage = 'clean workout sections return Home without reloading or losing session';
  const navigationDocuments = [];
  page.on('request', request => { if (request.resourceType() === 'document') navigationDocuments.push(new URL(request.url()).pathname); });
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const label of ['Nhật ký', 'Tiến bộ', 'Số đo cơ thể', 'Bài tập mẫu']) {
      await click(label);
      await page.getByRole('link', { name: 'Trang chủ', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Nhật ký', exact: true })).toBeVisible();
      assert.equal(new URL(page.url()).pathname, '/member');
      assert.deepEqual(navigationDocuments, [], 'Member navigation reloaded the document and lost the in-memory session');
    }
  }
  await click('Nhật ký');
  await click('Tạo buổi tập');
  await click('Đóng chi tiết');
  await page.getByRole('link', { name: 'Trang chủ', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Nhật ký', exact: true })).toBeVisible();
  assert.deepEqual(navigationDocuments, [], 'Clean editor navigation reloaded the document');
  stage = 'design system labels, selected state and responsive controls';
  const sections = ['Nhật ký', 'Tiến bộ', 'Số đo cơ thể', 'Bài tập mẫu'];
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByText('Từ ngày', { exact: true })).toBeHidden();
    await click('Mở bộ lọc');
    await expect(page.getByText('Từ ngày', { exact: true })).toBeVisible();
    await expect(page.getByText('Đến ngày', { exact: true })).toBeVisible();
    for (const label of sections) {
      const button = page.getByRole('button', { name: label, exact: true });
      await expect(button).toHaveAttribute('aria-pressed', String(label === 'Nhật ký'));
      const box = await button.boundingBox(); assert(box && box.height >= 48 && box.width >= 48);
    }
    await expect(page.getByRole('button', { name: 'Nhật ký', exact: true })).toContainText('✓');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await page.getByText('Hoạt động tập luyện', { exact: true }).first().scrollIntoViewIfNeeded();
    await click('Thu gọn bộ lọc');
    await page.screenshot({ path: path.join(out, 'design-system-' + width + '.png') });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  stage = 'filter selections survive collapse';
  await click('Mở bộ lọc');
  await page.getByRole('radio', { name: '○ Nháp', exact: true }).click();
  await click('Thu gọn bộ lọc');
  await expect(page.getByText('30 ngày gần nhất · Nháp', { exact: true })).toBeVisible();
  await click('Mở bộ lọc');
  await expect(page.getByRole('radio', { name: '● Nháp', exact: true })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('radio', { name: /Nháp và hoàn tất/ }).click();
  await click('Thu gọn bộ lọc');
  stage = 'draft validation and pending/retry identity';
  await click('Tạo buổi tập'); await click('Thêm bài tự nhập'); await page.getByLabel('Tên bài 1', { exact: true }).fill('Squat'); await click('Thêm hiệp'); await page.getByLabel('Số lần hiệp 1', { exact: true }).fill('10');
  await page.getByLabel('Số lần hiệp 1', { exact: true }).fill('1.5');
  await click('Lưu nháp');
  await expect(page.getByRole('alert').filter({ hasText: 'Bài 1, hiệp 1:' })).toBeVisible();
  await expect(page.getByLabel('Số lần hiệp 1', { exact: true })).toBeFocused();
  assert.equal(createKeys.length, 0);
  await page.screenshot({ path: path.join(out, 'inline-error-mobile.png') });
  await page.getByLabel('Số lần hiệp 1', { exact: true }).fill('10');
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const reps = await page.getByLabel('Số lần hiệp 1', { exact: true }).boundingBox();
    const weight = await page.getByLabel('Mức tạ (kg) hiệp 1', { exact: true }).boundingBox();
    assert(reps.height >= 48 && weight.height >= 48);
    // useWindowDimensions updates after the browser resize event.
    await expect.poll(async () => {
      const a = await page.getByLabel('Số lần hiệp 1', { exact: true }).boundingBox();
      const b = await page.getByLabel('Mức tạ (kg) hiệp 1', { exact: true }).boundingBox();
      return width >= 390 ? Math.abs(a.y - b.y) < 2 : b.y >= a.y;
    }).toBe(true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await page.getByLabel('Số lần hiệp 1', { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(out, 'sets-compact-' + width + '.png') });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await click('Lưu nháp'); await started; await expect(page.getByRole('button', { name: 'Số đo cơ thể', exact: true })).toBeDisabled(); assert(held); await expect(page.getByRole('button', { name: 'Đóng chi tiết', exact: true })).toBeDisabled(); await page.keyboard.press('Escape'); assert.equal(new URL(page.url()).pathname, '/member'); await expect(page.getByLabel('Tên bài 1', { exact: true })).toHaveValue('Squat'); release();
  await page.getByText('Mất phản hồi giả lập. Thử lưu lại.', { exact: true }).waitFor();
  const errorFeedback = page.getByRole('alert').filter({ hasText: 'Mất phản hồi giả lập. Thử lưu lại.' });
  await expect(errorFeedback).toHaveAttribute('aria-live', 'polite');
  await expect(errorFeedback).toHaveCSS('color', 'rgb(173, 48, 45)');
  await expect(errorFeedback).toHaveCSS('background-color', 'rgb(251, 237, 236)');
  await expect(page.getByLabel('Tên bài 1', { exact: true })).toHaveValue('Squat');
  started = new Promise(r => { startedResolve = r; }); await click('Lưu nháp'); await started; release();
  await page.getByText('Đã lưu nháp. Bạn có thể tiếp tục nhập hoặc hoàn tất buổi tập.', { exact: true }).waitFor(); assert.equal(createKeys[0], createKeys[1]); assert.equal(workouts.length, 1);
  const successFeedback = page.getByText('Đã lưu nháp. Bạn có thể tiếp tục nhập hoặc hoàn tất buổi tập.', { exact: true });
  await expect(successFeedback).toHaveAttribute('aria-live', 'polite');
  await expect(successFeedback).toHaveCSS('color', 'rgb(20, 113, 94)');
  await expect(successFeedback).toHaveCSS('background-color', 'rgb(232, 247, 242)');
  stage = 'conflict retention, reload, complete and revision';
  await page.getByLabel('Tên buổi (tối đa 100 ký tự)', { exact: true }).fill('Chưa lưu'); conflictNext = true; await click('Lưu thay đổi');
  await page.getByText('Bản ghi đã thay đổi. Tải bản mới để đối chiếu.', { exact: true }).waitFor(); await expect(page.getByLabel('Tên buổi (tối đa 100 ký tự)', { exact: true })).toHaveValue('Chưa lưu');
  failNextDetail = true; await click('Tải bản mới để đối chiếu');
  await page.getByText('Không tải được nhật ký. Thử lại.', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Lưu nháp', exact: true }).count(), 0);
  assert.equal(createKeys.length, 2);
  await click('Thử lại'); await expect(page.getByLabel('Tên buổi (tối đa 100 ký tự)', { exact: true })).toHaveValue('');
  await page.getByLabel('Tên buổi (tối đa 100 ký tự)', { exact: true }).fill('Buổi sáng');
  await click('Lưu thay đổi');
  await page.getByText('Đã lưu nháp. Bạn có thể tiếp tục nhập hoặc hoàn tất buổi tập.', { exact: true }).waitFor();
  assert.equal(workouts[0].version, 2);
  await expect(page.getByLabel('Tên buổi (tối đa 100 ký tự)', { exact: true })).toHaveValue('Buổi sáng');
  await click('Hoàn tất buổi tập'); await page.getByText('Đã lưu. Buổi tập đã hoàn tất.', { exact: true }).waitFor();
  await click('Xem lịch sử sửa'); await page.getByText('Phiên bản 1', { exact: true }).waitFor();
  await page.getByRole('button', { name: /Xem chi tiết Phiên bản 1/ }).click();
  await expect(page.getByText('Nháp', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).last().click();
  await expect(page.getByText('Hoàn tất', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/^Tạo mới ·/)).toBeVisible();
  await expect(page.getByText(/^Cập nhật ·/).first()).toBeVisible();
  assert.equal(await page.getByText(/\b(DRAFT|COMPLETED|ARCHIVED|CREATE|UPDATE)\b/).count(), 0);
  await click('Đóng buổi tập');
  await page.getByRole('button', { name: 'Mở buổi ' + today, exact: true }).waitFor();
  await page.screenshot({ path: path.join(out, 'journal-list-mobile.png'), fullPage: true });
  stage = 'measurements optional field and duplicate-day edit';
  await click('Số đo cơ thể'); await click('Ghi số đo'); await page.getByLabel('Cân nặng cơ thể (kg, tối đa 2 số thập phân)', { exact: true }).fill('0'); await click('Lưu số đo'); await expect(page.getByLabel('Cân nặng cơ thể (kg, tối đa 2 số thập phân)', { exact: true })).toBeFocused(); assert.equal(measurements.length, 0); await page.getByLabel('Cân nặng cơ thể (kg, tối đa 2 số thập phân)', { exact: true }).fill('70'); await click('Lưu số đo'); await page.getByText('Đã lưu số đo.', { exact: true }).waitFor();
  await expect(page.getByRole('button', { name: 'Số đo cơ thể', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Đang hoạt động', { exact: true })).toBeVisible();
  await click('Ghi số đo'); await click('Mở số đo đang có'); await page.getByLabel('Chiều cao (cm, tối đa 1 số thập phân)', { exact: true }).fill('170'); await click('Lưu số đo'); await page.getByText('Đã lưu số đo.', { exact: true }).waitFor(); assert.equal(measurements.length, 1);
  await page.screenshot({ path: path.join(out, 'measurements-list-mobile.png'), fullPage: true });
  stage = 'progress charts and missing weight';
  await click('Tiến bộ'); await page.getByText('Cân nặng cơ thể', { exact: true }).first().waitFor(); await expect(page.getByText('70 kg', { exact: true })).toBeVisible(); await expect(page.getByText('Đo ngày ' + today + ' trong khoảng đã chọn.', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tiến bộ', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Tìm trong bài đã ghi', { exact: true })).toHaveAttribute('placeholder', 'Nhập tên bài tập');
  await page.getByText('Tiến bộ của bạn', { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(out, 'progress-overview-mobile.png') });
  await page.getByRole('radio', { name: /Squat/ }).click(); await page.getByText('Mức tạ cao nhất mỗi ngày (kg)', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
  await page.getByRole('button', { name: 'Xem chi tiết Tần suất ghi buổi tập', exact: true }).click();
  await expect(page.getByText(today + ': 1 buổi', { exact: true })).toHaveCount(0);
  await click('Xem bảng số liệu: Số buổi');
  await expect(page.getByText(today + ': 1 buổi', { exact: true })).toBeVisible();
  await click('Ẩn bảng số liệu: Số buổi');
  await page.screenshot({ path: path.join(out, 'progress-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
  stage = 'catalog guide and draft selection';
  await click('Bài tập mẫu');
  await expect(page.getByRole('combobox', { name: 'Nhóm cơ', exact: true })).toBeHidden();
  await click('Mở bộ lọc');
  await page.getByRole('combobox', { name: 'Nhóm cơ', exact: true }).selectOption('QUADRICEPS');
  await page.getByRole('combobox', { name: 'Dụng cụ', exact: true }).selectOption('NONE');
  await expect(page.getByRole('combobox', { name: 'Dụng cụ', exact: true })).toHaveValue('NONE');
  await page.getByRole('combobox', { name: 'Dụng cụ', exact: true }).selectOption('');
  await click('Thu gọn bộ lọc');
  await expect(page.getByText('Đùi trước · Tất cả dụng cụ', { exact: true })).toBeVisible();
  await click('Mở bộ lọc');
  await expect(page.getByRole('combobox', { name: 'Nhóm cơ', exact: true })).toHaveValue('QUADRICEPS');
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    for (const label of ['Nhóm cơ', 'Dụng cụ']) {
      const field = page.getByRole('combobox', { name: label, exact: true });
      await expect(field).toBeVisible();
      const box = await field.boundingBox(); assert(box.height >= 48 && box.width <= width, 'Dropdown touch size/width');
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Dropdown filter overflow');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('combobox', { name: 'Nhóm cơ', exact: true }).focus();
  await expect(page.getByRole('combobox', { name: 'Nhóm cơ', exact: true })).toBeFocused();
  await page.screenshot({ path: path.join(out, 'library-dropdown-390.png'), fullPage: true });
  await click('Thu gọn bộ lọc');
  await page.screenshot({ path: path.join(out, 'library-mobile.png'), fullPage: true });
  stage = 'search dismisses focus and reveals exercise results';
  const searchField = page.getByLabel('Tên bài Việt hoặc Anh', { exact: true });
  await searchField.fill('  squat  ');
  const searched = page.waitForResponse(r => new URL(r.url()).pathname === '/api/exercise-library' && new URL(r.url()).searchParams.get('q') === 'squat');
  await click('Tìm bài tập'); await searched;
  await expect(searchField).not.toBeFocused();
  await expect(page.getByText('1 bài phù hợp với “squat”', { exact: true })).toBeVisible();
  const resultHeading = page.getByRole('heading', { name: 'Kết quả tìm kiếm', exact: true });
  await expect(resultHeading).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Xem Squat không tạ', exact: true })).toBeInViewport();
  await page.screenshot({ path: path.join(out, 'search-results-visible-390.png'), fullPage: true });
  await searchField.focus();
  const repeated = page.waitForResponse(r => new URL(r.url()).pathname === '/api/exercise-library' && new URL(r.url()).searchParams.get('q') === 'squat');
  await searchField.press('Enter'); await repeated;
  await expect(searchField).not.toBeFocused();
  await expect(resultHeading).toBeInViewport();
  await click('Xem Squat không tạ'); await page.getByText('1. Đứng vững.', { exact: true }).waitFor(); await click('Chọn bài vào buổi nháp');
  await page.getByText('Squat không tạ · bài mẫu', { exact: true }).waitFor(); assert.equal(await page.getByLabel('Số lần hiệp 1', { exact: true }).count(), 0);
  await page.screenshot({ path: path.join(out, 'catalog-draft-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 }); await page.screenshot({ path: path.join(out, 'journal-desktop.png'), fullPage: true });
  stage = 'unsaved popup close cancellation and Home navigation';
  acceptDialog = false;
  await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
  await expect(page.getByText('Squat không tạ · bài mẫu', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByText('Squat không tạ · bài mẫu', { exact: true })).toBeVisible();
  assert(dialogs > 0);
  acceptDialog = true;
  await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('link', { name: 'Lịch', exact: true }).click();
  await page.getByText('Lịch do chủ phòng tập quản lý. Liên hệ chủ phòng tập khi cần thay đổi.', { exact: true }).waitFor();
  assert.deepEqual(navigationDocuments, [], 'Guarded navigation reloaded the document');
  assert.deepEqual(forbiddenWrites, []); assert.deepEqual(pageErrors, []);
  console.log('PASS: UX save-in-place/version/reload-failure, filter persistence, inline-error focus, responsive sets, summary-first and expandable tables; Member journal pending/retry/conflict/revisions, measurements, progress, catalog; design-system labels/selected state/semantic feedback/Vietnamese statuses/exercise search, 320/390/768/1280px. API mocked.');
}
main().catch(async e => { console.error('Workout browser regression failed at ' + stage + ': ' + e.message); if (page && !page.isClosed()) await page.screenshot({ path: path.join(out, 'failure.png'), fullPage: true }).catch(() => {}); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
