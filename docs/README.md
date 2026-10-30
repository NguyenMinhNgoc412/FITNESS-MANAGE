# FITNESS-MANAGE — Source of Truth (SOT)

**Trạng thái:** Canonical baseline đã chốt  
**Dự án:** FITNESS-MANAGE  
**Ngày cập nhật:** 2026-09-23  
**Ngôn ngữ:** Tiếng Việt  
**Mục tiêu:** Làm nguồn tham chiếu duy nhất cho Codex/dev khi phân tích, thiết kế, implement và test hệ thống.

---

## 1. Mục đích

Bộ tài liệu này khóa các quyết định đã chốt về:

- sản phẩm và boundary;
- nghiệp vụ phòng gym thực tế;
- quyền của `OWNER`, `PT`, `MEMBER`;
- Trial 3 buổi, CRM và Sales Trigger;
- Membership theo tháng hoặc theo số buổi;
- PT nội bộ, assignment và booking;
- check-in Member, Trial, PT nội bộ và PT ngoài;
- AI kiểm tra form bài tập với raw video local-only;
- tech stack, data ownership, API, security, UI/UX và testing.

Codex **không được tự bổ sung feature, role, workflow hoặc provider** ngoài bộ SOT này.

---

## 2. Thứ tự đọc bắt buộc

### 2.1. Mọi task

Đọc theo thứ tự:

1. `README.md`
2. `01-product-brief-sot.md`
3. `02-product-requirements-sot.md`
4. `03-technical-architecture-sot.md`
5. file chi tiết đúng phạm vi task
6. `CHANGELOG.md` nếu cần biết lịch sử thay đổi

### 2.2. Task giao diện

Đọc thêm:

- `05-design-system-sot.md`
- file business của chức năng đang làm

### 2.3. Task database/API/backend

Đọc thêm:

- `04-tech-stack-sot.md`
- `15-tech-data-model-storage-sot.md`
- `16-tech-api-contract-sot.md`
- `17-tech-security-audit-sot.md`

### 2.4. Task AI

Đọc thêm:

- `14-business-ai-form-analysis-sot.md`
- `18-tech-local-ai-privacy-sot.md`
- `04-tech-stack-sot.md`

### 2.5. Khi giao việc cho Codex

Đọc thêm:

- `19-Agent-task-splitting-sot.md`
- `20-testing-acceptance-sot.md`

---

## 3. Bản đồ tài liệu

| File | Sở hữu quyết định |
|---|---|
| `01-product-brief-sot.md` | Why, định vị, audience, outcome, product principles, business model, boundary |
| `02-product-requirements-sot.md` | Scope, requirement ID, hành vi và acceptance cấp sản phẩm |
| `03-technical-architecture-sot.md` | Kiến trúc hệ thống cấp cao, module/layer/data flow |
| `04-tech-stack-sot.md` | Framework, database, provider, library và rule đổi stack |
| `05-design-system-sot.md` | UI/UX, palette, typography, component, layout theo role |
| `06-business-auth-role-access-sot.md` | 3 role đăng nhập và quyền |
| `07-business-lead-trial-conversion-sot.md` | Lead/Trial 3 buổi, check-in trial, conversion |
| `08-business-membership-package-sot.md` | Gói theo tháng/buổi, lifecycle, gia hạn |
| `09-business-member-profile-pt-assignment-sot.md` | Hồ sơ Member/PT, CCCD, PT chính, đổi/hủy PT |
| `10-business-booking-schedule-sot.md` | Booking từng buổi, Owner quản lý lịch, conflict rule |
| `11-business-checkin-attendance-sot.md` | QR/SĐT, context check-in, PT attendance log |
| `12-business-external-pt-pass-sot.md` | PT ngoài, pass, check-in bằng SĐT Member, xác nhận |
| `13-business-sales-trigger-notification-sot.md` | Trial cuối, Member sắp hết gói, notification |
| `14-business-ai-form-analysis-sot.md` | AI kiểm tra form, output và privacy nghiệp vụ |
| `15-tech-data-model-storage-sot.md` | MongoDB server, SQLite local, collection/entity model |
| `16-tech-api-contract-sot.md` | REST boundary, endpoint/resource contract và error rules |
| `17-tech-security-audit-sot.md` | Auth, RBAC, token, audit, concurrency, integrity |
| `18-tech-local-ai-privacy-sot.md` | Local video, MediaPipe, SQLite, File System, JSON-only cloud |
| `19-Agent-task-splitting-sot.md` | Thứ tự và cách chia task Codex |
| `20-testing-acceptance-sot.md` | Test matrix và release gate |
| [21-business-member-workout-sot.md](21-business-member-workout-sot.md) | Nhật ký, tiến bộ, số đo cơ thể và thư viện bài Member |
| `CHANGELOG.md` | Lịch sử thay đổi SOT |

---

Cấu trúc service và component/hook dùng chung của hoạt động tập luyện sau review nằm tại [SOT 03](03-technical-architecture-sot.md); nghiệp vụ vẫn theo SOT 21.

## Proposal lịch sử — không thay thế SOT canonical

Hướng dẫn kiểm thử: [30 Member và lịch sử hoạt động nhiều ngày](testing-activity-scenario.md), dùng MongoDB test riêng và giữ dataset/báo cáo để kiểm tra lại; không thay thế nghiệp vụ SOT 21.

