# FITNESS-MANAGE — Quy tắc làm việc cho AI Agent

**Phạm vi:** Toàn bộ repository `FITNESS-MANAGE`
**Ngôn ngữ trao đổi:** Tiếng Việt  
**Nguồn quyết định:** Bộ Source of Truth trong `docs/`

## 1. Mục tiêu và nguyên tắc chung

Agent phải thay đổi đúng phạm vi Owner yêu cầu, tuân thủ SOT hiện hành và báo cáo kết quả có thể kiểm tra được. Không tự suy diễn nghiệp vụ, role, workflow, provider hoặc công nghệ ngoài codebase và SOT.

Các nguyên tắc khóa:

- Chỉ có 3 role đăng nhập: `OWNER`, `PT`, `MEMBER`. `LEAD`, `TRIAL` và `EXTERNAL_PT` không phải role đăng nhập.
- Owner kiểm soát mutation nhạy cảm về customer, package, PT assignment và booking.
- Trial có 3 buổi cố định; một số điện thoại chỉ được hưởng Trial một lần; conversion phải giữ identity/history.
- Membership hỗ trợ `TIME_BASED` và `SESSION_BASED`; quota không được âm hoặc consume hai lần.
- Member dùng PT nội bộ chỉ có tối đa một primary PT active; assignment phải preserve history.
- Booking là từng buổi cụ thể; chỉ Owner tạo/sửa/hủy. PT và Member chỉ xem.
- PT attendance là log độc lập; không tự động match với Member check-in để kết luận có mặt/vắng.
- Member check-in ưu tiên QR, SĐT là fallback; `SELF_TRAINING` không cần PT.
- PT ngoài không có account; External PT Pass do Owner quản lý và có audit khi fallback.
- AI chỉ hỗ trợ Member kiểm tra form và gợi ý sửa tư thế; không tạo workout plan, không chẩn đoán y khoa và không thay PT.
- Raw AI video chỉ ở local device; chỉ structured metrics/JSON tối thiểu mới được rời thiết bị khi cần.

## 2. Giao tiếp và cập nhật tiến độ

1. Luôn trả lời Owner bằng tiếng Việt.
2. Trước khi sửa hoặc thực hiện hành động, nêu rõ: requirement/mục tiêu, file/module dự kiến tác động, hành động sẽ làm, lý do và rủi ro/giới hạn.
3. Với khảo sát chỉ đọc, có thể gộp lý do và rủi ro trong một cập nhật ngắn.
4. Với task có dùng công cụ, gửi cập nhật sau các mốc có ý nghĩa: đã đọc SOT, đã xác định nguyên nhân, hoàn tất implementation, có kết quả test/build.
5. Khi hoàn tất, phải nêu:
   - kết quả đạt được;
   - file đã sửa và thay đổi chính;
   - lệnh kiểm tra đã chạy cùng kết quả thực tế;
   - requirement/acceptance đã cover;
   - phần chưa làm, giới hạn và rủi ro còn lại nếu có.
6. Không tuyên bố đã đọc đủ tài liệu hoặc test/build thành công nếu chưa thực sự kiểm tra; nếu output bị rút gọn phải đọc lại phần cần thiết.

## 3. Thứ tự đọc tài liệu

### Mọi task

1. `docs/README.md`
2. `docs/01-product-brief-sot.md`
3. `docs/02-product-requirements-sot.md`
4. `docs/03-technical-architecture-sot.md`
5. `docs/04-tech-stack-sot.md`
6. SOT chi tiết đúng phạm vi task
7. `docs/CHANGELOG.md` nếu task thay đổi hoặc cần đối chiếu lịch sử quyết định

### Theo loại task

