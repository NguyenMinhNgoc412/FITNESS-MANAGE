# FITNESS-MANAGE SOT 15 — Data Model & Storage

## 1. Data stores

### MongoDB Atlas

Server source-of-truth cho business data.

### SQLite

Local mobile database cho AI/offline/cache phù hợp.

### File System

Raw AI video local.

### Supabase Storage

Cloud-safe files như avatar nếu cần. Không lưu raw AI video.

---

## 2. MongoDB collections đề xuất

### `users`

- `_id`
- `role`: OWNER | PT | MEMBER
- `phone` unique
- `password_hash`
- `status`
- `refresh_token_version` hoặc session strategy tương đương
- timestamps

### `profiles`

Profile chính thức của account `OWNER`, `PT`, `MEMBER`:

- `user_id` unique
- `full_name`
- `cccd` unique sparse/partial
- `dob`
- `gender`
- `address`
- `avatar_url`

Không embed profile business vào `users` trong baseline để auth identity và hồ sơ nghiệp vụ có boundary rõ.

### `customers`

CRM identity canonical cho khách Trial và Member:

- `_id`
- `phone` unique
- `full_name`
- `trial_used_ever`
- `member_user_id` nullable, unique khi có
- `customer_status`: TRIAL | MEMBER | INACTIVE
- timestamps

Trial tồn tại bằng `customers` mà chưa cần `users`. Khi conversion, tạo `MEMBER` user/profile rồi link `customers.member_user_id`; không tạo một customer thứ hai. Đây là model baseline, Codex không tự hợp nhất `customers` vào `users`.

### `trial_entitlements`

- `customer_id`
- `total_sessions = 3`
- `used_sessions`
- `status`
- timestamps

### `memberships`

- `member_id`
- `mode`: TIME_BASED | SESSION_BASED
- `name`
- `start_at`
- `end_at` nullable
- `total_sessions` nullable
- `used_sessions` nullable
- `price_vnd` nullable: giá gói ghi nhận tại thời điểm cấp/gia hạn; không biểu thị trạng thái thanh toán
- `status`
- timestamps

### `pt_assignments`

- `member_id`
- `pt_id`
- `start_at`
- `end_at` nullable
- `status`
- `reason`
- `changed_by`

Enforce at service/index strategy để một Member tối đa một active assignment.

### `bookings`

- `member_id`
- `pt_id`
- `start_at`
- `end_at`
- `status`
- `created_by`
- `cancel_reason`
- `cancelled_by`
- timestamps

Overlap validation phải query trong service; MongoDB unique index không tự giải quyết interval overlap.

### `member_checkins`

- `subject_type`: TRIAL | MEMBER
- `customer_id/member_id`
- `context`: TRIAL | SELF_TRAINING | WITH_INTERNAL_PT | WITH_EXTERNAL_PT
- `booking_id` nullable
- `membership_id` nullable
- `external_pt_pass_id` nullable
- `checked_in_at`
- `method`: QR | PHONE
- `operator_id` nullable/Owner for manual
- `idempotency_key`

### `pt_attendance_logs`

- `pt_id`
- `checked_in_at`
- `source`
- `idempotency_key`

Không cần booking/member match field canonical.

### `external_pt_passes`

- `member_id`
- `total_uses`
- `used_uses`
- `status`
- `created_by`
- timestamps

### `sales_alerts`

- `customer/member_id`
- `type`: TRIAL_FINAL | MEMBERSHIP_EXPIRING_TIME | MEMBERSHIP_EXPIRING_SESSION
- `status`
- `triggered_at`
- `resolved_at`
- `owner_note`

### `notifications`

- recipient user
- type
- payload minimal
- delivery status/error
- `attempts` mặc định 0, tối đa 3 lần thử; `claimToken`, `leaseUntil` cho claim có thời hạn; `nextAttemptAt` cho retry delay
- timestamps

Từ 2026-10-20: index `(status, nextAttemptAt, createdAt)` phục vụ outbox worker. MongoDB không dùng Prisma migrate: dừng worker/API cũ, chạy `prisma:generate`, `db:push`, `db:indexes` rồi khởi động code mới. `db:indexes` backfill idempotent `attempts=0` chỉ cho record chưa có field; không reset trạng thái terminal/lịch sử. Worker đọc được field nullable/missing và phục hồi SENDING cũ không có lease. Không chạy đồng thời worker phiên bản cũ và mới vì worker cũ không hiểu claim token.

### `audit_logs`

