# FITNESS-MANAGE SOT 20 — Testing & Acceptance

## One check-in per UTC+7 day — 2026-10-09

- `pnpm --filter @fitness/api lint`: pass TypeScript/unused checks.
- `pnpm --filter @fitness/api build`: pass NestJS build.
- `pnpm test:api`: 7 suites / 51 tests pass. New cases cover daily guard, nửa đêm UTC+7/year rollover, đổi gói/context/method, customer identity sau conversion, Trial lượt cuối, PT độc lập, timestamp guard/log đồng nhất và pending external confirmation không trừ thêm package/pass.
- `git diff --check` cho service check-in/customer/external và integration test: pass.
- `pnpm --filter @fitness/api test:integration`: không chạy được (0 tests), thiếu TEST_DATABASE_URL tới isolated fitness_test_ database. Đã cập nhật fixtures cho ngày mới và thêm QR/SĐT race khác key, đổi gói cùng ngày và ngày sau; chưa xác minh MongoDB concurrency thực tế trong task này.
- Cover FR-CHECKIN-008/FR-AUDIT-002 và quota integrity. Không đổi UI/schema/stack; không tự hoàn số buổi đã trừ hoặc xóa duplicate logs quá khứ. Chưa quét camera/thiết bị thật.

## Owner package/check-in reports — 2026-10-09

- `pnpm lint`: pass API/app TypeScript và unused checks.
- `pnpm build`: pass NestJS build và Expo app typecheck.
- `pnpm test:api`: 6 suites / 41 tests pass. Report tests cover unique Member qua gia hạn, phân biệt mode cùng tên, dữ liệu rỗng, UTC+7/leap year/year rollover, 12 tháng/zero fill và PT/Member bị chặn trước database read.
- `pnpm test:app`: 12 suites / 51 tests pass (regression existing).
- `git diff --check` trên các file code liên quan: pass.
- Cover FR-PKG-008/FR-CHECKIN-007; chỉ read-only, không đổi schema/quota/history. Chưa kiểm thử báo cáo trên browser/native device hoặc tích hợp MongoDB thật; không suy ra số liệu thực tế từ mocked service tests.

## Counter check-in missing selection — 2026-10-08

- `pnpm lint` and `pnpm build`: pass API/app checks.
- `pnpm test:app`: pass 12 suites / 51 tests. QR confirmation requires package/internal booking, self-training omits stale booking, phone fallback omits token, external context cannot bypass dedicated flow.
- `pnpm test:api`: pass 5 suites / 36 tests. Valid QR/phone bodies accepted; missing IDs return safe field-specific errors; strict schema preserved.
- `node scripts/verify-qr.cjs | services/ai/.venv/Scripts/python.exe scripts/verify-qr.py`: 3 payload sizes round-trip decoded by OpenCV.
- Expo web export pass; browser UI regression pass with mocked API. Counter phone lookup uses the same form as QR-resolved identity: missing package sends zero requests, selecting package produces valid actual memberCheckinInput payload, missing internal booking adds zero requests. Synthetic 409 prevents consuming any quota.
- Cover FR-CHECKIN-001/003 and validation UX. Existing Owner guards, QR signature/expiry and transactional quota/idempotency service unchanged. No physical camera/device check-in, live database quota test or verification of Owner's exact selections in this task.

## Conversion validation feedback — 2026-10-08

- `pnpm lint`: pass API/app. `pnpm build`: pass NestJS build/app typecheck.
- `pnpm test:app`: pass 11 suites / 46 tests; identity checks before package builder, leading zeros/password preserved, safe field messages, date defaults independent of locale.
- `pnpm test:api`: pass 4 suites / 32 tests; strict conversion schema, valid session/time bodies, safe error messages for CCCD/password/date/price/quota/range and unknown fields rejected.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: pass.
- `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`: pass static export. Actual form submissions for custom session, preset 15-session and preset 3-month packages are validated against the real API conversionInput schema inside the mock route before synthetic 409 response. Existing identity preservation/pending and CRM/AI regressions also pass.
- Cover validation/error UX for FR-TRIAL-006, FR-PKG-004/007 and SOT 05/16/17; no change to service transaction/history/Owner boundary. No real Member created, no device test or reproduction of Owner's exact invalid data; cannot identify that specific field from a generic error alone.

## PT & Member, date-only package and owned package summaries — 2026-10-08