- UI/UX: đọc `docs/05-design-system-sot.md`, SOT business liên quan và ảnh trong `images/` theo bảng ở mục 7.
- Auth/RBAC: `docs/06-business-auth-role-access-sot.md`, `docs/17-tech-security-audit-sot.md`, `docs/16-tech-api-contract-sot.md`.
- Trial/CRM: `docs/07-business-lead-trial-conversion-sot.md`, `docs/08-business-membership-package-sot.md`, `docs/13-business-sales-trigger-notification-sot.md`.
- Profile/PT: `docs/09-business-member-profile-pt-assignment-sot.md`.
- Nhật ký tập luyện/tiến bộ/số đo/thư viện bài Member: `docs/21-business-member-workout-sot.md`, `docs/06-business-auth-role-access-sot.md`, `docs/15-tech-data-model-storage-sot.md`, `docs/16-tech-api-contract-sot.md`, `docs/17-tech-security-audit-sot.md`.
- Booking/schedule: `docs/10-business-booking-schedule-sot.md`, `docs/13-business-sales-trigger-notification-sot.md`.
- Check-in/attendance: `docs/11-business-checkin-attendance-sot.md`, `docs/12-business-external-pt-pass-sot.md`.
- AI/privacy: `docs/14-business-ai-form-analysis-sot.md`, `docs/18-tech-local-ai-privacy-sot.md`.
- Data/API/security: `docs/15-tech-data-model-storage-sot.md`, `docs/16-tech-api-contract-sot.md`, `docs/17-tech-security-audit-sot.md`.
- Chia task hoặc lập thứ tự triển khai: `docs/19-Agent-task-splitting-sot.md`.
- Verification/release: `docs/20-testing-acceptance-sot.md`.

Nếu phát hiện SOT thiếu quyết định bắt buộc hoặc mâu thuẫn, dừng phần implementation bị ảnh hưởng và báo rõ file/mục mâu thuẫn. Không tự chọn behavior để lấp khoảng trống.

## 4. Tech stack bắt buộc

- Client: React Native, Expo, TypeScript, React Native Web, Expo Router, Zustand, React Hook Form, Zod, Axios, `expo-sqlite`, `expo-file-system`.
- Backend/API: NestJS, TypeScript, REST API, JWT Access Token + Refresh Token, Prisma.
- Server database: MongoDB, ưu tiên MongoDB Atlas Free Tier. MongoDB là source-of-truth cho business data.
- Local data: SQLite qua `expo-sqlite` cho local AI session/result, file URI, cache hoặc pending sync phù hợp; SQLite không thay MongoDB.
- Storage: Supabase Storage chỉ cho cloud-safe files như avatar nếu cần; không dùng Supabase Auth, Realtime hoặc Edge Functions.
- AI: MediaPipe Pose on-device; Python + FastAPI; OpenCV khi phù hợp; OpenAI API chỉ nhận structured JSON/metrics tối thiểu.
- Notifications/source control: Expo Push Notifications, Git, GitHub.
- Realtime: không dùng WebSocket hoặc Supabase Realtime trong MVP; sau mutation dùng REST refresh/re-fetch.

Pipeline AI bắt buộc:

`video local → on-device pose/metrics → structured JSON → FastAPI → OpenAI nếu cần → structured feedback`

Không đổi stack, provider hoặc thêm dependency ngoài baseline nếu chưa cập nhật SOT sở hữu nội dung và `docs/CHANGELOG.md` theo quy trình quyết định.

## 5. Quy tắc implementation

1. Xác định requirement ID và acceptance trước khi sửa.
2. Không thêm feature ngoài `docs/02-product-requirements-sot.md`.
3. Business rule nằm ở service/domain; controller nhận request; component không tự quyết định nghiệp vụ.
4. Kiểm tra quyền ở server/service boundary; UI ẩn control không thay thế RBAC.
5. Preserve history cho conversion, package, assignment, booking cancellation, check-in, attendance và AI session/result; không ghi đè sự kiện cũ.
6. Mutation consume/quota/check-in phải có idempotency/concurrency guard phù hợp; booking phải chống overlap cho cả PT và Member.
7. Không cho PT/Member mutation booking hoặc PT assignment.
8. Không tạo service auto-match PT attendance với Member check-in.
9. Không upload raw AI video lên NestJS, FastAPI, Supabase Storage, OpenAI hoặc MongoDB; không đưa toàn video/base64 vào JS state.
10. AI chỉ hiển thị issue đã được algorithm implement/test; pose failure phải là trạng thái rõ ràng, không bịa feedback.
11. Không đưa secret, password, token, CCCD, raw video hoặc PII không cần thiết vào log, fixture, test output hay tài liệu.
12. Schema/data contract phải có migration hoặc cập nhật tương ứng theo công cụ hiện có.
13. Xem file lân cận trước khi sửa; giữ cách tổ chức, naming, format hiện tại; tránh refactor/format diện rộng.

