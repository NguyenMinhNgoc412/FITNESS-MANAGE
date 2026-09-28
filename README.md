# FITNESS-MANAGE

Ứng dụng Expo mobile/web, NestJS + Prisma MongoDB và FastAPI theo [SOT](docs/README.md). Ba role đăng nhập: OWNER, PT, MEMBER. Tiến độ và giới hạn kiểm chứng nằm trong [file 19](docs/19-Agent-task-splitting-sot.md).

## Chức năng

Owner quản lý Trial 3 buổi, conversion giữ lịch sử, gói thời gian/số buổi, hồ sơ/PT assignment, booking, check-in, External PT Pass và cảnh báo bán hàng. PT xem lịch/member được assign và tự check-in độc lập. Member xem gói/lịch, QR, xác nhận PT ngoài và AI kiểm tra độ sâu squat.

Booking chỉ Owner mutation. Quota/check-in/overlap được bảo vệ bằng transaction và idempotency server. Video AI giữ trên thiết bị; SQLite lưu phiên, File System/OPFS lưu video, MediaPipe xử lý local. FastAPI chỉ nhận JSON chỉ số tối thiểu. Không có workout plan hoặc endpoint cho Owner/PT xem AI.

## Cài đặt

Cần Node.js 22.16 trở lên, pnpm theo package.json, Python và MongoDB replica set/Atlas (không dùng standalone).

```sh
pnpm install
pnpm --filter @fitness/api prisma:generate
pnpm prepare:pose
```

prepare:pose tải model MediaPipe có kiểm tra SHA-256 và chép WASM/ESM từ dependency vào assets web/native. Không gửi dữ liệu người dùng. Chạy prisma:generate khi API/test đã dừng để tránh khóa DLL trên Windows.

Windows:

```powershell
py -m venv services/ai/.venv
services/ai/.venv/Scripts/python.exe -m pip install -r services/ai/requirements.txt
```

Linux/macOS dùng python3 và services/ai/.venv/bin/python.

Cấu hình theo apps/api/.env.example, apps/app/.env.example, services/ai/.env.example; không ghi đè .env cá nhân. Backend cần MongoDB URI và ba JWT secret khác nhau, mỗi secret ít nhất 32 ký tự. AI_SERVICE_TOKEN ở NestJS/FastAPI phải giống nhau. EXPO_PUBLIC_API_URL của client trỏ API với prefix /api; điện thoại dùng địa chỉ LAN.

Sau khi kiểm tra DATABASE_URL đúng database phát triển:

```sh
pnpm --filter @fitness/api db:push
pnpm --filter @fitness/api db:indexes
pnpm --filter @fitness/api prisma:seed
pnpm dev
```

Seed chỉ tạo Owner từ SEED_OWNER_PHONE/PASSWORD/NAME, không có mật khẩu mặc định và không ghi đè account cũ. MongoDB dùng db push và indexes riêng, không dùng SQL migration. Chưa có công cụ chuyển dữ liệu PostgreSQL cũ. Có thể chạy riêng pnpm dev:api, dev:app, dev:ai; AI runner đọc .env của service.

## Web và native

```sh
pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web
```

Host web cần HTTPS (localhost được hỗ trợ), SPA fallback, Cross-Origin-Opener-Policy: same-origin và Cross-Origin-Embedder-Policy: require-corp cho SQLite WASM. Phục vụ .wasm với application/wasm và .mjs với JavaScript MIME. MediaPipe assets cùng origin, không dùng CDN runtime.

Native AI cần development build chứa module fitness-pose, không có trong Expo Go. Sau prepare:pose, dùng Expo prebuild/run Android hoặc iOS. iOS cần macOS/Xcode. Expo push cần project ID và thiết bị cấp quyền.

## Kiểm tra

pnpm check chạy TypeScript lint (unused symbols), build NestJS, typecheck Expo và unit test API/app/FastAPI. Lint hiện không bao gồm ESLint style rules.

Integration cần database test riêng; runner từ chối tên không bắt đầu fitness_test_ và xóa database test khi kết thúc:

```powershell
$env:TEST_DATABASE_URL='mongodb://127.0.0.1:27027/fitness_test_sot_rebuild?replicaSet=rs0&directConnection=true'
pnpm --filter @fitness/api test:integration
```

Browser smoke cần MongoDB replica set loopback port 27027, Edge và bản web export; tự tạo/xóa database riêng, không dùng account trong .env:

```sh
pnpm --package=@playwright/test dlx -c "node scripts/browser-smoke.cjs"
```

Kiểm tra QR độc lập trên Windows:

```powershell
node scripts/verify-qr.cjs | services/ai/.venv/Scripts/python.exe scripts/verify-qr.py
```

Test tự động không thay thế thử camera, push delivery, pose trên người thật và bản iOS. Lượt rebuild không migration/seed dữ liệu thật.