- `pnpm --filter @fitness/app lint`: pass; `pnpm test:app`: pass 10 suites / 41 tests.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: pass; export Android/iOS sang dist-sot-native: pass bundle Hermes, không phải native device/Xcode acceptance.
- Browser regression Edge với API mock xác minh nhãn Owner PT & Member, customer dùng memberUserId khác customerId để hiển thị gói, Member detail hiển thị tên gói/23 trên 30 lượt/giá 2.100.000; đổi sang Member khác có empty state và không giữ gói của người trước.
- Custom TIME_BASED có input date ở ngày bắt đầu/kết thúc; mẫu 3 tháng dùng ngày bắt đầu date và vẫn tính hạn theo tháng. Booking datetime và các regression CRM/AI trước đó giữ nguyên. Không thêm request quyền ngoài endpoint memberships hiện hành, không sửa API/schema/quota.
- Cover FR-PKG-004/005/007, FR-UI-001/004 và privacy/Owner boundaries SOT 06/08/09. Chưa xác minh trực tiếp database/điện thoại thật trong task này; fixture không chứng minh dữ liệu Member thực tế đã có liên kết hay gói.

## Package catalog cleanup and booking datetime UI — 2026-10-08

- `pnpm --filter @fitness/app lint`: pass TypeScript/unused checks; `pnpm test:app`: pass 10 suites / 41 tests.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: pass.
- `pnpm --filter @fitness/app exec expo export --platform android --platform ios --output-dir dist-sot-native`: pass bundle Hermes sau sửa cuối; không phải native device/Xcode acceptance.
- `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`: pass Edge headless với API mock. Xác minh không còn card “6 gói hội viên mẫu”, lựa chọn gói còn giá 1.200.000; form tạo/sửa lịch có datetime-local, chặn gõ trực tiếp, ngày 10/10/2026 10:15 Asia/Bangkok gửi ISO 03:15Z, kết thúc đúng 04:15Z, khóa khi gửi/mở lại khi lỗi. Sửa lịch prefill 07:00/08:00 từ fixture UTC 00:00/01:00 và giữ trường lý do. Member không có nút tạo/sửa. Các regression CRM/AI trước đó vẫn pass.
- Không thay đổi API/quy tắc booking hoặc package; cover FR-PKG-004/007, FR-BOOK-001/002/003/004 và FR-UI-001. Overlap/assignment/RBAC tại server giữ nguyên; browser mock không chứng minh tích hợp nghiệp vụ database.
- Native đã triển khai picker Android ngày → giờ và iOS xác nhận/hủy, dùng dependency có sẵn. Chưa thao tác picker trên thiết bị thật hoặc build iOS/Xcode; binary cũ thiếu module cần Development Build mới. Không gọi export JS là device acceptance.

## FastAPI stale dev process / 422 — 2026-10-08

- Runtime trước sửa: GET http://127.0.0.1:8000/openapi.json chỉ có FormRequest, không có AutoFormRequest; xác nhận tiến trình chưa nạp contract v2.
- scripts/ai.mjs bật reload giới hạn thư mục app; restart phiên dev hiện có, không mở thêm instance trên cổng đang dùng.
- `pnpm test:ai`: pass 12 tests. Probe bằng Python urllib sau restart: OpenAPI có AutoFormRequest, POST schemaVersion=2.0 với metrics pose-failure giả lập và token gateway đọc riêng từ env trả HTTP 200 / provider LOCAL. Không log token/payload người thật, không gọi OpenAI cho probe này. Cover FR-AI-008 contract runtime; không tuyên bố xác minh nhận xét LLM hoặc video người thật.

## Automatic exercise analysis — 2026-10-08

