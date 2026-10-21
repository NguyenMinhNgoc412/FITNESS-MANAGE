# FITNESS-MANAGE

FITNESS-MANAGE là ứng dụng quản lý phòng gym quy mô nhỏ cho **Owner**, **PT nội bộ** và **Member**. Ứng dụng Expo chạy trên mobile và web, NestJS cung cấp REST API với MongoDB, còn FastAPI hỗ trợ phản hồi AI từ các chỉ số tư thế đã xử lý trên thiết bị. Quyết định sản phẩm và nghiệp vụ nằm trong [bộ Source of Truth](docs/README.md).

Repository đang phát triển theo phạm vi MVP. Hướng dẫn dưới đây dành cho môi trường development; các điều kiện nghiệm thu và giới hạn kiểm chứng được ghi trong [Testing & Acceptance](docs/20-testing-acceptance-sot.md).

## Giới thiệu ứng dụng

| Người dùng | Chức năng chính |
|---|---|
| Owner | Tiếp nhận Trial 3 buổi, chuyển Trial thành Member, quản lý gói tập, PT, booking từng buổi, check-in, External PT Pass và cảnh báo chăm sóc khách hàng. |
| PT | Xem lịch và Member được phân công; ghi nhận PT check-in độc lập. |
| Member | Xem gói tập, lịch, mã QR check-in, xác nhận yêu cầu dùng PT ngoài và kiểm tra form bài tập bằng AI. |

### Quy tắc nghiệp vụ chính

- Chỉ có ba role đăng nhập: `OWNER`, `PT`, `MEMBER`. Lead/Trial và PT ngoài không có role đăng nhập.
- Trial có đúng **3 buổi**, mỗi số điện thoại chỉ được hưởng một lần; chuyển thành Member giữ nguyên identity và lịch sử.
- Gói tập hỗ trợ `TIME_BASED` và `SESSION_BASED`; Owner quản lý kích hoạt, gia hạn và PT assignment.
- Chỉ Owner tạo, sửa hoặc hủy booking; lịch phải chống trùng cho cả PT và Member.
- Member/Trial có một lượt vào tập mỗi ngày UTC+7. PT attendance là log độc lập, không tự ghép với Member check-in để kết luận attendance của booking.
- Owner có báo cáo người đăng ký gói và lượt check-in theo tháng; số liệu này không phải báo cáo doanh thu.

### AI kiểm tra form và quyền riêng tư

AI trên mobile/web tự nhận diện heuristic **Squat, chống đẩy và Lunge** từ video, đo chỉ số/góc theo phạm vi hỗ trợ và lấy nhận xét từ JSON chỉ số. Bài chưa rõ hoặc ngoài phạm vi trả `UNKNOWN`. Ngưỡng so sánh là mục tiêu của app chưa được kiểm chứng trên video người thật; thân/tay thiếu tiêu chí thì chỉ báo số đo.

```text
Video local → MediaPipe trên thiết bị → structured JSON/metrics
           → NestJS gateway (MEMBER) → FastAPI → OpenAI nếu cấu hình
           → structured feedback
```

**Video gốc ở lại thiết bị.** Chỉ Member xem kết quả AI của mình. FastAPI dùng `OPENAI_API_KEY` và `OPENAI_MODEL` phía server, giữ nhận xét local khi thiếu cấu hình hoặc dịch vụ lỗi. AI không tạo giáo án, không chẩn đoán y khoa và không thay PT. Xem [hướng dẫn AI service](services/ai/README.md) để cấu hình.

## Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Client mobile/web | React Native, Expo, TypeScript, React Native Web, Expo Router |
| State, form và REST client | Zustand, React Hook Form, Zod, Axios |
| Backend và xác thực | NestJS, REST API, JWT Access Token + Refresh Token, Prisma |
| Dữ liệu nghiệp vụ | MongoDB, ưu tiên MongoDB Atlas |
| Dữ liệu AI local | SQLite qua `expo-sqlite`, `expo-file-system`; OPFS trên web |
| AI | MediaPipe Pose trên thiết bị, Python/FastAPI, OpenAI cho diễn giải metrics |
| Thông báo và storage | Expo Push Notifications; Supabase Storage chỉ cho file cloud-safe như avatar |

