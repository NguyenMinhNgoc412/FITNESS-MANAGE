# FITNESS-MANAGE SOT 16 — REST API Contract

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
- `GET /customers/:id` — Owner
- `GET /customers/:id/history?page=` — Owner; nhật ký audit theo customer và các resource liên quan, trả action/reason/time/actorName đã lược bỏ snapshot nhạy cảm, phân trang 30 bản ghi.
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

- `POST /pt/me/checkin` — PT
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

- `GET /sales-alerts` — Owner
- `PATCH /sales-alerts/:id` — Owner

---

## 11. AI service

AI service FastAPI không phải public business API cho Owner/PT.

Ví dụ:

- `POST /ai/form-analysis` — Member-authenticated/gateway-protected structured JSON only

Payload **không chứa video/base64/file URL raw video**.

---

## 12. Idempotency

Endpoint consume quota/check-in nên nhận `Idempotency-Key` hoặc command id.

Server lưu/nhận biết duplicate trong window phù hợp.

---

## 13. Pagination/search

Owner list lớn dùng pagination/filter server-side.

Phone search hỗ trợ exact/normalized match; không log raw search unnecessarily.

## Chi tiết contract đã triển khai — 2026-09-24

API prefix /api. Mutation nghiệp vụ dùng Idempotency-Key; cùng key/actor/action nhưng payload khác trả conflict. Body dùng strict Zod, không nhận field tùy ý. Danh sách phân trang 30 bản ghi qua page. Booking hỗ trợ from/to và scope theo account.

Endpoint bổ sung cho UI: GET/POST /people, PATCH /people/:id; GET /members/me/qr; GET /members/me/checkins; GET /members/me/pt; GET /pt/me/members; GET /pt/me/attendance; POST /pt/me/checkin; GET /dashboard, /audit, /external-pt/requests; POST/DELETE /notifications/device-token.

POST /ai/form-analysis chỉ Member, payload schemaVersion/exercise/status/reps/metrics/issues. Không có URL video hay endpoint upload. FastAPI nội bộ nhận cùng JSON với X-Service-Token; response feedback có schema strict.
