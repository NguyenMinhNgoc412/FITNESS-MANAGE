# FITNESS-MANAGE SOT — CHANGELOG

Tất cả thay đổi quan trọng của bộ Source of Truth được ghi tại file này.

Format:

- ngày thay đổi;
- version;
- nhóm thay đổi;
- file bị ảnh hưởng;
- lý do.

---

## [1.6.0] — 2026-09-17

### Added

- Chuẩn hóa UI/UX theo toàn bộ ảnh tham chiếu trong `screenshots/`: Owner dashboard, quản lý Member/PT, lịch-check-in theo role, AI Member, dashboard Member/PT và setting.
- Bổ sung `PR-AI-005` cho chatbot trợ lý vận hành của Owner/Admin với boundary đọc dữ liệu, RBAC và không tự mutate nghiệp vụ.
- Bổ sung technical contract cho Owner operational assistant.
- Cập nhật `AGENTS.md` để Agent bắt buộc đối chiếu `docs/13-ui-ux-sot.md` và ảnh khi làm UI.

### Affected files

- `docs/13-ui-ux-sot.md`
- `docs/02-product-requirements-sot.md`
- `docs/03-technical-architecture-sot.md`
- `docs/README.md`
- `AGENTS.md`
- `apps/api/src/owner-assistant/`
- `apps/app/app/owner-assistant.tsx`
- `apps/app/app/owner_admin.tsx`

### Reason

Owner bổ sung bộ ảnh UI và yêu cầu chatbot AI riêng cho vận hành Owner để giảm thời gian tổng hợp dữ liệu mà không thay đổi quyền hoặc lịch sử nghiệp vụ.

---

## [1.5.0] — 2026-09-17

### Changed

- Thêm UI/UX SOT cho design system Expo mobile/web.
- Dashboard ba role dùng visual language Modern Athletic Wellness: canvas sáng, mint/coral state, card bo lớn, KPI theo scope API, quick actions và bottom navigation.
- Ảnh `screenshots/dashboard-owner.jpg` được ghi nhận là visual reference cho hierarchy Owner dashboard; không tạo requirement hoặc business rule mới.

### Affected files

- `13-ui-ux-sot.md`
- `apps/app/src/design-system/`
- `apps/app/src/components/role-home.tsx`
- `apps/app/app/owner_admin.tsx`
- `apps/app/app/pt.tsx`
- `apps/app/app/member.tsx`

### Reason

Owner cung cấp design direction và ảnh mẫu để chuẩn hóa trải nghiệm quản lý trên mobile/web mà vẫn giữ nguyên phạm vi sản phẩm đã chốt.

---

## [1.4.0] — 2026-09-17

### Changed

- Hoàn thiện dashboard mobile theo ba role cho PT/Member, lịch tập, check-in, Guest, attendance và audit.
- Bổ sung API danh sách/cập nhật PT và Member; loại `passwordHash` khỏi response PT.
- Access token bị từ chối ngay khi session đã logout, hết hạn hoặc tài khoản không còn hoạt động.
- Khóa chuyển trạng thái AI bằng cập nhật có điều kiện để tránh xử lý trùng khi có request đồng thời.
- Structured pose analysis bổ sung góc gối, khuỷu tay, độ nghiêng vai/hông và độ lệch tâm trước bước OpenAI.
- Pin Expo chính xác ở phiên bản `57.0.0`.

### Reason

Hoàn thiện các luồng quản lý trên mobile và xử lý các điểm bảo mật, concurrency, structured CV còn thiếu trong implementation.

---

## [1.3.0] — 2026-09-16

### Changed

- Owner yêu cầu chuyển generative AI provider từ OpenAI API sang Gemini API qua Google Gen AI SDK.
- Giữ nguyên pipeline `video -> OpenCV -> MediaPipe Pose -> structured JSON -> Gemini API`; Gemini không nhận raw body video.
- Đổi cấu hình AI service từ `OPENAI_API_KEY`/`OPENAI_MODEL` sang `GEMINI_API_KEY`/`GEMINI_MODEL`.

### Affected files

