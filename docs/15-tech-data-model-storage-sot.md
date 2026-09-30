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
- timestamps

### `audit_logs`

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

- Raw AI video không có collection server.
- Không lưu CCCD vào log message.
- Audit chỉ lưu dữ liệu cần thiết, tránh snapshot toàn bộ PII nếu không cần.

## Schema triển khai — 2026-09-24

Prisma MongoDB dùng ObjectId. Các model nghiệp vụ kèm Session, Command (idempotency), WriteLock (serialization), DeviceToken, Notification và ExternalPtRequest. db:push tạo schema indexes; db:indexes bổ sung partial unique CCCD, customer.memberUserId và primary assignment active. Phải chạy cả hai khi dựng database.

Mutation nhạy cảm cập nhật một WriteLock trong cùng MongoDB transaction trước khi đọc/ghi nghiệp vụ; mọi API instance dùng cùng lock. Retry write conflict có giới hạn. Cách này ưu tiên tính đúng cho gym MVP, giới hạn throughput khi nhiều mutation đồng thời. Không có migration tự động từ PostgreSQL; database thật chưa được chuyển đổi.
