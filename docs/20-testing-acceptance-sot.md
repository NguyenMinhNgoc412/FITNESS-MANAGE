# FITNESS-MANAGE SOT 20 — Testing & Acceptance

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
