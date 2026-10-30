// After web export: pnpm --package=@playwright/test dlx -c "node scripts/list-popup-regression.cjs"
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
const output = path.join(root, '.local/list-popup');
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

let browser,page,stage='start';
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({channel:'msedge',headless:true});
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:1440,height:900}]){
  stage='lists and popup '+viewport.width;const context=await browser.newContext({viewport,timezoneId:'Asia/Bangkok'});page=await context.newPage();
  let release,mark,hold=false,fail=true,writes=0;const alert={id:'b'.repeat(24),customerId:'c'.repeat(24),customerName:'Khách cần chăm sóc',type:'MEMBERSHIP_EXPIRING_TIME',status:'OPEN',triggeredAt:'2026-10-29T00:00:00.000Z',ownerNote:''};
  await page.route('**/api/**',async route=>{const req=route.request(),u=new URL(req.url()),p=u.pathname;let data=[];
   if(p.endsWith('/auth/login'))data={accessToken:randomBytes(32).toString('hex'),refreshToken:randomBytes(32).toString('hex'),user:{id:'a'.repeat(24),role:'OWNER'}};
   else if(p.endsWith('/auth/me'))data={id:'a'.repeat(24),role:'OWNER',status:'ACTIVE',profile:{fullName:'Owner kiểm thử'}};
   else if(p.endsWith('/dashboard'))data={checkins:0,trials:0,alerts:1,trialFinal:0,membershipExpiring:1,bookingsToday:0,ptsToday:0,bookings:[]};
   else if(p==='/api/sales-alerts')data=[alert];
   else if(p.startsWith('/api/sales-alerts/')){writes++;if(hold){mark();await new Promise(r=>release=r);}if(fail)return route.fulfill({status:409,json:{message:'Lưu chưa thành công; giữ nội dung.'}});Object.assign(alert,req.postDataJSON());data=alert;}
   else if(p==='/api/reports/checkins')data={months:Array.from({length:12},(_,i)=>({month:i+1,member:i===0?32:0,trial:i===0?5:0,total:i===0?37:0,pt:i===0?9:0}))};
   else if(p==='/api/checkins')data=[{id:'d'.repeat(24),checkedInAt:'2026-10-29T00:00:00.000Z',context:'SELF_TRAINING',memberId:'e'.repeat(24),reason:'Ghi chú đối chiếu mẫu'}];
   return route.fulfill({json:data});
  });
  await page.goto(origin+'/login');await page.getByLabel('Số điện thoại',{exact:true}).fill('0900000000');await page.getByLabel('Mật khẩu',{exact:true}).fill(randomBytes(16).toString('hex'));await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await page.waitForURL('**/owner');
  const go=async label=>{if(viewport.width<900)await page.getByRole('button',{name:'Mở menu',exact:true}).click();await page.getByRole('link',{name:label,exact:true}).click();};
  await go('Sales / Cảnh báo');const row=page.getByRole('button',{name:'Xem chi tiết Khách cần chăm sóc',exact:true});await row.click();
  const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();const close=page.getByRole('button',{name:'Đóng chi tiết',exact:true});let box=await close.boundingBox();assert(box&&box.y>=0&&box.y+box.height<=viewport.height);
  await page.getByLabel('Ghi chú',{exact:true}).fill('Ghi chú được giữ khi lỗi');let started=new Promise(r=>mark=r);hold=true;await dialog.getByRole('button',{name:'Lưu',exact:true}).click();await started;await expect(close).toBeDisabled();await page.keyboard.press('Escape');await expect(dialog).toBeVisible();assert.equal(writes,1);release();hold=false;
  await expect(dialog.getByText('Lưu chưa thành công; giữ nội dung.',{exact:true})).toBeVisible();await expect(page.getByLabel('Ghi chú',{exact:true})).toHaveValue('Ghi chú được giữ khi lỗi');fail=false;await dialog.getByRole('button',{name:'Lưu',exact:true}).click();await expect(dialog.getByText('Đã thực hiện thành công.',{exact:true})).toBeVisible();await close.click();await expect(row).toBeFocused();
  await go('Logs / Báo cáo');const report=page.getByTestId('monthly-checkin-report');await expect(report.getByRole('button',{name:/^Xem chi tiết Tháng/})).toHaveCount(12);
  await report.getByRole('button',{name:/^Xem chi tiết Tháng 1\//}).click();await expect(dialog.getByText('37 lượt vào tập · Member: 32 · Trial: 5',{exact:true})).toBeVisible();await expect(dialog.getByText('PT attendance: 9 lượt',{exact:true})).toBeVisible();await page.screenshot({path:path.join(output,'monthly-popup-'+viewport.width+'.png')});await close.click();
  await report.getByRole('button',{name:/^Xem chi tiết Tháng 2\//}).click();await expect(dialog.getByText('0 lượt vào tập · Member: 0 · Trial: 0',{exact:true})).toBeVisible();await close.click();
  const logs=page.getByRole('button',{name:/^Xem chi tiết 07:00/});await logs.click();await expect(dialog.getByText('Ghi chú đối chiếu mẫu',{exact:true})).toBeVisible();await close.click();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow');await report.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'monthly-list-'+viewport.width+'.png')});console.log('PASS list/popup '+viewport.width+'px: Sales pending/retry/focus, 12 month rows incl zero, independent PT attendance, log detail; mocked API.');await context.close();
 }
}
main().catch(async e=>{console.error('List popup regression failed at '+stage+': '+e.message);if(page)await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