- `03-technical-architecture-sot.md`
- `04-tech-stack-sot.md`
- `11-tech-ai-analysis-pipeline-sot.md`
- `services/ai/`

### Reason

Owner chỉ định Gemini là generative AI provider mới. Structured output vẫn được validate bằng Pydantic trước khi persist kết quả.

---

## [1.2.0] — 2026-09-16

### Added

- Chốt Expo SecureStore cho session token trên iOS/Android.
- Chốt session web chỉ giữ trong memory ở baseline, không persist refresh token trong localStorage/AsyncStorage.
- Chốt Expo FileSystem để upload body video trực tiếp tới signed URL, tránh giữ toàn bộ video trong JavaScript memory.
- Bổ sung design token/component dùng chung, safe area, keyboard handling, responsive container và accessibility state cho Expo client.

### Changed

- Đồng bộ dependency native theo Expo SDK 52.
- Hoàn thiện client refresh-token rotation, logout và navigation theo role.
- Luồng AI mobile bổ sung bước chọn/xác nhận video, progress, kết quả có cấu trúc và lịch sử analysis.
- `AI_MAX_UPLOAD_BYTES` trở thành cấu hình bắt buộc; giá trị cụ thể vẫn chờ Owner quyết định theo `11-tech-ai-analysis-pipeline-sot.md`.

### Affected files

- `04-tech-stack-sot.md`
- `CHANGELOG.md`
- `apps/app/`
- `apps/api/src/ai-analysis/`

### Reason

Khắc phục lỗi bundle mobile, bảo vệ refresh token theo platform và hoàn thiện UI/architecture cho các requirement `PR-AUTH-001`, `PR-AUTH-002`, `PR-AI-001..004` mà không thêm feature ngoài PRD.

---

## [1.1.0] — 2026-09-16

### Added

- Bổ sung `04-tech-stack-sot.md` làm Source of Truth riêng cho technology stack.
- Chốt frontend mobile bằng React Native + Expo + TypeScript.
- Chốt web dùng cùng Expo codebase qua React Native Web.
- Chốt Expo Router, Zustand, React Hook Form + Zod và Axios ở client.
- Chốt backend NestJS + TypeScript với REST API.
- Chốt authentication JWT + Refresh Token do NestJS quản lý.
- Chốt Prisma ORM và PostgreSQL trên Supabase Free.
- Chốt Supabase Storage cho media/private body video.
- Chốt AI service Python + FastAPI, Computer Vision bằng OpenCV + MediaPipe Pose và Generative AI bằng OpenAI API nhận structured JSON từ tầng CV.
- Chốt Expo Push Notifications.
- Chốt MVP chưa dùng WebSocket/Realtime.
- Chốt deploy ưu tiên local/free tier và source control Git + GitHub.

### Changed

- Đổi số các SOT chức năng/kỹ thuật phía sau để `04` dành riêng cho Technology Stack:
  - Auth/Role `04 -> 05`;
  - Member/PT Assignment `05 -> 06`;
  - Schedule/Check-in `06 -> 07`;
  - Guest Trial `07 -> 08`;
  - AI Body Analysis `08 -> 09`;
  - Data/Security/Audit `09 -> 10`;
  - AI Pipeline `10 -> 11`;
  - Agent Task Splitting `11 -> 12`.
- Technical Architecture bỏ trạng thái provider-neutral và bind trực tiếp vào stack đã chốt.
- AI technical pipeline khóa đường xử lý `FastAPI -> OpenCV -> MediaPipe Pose -> structured JSON -> OpenAI API`.
- Làm rõ Supabase chỉ được dùng như managed PostgreSQL + Storage trong baseline; không tự bật Supabase Auth, Realtime hoặc Edge Functions.

### Affected files

- `README.md`
- `02-product-requirements-sot.md`
- `03-technical-architecture-sot.md`
- `04-tech-stack-sot.md`
- `05-business-auth-role-access-sot.md`
- `06-business-member-pt-assignment-sot.md`
- `07-business-schedule-checkin-attendance-sot.md`
- `08-business-guest-trial-conversion-sot.md`
- `09-business-ai-body-analysis-sot.md`
- `10-tech-data-security-audit-sot.md`
- `11-tech-ai-analysis-pipeline-sot.md`
- `12-Agent-task-splitting-sot.md`