## 6. UI/UX

Tuân thủ `docs/05-design-system-sot.md`: UI đơn giản, dễ đọc/thao tác, responsive mobile/tablet/web, màu tươi sáng nhưng không neon, ít animation, spacing 4/8px, touch target khoảng 44–48px, trạng thái không chỉ dựa vào màu.

Mọi flow phù hợp phải có loading, empty, error, success và permission state; error không lộ stack trace; nút mutation disable khi pending để chống double-submit.

- Owner: Dashboard, Khách hàng, Gói tập, Lịch tập, Check-in, PT, Sales/Cảnh báo, Logs/Báo cáo, Cài đặt. Dashboard ưu tiên KPI/queue, không biến thành nơi làm mọi CRUD.
- PT: Hôm nay, Lịch, Member, Tài khoản; chỉ xem lịch của mình/member được assign và thực hiện PT check-in; không có create/edit/delete booking, sales hoặc doanh thu.
- Member: Trang chủ, Lịch, Check-in, AI, Tài khoản; package/booking read-only, QR rõ ràng, AI theo flow video local → tự nhận diện và phân tích → nhận xét, theo phạm vi SOT 14/18.

## 7. Ảnh tham chiếu UI hiện hành

Không dùng thư mục `screenshots/` hoặc tên ảnh cũ. Ảnh canonical hiện nằm trong `images/`:

| Surface | Ảnh | Phạm vi tham chiếu |
|---|---|---|
| Owner | `images/owner/dashboard-owner.JPG` | Dashboard Owner |
| Owner | `images/owner/guest-member-owner.JPG` | Khách/Member, customer management |
| Owner | `images/owner/schedule-owner.JPG` | Lịch/booking Owner |
| Owner | `images/owner/check-in-owner.JPG` | Check-in tại quầy |
| PT | `images/pt/PT.JPG` | Trang chính PT |
| PT | `images/pt/schedule-pt.JPG` | Lịch PT |
| PT | `images/pt/member-pt.JPG` | Member được assign |
| PT | `images/pt/check-in-pt.JPG` | PT attendance check-in |
| Member | `images/member/home-member.JPG` | Home Member |
| Member | `images/member/schedule-member.JPG` | Lịch Member |
| Member | `images/member/check-in-member.JPG` | QR/check-in Member |
| Member | `images/member/AI-member.JPG` | AI form analysis Member |

Khi task làm giao diện, đối chiếu đúng surface/ảnh liên quan và giữ boundary quyền; không để ảnh tham chiếu tạo ra feature hoặc role ngoài SOT.

## 8. Kiểm tra và hoàn tất

Sau implementation, bắt buộc chạy test phù hợp. Chạy thêm build/lint/typecheck/generate migration khi repository hoặc task yêu cầu. Các release blocker cần đặc biệt kiểm tra:

- Member/PT mutation booking;
- duplicate Trial phone hoặc double consume/quota âm;
- booking overlap dưới concurrency;
- raw AI video xuất hiện trong network payload;
- Owner/PT xem AI result Member;
- PII/secret xuất hiện trong standard logs;
- RBAC chỉ nằm ở frontend.

Nếu không chạy được test, nêu chính xác lệnh, nguyên nhân và rủi ro còn lại; không trình bày task như đã verify hoàn toàn.

## 9. Cập nhật SOT

- Thay đổi product/requirement/business: cập nhật SOT business/`docs/02-product-requirements-sot.md` và `docs/CHANGELOG.md`.
- Thay đổi architecture: cập nhật `docs/03-technical-architecture-sot.md` và `docs/CHANGELOG.md`.
- Thay đổi stack/provider: cập nhật `docs/04-tech-stack-sot.md` và `docs/CHANGELOG.md`.
- Thay đổi UI/UX: cập nhật `docs/05-design-system-sot.md`; nếu đổi tên/thư mục ảnh, cập nhật `docs/README.md`, `AGENTS.md` và `docs/CHANGELOG.md`.
- `AGENTS.md` chỉ hướng dẫn cách làm việc, không thay thế SOT canonical.
