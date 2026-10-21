# FITNESS-MANAGE SOT — CHANGELOG

## 2026-10-21 — PT check-in bằng QR như Member

- Theo yêu cầu Owner, thay PT tự bấm có mặt bằng QR cá nhân hạn 2 phút để Owner quét/xác nhận tại quầy.
- Thêm GET pt/me/qr, POST checkins/pt Owner-only; bỏ POST pt/me/checkin. QR kind riêng, kiểm tra active, audit và source QR. Giữ log độc lập, daily guard UTC+7, idempotency/WriteLock và dữ liệu cũ; không đổi schema/stack/dependency.
- Cập nhật SOT 02/05/11/16/17; kết quả kiểm tra ghi SOT 20.

## 2026-10-20 — Sửa 4 khoảng trống CRM sau review

- Khi hết retry write conflict, transaction trả 409 CONCURRENT_CHANGE thay vì lỗi database 500; giữ nguyên khóa và số lần retry. Thêm unit regression cho retry thành công/hết retry.
- Giữ nhật ký booking theo bằng chứng Member trong audit before/after sau reassignment; không ghi lại audit cũ. Thêm hai nested indexes bằng db:indexes, không thay schema/provider.
- Thêm GET customers/:id/checkins Owner-only và phân trang riêng booking/check-in ở CRM; giữ preview detail cũ để tương thích, truy xuất được lịch sử sau 100 lượt.
- Customer detail trả allowlist thông tin Member chính thức cho Owner và UI hiển thị CCCD/trạng thái tài khoản tách khỏi phân loại customer.
- Sales mặc định OPEN, lọc các trạng thái hiện có hoặc ALL trước phân trang; đổi lọc reset trang 1, giữ mọi alert đã đóng và không tự convert/gia hạn.
- Cập nhật SOT 02/05/13/15/16/17; validation/unit/integration/browser ghi tại SOT 20. Không sửa business database hoặc dữ liệu người thật.

## 2026-10-20 — Sửa 5 lỗi design system sau review

- Khóa picker mẫu trong pending cấp/gia hạn gói bằng Form ổn định theo revision; không reset guard bằng remount khi đổi mẫu.
- Cho drawer/sidebar Owner cuộn trên màn thấp; giữ navigation theo role và touch target.
- Giữ palette thương hiệu, thêm màu semantic đậm cho chữ/CTA/error với contrast tối thiểu 4,5:1. Form xác nhận hủy lịch/PT/gói có destructive variant và nhãn cụ thể.
- Quầy hiển thị loading/error/retry/empty cho booking Member đang chọn, khóa xác nhận PT nội bộ khi booking chưa sẵn sàng; tự tập không bị khóa bởi booking. Dùng filter memberId của endpoint hiện có, không thêm API.
- Cập nhật SOT 05, bổ sung regression màu/UI; không đổi nghiệp vụ, schema, stack hoặc dependency. Kết quả kiểm tra thực tế tại SOT 20.

## 2026-10-20 — Sửa Dashboard UTC+7 và lỗi scheduler sau review

- Dashboard dùng chung khoảng ngày UTC+7 cho check-in/booking, bao gồm đầu ngày và loại trừ đầu ngày kế tiếp; không phụ thuộc timezone máy chủ.
- Bỏ refresh cảnh báo khỏi Dashboard và bỏ dependency SalesAlertsModule; đọc KPI không còn lấy business write lock. Giữ refresh lúc khởi động/mỗi 60 giây, ghi rõ độ trễ cập nhật tại SOT 03/13.
- Hai scheduler log mã lỗi cố định bằng Nest Logger khi vòng chạy thất bại; không log exception/stack/PII và vẫn chạy vòng tiếp theo. Không đổi schema, dependency, endpoint, quyền hoặc quota.
- Thêm regression test ranh giới ngày/năm, Owner-only/read-only Dashboard, scheduler failure/recovery/shutdown và log an toàn; kết quả thực tế ghi tại SOT 20.

## 2026-10-20 — Sửa notification và tách trách nhiệm module