- `pnpm build`: pass NestJS build và Expo TypeScript; `pnpm lint`: pass API/app, chạy lại sau thay đổi storage/screen.
- `pnpm test:app`: pass 10 suites / 41 tests. Ba bài nhận diện/chu kỳ bằng dữ liệu pose giả, video tĩnh/trộn bài/thiếu dữ liệu → UNKNOWN hoặc failure; push-up dùng joint khuỷu; reference snapshot, tay thiếu tiêu chí, allowlist/cap 10 reports, SQLite history migration/transaction và retry/cancel.
- `pnpm test:api`: pass 3 suites / 24 tests. Strict v2 evidence/privacy, Member guards/roles, response sai exercise bị từ chối; payload media/identity không tới fetch. Existing domain regressions vẫn pass.
- `pnpm test:ai`: pass 12 tests. FastAPI token/body/schema, v1 tương thích, v2 ba bài/unknown, số đo-target-verdict canonical, mock OpenAI giữ configured model/store=false; refusal/timeout/extra số liệu fallback LOCAL. Starlette có cảnh báo deprecation httpx; không đổi dependency ngoài baseline.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: pass; `pnpm --filter @fitness/app exec expo export --platform android --platform ios --output-dir dist-sot-native`: pass sau thay đổi cuối. Native export là bundle Hermes, không phải iOS/Xcode compile hoặc acceptance thiết bị.
- `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`: pass Edge headless trên static export, chạy lại sau SQLite v2. Kiểm tra bỏ bước chọn bài, upload local/nút phân tích, MediaPipe thật với video đen → pose failure, pose Squat giả → tự request JSON v2/nhận xét/góc cụ thể, storage transaction/reanalysis/delete/cancel và privacy. API/OpenAI response được mock; viewport Member 390x844, Owner 1440x1000. Không dùng video/account người thật, không tuyên bố độ chính xác từ fixture.
- Live SDK thử bằng synthetic metrics, đọc cấu hình server-only mà không log secret: provider LOCAL, SDK RateLimitError HTTP 429. Không có diễn giải OPENAI live được xác minh; hệ thống vẫn giữ phản hồi local. Không suy diễn 429 chắc chắn do hết quota hay tốc độ khi chưa xác minh account.
- Cover FR-AI-002/003/005/006/007/008 và SOT 05/14/18. Chưa kiểm chứng bài gần giống/biến thể, góc quay thực tế, ngưỡng app hay native device/Swift build. Cần restart FastAPI dev hiện có để nạp code/env mới; không khởi động thêm server vào cổng đã dùng.
- Kiểm tra runtime: thử API ở port tạm không listen trong window 15 giây, đã dừng/cleanup tiến trình; không tính là startup pass. API watch hiện có sau rebuild đã listen lại ở 3000 và request AI không token trả 401. Các listener 3000/8000/8081 là phiên dev hiện có; không để thêm server kiểm thử chạy nền. Không dùng runtime này để tuyên bố flow live OpenAI v2 đã qua vì FastAPI cũ vẫn cần restart và call thật bị 429.

## 1. Test layers

- Unit: domain/service/rules.
- Integration: NestJS + MongoDB test environment.
- Component/UI: role surfaces/forms.
- E2E: end-to-end user flows.
- Manual device: QR, push, AI, local file/SQLite.

---

## 2. Critical business test matrix

### Trial

- phone mới tạo được Trial 3 lượt;
- cùng phone không tạo Trial lần hai;
- 3 check-in → 0;
- lần 4 bị chặn;
- double request không trừ 2;
- conversion giữ history.

### Membership

- time package active/expired đúng;
- session package consume đúng;
- quota không âm;
- renewal alert đúng ngưỡng;
- expired account vẫn login nếu account active nhưng check-in bị business rule xử lý.

### PT assignment

- một Member không có hai active primary PT;
- Owner đổi được;
- Member/PT mutation bị 403;
- history còn nguyên.

### Booking

- Owner tạo/sửa/hủy;
- Member/PT không mutation;
- PT overlap reject;
- Member overlap reject;
- cancel reason lưu;
- cancelled slot có thể dùng lại.

### Check-in

- QR resolve đúng;
- phone fallback đúng;
- SELF_TRAINING không cần PT;
- PT attendance tạo log độc lập;
- không có service tự đánh `PT_ABSENT` từ mismatch.

### External PT

- pass không hợp lệ bị chặn;
- confirm thành công consume 1;
- retry không consume 2;
- owner fallback được audit.

### AI privacy

- raw video không trong HTTP request;
- không upload Supabase;
- Owner/PT không query được AI result;
- pose fail không bịa feedback;
- unsupported exercise bị chặn rõ.

---

## 3. UI acceptance

Owner:

- search customer bằng SĐT ≤ vài thao tác;
- check-in screen không bị dashboard clutter;
- create/edit/cancel booking rõ reason.

PT:

- mở app thấy lịch hôm nay nhanh;
- không có booking mutation control;
- PT check-in rõ trạng thái.

Member:

- QR mở nhanh;
- package/booking read-only rõ;
- không có đổi PT/hủy booking;
- AI flow từng bước, không lẫn với gym management.

---

## 4. Release blockers

Không release nếu có một trong các lỗi:

- Member/PT có thể mutation booking;
- duplicate Trial phone lọt;
- quota counter âm/double consume;
- booking overlap lọt dưới concurrency test;
- raw AI video upload server;
- Owner/PT xem AI result Member;
- CCCD/password/token xuất hiện trong standard logs;
- RBAC chỉ dựa frontend.

## Verification rebuild — 2026-09-24

