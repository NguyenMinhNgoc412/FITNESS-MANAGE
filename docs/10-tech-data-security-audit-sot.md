# FITNESS-MANAGE SOT 10 — Technical Spec: Data Integrity, Security & Audit

**Trạng thái:** SOT kỹ thuật chi tiết  
**Dự án:** FITNESS-MANAGE  
**Ngày cập nhật:** 2026-09-16  
**Liên quan:** `03-technical-architecture-sot.md`, `04-tech-stack-sot.md`, SOT `05`–`09`  
**Nguyên tắc:** File này chi tiết hóa invariant, transaction, RBAC, history và audit. Không thêm feature.

---

## 1. Mục tiêu kỹ thuật

1. Không để dữ liệu lịch sử bị rewrite bởi trạng thái hiện tại.
2. Không để hai PT assignment active chồng nhau cho một Member.
3. Không để role vượt quyền bằng cách gọi API trực tiếp.
4. Check-in raw phải immutable ở mức nghiệp vụ.
5. Action quan trọng có audit trail.
6. Retry/double tap không tạo duplicate business event nguy hiểm.

---

## 2. Domain ownership

| Domain | Source of truth |
|---|---|
| Identity/role | user/account records |
| PT profile | PT profile records |
| Member profile | Member profile records |
| Current/historical PT | time-bound assignment records |
| Schedule | schedule records có context PT/Member |
| Presence evidence | raw check-in records |
| Attendance status | reconciliation records/result |
| Guest trial | guest/trial records |
| AI run/result | analysis run + result/output records |
| Audit | append-only audit records |

Không dùng UI cache làm source of truth.

---

## 3. Data invariants

### 3.1. Assignment uniqueness

Tại một thời điểm business hợp lệ:

```text
COUNT(active primary assignment for member) <= 1
```

Enforce bằng Prisma transaction kết hợp PostgreSQL constraint/index phù hợp.

### 3.2. Historical immutability

Không update record cũ để giả lập trạng thái mới khi có thể biểu diễn bằng event/version mới.

Ví dụ:

- đổi PT -> close old + create new;
- AI run mới -> create new run;
- attendance resolution -> lưu resolution/audit, không sửa timestamp raw check-in.

### 3.3. Referential context

Schedule/check-in/attendance cần đủ reference hoặc snapshot để lịch sử không phụ thuộc vào current assignment sau này.

---

## 4. Transaction contracts

### 4.1. Register Member + initial PT assignment

```text
BEGIN
  create/activate member
  validate PT active
  create initial assignment
  optional create initial schedule
  append audit
COMMIT
```

Nếu assignment bắt buộc mà fail -> rollback registration completion.

### 4.2. Change PT

```text
BEGIN
  lock/read current assignment
  validate no conflicting transition
  validate new PT active
  end old assignment
  create new assignment
  update/recreate affected future schedules according to product flow
  append audit
COMMIT
```

### 4.3. Guest conversion

```text
BEGIN
  validate guest not converted
  create member/account
  create initial assignment
  link guest -> member
  mark conversion state
  append audit
COMMIT
```

### 4.4. Attendance resolution

Raw check-in không xóa. Resolution tạo/update business result + audit theo quyền.

---

## 5. Idempotency

Các action dễ retry phải có protection:

- check-in;
- guest conversion;
- change PT;
- AI analysis submit;
- account status update nếu client có retry.

Mục tiêu:

- double tap không tạo hai check-in cùng business action;
- retry network không double-convert Guest;
- retry change PT không tạo hai assignment active.

Implementation dùng NestJS service boundary + Prisma/PostgreSQL transaction/constraint theo `04-tech-stack-sot.md`.

---

## 6. Time handling

1. Lưu timestamp theo chuẩn nhất quán.
2. Business display dùng timezone đã cấu hình cho phòng gym/client.
3. Reconciliation phải so sánh theo một time basis rõ ràng.
4. Không phụ thuộc clock client làm nguồn thời gian tin cậy duy nhất cho action nhạy cảm nếu backend có thể ghi server time.
5. Assignment/schedule history phải dùng effective time, không chỉ `updated_at`.

---

## 7. Authorization enforcement

### 7.1. Server/service boundary

Mỗi command/query phải xác định:

- actor identity;
- actor role;
- target entity;
- scope relationship nếu là PT/Member.

### 7.2. Owner/Admin

Có thể query/manage toàn scope sản phẩm, nhưng vẫn phải qua audited service cho action quan trọng.

### 7.3. PT

Query Member cần check active/historical assignment scope theo policy cụ thể của endpoint.

### 7.4. Member

Query/mutation chỉ với own member id; không tin `memberId` gửi từ client nếu khác identity mapping.

---

## 8. Audit contract

Audit tối thiểu cho:

- create/update/deactivate PT/Member quan trọng;
- change PT assignment;
- account lock/inactive;
- attendance exception resolution;
- Guest conversion;
- manual change liên quan AI history nếu feature có cho phép.

Một audit event nên chứa:

- actor;
- action;
- entity type/id;
- timestamp;
- request/correlation id;
- before/after summary ở mức phù hợp, tránh copy secret/raw media.

Audit không thay thế domain record chính.

---

## 9. Sensitive data

Nhóm cần bảo vệ cao:

- authentication secret/token;
- contact data;
- body video;
- AI analysis result;
- audit có dữ liệu vận hành.

Rule:

- không public raw body video;
- không log secret/token;
- private Supabase Storage + signed access có thời hạn khi client cần đọc/upload trực tiếp theo flow được backend cấp quyền;
- validate MIME/size/type upload;
- limit quyền download/view theo role scope;
- retention phải có policy rõ trước khi auto-delete.

---

## 10. Soft delete / deactivation

PT/Member có lịch sử không nên hard-delete tùy tiện.

Ưu tiên:

- status inactive/locked;
- giữ foreign key history;
- hard delete chỉ khi policy dữ liệu được duyệt và không phá audit/history.

---

## 11. Concurrency cases phải test

1. Hai Owner cùng đổi PT cho một Member.
2. Member double tap check-in.
3. PT double tap check-in.
4. Hai request convert cùng Guest.
5. AI submit retry do network timeout.
6. Owner deactivate PT đúng lúc một assignment mới đang tạo.

---

## 12. Acceptance checklist kỹ thuật

- [ ] Assignment uniqueness được enforce ngoài UI.
- [ ] Change PT atomic.
- [ ] Guest conversion atomic.
- [ ] Raw check-in không bị overwrite để sửa lịch sử.
- [ ] Retry quan trọng có idempotency/concurrency protection.
- [ ] Role check nằm ở service/API boundary.
- [ ] Member/PT query có scope relationship.
- [ ] Audit ghi action quan trọng.
- [ ] Secret/raw media không bị log công khai.
- [ ] Time/effective date được xử lý nhất quán.