- Theo review và yêu cầu Owner: notification có lease 60 giây/claim token, retry transport/429/5xx tối đa 3 lần và delay; phục hồi SENDING sau crash. Giữ best-effort, ghi rõ giới hạn duplicate khi upstream đã nhận nhưng response mất.
- Booking/external initiation chỉ enqueue trong transaction, không gửi push trên request; scheduler riêng xử lý outbox. Không đổi consume/history/RBAC/endpoint/provider.
- Thay `domain.controller.ts` và `operations.service.ts` bằng controller/module theo domain và Sales Alerts, Reports, Dashboard, Audit, Device Tokens service riêng; route me đứng trước dynamic id. Tách client form, useLoad, HTTP và date helpers khỏi ui.tsx, giữ hành vi giao diện.
- Notification schema bổ sung attempts/lease/retry fields và index; db:indexes backfill attempts thiếu, không reset record cũ. Hướng dẫn rollout tại README/SOT 15; cập nhật SOT 03/13. Kết quả kiểm tra thực tế ghi tại SOT 20.

## 2026-10-09 — Chặn điểm danh nhiều lần cùng ngày

- Owner báo QR quét lần hai trừ thêm buổi; code cũ chỉ chống lặp 30 giây.
- FR-CHECKIN-008 khóa một lượt vào tập/customer hoặc Member/ngày UTC+7, không reset bởi method/gói/context/conversion; PT một attendance log/ngày độc lập.
- Daily guard đặt trong transaction có shared write lock trước consume; request mới bị chặn 409 và không consume gói/Trial/pass. Same-key replay giữ nguyên. Chốt timestamp cùng guard để tránh race qua nửa đêm.
- Cập nhật SOT 02/07/08/11/12/15/16/17 và integration fixtures cho ngày mới; không đổi schema/stack hoặc tự hoàn quota lịch sử. Verification tại SOT 20.

## 2026-10-09 — Người đăng ký gói và check-in theo tháng

- Owner yêu cầu thêm hai thống kê; sau làm rõ đã bỏ yêu cầu doanh thu.
- FR-PKG-008 đếm Member duy nhất theo tên + mode trong lịch sử và số lần cấp/gia hạn, gồm hết hạn/hủy.
- FR-CHECKIN-007 báo cáo đủ 12 tháng theo năm/UTC+7; Member + Trial là tổng lượt vào tập, PT attendance riêng. Hai API read-only enforce Owner tại guard và service; không đổi schema/quota/history/stack.
- Cập nhật SOT 02/05/08/11/16; verification ghi tại SOT 20.

## 2026-10-08 — Lỗi dữ liệu khi xác nhận check-in sau quét QR

- Owner xác nhận lỗi xuất hiện sau nút Xác nhận vào tập. Form gửi id gói/booking rỗng khi chưa chọn; schema API từ chối với lỗi chung.
- Thêm client check-in payload helper kiểm tra lựa chọn, chỉ gửi booking trong context PT nội bộ; API trả lỗi trường cụ thể. Xóa identity/token cũ khi bắt đầu quét mới.
- Giữ cơ chế QR ký/hết hạn và quota/idempotency/Owner boundary hiện hành; không auto-select gói/booking và không đổi stack. Cập nhật SOT 05/16/20 cho FR-CHECKIN-001/003 và FR-AUDIT-002.

## 2026-10-08 — Làm rõ lỗi chuyển Trial thành Member

- Owner báo nhập đủ vẫn bị lỗi ở cả gói mẫu/tự nhập. Xác minh thông báo generic phía client/server che trường sai; chưa có dữ liệu lỗi thực tế để kết luận trường cụ thể của Owner.
- Conversion kiểm tra CCCD/mật khẩu trước gửi, giữ leading zeros/mật khẩu nguyên bản; lỗi package/date được diễn giải. Chuẩn hóa ngày mặc định độc lập locale, đồng bộ giới hạn giá/quota/tên/ngày với API existing.
- API giữ strict validation/400, bổ sung thông báo theo trường không echo PII; không đổi role/conversion transaction/history/quota. Cập nhật SOT 05/16/20 và regression cả mẫu/tự nhập.