- pnpm check: pass lint TypeScript, NestJS build, Expo typecheck, 13 API + 15 app + 7 AI tests.
- pnpm --filter @fitness/api test:integration: pass 7 scenarios với MongoDB replica set test riêng. Bao gồm Trial unique/3 lượt/history, RBAC, booking race hai phía, quota/QR, attendance độc lập, external confirm/fallback, refresh/lock và CCCD privacy.
- pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web: pass.
- node scripts/verify-qr.cjs | services/ai/.venv/Scripts/python.exe scripts/verify-qr.py: OpenCV giải mã đúng 3 payload ngắn/220/271 ký tự.
- Android gradlew.bat :fitness-pose:compileDebugKotlin --console=plain: BUILD SUCCESSFUL, module autolink được nhận diện. Đây là compile module, chưa phải full APK/device acceptance.

Browser runner dùng synthetic accounts/video và chặn mọi origin ngoài ứng dụng/API test. Không dùng credential thật. Camera quét vật lý, push delivery, iOS build, pose trên người thật/offline thiết bị và toàn bộ matrix responsive chưa được xác minh; còn là release gates. Không suy ra độ chính xác algorithm từ fixture video đen hoặc unit samples.

Browser E2E cuối: PASS bằng pnpm --package=@playwright/test dlx -c "node scripts/browser-smoke.cjs" trên Edge headless. Owner tạo Trial/check-in, PT check-in + lịch read-only, Member QR + import OPFS/SQLite + MediaPipe video không thấy pose + delete đều qua. Không request ngoài origin ứng dụng/API test, không raw-video payload. Web MediaPipe pin 0.10.21; route PT me/attendance có regression test riêng. Kết quả này không xác nhận độ chính xác pose trên người thật.

git diff --check với apps/scripts/services/README/package/lock/.gitignore pass. Toàn working tree vẫn có Markdown hard-break whitespace sẵn trong SOT core của Owner; không sửa nội dung này chỉ để làm sạch diff.

### Design pattern regression — 2026-09-24

Sau khi chuẩn hóa UI theo SOT 05: `pnpm check` pass 13 API + 15 app + 7 AI tests; MongoDB integration pass 7 scenarios; Expo web export pass. Browser E2E pass Owner Trial/master-detail, Owner menu ở viewport 390x844, PT attendance/read-only và Member QR/AI local/xác nhận xóa. Network interception không thấy raw video hoặc request ngoài origin cho phép. Ảnh kiểm tra local gồm `owner-sot.png`, `owner-customers-sot.png`, `owner-mobile-menu-sot.png`, `pt-sot.png`, `member-sot.png`; thư mục `.local` bị ignore và không phải artifact release.

Regression mobile/web CRM xác minh thêm: Customer tabs đầy đủ và booking filter theo Member giữ Owner scope; PT/Member vẫn không được mở rộng dữ liệu. Drawer compact có backdrop, bottom tabs một hàng và booking day-group được kiểm tra trong web export/browser screenshots. Kiểm tra focus bằng bàn phím thực tế và screen reader trên thiết bị vẫn là release gate thủ công.

### UI regression fixes — 2026-10-07

- `pnpm lint`: pass API/app; sau sửa cuối, `pnpm --filter @fitness/app lint` pass lại.
- `pnpm build`: pass NestJS build và Expo typecheck.
- `pnpm test:app`: pass 6 suites / 21 tests; bổ sung workflow AI cho video mới sau kết quả cũ, khóa thao tác cạnh tranh và mở khóa sau hủy/lỗi storage.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: pass.
- `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`: pass trên Edge headless, Owner 1440x1000 và Member 390x844. Xác minh conversion giữ CCCD/mật khẩu giả khi đổi mẫu, áp dụng giá mẫu mới, khóa lựa chọn/input khi pending, dấu chọn và `aria-checked`, shortcut 48px/focus, video local qua OPFS/SQLite và pending/cancel/delete.
- Browser regression dùng API mock và identity sinh lúc chạy, không dùng database/credential thật. Đây không phải xác minh tích hợp nghiệp vụ hoặc độ chính xác pose. Chưa chạy lại native device/screen reader hoặc toàn bộ responsive matrix.

### AI web import failure — 2026-10-08