- [Proposal hoạt động tập luyện](proposals/member-workout-journal-progress.md): lịch sử thảo luận trước triển khai. Owner đã yêu cầu thực hiện ngày 2026-10-28; dùng [SOT 21](21-business-member-workout-sot.md) làm nguồn hiện hành.

## 4. Quy tắc ưu tiên khi mâu thuẫn

1. `01` quyết định **sản phẩm tồn tại để làm gì và boundary**.
2. `02` quyết định **feature/behavior nào thuộc scope**.
3. Các file business `06`–`14` và `21` quyết định **nghiệp vụ chi tiết**.
4. `03` quyết định **kiến trúc cấp hệ thống**.
5. `04` quyết định **tech stack/provider**.
6. Các file technical `15`–`18` quyết định **implementation contract kỹ thuật**.
7. `05` quyết định **UI/UX và design system**.
8. `19` chỉ chia việc, không được sửa nghiệp vụ.
9. `20` chỉ định cách verify, không được tạo feature mới.
10. `CHANGELOG` chỉ ghi lịch sử; không thay thế nội dung canonical.

Nếu hai file cùng cấp mâu thuẫn, **dừng implement và báo rõ hai đoạn mâu thuẫn**. Không tự chọn một bên.

---

## 5. Quyết định khóa nhanh

1. Chỉ có 3 role đăng nhập: `OWNER`, `PT`, `MEMBER`.
2. Không có `STAFF`, `DEV`, `TRIAL`, `LEAD`, `EXTERNAL_PT` dưới dạng role đăng nhập.
3. Trial chỉ cần tên + SĐT, có **3 buổi cố định**.
4. Một SĐT chỉ được hưởng Trial **một lần**.
5. Khi Trial chuyển Member, giữ cùng customer identity/history; không tạo hồ sơ trùng.
6. Hồ sơ Member/PT chính thức có CCCD; CCCD unique khi đã nhập.
7. Membership hỗ trợ **gói theo thời gian** và **gói theo số buổi**.
8. Có cảnh báo Trial buổi cuối và Member sắp hết gói.
9. Member dùng PT nội bộ có một PT chính active tại một thời điểm.
10. Member muốn đổi/hủy PT phải báo Owner; chỉ Owner thay đổi assignment.
11. Có booking PT từng buổi.
12. Chỉ Owner tạo/sửa/hủy booking; Member/PT chỉ xem.
13. Một booking là một khoảng giờ cụ thể; bỏ khái niệm ca.
14. Một PT chỉ tập với một Member trong cùng khoảng thời gian; không overlap.
15. Member có thể `SELF_TRAINING` không cần PT.
16. Member check-in ưu tiên QR, SĐT là fallback.
17. PT nội bộ check-in độc lập; hệ thống **không tự match** PT log với Member log để kết luận attendance.
18. Owner đối chiếu booking + check-in logs khi cần điều tra.
19. PT ngoài không account; Member mua External PT Pass với Owner; tra bằng SĐT Member.
20. AI chỉ giúp Member kiểm tra form bài tập và gợi ý sửa tư thế; không tạo workout plan.
21. Chỉ Member xem AI result.
22. Raw AI video phải local-only; không upload cloud trong flow chuẩn.
23. MongoDB Atlas là server source-of-truth; SQLite là local mobile store/cache.
24. UI đơn giản, dễ nhìn, dễ thao tác; màu năng động/tươi sáng nhưng không gắt; rất ít animation.

---

## 6. Quy tắc cho Codex/dev

- Không tự thêm role.
- Không tự thêm Staff vì tài liệu tham khảo cũ có Lễ tân; trong MVP Owner kiêm thao tác quầy.
- Không cho Member/PT mutation booking.
- Không tự tạo attendance matching engine giữa PT và Member.
- Không upload raw AI video lên NestJS, FastAPI, Supabase Storage hoặc OpenAI.
- Không dùng Supabase Auth/Realtime/Edge Functions.
- Không đổi MongoDB sang PostgreSQL.
- Không dùng SQLite làm server database.
- Không đưa business data canonical vào Zustand.
- Không dùng AI để tạo giáo án thay PT.
- Không cho PT/Owner xem AI result của Member.
- Không tự thay provider/library đã khóa trong `04`.
- Nếu implementation buộc phải đổi SOT, ghi proposal gồm: vấn đề, lý do, file ảnh hưởng, migration, test; chờ duyệt trước.

---

## 7. Quy tắc cập nhật SOT

- Thay đổi nghiệp vụ: sửa `02` và file business đúng phạm vi; cập nhật `CHANGELOG`.
- Thay đổi architecture: sửa `03`; cập nhật `CHANGELOG`.
- Thay đổi tech stack: sửa `04`; cập nhật `CHANGELOG`.
- Thay đổi data/API/security/AI implementation: sửa file technical tương ứng.
- Thay đổi UI/UX: sửa `05`.
- Thêm/xóa/đổi tên file: cập nhật `README` và `CHANGELOG`.
- Không duplicate đặc tả chi tiết vào file tổng quát.


Minh họa 20 bài Member theo yêu cầu 2026-10-30: quyết định tại SOT 21/SOT 05; nguồn, giấy phép và hash từng ảnh tại [exercise-demos/README](../apps/app/assets/exercise-demos/README.md) và provenance.json cùng thư mục. Kiểm tra assets bằng `node scripts/verify-exercise-demos.cjs`; kết quả thực tế ở SOT 20.