Mọi thay đổi quyết định sản phẩm/nghiệp vụ/architecture/stack/UI quan trọng phải ghi ở đây.

## 2026-10-08 — PT & Member, date gói và hiển thị gói sở hữu

- Theo yêu cầu Owner, đổi nhãn nav PT thành PT & Member; không thay route/role/RBAC.
- Form package/conversion/gia hạn dùng date-only picker, mẫu tháng vẫn tự tính hạn; booking datetime giữ nguyên. Mở rộng control date/time existing, không thêm dependency.
- Thêm read-only package summary trong Member detail và hồ sơ customer mặc định; dùng memberUserId/user id và endpoint memberships hiện hành, trạng thái/quota do server trả. Ưu tiên ACTIVE và giữ gói lịch sử. Tab quản lý gói hiển thị các gói đã cấp trước form mới.
- Cập nhật SOT 05; cover FR-PKG-004/005/007 và FR-UI-001/004. Kiểm tra thực tế tại SOT 20.

## 2026-10-08 — Gọn trang Gói tập và bộ chọn datetime lịch tập

- Theo yêu cầu Owner, bỏ card danh sách “6 gói hội viên mẫu” đầu trang; giữ lựa chọn gói kèm giá và quyền sửa giá trước khi lưu theo FR-PKG-007.
- Form tạo/sửa booking dùng datetime control web/native, có prefill/confirm/cancel/pending. Giữ local-time → ISO, Owner-only mutation, reason/history và server overlap theo FR-BOOK-001/002/004/005/006.
- Dùng datetimepicker native đã có trong package/lockfile, không cài thêm dependency; cập nhật SOT 04/05. Verification thực tế ghi tại SOT 20.

## 2026-10-08 — Sửa FastAPI dev trả 422 do code cũ

- Xác minh OpenAPI của tiến trình 8000 chỉ có FormRequest v1 dù source đã hỗ trợ v2; request mới bị từ chối vì service chưa reload.
- Bật Uvicorn reload giới hạn services/ai/app trong scripts/ai.mjs, không đổi schema/privacy/stack. Restart đúng một phiên dev, giữ token gateway trong môi trường và không log secret.
- pnpm test:ai pass 12 tests; sau restart OpenAPI có AutoFormRequest, POST v2 với chỉ số pose-failure giả lập tới service thật trả 200. Nhận xét OpenAI live vẫn chưa được xác minh do HTTP 429 ở lần thử trước.

## 2026-10-08 — AI tự nhận diện bài, nhận xét từ số đo trên web/mobile

- Theo yêu cầu Owner, bỏ chọn bài trước; FR-AI-008 bổ sung nhận diện on-device heuristic SQUAT/PUSH_UP/LUNGE với UNKNOWN khi thiếu bằng chứng. Không mặc định biến thể Squat hai tay đưa trước; tay/thân chưa có tiêu chí thì chỉ báo góc.
- Shared domain web/native tính motion, đếm joint cycles, lưu báo cáo góc từng lần và tự gọi JSON contract v2. Raw video/landmarks/identity không gửi cloud; tối đa mười perRep, server diễn giải sáu bằng chứng ưu tiên lỗi mục tiêu.
- FastAPI thêm prompt hướng dẫn form tiếng Việt và Responses structured output, giữ OPENAI_MODEL đã cấu hình, store=false. Server giữ số đo/target/verdict cố định; timeout/refusal/429/rewrite sai bằng chứng fallback LOCAL với nguồn hiển thị rõ. Không đổi stack/provider baseline, không tạo giáo án/chẩn đoán.
- SQLite user_version=2 thêm history local_ai_results, migrate kết quả cũ và append kết quả trong transaction; thất bại/hủy phân tích lại không xóa kết quả trước. Xóa phiên theo Member xóa cả history/video.
- Dev AI runner kế thừa gateway token từ API env khi chưa cấu hình riêng, không ghi/log secret. Cập nhật SOT 02/03/05/14/15/16/18/20, hướng dẫn README và flow trong AGENTS.md; phiên/binary cũ giữ boundary tương thích.
- Kiểm thử app/API/AI, web browser và export ba platform ghi tại SOT 20. OpenAI thật với cấu hình hiện có trả HTTP 429; không tuyên bố đã nhận diễn giải live hoặc kiểm chứng nhận diện/góc trên video người thật/native device.

