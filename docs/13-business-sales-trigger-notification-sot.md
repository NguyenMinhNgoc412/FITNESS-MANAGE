# FITNESS-MANAGE SOT 13 — Sales Trigger & Notifications

## 1. Mục tiêu

Giúp Owner không bỏ lỡ thời điểm chuyển Trial hoặc gia hạn Member; đồng thời thông báo thay đổi lịch đúng người.

---

## 2. Sales triggers

### Trial final session

Khi Trial dùng/chuẩn bị dùng lượt cuối, tạo alert Owner.

### Membership renewal

TIME_BASED: alert khi còn ít ngày.  
SESSION_BASED: alert khi còn ít buổi.

Default MVP nếu chưa đổi:

- 7 ngày;
- 3 buổi.

---

## 3. Alert lifecycle

Trạng thái gợi ý:

- `OPEN`
- `CONTACTED`
- `CONVERTED_RENEWED`
- `CLOSED_NOT_CONTINUING`

Owner cập nhật trạng thái để tránh popup lặp vô nghĩa.

Alert không tự gia hạn/convert.

---

## 4. Push notification use cases

- booking created;
- booking rescheduled;
- booking cancelled;
- nhắc lịch nếu bật;
- External PT confirmation.

Sales alerts chủ yếu là Owner dashboard/inbox, không cần push Member mặc định.

---

## 5. Notification failure

Push là best-effort side effect.

Booking/package/check-in transaction đã thành công không rollback chỉ vì push fail.

Lưu delivery state/error nếu cần retry/diagnose.

---

## 6. Acceptance

1. Trial cuối tạo alert một cách có kiểm soát.
2. Package gần hết tạo renewal alert.
3. Owner xử lý/đóng alert được.
4. Booking change gửi notification đúng recipients.
5. Push fail không làm mất mutation chính.
