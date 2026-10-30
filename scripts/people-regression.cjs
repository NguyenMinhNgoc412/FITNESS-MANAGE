// After web export: pnpm --package=@playwright/test dlx -c "node scripts/people-regression.cjs"
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
const output = path.join(root, '.local/people-ui');
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

let browser, stage='start', activePage;
const id=n=>n.toString(16).padStart(24,'0');
const members=Array.from({length:34},(_,i)=>({id:id(i+1),role:'MEMBER',status:i===2?'LOCKED':'ACTIVE',phone:'090100'+String(i).padStart(4,'0'),profile:{fullName:'Hội viên mẫu '+String(i+1).padStart(2,'0'),cccd:'TEST-ONLY'}}));
const pts=Array.from({length:31},(_,i)=>({...members[i],id:id(i+100),role:'PT',profile:{fullName:'PT mẫu '+String(i+1).padStart(2,'0')}}));
members[33].profile.fullName += ' — ' + 'Họ tên dài '.repeat(12);
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({channel:'msedge',headless:true});
 for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:568},{width:844,height:480}]){
  members[0].profile.fullName='Hội viên mẫu 01';
  stage='layout '+viewport.width+'x'+viewport.height;
  const context=await browser.newContext({viewport,timezoneId:'Asia/Bangkok'}),page=activePage=await context.newPage();
  let mode='ok',release,started,mark,hold=false,writes=0,writeBody,writeSuccess=false;
  await page.route('**/api/**',async route=>{
   const req=route.request(),u=new URL(req.url()),p=u.pathname;
   let data=[];
   if(p.endsWith('/auth/login'))data={accessToken:randomBytes(32).toString('hex'),refreshToken:randomBytes(32).toString('hex'),user:{id:id(999),role:'OWNER'}};
   else if(p.endsWith('/auth/me'))data={...members[0],role:'OWNER'};
   else if(p.endsWith('/dashboard'))data={checkins:0,trials:0,alerts:0,trialFinal:0,membershipExpiring:0,bookingsToday:0,ptsToday:0,bookings:[]};
   else if(p==='/api/people'&&req.method()==='GET'){
    if(mode==='error')return route.fulfill({status:503,json:{message:'Không tải được danh sách mẫu.'}});
    const all=u.searchParams.get('role')==='PT'?pts:members,offset=(Number(u.searchParams.get('page')||1)-1)*30;data=mode==='empty'?[]:all.slice(offset,offset+30);
   }else if(p.endsWith('/pt-assignment/history'))data=[{id:id(700),ptId:pts[0].id,ptName:pts[0].profile.fullName,status:'ACTIVE',reason:'Lịch sử mẫu'}];
   else if(p.endsWith('/memberships'))data=p.includes(members[0].id)?[{id:id(800),name:'Gói riêng Member 01',mode:'SESSION_BASED',effectiveStatus:'ACTIVE',remainingSessions:10,totalSessions:30,usedSessions:20}]:[];
   if(!p.endsWith('/auth/login')&&req.method()!=='GET'){
    writes++;writeBody=req.postDataJSON();if(hold){mark();await new Promise(r=>release=r);}
    if(writeSuccess&&req.method()==='PATCH'){members[0].profile.fullName=writeBody.fullName;return route.fulfill({json:{id:members[0].id}});}
    return route.fulfill({status:409,json:{message:'Xung đột mẫu; giữ nội dung để thử lại.'}});
   }
   await route.fulfill({json:data});
  });
  await page.goto(origin+'/login');await page.getByLabel('Số điện thoại',{exact:true}).fill('0900000000');await page.getByLabel('Mật khẩu',{exact:true}).fill(randomBytes(16).toString('hex'));await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await page.waitForURL('**/owner');
  if(viewport.width<900)await page.getByRole('button',{name:'Mở menu',exact:true}).click();
  await page.getByRole('link',{name:'PT & Member',exact:true}).click();await expect(page.getByTestId('person-row').first()).toBeVisible();
  await page.getByRole('radio',{name:/Hội viên/}).click();await expect(page.getByRole('button',{name:'Xem chi tiết Hội viên mẫu 01',exact:true})).toBeVisible();
  const checkLayout=async()=>{
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight),'Page overflow');
   for(const el of [page.getByRole('button',{name:'Trang sau',exact:true}),page.getByTestId('person-row').last()]){const b=await el.boundingBox();assert(b&&b.y>=0&&b.y+b.height<=viewport.height,'Clipped row/pager');}
  };await checkLayout();
  const seen=new Set();let previous='';
  for(let n=0;n<40;n++){
   await expect(page.getByTestId('person-row').first()).toBeVisible();
   const rows=await page.getByTestId('person-row').allTextContents();rows.forEach(x=>seen.add(x));
   const next=page.getByRole('button',{name:'Trang sau',exact:true});if(await next.isDisabled())break;
   previous=rows[0];await next.click();await expect(page.getByTestId('person-row').first()).not.toHaveText(previous);
  }
  assert.equal(seen.size,34,'All 34 members reachable across server pages');await checkLayout();
  await page.getByTestId('person-row').last().click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByText('Member chưa có gói tập.',{exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByTestId('person-row').last()).toBeFocused();
  const lastBefore=await page.getByTestId('person-row').last().innerText();await page.getByTestId('person-row').last().click();await page.getByRole('button',{name:'Đóng chi tiết',exact:true}).click();assert.equal(await page.getByTestId('person-row').last().innerText(),lastBefore);
  await page.getByRole('radio',{name:/Huấn luyện viên$/}).click();await expect(page.getByRole('button',{name:'Xem chi tiết PT mẫu 01',exact:true})).toBeVisible();if(viewport.width===1440){
   const ptSeen=new Set();for(let n=0;n<40;n++){await expect(page.getByTestId('person-row').first()).toBeVisible();const rows=await page.getByTestId('person-row').allTextContents();rows.forEach(x=>ptSeen.add(x));const next=page.getByRole('button',{name:'Trang sau',exact:true});if(await next.isDisabled())break;await next.click();await expect(page.getByTestId('person-row').first()).not.toHaveText(rows[0]);}assert.equal(ptSeen.size,31,'All 31 PT reachable');
  }
  await page.getByRole('radio',{name:/Hội viên$/}).click();await page.getByRole('button',{name:'Xem chi tiết Hội viên mẫu 01',exact:true}).click();
  await expect(page.getByText('Gói riêng Member 01',{exact:true})).toBeVisible();
  const dialog=page.getByRole('dialog');assert(await dialog.evaluate(e=>e.scrollWidth<=innerWidth),'Modal overflow');
  await page.screenshot({path:path.join(output,'people-detail-'+viewport.width+'.png')});
  await page.getByRole('radio',{name:/Sửa hồ sơ$/}).click();await page.getByLabel('Họ tên mới (để trống nếu giữ nguyên)',{exact:true}).fill('Tên chỉnh sửa mẫu');await page.getByLabel('Lý do thay đổi',{exact:true}).fill('Kiểm tra pending');
  started=new Promise(r=>mark=r);hold=true;await page.getByRole('button',{name:'Lưu hồ sơ',exact:true}).click();await started;
  await expect(page.getByRole('button',{name:'Đóng chi tiết',exact:true})).toBeDisabled();await expect(page.getByRole('radio',{name:/PT phụ trách$/})).toBeDisabled();await page.keyboard.press('Escape');await expect(dialog).toBeVisible();assert.equal(writes,1);release();hold=false;
  await expect(page.getByText('Xung đột mẫu; giữ nội dung để thử lại.',{exact:true})).toBeVisible();await expect(page.getByLabel('Họ tên mới (để trống nếu giữ nguyên)',{exact:true})).toHaveValue('Tên chỉnh sửa mẫu');assert.equal(writeBody.fullName,'Tên chỉnh sửa mẫu');writeSuccess=true;await page.getByRole('button',{name:'Lưu hồ sơ',exact:true}).click();await expect(page.getByText('Đã thực hiện thành công.',{exact:true})).toBeVisible();await page.getByRole('radio',{name:/Thông tin$/}).click();await expect(page.getByText('Tên chỉnh sửa mẫu',{exact:true}).last()).toBeVisible();
  await page.getByRole('radio',{name:/PT phụ trách$/}).click();await page.getByRole('button',{name:'Hủy PT phụ trách',exact:true}).click();await expect(page.getByRole('button',{name:'Xác nhận hủy PT',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Đóng chi tiết',exact:true}).click();await page.getByRole('button',{name:'Thêm Member',exact:true}).click();await expect(page.getByLabel('Mật khẩu (ít nhất 10 ký tự)',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Đóng chi tiết',exact:true}).click();
  await page.getByLabel('Lọc nhóm hiện tại theo tên hoặc SĐT',{exact:true}).fill('không có tên này');await expect(page.getByTestId('person-row')).toHaveCount(0);await page.getByLabel('Lọc nhóm hiện tại theo tên hoặc SĐT',{exact:true}).fill('');
  await page.screenshot({path:path.join(output,'people-list-'+viewport.width+'.png')});
  mode='error';await page.getByRole('radio',{name:/Huấn luyện viên$/}).click();await expect(page.getByText('Không tải được danh sách mẫu.',{exact:true})).toBeVisible();mode='ok';await page.getByRole('button',{name:'Thử lại',exact:true}).click();await expect(page.getByTestId('person-row').first()).toBeVisible();
  mode='empty';await page.getByRole('radio',{name:/Hội viên$/}).click();await expect(page.getByText('Chưa có Member chính thức.',{exact:true})).toBeVisible();
  console.log('PASS people list/detail '+viewport.width+'x'+viewport.height+'; 34 members, pending/error/empty/create; mocked API');await context.close();
 }
}
main().catch(async e=>{console.error('People regression failed at '+stage+': '+e.message);if(activePage)await activePage.screenshot({path:path.join(output,'people-failure.png')}).catch(()=>{});process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