---

## [1.0.0] — 2026-09-23

### Added

- Dựng lại bộ SOT canonical theo cấu trúc core + business detail + technical detail + Codex guide + testing.
- Chốt 3 role đăng nhập: OWNER, PT, MEMBER.
- Chốt CCCD trong hồ sơ chính thức Member/PT; Trial chỉ cần tên + SĐT ở onboarding.
- Chốt Trial 3 buổi cố định và một SĐT chỉ Trial một lần.
- Chốt Sales Trigger cho Trial lượt cuối và Member sắp hết package.
- Chốt Membership hỗ trợ cả time-based và session-based.
- Chốt một primary PT active cho Member dùng PT nội bộ; chỉ Owner đổi/hủy.
- Chốt booking từng buổi do Owner độc quyền tạo/sửa/hủy; bỏ mô hình ca.
- Chốt PT/Member booking read-only và conflict rule một PT chỉ tập một Member cùng thời gian.
- Chốt Member có SELF_TRAINING.
- Chốt QR primary, phone fallback cho Member check-in.
- Chốt PT attendance độc lập; không auto-match với Member để kết luận vắng/mặt.
- Chốt External PT Pass; PT ngoài không account và tra cứu qua SĐT Member.
- Chốt AI chỉ kiểm tra form/gợi ý sửa; không tạo workout plan; chỉ Member xem.
- Chốt raw AI video local-only do privacy.
- Chốt UI/UX đơn giản, màu năng động/tươi sáng không gắt, ít animation.
- Chốt tech stack React Native + Expo + TypeScript, React Native Web, Expo Router, Zustand, RHF+Zod, Axios, NestJS, REST, JWT+Refresh, Prisma, MongoDB Atlas, Supabase Storage, SQLite/File System local, MediaPipe Pose, FastAPI/OpenCV/OpenAI, Expo Push, Git/GitHub.

### Changed

- Database server chuyển từ PostgreSQL/Supabase Database sang MongoDB Atlas.
- Supabase chỉ còn vai trò Storage cho cloud-safe file; không dùng Auth/Realtime.
- SQLite được chính thức hóa cho local mobile AI/cache, không thay server DB.
- AI architecture chuyển sang raw-video local + structured JSON cloud để phù hợp privacy.

### Source reconciliation

- Giữ tinh thần CRM/Trial 3 buổi, sales trigger, External PT và offline-first AI từ đề cương tham khảo.
- Loại bỏ Staff role khỏi đề cương tham khảo; Owner kiêm nghiệp vụ quầy trong MVP.
- Không dùng React/Vite, Express, MongoDB schema cũ nguyên trạng; tech stack canonical theo quyết định mới.
- Khác đề cương tham khảo: AI result không cho Owner/PT xem; chỉ Member xem theo quyết định đã chốt.

## [Implementation] — 2026-09-24

- Rebuild API MongoDB, auth OWNER/PT/MEMBER, Trial/conversion, membership, assignment, owner-only booking, check-in/PT attendance độc lập, External PT Pass và sales/notification/audit.
- Thay UI legacy bằng ba vùng Expo Router theo SOT/ảnh hiện hành; thêm QR local và AI sessions SQLite/File System/OPFS.
- Bỏ pipeline upload video/workout plan; MediaPipe on-device và FastAPI strict JSON-only, chỉ issue squat depth đã implement/test.
- Bổ sung transaction/idempotency/concurrency checks, MongoDB integration, browser smoke, QR decoder verification và native pose module.
- Chi tiết implementation trong SOT 04/15/16/17/18; trạng thái verification và giới hạn trong 19/20. Không chuyển dữ liệu thật hoặc sửa .env cá nhân.
- Chuẩn hóa design pattern theo SOT 05: Owner mobile drawer, KPI hierarchy, Customer CRM master/detail, record picker có tìm kiếm, check-in progressive disclosure, empty state theo ngữ cảnh và AI step flow có xác nhận xóa.
- Hoàn thiện mobile/web CRM: token-driven components, semantic badges, web focus/hover, drawer backdrop, bottom tabs một hàng, customer mobile detail và đủ section CRM, booking nhóm theo ngày.

