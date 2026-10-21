# FITNESS-MANAGE SOT 16 — REST API Contract

## Member check-in validation feedback — 2026-10-08

POST checkins/member giữ strict schema và INVALID_INPUT/400; thiếu/không hợp lệ membershipId hoặc bookingId trả message cố định hướng dẫn chọn gói/booking, không echo id/token. Client tạo payload allowlist: SELF_TRAINING không gửi bookingId; WITH_INTERNAL_PT gửi booking đã chọn. QR signature/expiry/member matching, gói/quota, role và idempotency vẫn do service kiểm tra.

## Conversion validation feedback — 2026-10-08

Endpoint convert-to-member giữ strict schema và INVALID_INPUT/400; message chỉ rõ trường lỗi bằng thông báo cố định, không echo dữ liệu: CCCD đúng 12 chữ số, mật khẩu 10–72 ký tự; tên gói 1–200 ký tự, số lượt 1–10.000, giá VNĐ nguyên dương tối đa 1 tỷ khi có. Gói thời gian cần endAt sau startAt. Các giới hạn này là contract đã triển khai, không thay nghiệp vụ/history/RBAC.

## 1. Convention

Base ví dụ: `/api/v1`.

Response/error format phải nhất quán. Không để client phụ thuộc trực tiếp vào MongoDB shape.

Error business nên có:

```json
{
  "code": "BOOKING_PT_TIME_CONFLICT",
  "message": "PT đã có lịch trong khoảng thời gian này",
  "details": {}
}
```

---

## 2. Auth

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

Không expose role mutation cho Member/PT.

---

## 3. Trial/customer

- `POST /customers/trials` — Owner
- `GET /customers/search?phone=` — Owner
- `GET /customers/:id` — Owner; thêm `member: {id,status,profile:{fullName,cccd}|null}|null` cho Member liên kết, select allowlist không có password/token/session. Trial trả member=null. Preview checkins tối đa 100 giữ tương thích; client dùng endpoint checkins phân trang để xem đầy đủ.
- `GET /customers/:id/checkins?page=` — Owner-only; 30 dòng/trang, mới nhất trước, tie-break id desc. Query OR customerId và memberUserId liên kết để giữ Trial/conversion và logs Member cũ; trả id/checkedInAt/context/method/subjectType. Page sai trả INVALID_PAGE/400, customer không có trả NOT_FOUND/404. Không tự match PT attendance.
- `GET /customers/:id/history?page=` — Owner; nhật ký audit theo customer và các resource liên quan, trả action/reason/time/actorName đã lược bỏ snapshot nhạy cảm, phân trang 30 bản ghi.

Nhật ký dùng cả summary Member trong before/after booking để giữ lịch sử sau reassignment; sort createdAt desc rồi id desc, không lặp record khi khớp nhiều nhánh. Response không có before/after/actorId; actorName được lookup riêng.
- `POST /customers/:id/trial-checkin` — Owner
- `POST /customers/:id/convert-to-member` — Owner

Trial check-in phải idempotent.

---

## 4. Membership

Payload tạo/gia hạn và membership trong conversion nhận `priceVnd` là số nguyên VNĐ dương, tùy chọn để đọc/ghi tương thích bản ghi cũ. Giá không phải trạng thái thanh toán.

- `POST /members/:memberId/memberships` — Owner
- `GET /members/:memberId/memberships` — Owner / same Member limited
- `POST /memberships/:id/renew` — Owner
- `POST /memberships/:id/cancel` — Owner

Member không có mutation.

---

## 5. PT assignment

- `POST /members/:memberId/pt-assignment` — Owner
- `PATCH /members/:memberId/pt-assignment` — Owner
- `DELETE /members/:memberId/pt-assignment` hoặc domain cancel endpoint — Owner
- `GET /pt/me/members` — PT
- `GET /members/me/pt` — Member

---

## 6. Booking

- `POST /bookings` — Owner
- `PATCH /bookings/:id` — Owner
- `POST /bookings/:id/cancel` — Owner
- `GET /bookings` — role-filtered
- `GET /bookings/:id` — role-filtered

PT/Member mutation trả 403.

---

## 7. Member check-in

- `POST /checkins/resolve-qr` — Owner/check-in surface
- `POST /checkins/member` — Owner or approved QR flow
- `GET /members/me/checkins` — Member
- `GET /checkins` — Owner

Payload phải có context explicit.

---

## 8. PT attendance

- `GET /pt/me/qr` — PT; trả `{token,expiresIn:120}`, kind `pt-attendance`.
- `POST /checkins/pt` — Owner; strict body `{token}`, Idempotency-Key bắt buộc. Chỉ QR PT còn hạn, tài khoản PT active; source QR + audit PT_QR_CHECKIN. Không consume gói/pass hoặc match booking.
- Đã bỏ `POST /pt/me/checkin`; PT không tự ghi attendance.
- `GET /pt/me/attendance` — PT
- `GET /pt/:id/attendance` — Owner

Không có endpoint `match-booking-attendance` trong MVP.

---

## 9. External PT Pass

- `POST /members/:id/external-pt-passes` — Owner
- `GET /members/me/external-pt-passes` — Member
- `POST /external-pt/checkin/initiate` — Owner
- `POST /external-pt/checkin/:requestId/confirm` — Member
- `POST /external-pt/checkin/:requestId/owner-fallback-confirm` — Owner nếu push flow không khả dụng, phải audit

