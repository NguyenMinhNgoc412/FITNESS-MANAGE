# FITNESS-MANAGE SOT 17 — Security, Integrity & Audit

## 1. Auth

- Access token ngắn hạn.
- Refresh token có rotation/revocation strategy.
- Password hash bằng thuật toán password hashing phù hợp; không lưu plaintext.
- JWT secret/key không commit Git.

---

## 2. RBAC

Backend guard phải enforce:

- Owner-only mutations;
- PT self/assigned scope;
- Member self scope.

Không tin `role` gửi từ client.

---

## 3. PII

PII gồm SĐT, CCCD, địa chỉ, DOB.

- Không ghi CCCD/password/token vào logs.
- API chỉ trả field cần cho role.
- PT không nhận CCCD Member đầy đủ nếu không cần.
- Member không xem data người khác.

---

## 4. Critical invariants

Khi hết số lần retry write conflict, API trả `409 CONCURRENT_CHANGE` với thông báo an toàn để client thử lại; không trả lỗi database hoặc nới khóa chống overlap/quota.

1. phone unique.
2. CCCD unique khi có.
3. Trial once per phone.
4. Trial remaining không âm.
5. Membership session remaining không âm.
6. External PT Pass remaining không âm.
7. một Member tối đa một active primary PT.
8. booking không overlap cho PT/Member.
9. PT/Member không mutation booking.
10. raw AI video không server upload.

---

## 5. Concurrency

Critical commands dùng atomic update/transaction/idempotency:

- Trial check-in;
- session-based Member check-in;
- External PT Pass consume;
- booking create/update conflict check cần giảm race condition.

Với booking, nếu hai request đồng thời cùng slot, service phải revalidate gần write/transaction và trả conflict cho request thua.

---

## 6. Audit actions

CRM 2026-10-20: endpoint hồ sơ chính thức và check-in phân trang theo customer đều Owner-only tại guard và service. Chỉ chọn họ tên/CCCD/trạng thái cần thiết; không trả password/token/session. Nhật ký truy vấn summary Member của booking để giữ liên kết lịch sử sau đổi Member; Mongo projection và mapper chỉ trả allowlist sự kiện, không đưa audit snapshots ra client.

Audit tối thiểu:

- create/convert Trial;
- package create/renew/cancel;
- assign/change/cancel PT;
- booking create/edit/cancel;
- manual phone fallback check-in;
- external PT fallback confirmation;
- profile/CCCD change;
- role/account status change.

Audit chứa actor, action, resource, time, reason khi có.

---

## 7. QR security

QR không nên chứa PII/CCCD trực tiếp.

Dùng opaque/signed identifier/token có expiry hoặc server validation phù hợp.

Không để static QR chứa raw member id + phone nếu có thể bị chụp lại dùng mãi mà không kiểm soát.

---

## 8. AI privacy

Network inspector/test phải chứng minh raw video không được gửi.

Nếu crash analytics/logging được thêm sau này, không attach local video path/content mặc định.

---

## 9. Acceptance

- Unauthorized mutation 403.
- Expired/revoked token bị chặn.
- Counter không double consume dưới retry test.
- Audit record có cho mutation trọng yếu.
- PII không xuất hiện trong application logs tiêu chuẩn.

## Cơ chế hiện hành — 2026-09-24

Access token 15 phút, refresh 7 ngày; refresh hash SHA-256, rotation transaction và revoke khi khóa account. Server đọc role/status/session hiện hành; mutation kiểm tra lại actor trong transaction. QR có chữ ký riêng, loại token checkin, hạn 2 phút; không nhúng SĐT/CCCD.

Command lưu fingerprint và kết quả để replay cùng Idempotency-Key. Transaction lock bảo vệ Trial, quota, assignment và overlap của cả PT/Member. Từ 2026-10-09, FR-CHECKIN-008 thay cửa sổ 30 giây bằng daily guard UTC+7 theo memberId/customerId (OR để giữ conversion identity), không phụ thuộc context/gói/method. PT guard theo ptId/ngày độc lập. Query guard và consume/create log nằm sau shared write lock trong cùng transaction; write conflict retry đọc state mới. Timestamp log được chốt cùng ngày kiểm tra để tránh race qua nửa đêm. Log lỗi công khai không echo input, token, CCCD hoặc stack; audit chỉ lưu context nghiệp vụ cần thiết.

## PT QR — 2026-10-21

PT chỉ lấy QR của chính mình; chỉ Owner resolve/xác nhận PT attendance tại guard và service. Signed QR PT có kind pt-attendance khác Member checkin, expiry 2 phút, không PII. Confirm revalidate PT active trong transaction; source QR, audit actor Owner, không lưu token trong log/audit/result. Command chỉ lưu fingerprint của input và kết quả, không lưu raw QR. Daily guard/WriteLock bảo vệ các Owner quét đồng thời; replay cùng key không tạo log/audit mới. Log APP cũ được giữ nguyên, không cần migration/schema/index mới.