Sau mutation, client refresh/re-fetch qua REST. Chi tiết baseline xem [Tech Stack SOT](docs/04-tech-stack-sot.md).

## Cấu trúc dự án

| Thư mục | Vai trò |
|---|---|
| `apps/app` | Expo, React Native Web, giao diện ba role, QR và xử lý pose trên thiết bị. |
| `apps/api` | NestJS REST API, Prisma, MongoDB, auth và nghiệp vụ. |
| `services/ai` | FastAPI nhận chỉ số tư thế và trả phản hồi có cấu trúc. |
| `scripts` | Chạy các service, chuẩn bị MediaPipe và kiểm tra bổ trợ. |
| `docs` | Source of Truth về sản phẩm, thiết kế, kiến trúc và acceptance. |
| `images` | Ảnh tham chiếu giao diện canonical theo Owner, PT và Member. |

Backend có controller/module theo domain tại `apps/api/src/domain`; Reports, Dashboard, Sales Alerts, Audit và Device Tokens có service riêng. Notification outbox được enqueue trong transaction và gửi bởi scheduler. Client tách visual primitives (`src/ui.tsx`), form (`src/components/form.tsx`), REST loading (`src/hooks/use-load.ts`) và helper (`src/lib/http.ts`, `src/lib/date-time.ts`).

Khi nâng cấp notification từ bản trước 2026-10-20: dừng API/worker cũ, chạy `pnpm --filter @fitness/api prisma:generate`, `pnpm --filter @fitness/api db:push`, `pnpm --filter @fitness/api db:indexes`, rồi chạy API mới. Lệnh indexes backfill attempts còn thiếu; giữ lịch sử/trạng thái terminal. Không chạy worker cũ và mới đồng thời. Xem SOT 13/15 về lease, retry và giới hạn push best-effort.

## Tài liệu dự án

- [Mục lục Source of Truth](docs/README.md)
- [Product Brief](docs/01-product-brief-sot.md) và [Product Requirements](docs/02-product-requirements-sot.md)
- [Kiến trúc hệ thống](docs/03-technical-architecture-sot.md)
- [Testing & Acceptance](docs/20-testing-acceptance-sot.md)
- [Lịch sử quyết định](docs/CHANGELOG.md)
- [Quy tắc làm việc trong repository](AGENTS.md)

## Yêu cầu cài đặt

- Node.js **22.16 trở lên** và pnpm **10.34.4** (phiên bản khai báo trong `package.json`).
- Python và `pip` để chạy FastAPI. Trên Windows có thể dùng lệnh `py`.
- MongoDB Atlas hoặc MongoDB local chạy **replica set**; MongoDB standalone không hỗ trợ transaction mà API cần.
- Kết nối mạng khi chạy `pnpm prepare:pose` lần đầu để tải model MediaPipe chính thức.
- AI native cần development build Android/iOS có module `fitness-pose`; Expo Go không chứa module này. Build iOS cần macOS/Xcode.
- Báo cáo góc mobile cần module `FitnessPose` bridge v2. Khi nâng cấp từ binary cũ, phải build và cài lại (`pnpm --filter @fitness/app exec expo run:android` hoặc `expo run:ios` trên macOS); tải lại JavaScript không cập nhật module native. Kết quả cũ vẫn xem được, phân tích lại video để có góc mới.

## Cài đặt từ bản clone mới

Chạy tại thư mục gốc:

```sh
pnpm install
pnpm --filter @fitness/api prisma:generate
pnpm prepare:pose
```

