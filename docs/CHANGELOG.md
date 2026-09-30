# FITNESS-MANAGE SOT — CHANGELOG

Mọi thay đổi quyết định sản phẩm/nghiệp vụ/architecture/stack/UI quan trọng phải ghi ở đây.

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