### Reason

Owner xác nhận đầy đủ tech stack đã chốt trước đó và yêu cầu có file chọn tech stack riêng để Codex không tự suy đoán framework/provider.

---

## [0.2.0] — 2026-09-16

### Added

- Tách SOT chi tiết cho Authentication & Role Access.
- Tách SOT chi tiết cho Member & PT Assignment, bao gồm rule 1-1 và đổi PT có lịch sử.
- Tách SOT chi tiết cho Schedule, flexible window tối đa 2 giờ, Member/PT check-in và attendance reconciliation.
- Tách SOT chi tiết cho Guest Trial & Conversion.
- Tách SOT chi tiết cho AI Body Analysis ở mức nghiệp vụ.
- Bổ sung technical SOT về Data Integrity, Security & Audit.
- Bổ sung technical SOT riêng cho AI Analysis Pipeline.
- Bổ sung Agent/Codex Task Splitting Guide.

### Changed

- README chuyển từ bộ 3 file lõi sang mô hình `core SOT + feature SOT + technical detail + task guide`.
- Product Requirements và Technical Architecture bổ sung mapping sang file chi tiết.
- Không thêm feature mới; toàn bộ file mới chỉ chi tiết hóa requirement/architecture đã tồn tại.

### Affected files

- `README.md`
- `02-product-requirements-sot.md`
- `03-technical-architecture-sot.md`
- `05-business-auth-role-access-sot.md`
- `06-business-member-pt-assignment-sot.md`
- `07-business-schedule-checkin-attendance-sot.md`
- `08-business-guest-trial-conversion-sot.md`
- `09-business-ai-body-analysis-sot.md`
- `10-tech-data-security-audit-sot.md`
- `11-tech-ai-analysis-pipeline-sot.md`
- `12-Agent-task-splitting-sot.md`

### Reason

Bộ 3 file lõi đúng ranh giới ownership nhưng chưa đủ granular để Codex nhận từng task chức năng mà không phải tự tách nghiệp vụ từ một PRD lớn.

---

## [1.0.0] — 2026-09-16

### Added

- Tạo lại bộ SOT canonical cho FITNESS-MANAGE theo cấu trúc tối giản gồm Product Brief, Product Requirements, Technical Architecture, README và CHANGELOG.
- Chốt ranh giới ownership giữa business direction, product behavior và architecture.
- Ghi lại ba role đăng nhập chính: Owner/Admin, PT, Member.
- Ghi rõ Guest/Trial chỉ là nghiệp vụ lead/tập thử, không phải role đăng nhập.
- Ghi rõ member được gán PT từ quá trình đăng ký và không sử dụng booking PT theo từng buổi.
- Ghi luồng đổi PT có lịch sử assignment.
- Ghi requirement check-in member/PT và reconciliation khi member đến nhưng PT không có mặt.
- Ghi hỗ trợ lịch/khung linh hoạt tối đa 2 giờ theo baseline đã chốt.
- Ghi nghiệp vụ khách mới check-in/tập thử để giữ dữ liệu cho thống kê và chăm sóc về sau.
- Ghi feature AI body analysis và nguyên tắc `raw video -> CV/pose structured result -> LLM recommendation/training plan`.
- Ghi nguyên tắc AI không chẩn đoán y khoa.
- Ghi kiến trúc audit/history-preserving và phương án test đồng thời ba role bằng session độc lập.

### Changed

- Loại bỏ cách tổ chức SOT cũ quá phân mảnh; gom về ba file canonical đúng ownership.
- Loại bỏ Staff role khỏi product model.
- Loại bỏ Dev role khỏi product model.
- Làm rõ PT continuity thay cho per-session PT booking.

### Affected files

- `README.md`
- `01-product-brief-sot.md`
- `02-product-requirements-sot.md`
- `03-technical-architecture-sot.md`
- `CHANGELOG.md`

### Reason

Owner yêu cầu làm lại bộ tài liệu SOT chuẩn, đủ rõ để Codex hiểu sản phẩm nhưng không duplicate trách nhiệm giữa các file.

---
