// After web export: pnpm --package=@playwright/test dlx -c "node scripts/package-statistics-regression.cjs"
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
const output = path.join(root, '.local/package-statistics');
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
const fixture=[...Array.from({length:7},(_,i)=>({name:i===0?'Cùng tên gói':i===2?'Gói luyện tập dành cho hội viên có tên rất dài để kiểm tra cách xuống dòng trên điện thoại':'Gói buổi '+i,mode:'SESSION_BASED',memberCount:10+i,registrations:20+i})),...Array.from({length:5},(_,i)=>({name:i===0?'Cùng tên gói':'Gói tháng '+i,mode:'TIME_BASED',memberCount:30+i,registrations:40+i}))];
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({channel:'msedge',headless:true});
 for(const width of [320,390,768,1440]){
  stage='statistics '+width;const context=await browser.newContext({viewport:{width,height:900}});page=await context.newPage();let mode='ok',release,mark,hold=false,writes=0;
  await page.route('**/api/**',async route=>{const req=route.request(),p=new URL(req.url()).pathname;let data=[];
   if(p.endsWith('/auth/login'))data={accessToken:randomBytes(32).toString('hex'),refreshToken:randomBytes(32).toString('hex'),user:{id:'a'.repeat(24),role:'OWNER'}};
   else if(p.endsWith('/auth/me'))data={id:'a'.repeat(24),role:'OWNER',status:'ACTIVE',profile:{fullName:'Owner mẫu'}};
   else if(p.endsWith('/dashboard'))data={checkins:0,trials:0,alerts:0,trialFinal:0,membershipExpiring:0,bookingsToday:0,ptsToday:0,bookings:[]};
   else if(p==='/api/reports/packages'){
    if(hold){mark();await new Promise(r=>release=r);}
    if(mode==='error')return route.fulfill({status:503,json:{message:'Không tải được thống kê mẫu.'}});
    data=mode==='empty'?[]:mode==='time-only'?fixture.filter(x=>x.mode==='TIME_BASED'):fixture;
   }
   if(req.method()!=='GET'&&!p.endsWith('/auth/login'))writes++;
   await route.fulfill({json:data});
  });
  await page.goto(origin+'/login');await page.getByLabel('Số điện thoại',{exact:true}).fill('0900000000');await page.getByLabel('Mật khẩu',{exact:true}).fill(randomBytes(16).toString('hex'));await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await page.waitForURL('**/owner');
  if(width<900)await page.getByRole('button',{name:'Mở menu',exact:true}).click();await page.getByRole('link',{name:'Gói tập',exact:true}).click();
  const stats=page.getByTestId('package-statistics');await expect(stats.getByTestId('package-stat-row').first()).toBeVisible();
  if(width>=1100){assert.equal(await stats.getByTestId(/package-stat-group-/).count(),2);const a=await page.getByTestId('package-stat-group-SESSION_BASED').boundingBox(),b=await page.getByTestId('package-stat-group-TIME_BASED').boundingBox();assert(Math.abs(a.y-b.y)<2&&b.x>a.x,'Groups not side by side');}
  else assert.equal(await stats.getByTestId(/package-stat-group-/).count(),1);
  const box=await stats.boundingBox();assert(box.height<(width<1100?700:550),'Statistics too tall');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');
  await stats.getByTestId('package-stat-row').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByText('10 người đăng ký · 20 lần cấp/gia hạn',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Đóng chi tiết',exact:true}).click();
  await stats.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'packages-'+width+'.png')});
  for(const [type,label] of [['SESSION_BASED','Số buổi'],['TIME_BASED','Thời gian']]){
   if(width<1100)await stats.getByRole('radio',{name:new RegExp(label+'$')}).click();const group=page.getByTestId('package-stat-group-'+type),seen=new Set();
   for(let i=0;i<10;i++){const rows=group.getByTestId('package-stat-row');assert((await rows.count())<=3);for(const row of await rows.all()){const text=await row.innerText();const name=text.split(String.fromCharCode(10))[0];seen.add(name);const item=fixture.find(x=>x.mode===type&&x.name===name);assert(item,'Wrong group');await expect(row.getByText(item.memberCount+' người đăng ký · '+item.registrations+' lần cấp',{exact:true})).toBeVisible();}
    const next=group.getByRole('button',{name:'Sau',exact:true});if(await next.isDisabled())break;await next.click();
   }
   assert.equal(seen.size,fixture.filter(x=>x.mode===type).length,'Some rows unreachable');
  }
  if(width<1100){await stats.getByRole('radio',{name:/Số buổi$/}).click();await expect(page.getByTestId('package-stat-group-SESSION_BASED').getByText('3 / 3',{exact:true})).toBeVisible();}
  let started=new Promise(r=>mark=r);hold=true;await stats.getByRole('button',{name:'Làm mới',exact:true}).click();await started;await expect(stats.getByRole('button',{name:'Làm mới',exact:true})).toBeDisabled();release();hold=false;await expect(stats.getByRole('button',{name:'Làm mới',exact:true})).toBeEnabled();
  mode='time-only';await stats.getByRole('button',{name:'Làm mới',exact:true}).click();await expect(stats.getByTestId('package-stat-group-TIME_BASED')).toBeVisible();await expect(stats.getByTestId('package-stat-group-SESSION_BASED')).toHaveCount(0);await expect(stats.getByRole('radio')).toHaveCount(0);
  mode='error';await stats.getByRole('button',{name:'Làm mới',exact:true}).click();await expect(stats.getByText('Không tải được thống kê mẫu.',{exact:true})).toBeVisible();mode='empty';await stats.getByRole('button',{name:'Thử lại',exact:true}).click();await expect(stats.getByText('Chưa có gói được cấp để thống kê.',{exact:true})).toBeVisible();assert.equal(writes,0);
  console.log('PASS package statistics '+width+'px: groups, 3 rows/page, all 12 groups reachable, distinct counts, no blank group, refresh/loading/error/empty; API mocked.');await context.close();
 }
}
main().catch(async e=>{console.error('Package statistics regression failed at '+stage+': '+e.message);if(page)await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