---

## 10. Sales alerts

### Owner reports — 2026-10-09

- `GET /reports/packages`: Owner-only; array `{name,mode,memberCount,registrations}` cho toàn lịch sử cấp gói, nhóm tên + mode, memberCount unique theo memberId.
- `GET /reports/checkins?year=YYYY`: Owner-only; year bắt buộc 1900–2199, sai trả INVALID_INPUT/400. Response `{year,timezone: "Asia/Bangkok",months:[{month,member,trial,total,pt}]}` đủ 12 tháng; total=member+trial, PT riêng. Khoảng tháng UTC+7, đầu bao gồm/cuối loại trừ. Không trả identity/PII hoặc đọc AI data. Không đổi schema/consume logic.

- `GET /sales-alerts?page=&status=` — Owner; status mặc định OPEN, nhận OPEN/CONTACTED/CONVERTED_RENEWED/CLOSED_NOT_CONTINUING/ALL. Lọc trước phân trang 30 dòng, triggeredAt desc rồi id desc; ALL trả mọi trạng thái. Giá trị không hợp lệ trả INVALID_INPUT/400, không echo query. Không đổi mutation lifecycle.
- `PATCH /sales-alerts/:id` — Owner

---

## 11. AI service

AI service FastAPI không phải public business API cho Owner/PT.

Ví dụ:

- `POST /ai/form-analysis` — Member-authenticated/gateway-protected structured JSON only

Payload **không chứa video/base64/file URL raw video**.

---

## 12. Idempotency

FR-CHECKIN-008 (2026-10-09): Trial/Member/PT check-in và external initiate/confirm bị từ chối `ALREADY_CHECKED_IN_TODAY`/409 nếu identity đã điểm danh trong ngày UTC+7 (PT log độc lập). Message tiếng Việt nêu đã điểm danh, không consume thêm. Cùng key hợp lệ vẫn replay command cũ; không đổi payload/schema hoặc QR validation. Daily guard chạy trong transaction, không chỉ ở UI.

Endpoint consume quota/check-in nên nhận `Idempotency-Key` hoặc command id.

Server lưu/nhận biết duplicate trong window phù hợp.

---

## 13. Pagination/search

Owner list lớn dùng pagination/filter server-side.

Phone search hỗ trợ exact/normalized match; không log raw search unnecessarily.

## Chi tiết contract đã triển khai — 2026-09-24

API prefix /api. Mutation nghiệp vụ dùng Idempotency-Key; cùng key/actor/action nhưng payload khác trả conflict. Body dùng strict Zod, không nhận field tùy ý. Danh sách phân trang 30 bản ghi qua page. Booking hỗ trợ from/to và scope theo account.

Endpoint bổ sung cho UI: GET/POST /people, PATCH /people/:id; GET /members/me/qr; GET /members/me/checkins; GET /members/me/pt; GET /pt/me/members; GET /pt/me/attendance; GET /pt/me/qr; POST /checkins/pt; GET /dashboard, /audit, /external-pt/requests; POST/DELETE /notifications/device-token.

POST /ai/form-analysis chỉ Member, payload schemaVersion/exercise/status/reps/metrics/issues. Không có URL video hay endpoint upload. FastAPI nội bộ nhận cùng JSON với X-Service-Token; response feedback có schema strict.

## AI automatic contract v2 — 2026-10-08

POST /api/ai/form-analysis vẫn chỉ MEMBER. Gateway chấp nhận v1 tương thích và strict v2: schemaVersion=2.0, exercise SQUAT/PUSH_UP/LUNGE/UNKNOWN, status COMPLETED/POSE_NOT_DETECTED/INSUFFICIENT_REPS/UNRECOGNIZED_EXERCISE, recognitionScore [0,1], reps [0,500], metrics {detectedRatio,minJointAngle}, reference {trunkMax:null hoặc [0,90]}, perRep tối đa mười {index,timeSeconds [0,120],angles {kneeLeft,kneeRight,trunk,elbowLeft,elbowRight,armLeft,armRight},bodyLine}. Góc thiếu là null, không phải zero.

COMPLETED cần bài xác định, reps>0, score≥0.7, coverage≥0.6, minJointAngle có dữ liệu và đúng min(reps,10) báo cáo chỉ số tuần tự. Failure không có reps/perRep; UNRECOGNIZED_EXERCISE cần UNKNOWN. Extra fields bị từ chối ở mọi object. FastAPI body ≤8192 bytes và X-Service-Token bắt buộc. V2 response strict {schemaVersion,exercise,status,provider:OPENAI|LOCAL,feedback:1..8 đoạn tối đa 600 ký tự}; gateway kiểm tra cùng exercise/status/version với request. Upstream timeout 25 giây; lỗi trả thông báo generic, không lộ SDK/input/secret.

## PT QR — 2026-10-21

POST /checkins/resolve-qr Owner-only giữ response Member `{member,memberships}`; QR PT trả `{pt:{id,profile:{fullName}}}`. Token PT dùng kind riêng, không dùng thay QR Member và ngược lại. Mã sai loại/chữ ký/hết hạn trả INVALID_QR/400. POST checkins/pt kiểm tra token trong callback command để retry cùng key replay trước validation expiry; key mới sau điểm danh bị ALREADY_CHECKED_IN_TODAY/409 khi mã hợp lệ.