CRM 2026-10-20 đọc thêm `before.memberId`/`after.memberId` của audit booking để không mất liên kết khi booking đổi Member. Truy vấn `aggregateRaw` qua Prisma MongoDB, kết hợp resource hiện tại và bằng chứng audit, sort `createdAt`/`_id`, phân trang trước projection allowlist; không trả snapshots cho client. Audit cũ có summary Member được đọc trực tiếp, không backfill hoặc ghi lại lịch sử. Bản ghi cũ thiếu cả liên kết hiện tại lẫn summary Member không thể suy ra identity đã mất.

Không đổi Prisma schema/field. `db:indexes` bổ sung idempotent `audit_booking_member_before` và `audit_booking_member_after` theo resourceType + nested memberId + createdAt. Khi triển khai chạy `pnpm --filter @fitness/api db:indexes` trên database đích; task không tự chạy lệnh này trên database nghiệp vụ. Không cần Prisma generate/db push riêng cho phần sửa CRM này.

- actor_id
- action
- resource_type
- resource_id
- reason nullable
- before summary nullable
- after summary nullable
- timestamp

---

## 3. SQLite local tables

### `local_ai_sessions`

- `id`
- `member_id`
- `exercise_type`
- `video_uri`
- `status`
- `analysis_json`
- `created_at`
- `updated_at`

### `local_sync_queue` nếu cần

- `id`
- `type`
- `payload_json`
- `status`
- `retry_count`

Không lưu access token plaintext trong SQLite nếu có secure storage phù hợp; token storage implementation cần security review.

---

## 4. Indexes bắt buộc

- unique phone;
- unique sparse/partial CCCD;
- customer phone unique;
- booking PT + time query indexes;
- booking Member + time query indexes;
- check-in timestamp/member indexes;
- PT attendance pt+time index;
- sales alert status/type indexes.

---

## 5. MongoDB + Prisma notes

- Prisma datasource dùng MongoDB.
- Dùng ObjectId mapping đúng type.
- Multi-document transaction chỉ dùng khi thật sự cần và môi trường MongoDB hỗ trợ replica set; Atlas đáp ứng.
- Không giả định relational cascade; cleanup/history rule phải explicit.
- Các counter consume cần atomic update/transaction/idempotency.

---

## 6. Data retention/privacy

FR-CHECKIN-008 daily guard sử dụng timestamp + memberId/customerId và ptId indexes hiện có trong transaction có WriteLock. Không thêm field/index nên không cần migration/db push; đọc được logs cũ. Không tự xóa duplicate lịch sử hoặc hoàn quota khi chưa có đối soát riêng.

- Raw AI video không có collection server.
- Không lưu CCCD vào log message.
- Audit chỉ lưu dữ liệu cần thiết, tránh snapshot toàn bộ PII nếu không cần.

## Schema triển khai — 2026-09-24

Prisma MongoDB dùng ObjectId. Các model nghiệp vụ kèm Session, Command (idempotency), WriteLock (serialization), DeviceToken, Notification và ExternalPtRequest. db:push tạo schema indexes; db:indexes bổ sung partial unique CCCD, customer.memberUserId và primary assignment active. Phải chạy cả hai khi dựng database.

Mutation nhạy cảm cập nhật một WriteLock trong cùng MongoDB transaction trước khi đọc/ghi nghiệp vụ; mọi API instance dùng cùng lock. Retry write conflict có giới hạn. Cách này ưu tiên tính đúng cho gym MVP, giới hạn throughput khi nhiều mutation đồng thời. Không có migration tự động từ PostgreSQL; database thật chưa được chuyển đổi.

## AI local schema v2 — 2026-10-08

Phiên mới có exercise_type=AUTO khi PENDING; kết quả nhận diện cập nhật SQUAT/PUSH_UP/LUNGE/UNKNOWN. analysis_json đọc được envelope v1 và v2. SQLite user_version=2 tạo local_ai_results (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id, member_id, analysis_json, created_at); migration giữ kết quả cũ, append kết quả và update latest trong cùng transaction. Reanalysis lỗi/hủy không xóa kết quả đã có; UI ghi rõ đó là kết quả trước nếu lần mới thất bại. User xóa phiên xóa results cùng session theo member scope. Không có thay đổi Prisma/MongoDB; raw video và history chỉ local.


## Hoạt động tập luyện — 2026-10-28

Thêm workout_sessions/workout_session_revisions, body_measurements/body_measurement_revisions, exercise_catalog/exercise_catalog_versions. Latest và revisions ghi cùng transaction/Command; unique (resourceId,version), partial unique body_measurements(memberId,measurementDate) khi ACTIVE; ngày lưu YYYY-MM-DD theo UTC+7. weightUnits/heightUnits là số nguyên, API kg/cm; exercises/catalogSnapshot JSON server. Xem SOT 21 mục 8/11 và prisma/schema.prisma cho contract/rollout generate, validate, db:push, db:indexes, db:seed-exercises. Không backfill dữ liệu cũ hoặc chạy trên business DB trong task.
