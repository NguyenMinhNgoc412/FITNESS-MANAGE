// pnpm --package=@playwright/test dlx -c "node scripts/exercise-media-regression.cjs"
// Bundled real images; synthetic API only, no external media requests or credentials.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { randomBytes } = require('node:crypto');
const bin = process.env.PATH.split(path.delimiter).find(p => fs.existsSync(path.resolve(p, '../@playwright/test/package.json')));
if (!bin) throw Error('Run with the documented pnpm dlx command.');
const req = createRequire(fs.realpathSync(path.resolve(bin, '../@playwright/test/package.json'))), { chromium } = req('playwright'), { expect } = req('@playwright/test');
const root = path.resolve(__dirname, '..'), build = path.join(root, 'apps/app/dist-sot-web'), out = path.join(root, '.local/exercise-media');
fs.mkdirSync(out, { recursive: true });
const media = JSON.parse(fs.readFileSync(path.join(root, 'apps/app/assets/exercise-demos/provenance.json')));
const guides = Object.entries(media).map(([code, demo], index) => ({ id: (index + 1).toString(16).padStart(24, '0'), code, contentVersion: 1, nameVi: 'Bài mẫu ' + code, nameEn: demo.nameEn, primaryMuscleGroup: 'CORE', secondaryMuscleGroups: [], muscleGroups: ['CORE'], equipmentCodes: ['NONE'], description: 'Hướng dẫn kiểm thử', steps: ['Bước tham khảo'], techniqueNotes: [], sourceUrls: ['https://www.acefitness.org/resources/everyone/exercise-library/'] }));
guides[0].steps.push(...Array.from({ length: 12 }, (_, i) => 'Bước dài ' + (i + 1) + ': Giữ tư thế ổn định, thực hiện động tác có kiểm soát theo hướng dẫn và đọc kỹ từng bước trước khi chọn bài vào nhật ký.'));
const server = http.createServer((request, response) => {
  const file = path.resolve(build, '.' + new URL(request.url, 'http://localhost').pathname);
  if (!file.startsWith(build + path.sep) && file !== build) { response.writeHead(403); return response.end(); }
  const chosen = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(build, 'index.html');
  response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.wasm': 'application/wasm' })[path.extname(chosen)] || 'application/octet-stream');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin'); response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp'); fs.createReadStream(chosen).pipe(response);
});
let browser, page, stage = 'setup', blockFrame = true, futureVersion = false;
async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  page = await context.newPage(); const errors = [], external = []; page.on('pageerror', error => errors.push(error.message));
  const routeHandler = route => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/api/')) {
      let data = [];
      if (url.pathname === '/api/auth/login') data = { accessToken: randomBytes(32).toString('hex'), refreshToken: randomBytes(32).toString('hex'), user: { id: 'a'.repeat(24), role: 'MEMBER' } };
      else if (url.pathname === '/api/auth/me') data = { id: 'a'.repeat(24), role: 'MEMBER', profile: { fullName: 'Member kiểm thử' } };
      else if (url.pathname === '/api/members/me/workouts') data = { items: [], total: 0, page: 1, pageSize: 20 };
      else if (url.pathname === '/api/exercise-library') data = { items: guides, total: guides.length, page: 1, pageSize: 20 };
      else if (url.pathname.startsWith('/api/exercise-library/')) { data = guides.find(item => item.id === url.pathname.split('/').at(-1)); if (futureVersion) data = { ...data, contentVersion: 2 }; }
      return route.fulfill({ json: data });
    }
    if (url.origin !== origin) { external.push(url.origin); return route.abort(); }
    if (blockFrame && url.pathname.includes('push-up-0') && /\.jpg$/.test(url.pathname)) return route.abort();
    return route.continue();
  };
  await page.route('**/*', routeHandler);
  await page.goto(origin + '/login'); await page.getByLabel('Số điện thoại', { exact: true }).fill('0900000000'); await page.getByLabel('Mật khẩu', { exact: true }).fill(randomBytes(16).toString('hex')); await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.getByRole('button', { name: 'Bài tập mẫu', exact: true }).click();
  for (const guide of guides) {
    stage = guide.code;
    await page.getByRole('button', { name: 'Xem ' + guide.nameVi, exact: true }).click();
    const modal = page.getByRole('dialog'), image = modal.getByTestId('exercise-demo-image');
    if (guide.code === 'push-up') {
      await expect(modal.getByText('Chưa tải được ảnh minh họa. Bạn vẫn có thể đọc hướng dẫn bên dưới.', { exact: true })).toBeVisible();
      await expect(modal.getByText('Bước tham khảo', { exact: false })).toBeVisible();
      await expect(image).toHaveCount(0);
      await expect(modal.getByRole('button', { name: 'Phát', exact: true })).toHaveCount(0);
      await expect(modal.getByRole('button', { name: 'Chọn bài vào buổi nháp', exact: true })).toBeInViewport();
      await page.screenshot({ path: path.join(out, 'compact-image-error-390.png') });
      blockFrame = false; await modal.getByRole('button', { name: 'Tải lại minh họa', exact: true }).click();
    }
    await expect(image).toBeVisible();
    const play = modal.getByRole('button', { name: 'Phát', exact: true }); await expect(play).toBeEnabled();
    await expect(image).toHaveAttribute('aria-label', guide.nameVi + ' · khung 1/' + media[guide.code].frameFiles.length);
    assert(await image.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)), 'Bundled frame failed to decode');
    await modal.getByRole('button', { name: 'Sau', exact: true }).click();
    await expect(image).toHaveAttribute('aria-label', guide.nameVi + ' · khung 2/' + media[guide.code].frameFiles.length);
    await modal.getByRole('button', { name: 'Trước', exact: true }).click();
    if (guide.code === 'bodyweight-squat' || guide.code === 'dead-bug') {
      await play.click(); await expect.poll(() => image.getAttribute('aria-label')).not.toBe(guide.nameVi + ' · khung 1/' + media[guide.code].frameFiles.length);
      await modal.getByRole('button', { name: 'Tạm dừng', exact: true }).click();
      const paused = await image.getAttribute('aria-label'); await page.waitForTimeout(1200); assert.equal(await image.getAttribute('aria-label'), paused, 'Paused frames advanced');
      for (const width of [320, 390, 768, 1280]) { await page.setViewportSize({ width, height: 844 }); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow'); }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: path.join(out, guide.code + '-390.png'), fullPage: true });
    }
    await modal.getByRole('button', { name: 'Nguồn và giấy phép', exact: true }).click();
    await expect(modal.getByRole('button', { name: 'Giấy phép: ' + media[guide.code].license, exact: true })).toBeVisible();
    await modal.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  stage = 'fixed action footer with long instructions';
  await page.getByRole('button', { name: 'Xem ' + guides[0].nameVi, exact: true }).click();
  const fixedAction = page.getByRole('button', { name: 'Chọn bài vào buổi nháp', exact: true });
  for (const [width, height] of [[320, 568], [390, 844], [844, 390], [1280, 900]]) {
    await page.setViewportSize({ width, height });
    await expect(fixedAction).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('button', { name: 'Đóng chi tiết', exact: true })).toBeInViewport({ ratio: 1 });
    const before = await fixedAction.boundingBox();
    await page.getByText('13. Bước dài 12:', { exact: false }).scrollIntoViewIfNeeded();
    const after = await fixedAction.boundingBox(); assert(Math.abs(before.y - after.y) < 2, 'Footer moved with body scroll');
    await expect(fixedAction).toBeInViewport({ ratio: 1 });
    await page.getByRole('button', { name: 'Nguồn và giấy phép', exact: true }).click();
    await expect(fixedAction).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: path.join(out, 'fixed-footer-' + width + '.png') });
  }
  await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  stage = 'future catalog content is not silently assigned old media'; futureVersion = true;
  await page.getByRole('button', { name: 'Xem ' + guides[0].nameVi, exact: true }).click();
  await expect(page.getByText('Chưa có minh họa phù hợp cho phiên bản bài này. Xem hướng dẫn bên dưới.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('exercise-demo-image')).toHaveCount(0);
  await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
  stage = 'default motion auto playback'; futureVersion = false;
  const normal = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
  page = await normal.newPage(); page.on('pageerror', error => errors.push(error.message)); await page.route('**/*', routeHandler);
  await page.goto(origin + '/login'); await page.getByLabel('Số điện thoại', { exact: true }).fill('0900000000'); await page.getByLabel('Mật khẩu', { exact: true }).fill(randomBytes(16).toString('hex')); await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.getByRole('button', { name: 'Bài tập mẫu', exact: true }).click();
  await page.getByRole('button', { name: 'Xem ' + guides[0].nameVi, exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tạm dừng', exact: true })).toBeEnabled();
  const autoImage = page.getByTestId('exercise-demo-image'), beforeAuto = await autoImage.getAttribute('aria-label');
  await expect.poll(() => autoImage.getAttribute('aria-label')).not.toBe(beforeAuto);
  await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click(); await expect(page.getByTestId('exercise-demo-image')).toHaveCount(0);
  await normal.close();
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  await context.close(); console.log('PASS: all 20 exercise demos / 43 bundled frames decode; reduced-motion starts paused, manual frames, play/pause, source/licenses, responsive popup 320–1280; no third-party media requests. API mocked.');
}
main().catch(async error => { console.error('Exercise media regression failed at ' + stage + ': ' + error.message); if (page && !page.isClosed()) await page.screenshot({ path: path.join(out, 'failure.png') }).catch(() => {}); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
