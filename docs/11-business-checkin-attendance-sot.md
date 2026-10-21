# FITNESS-MANAGE SOT 11 — Check-in & Attendance

## 1. Tách hai khái niệm

### Member/Trial check-in

Ghi việc khách/hội viên vào tập.

### PT attendance check-in

Ghi việc PT nội bộ có mặt tại gym.

Hai loại log độc lập.

---

## 2. Member check-in identity

Ưu tiên:

1. QR trong Member app;
2. SĐT fallback qua Owner.

QR chỉ là phương tiện resolve identity nhanh; server vẫn kiểm tra package/context.

---

## 3. Check-in contexts

Canonical:

- `TRIAL`
- `SELF_TRAINING`
- `WITH_INTERNAL_PT`
- `WITH_EXTERNAL_PT`

Không dùng một boolean `with_pt` cho mọi trường hợp.

---

## 4. SELF_TRAINING

Member có thể tự đến tập.

Không yêu cầu PT check-in.

Không tạo violation nếu không có PT log.

---

## 5. WITH_INTERNAL_PT

Member có booking PT nội bộ.

Member check-in bình thường; PT thực hiện PT attendance check-in riêng.

**Hệ thống không tự match hai log để kết luận PT có/không phục vụ booking.**

Khi có tranh chấp/kiểm tra, Owner mở:

- booking;
- Member check-in log;
- PT attendance log;

và tự đối chiếu theo thời gian/thực tế.

---

## 6. PT attendance

Theo yêu cầu Owner 2026-10-21: PT mở QR cá nhân hạn 2 phút, tự làm mới như Member; Owner quét tại quầy, xem tên PT và xác nhận có mặt. Server xác thực chữ ký/expiry/loại mã PT và tài khoản PT active. Không có self-check-in trực tiếp; không cần gói hoặc booking để ghi PT attendance.

Mutation Owner có Idempotency-Key, daily guard UTC+7 trong transaction có shared write lock; log source=QR và audit PT_QR_CHECKIN lưu Owner thực hiện, không lưu token. Replay cùng key giữ kết quả cũ kể cả QR đã hết hạn; key mới cần QR còn hiệu lực. Không thay đổi lịch sử cũ.

PT check-in tạo log tối thiểu:

- PT id;
- timestamp;
- source/device metadata cần thiết;
- status hợp lệ.

MVP không bắt buộc check-out nếu chưa được duyệt.

PT có thể xem check-in của chính mình; Owner xem toàn bộ PT logs cần quản lý.

---

## 7. Trial check-in

Owner tìm bằng SĐT, hệ thống kiểm tra remaining Trial, tạo log `TRIAL` và consume 1 lượt atomically.

---

## 8. Member package check

Member check-in phải kiểm tra package phù hợp trước khi thành công.

Với session-based package, consume quota và tạo check-in phải thuộc cùng một logical operation/idempotent command.

---

## 9. Idempotency

Không được double log/consume vì:

- double tap;
- network retry;
- QR scan lặp liên tiếp.

Có thể dùng idempotency key hoặc duplicate-window rule ở service/API; implementation chi tiết nằm technical files.

Quyết định Owner 2026-10-09 (FR-CHECKIN-008): thay cửa sổ 30 giây bằng một lượt/customer hoặc Member mỗi ngày UTC+7, từ 00:00 gồm đến 00:00 ngày sau không gồm. QR/SĐT, gói, context và conversion không reset giới hạn. PT attendance cũng tối đa một log/PT/ngày, vẫn độc lập. Request với key mới bị từ chối ALREADY_CHECKED_IN_TODAY/409, không ghi log hoặc consume thêm; retry cùng key replay kết quả. Kiểm tra và consume trong transaction có shared business write lock. Không tự xóa log/hoàn quota quá khứ.

---

## 10. Acceptance

Báo cáo FR-CHECKIN-007 chỉ Owner: chọn năm 1900–2199, trả đủ 12 tháng theo UTC+7 với khoảng [đầu tháng, đầu tháng sau). Đếm Member/Trial từ member_checkins.checked_in_at và PT riêng từ pt_attendance_logs.checked_in_at. Retry đã được idempotency chặn không tạo log nên không tăng lượt báo cáo; không auto-match booking.

1. QR resolve đúng Member.
2. SĐT fallback hoạt động.
3. Trial consume đúng một lượt.
4. Self-training không yêu cầu PT.
5. PT check-in độc lập.
6. Không có automated attendance matching conclusion.
7. Owner xem được logs để đối chiếu.