## [UI navigation] — 2026-09-29

- Thanh điều hướng dưới của PT/Member hiển thị icon và nhãn cho mục đang mở, chỉ icon cho mục còn lại; giữ tên đầy đủ cho trợ năng và vùng chạm 48px.

- Hoàn thiện icon mobile dễ nhận biết; form sửa booking điền sẵn lịch hiện tại; CRM Owner đọc nhật ký audit theo hồ sơ qua API Owner-only, không trả snapshot nhạy cảm.

## [Membership samples] — 2026-09-29

- Bổ sung 6 gói hội viên mẫu 15/30/45 buổi và 3/6/12 tháng với giá VNĐ gợi ý tham khảo thị trường; Owner có thể sửa giá trước khi cấp gói.
- Membership lưu `priceVnd` tùy chọn để giữ lịch sử giá, không thêm payment status/gateway; bản ghi cũ giữ nguyên. Cập nhật Prisma schema và cần chạy `prisma db push` cho database đích khi triển khai.

## [UI regression fixes] — 2026-10-07

- Giữ dữ liệu identity khi đổi mẫu gói conversion; khóa lựa chọn khi form pending.
- Sửa stepper AI theo phiên hiện tại và chống thao tác xóa lặp/cạnh tranh với import, phân tích.
- Thêm dấu chọn record picker, shortcut Home có vùng chạm 48px và chuẩn hóa token dùng lại ở UI/shell.
- Giữ nguyên API, quyền và business rules; bổ sung kiểm tra hồi quy workflow AI và UI.

## [AI web import feedback] — 2026-10-08

- Tái hiện video local lưu xong nhưng SQLite dev worker 404 với pnpm store ngoài workspace; thêm entry/rewrite worker nội bộ và khắc phục document `/` thiếu isolation trước đăng nhập.
- Thêm loading stage, thông báo lưu video thành công/hướng dẫn phân tích, kiểm tra môi trường local storage và timeout khởi tạo SQLite cùng cleanup connection tới muộn.
- Test hồi quy dev web và static export cho lưu video local, MediaPipe pose failure, thiếu headers, pending/cancel/delete; không đổi pipeline raw-video local-only.

## [AI angle comparison] — 2026-10-08

- Owner yêu cầu so sánh góc từ video, chọn Squat không tạ hai tay đưa trước. Thêm FR-AI-007 và báo cáo góc gối/thân/khuỷu/tay tại điểm thấp nhất từng lần trên web.
- Phân biệt mục tiêu tham chiếu app với tiêu chuẩn đã kiểm chứng; thân không có ngưỡng chung, cho nhập mục tiêu tùy chọn theo hướng dẫn PT. Điểm thiếu không kết luận đúng/sai.
- JSON local có detail v2, phiên cũ/native vẫn đọc kết quả độ sâu. Payload giải thích vẫn allowlist v1; không thay stack/provider hoặc gửi video/landmarks lên cloud.

## [AI mobile/web parity] — 2026-10-08

- Owner yêu cầu mở rộng báo cáo góc cho mobile và web. FR-AI-007 nay bao gồm Android/iOS Development Build.
- Native MediaPipe trả landmarks tối thiểu qua bridge local v2; JS/web dùng chung phép đo góc, chọn gối đủ rõ và thuật toán so sánh. Không gửi face landmarks/frame/video và không lưu raw landmarks trong kết quả.
- Guard binary native cũ/Expo Go, validate frame bridge và bỏ kết quả tới muộn sau cancel. Giao diện cùng report/input tham chiếu trên mobile/web; dữ liệu cũ không tự bịa góc.
- Cần rebuild/cài lại app native; SQLite/API/cloud contract không đổi, không thêm dependency/provider.