`prepare:pose` kiểm tra SHA-256 của model MediaPipe, chép model vào assets web/Android/iOS và chép WASM/ESM từ dependency vào assets web. Nếu đổi phiên bản MediaPipe hoặc xóa assets local, chạy lại lệnh này. Trên Windows, dừng API/test trước khi chạy `prisma:generate` để tránh file Prisma DLL bị khóa.

Tạo Python virtual environment và cài dependency:

```powershell
# Windows
py -m venv services/ai/.venv
services/ai/.venv/Scripts/python.exe -m pip install -r services/ai/requirements.txt
```

```sh
# Linux/macOS
python3 -m venv services/ai/.venv
services/ai/.venv/bin/python -m pip install -r services/ai/requirements.txt
```

### Cấu hình môi trường

Tạo file `.env` từ bản `.env.example` tương ứng rồi điền giá trị cho môi trường phát triển:

| File | Cấu hình cần chú ý |
|---|---|
| `apps/api/.env` | `DATABASE_URL`, ba JWT secret khác nhau (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_QR_SECRET`), `AI_SERVICE_TOKEN` và thông tin `SEED_OWNER_*`. |
| `services/ai/.env` | `AI_SERVICE_TOKEN` giống giá trị ở API; `OPENAI_API_KEY` và `OPENAI_MODEL` nếu dùng diễn giải OpenAI. |
| `apps/app/.env` | `EXPO_PUBLIC_API_URL` nếu không dùng URL API mặc định; `EXPO_PUBLIC_PROJECT_ID` khi cần native push. |

Mỗi JWT secret cần ít nhất 32 ký tự. `DATABASE_URL` phải trỏ tới database phát triển dùng replica set. API mặc định chạy tại `http://localhost:3000/api`; với điện thoại, dùng địa chỉ LAN của máy chạy API (hoặc để client tự nhận host Metro trong môi trường development). Không commit `.env` hoặc secret.

Nếu API báo `DATABASE_URL must use MongoDB`, kiểm tra lại `apps/api/.env`: giá trị phải bắt đầu bằng `mongodb://` hoặc `mongodb+srv://` và trỏ tới MongoDB replica set/Atlas đang dùng. Sau khi sửa `.env`, khởi động lại `pnpm dev`. Nếu thấy lỗi TypeScript thiếu `Role` hoặc `PrismaClient`, chạy lại `pnpm --filter @fitness/api prisma:generate` khi API đã dừng.

### Chuẩn bị database và Owner đầu tiên

Sau khi kiểm tra `DATABASE_URL` và điền `SEED_OWNER_PHONE`, `SEED_OWNER_PASSWORD`, `SEED_OWNER_NAME` trong `apps/api/.env`:

```sh
pnpm --filter @fitness/api db:push
pnpm --filter @fitness/api db:indexes
pnpm --filter @fitness/api prisma:seed
```

Seed chỉ tạo Owner nếu số điện thoại đó chưa có account; không có mật khẩu mặc định và không ghi đè account cũ. Prisma MongoDB dùng `db:push` cùng bước tạo index riêng, không dùng SQL migration.

## Chạy dự án

```sh
pnpm dev
```

Lệnh này khởi chạy **NestJS API**, **FastAPI AI service** và **Expo** cùng lúc. Expo sẽ hiển thị lựa chọn mở web hoặc chạy trên thiết bị/emulator. Có thể chạy từng phần ở các terminal riêng:

```sh
pnpm dev:api
pnpm dev:ai
pnpm dev:app
```

`dev:ai` cần `services/ai/.venv` đã cài dependency và đọc `services/ai/.env`. Đăng nhập bằng Owner đã tạo ở bước seed. Các tài khoản PT/Member được tạo qua flow nghiệp vụ của Owner.

## Kiểm tra và build

```sh
pnpm check
```

Lệnh này chạy TypeScript lint (kiểm tra unused symbols), build API, typecheck app và unit test API/app/AI. Muốn chạy riêng, dùng `pnpm lint`, `pnpm build`, `pnpm test` hoặc script của từng package. Lint hiện không bao gồm ESLint style rules.

Export bản web:

```sh
pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web
```

Web host cần HTTPS (localhost được hỗ trợ), SPA fallback, header `Cross-Origin-Opener-Policy: same-origin` và `Cross-Origin-Embedder-Policy: require-corp` để SQLite WASM hoạt động. Phục vụ `.wasm` với MIME `application/wasm` và `.mjs` với JavaScript MIME. MediaPipe assets phải cùng origin. Native AI cần development build sau khi chạy `pnpm prepare:pose`.

Nếu web dev chọn video nhưng nút bị mờ và không có phiên mới, restart Expo sau khi sửa `metro.config.js`, rồi mở trực tiếp `http://localhost:8081/login` và đăng nhập lại. Metro có entry worker SQLite trong workspace để tránh URL 404 khi pnpm store nằm ngoài repository. Chọn video chỉ lưu local; sau thông báo thành công, bấm **Phân tích trên thiết bị**. Khởi tạo SQLite lỗi/quá 15 giây phải có thông báo, không chờ vô hạn.

Kiểm tra hồi quy UI trên dev server bằng PowerShell: `$env:UI_TEST_URL="http://localhost:8081"` rồi `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`. Runner dùng API mock, identity/video sinh lúc chạy; không dùng tài khoản hoặc video thật.

Kiểm tra 5 lỗi design system trên web export mới: chạy `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`, rồi `pnpm --package=@playwright/test dlx -c "node scripts/design-system-regression.cjs"`. Runner dùng Edge headless/API mock để kiểm tra khóa pending cấp/gia hạn, destructive CTA, menu Owner cuộn trên màn thấp, booking loading/error/retry/empty và lịch PT/Member read-only; ảnh lưu tại `.local/design-system-fixes/`. Unit test tương phản semantic colors nằm trong `theme.spec.ts`; không thay kiểm thử thiết bị native thật.

CRM regression trên cùng web export: `pnpm --package=@playwright/test dlx -c "node scripts/crm-regression.cjs"`. Runner kiểm tra profile Owner, phân trang riêng với 31 booking/121 check-in, retry, đổi customer reset dữ liệu và lọc Sales OPEN/đã đóng/ALL; chỉ dùng API giả lập. Khi rollout sửa CRM 2026-10-20, chạy `pnpm --filter @fitness/api db:indexes` để thêm hai index tra audit theo Member trước/sau đổi booking. Không cần đổi schema hoặc backfill audit cho phần CRM này; xem SOT 15/16 về dữ liệu cũ và contract.

Integration test cần MongoDB replica set và database test **riêng**; runner chỉ chấp nhận tên bắt đầu bằng `fitness_test_` và xóa database test khi kết thúc:

```powershell
$env:TEST_DATABASE_URL='mongodb://127.0.0.1:27027/fitness_test_sot_rebuild?replicaSet=rs0&directConnection=true'
pnpm --filter @fitness/api test:integration
```

## File được lưu trên GitHub

Mã nguồn AI trong `services/ai/`, `apps/app/src/features/ai-analysis/`, module `apps/app/modules/fitness-pose/` và script chuẩn bị pose đều được lưu trong Git. `.gitignore` loại trừ file tạo lại được như `.venv/`, `__pycache__/`, `*.pyc`, model `*.task`, `apps/app/public/mediapipe/`, `dist-*/` và `build/`. Sau khi clone, chạy các bước cài đặt ở trên để tạo lại assets cần cho AI; không cần ép Git theo dõi chúng.

## Giới hạn hiện tại

Chưa có công cụ chuyển dữ liệu PostgreSQL cũ. Test tự động không thay thế việc thử camera QR, push delivery, pose với người thật, iOS build và các kích thước màn hình trên thiết bị. Xem [testing & acceptance](docs/20-testing-acceptance-sot.md) để biết các điều kiện kiểm tra trước release.