- Tái hiện trên Expo dev ở cổng 8081: video tới OPFS nhưng lưu phiên chờ vô hạn; SQLite worker URL ngoài workspace trả 404/`importScripts` NetworkError. Document `/` thiếu COOP/COEP; `/login` và `/member/ai` có headers.
- Sau sửa, `pnpm --filter @fitness/app lint` pass; `pnpm test:app` pass 7 suites / 22 tests, gồm timeout worker, đóng connection tới muộn và retry.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web` pass.
- `$env:UI_TEST_URL="http://localhost:8082"` rồi `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`: pass trên Expo dev server mới. Cùng runner không đặt `UI_TEST_URL` pass trên static export.
- Browser kiểm tra root document isolation recovery, progress khi lưu OPFS, thông báo lưu thành công, phiên SQLite, MediaPipe với video đen tạo POSE_NOT_DETECTED, cancel/delete/pending và lỗi môi trường thiếu headers. API dùng mock; chỉ video giả và identity sinh tại runtime, không raw-video HTTP payload.
- Cover FR-AI-002/003/006, failure UX SOT 14/18 và loading/error/success SOT 05. Chưa xác minh pose accuracy với người thật, video/codec cụ thể của Owner hoặc native device. Expo đang chạy phải restart để nhận rewrite trong `metro.config.js`.
- Kiểm tra lại cổng 8081: tiến trình cũ chưa nạp cấu hình. Đã restart bằng pnpm dev; UI_TEST_URL=http://localhost:8081 cùng browser runner pass chọn video, lưu local, hiện nút phân tích và phản hồi MediaPipe. Lần đầu server chưa sẵn sàng trả connection refused; chạy lại sau khi Metro sẵn sàng đã pass. API mock, chưa xác minh video cụ thể của Owner.

### Detailed squat angle report — 2026-10-08

- `pnpm --filter @fitness/app lint`: pass.
- `pnpm test:app`: pass 8 suites / 27 tests. Bổ sung geometry/aspect ratio, vector suy biến/điểm bị che, giới hạn mục tiêu, snapshot mục tiêu, bottom từng rep, chu kỳ bị che và allowlist cloud.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: pass.
- `$env:UI_TEST_URL="http://localhost:8081"` + `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`: pass. MediaPipe thật với video đen vẫn báo pose failure; sau đó mock pose riêng để xác minh UI gối 80°, khuỷu 180°, thân 0°, mục tiêu thân 40°, mở/ẩn báo cáo cùng các kiểm tra pending/privacy trước đó.
- Cùng browser runner không đặt `UI_TEST_URL`: pass bản static export; ảnh báo cáo với pose giả ở `.local/ai-angle-comparison.png` (ignored, không phải dữ liệu người thật hoặc artifact release).
- Cover FR-AI-003/005/006/007 và SOT 05/14/18. Không suy ra độ chính xác trên người thật từ pose mock; native chỉ có v1, ngưỡng tham chiếu app chưa được kiểm chứng, chưa hỗ trợ knee valgus/độ cong cột sống/hướng tay trước-sau.

### Mobile/web angle parity — 2026-10-08

- `pnpm --filter @fitness/app lint`: pass.
- `pnpm test:app`: pass 9 suites / 32 tests. Native bridge mock xác minh report từng lần/góc cụ thể, parity với helper web, điểm bị che, malformed frame, module cũ/Expo Go, cancel/kết quả tới muộn và bỏ raw landmarks khỏi result/payload.
- `gradlew.bat :fitness-pose:compileDebugKotlin --console=plain` (JDK 17, Android SDK local): BUILD SUCCESSFUL. Module autolink đúng và bridge v2 compile.
- `gradlew.bat :app:assembleDebug -PreactNativeArchitectures=arm64-v8a --console=plain`: lần đầu fail ở Gesture Handler CMake/Ninja do đường dẫn vượt 260 ký tự trên Windows, không phải lỗi compile module AI. Chạy lại với `--init-script ../../../.local/android-ai-short-path.gradle` cấu hình `buildStagingDirectory = C:/f-cxx/fitness-ai-20261008`: BUILD SUCCESSFUL (3m14s). Init script/cache chỉ local, không sửa vendor/stack; APK ARM64 debug ở `apps/app/android/app/build/outputs/apk/debug/app-debug.apk`, cần dev server, chưa cài lên thiết bị.
- `pnpm --filter @fitness/app exec expo export --platform web --output-dir dist-sot-web`: pass.
- `pnpm --filter @fitness/app exec expo export --platform android --platform ios --output-dir dist-sot-native`: pass bundle Hermes Android/iOS. Đây không phải native iOS/Xcode build.
- `UI_TEST_URL=http://localhost:8081` + `pnpm --package=@playwright/test dlx -c "node scripts/ui-regression.cjs"`: pass; cùng runner trên static export cũng pass. Video đen chạy MediaPipe thật kiểm tra pose failure; report góc dùng pose giả. API mock, không raw video HTTP payload.
- `adb devices`: không có thiết bị kết nối. Không có Xcode trên Windows; chưa compile native iOS hoặc test trực tiếp thiết bị/camera/pose người thật. Cover implementation FR-AI-003/005/006/007, nhưng không tuyên bố hoàn tất native device acceptance hoặc kiểm chứng ngưỡng.
