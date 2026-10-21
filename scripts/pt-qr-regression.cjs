// Synthetic QR scan events and API mocks; no camera or business database.
// After web export: pnpm --package=@playwright/test dlx -c "node scripts/pt-qr-regression.cjs"
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
const output = path.join(root, '.local/pt-qr');
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

let browser;
const token = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url') + '.' + Buffer.from(JSON.stringify({sub:'222222222222222222222222',kind:'pt-attendance',iat:1792500000,exp:1792500120})).toString('base64url') + '.synthetic-signature-for-ui-only';
async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const origin = 'http://127.0.0.1:' + server.address().port;
  for (const role of ['PT', 'OWNER', 'MEMBER']) {
    const context = await browser.newContext({ viewport: {width:role === 'OWNER' ? 1440 : 390,height:844},permissions:['camera'] });
    const page = await context.newPage();
    let qrReads = 0, writes = 0, invalid = false, failConfirm = false, release, started;
    let mutationStarted = new Promise(resolve => { started = resolve; });
    await page.route('**/api/**', async route => {
      const req=route.request(), url=new URL(req.url()); let data=[];
      const fulfill=(value,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
      if(url.pathname.endsWith('/auth/login')) data={accessToken:'synthetic-access',refreshToken:'synthetic-refresh',user:{id:'222222222222222222222222',role}};
      else if(url.pathname.endsWith('/auth/me')) data={id:'222222222222222222222222',role,profile:{fullName:'Synthetic PT'}};
      else if(url.pathname.endsWith('/me/qr')) {qrReads++; data={token,expiresIn:120};}
      else if(url.pathname.endsWith('/dashboard')) data={checkins:0,trials:0,alerts:0,trialFinal:0,membershipExpiring:0,bookingsToday:0,ptsToday:0,bookings:[]};
      else if(url.pathname.endsWith('/resolve-qr')) {
        if(invalid) return fulfill({code:'INVALID_QR',message:'QR không hợp lệ hoặc đã hết hạn.'},400);
        data={pt:{id:'222222222222222222222222',profile:{fullName:'Synthetic PT'}}};
      } else if(url.pathname.endsWith('/checkins/pt')) {
        writes++; assert.deepEqual(req.postDataJSON(),{token}); assert(req.headers()['idempotency-key']);
        started(); await new Promise(resolve => { release=resolve; });
        if(failConfirm) return fulfill({code:'ALREADY_CHECKED_IN_TODAY',message:'PT đã điểm danh hôm nay.'},409);
        data={id:'synthetic-log',source:'QR'};
      } else if(req.method() !== 'GET') throw new Error('Unexpected mutation: '+url.pathname);
      return fulfill(data);
    });
    await page.goto(origin+'/login');
    await page.getByLabel('Số điện thoại',{exact:true}).fill('0900000000');
    await page.getByLabel('Mật khẩu',{exact:true}).fill('synthetic-password');
    await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
    await page.waitForURL('**/'+role.toLowerCase());
    if(role === 'PT' || role === 'MEMBER') {
      if(role === 'MEMBER') await page.getByRole('link',{name:'Check-in',exact:true}).click();
      const qr=page.getByLabel('Mã QR check-in có thời hạn',{exact:true});
      await expect(qr).toBeVisible();
      assert.equal(await page.getByRole('button',{name:'Xác nhận có mặt tại gym',exact:true}).count(),0);
      const before=qrReads;
      await page.getByRole('button',{name:'Làm mới QR',exact:true}).click();
      await expect.poll(()=>qrReads).toBeGreaterThan(before);
      await page.screenshot({path:path.join(output,role.toLowerCase()+'-qr.png'),fullPage:true});
    } else {
      await page.getByRole('link',{name:'Check-in',exact:true}).click();
      // Deliver the scanner callback at the CameraView boundary; decoder/device tested manually.
      async function scan() {
        await page.getByRole('button',{name:'Mở máy quét',exact:true}).click();
        await page.waitForFunction(()=>Array.from(document.querySelectorAll('*')).some(el=>Object.keys(el).some(k=>k.startsWith('__reactFiber$')) && (()=>{let f=el[Object.keys(el).find(k=>k.startsWith('__reactFiber$'))];while(f){if(typeof f.memoizedProps?.onBarcodeScanned==='function')return true;f=f.return;}return false;})()));
        await page.evaluate(data=>{
          for(const el of document.querySelectorAll('*')) {
            const key=Object.keys(el).find(k=>k.startsWith('__reactFiber$')); let f=key&&el[key];
            while(f){if(typeof f.memoizedProps?.onBarcodeScanned==='function'){f.memoizedProps.onBarcodeScanned({data,type:'qr',nativeEvent:{data,type:'qr'}});return;}f=f.return;}
          }
          throw new Error('Camera callback not mounted');
        },token);
      }
      await scan();
      const confirm=page.getByRole('button',{name:'Xác nhận PT có mặt',exact:true});
      await expect(confirm).toBeVisible();
      assert.equal(await page.getByRole('button',{name:'Xác nhận vào tập',exact:true}).count(),0);
      await confirm.click(); await mutationStarted;
      await expect(confirm).toBeDisabled(); assert.equal(writes,1);
      release(); await expect(page.getByText('Đã ghi nhận PT có mặt tại gym.',{exact:true})).toBeVisible();
      invalid=true; await scan();
      await expect(page.getByText(/QR không hợp lệ hoặc đã hết hạn/)).toBeVisible();
      await expect(confirm).toHaveCount(0);
      invalid=false; failConfirm=true; mutationStarted=new Promise(resolve=>{started=resolve;});
      await scan(); await confirm.click(); await mutationStarted; release();
      await expect(page.getByText('PT đã điểm danh hôm nay.',{exact:true})).toBeVisible();
      await expect(confirm).toBeEnabled();
      await page.screenshot({path:path.join(output,'owner-pt-confirm.png'),fullPage:true});
    }
    console.log(role+' QR checks passed');
    await context.close();
  }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
