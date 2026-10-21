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

Từ 2026-10-20: danh sách mặc định lọc `OPEN` trước phân trang để alert đã đóng không đẩy việc cần xử lý sang trang sau. Owner chọn `CONTACTED`, `CONVERTED_RENEWED`, `CLOSED_NOT_CONTINUING` hoặc `ALL` để xem lại; đổi bộ lọc reset trang 1. Đây là lọc đọc, không xóa/đóng tự động các alert và không đổi điều kiện trigger.

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

### Delivery worker — 2026-10-20

Scheduler ghi `NOTIFICATION_DELIVERY_FAILED` nếu vòng deliver bị reject; Sales Alerts scheduler ghi `SALES_ALERT_REFRESH_FAILED` nếu refresh bị reject. Log chỉ có mã cố định và context scheduler, không chứa nội dung exception/token/PII. Vòng kế tiếp vẫn chạy theo chu kỳ. Dashboard chỉ đọc cảnh báo đã lưu; refresh định kỳ chạy khi khởi động và mỗi 60 giây, nên số cảnh báo có thể trễ khoảng một chu kỳ khi worker hoạt động bình thường.

Áp dụng FR-NOTI-001/002, không đổi điều kiện xác nhận/consume pass. Notification được enqueue trong transaction; booking và external initiation không đợi push. Worker lấy tối đa 50 record theo createdAt mỗi vòng, claim từng record ngay trước gửi bằng atomic compare-and-set; lease 60 giây, fetch timeout 10 giây. Worker cũ chỉ hoàn tất record khi claimToken còn trùng. SENDING hết lease (kể cả record cũ thiếu lease) được đưa về PENDING hoặc FAILED nếu đã đủ 3 lần thử.

Lỗi transport, HTTP 429/5xx được retry tối đa 3 lần tổng cộng, delay 30/60 giây trước lần sau. Hết lượt thử thành FAILED; thiếu device thành UNAVAILABLE. Batch đã được chấp nhận một phần không tự gửi lại toàn bộ để tránh gửi lại thiết bị đã nhận. SENT chỉ là Expo chấp nhận ticket, không xác nhận thiết bị đã hiển thị. Payload có notificationId ổn định; không chứa PII ngoài device token cần gửi cho Expo.

Push vẫn best-effort: crash/mất response sau khi Expo nhận có thể khiến retry gửi trùng. Claim ngăn hai worker sở hữu cùng lease và ngăn ghi đè kết quả cũ; không bảo đảm exactly-once delivery. Fallback Owner vẫn yêu cầu xác nhận trực tiếp/lý do và audit; notification không tự consume pass.

---

## 6. Acceptance

1. Trial cuối tạo alert một cách có kiểm soát.
2. Package gần hết tạo renewal alert.
3. Owner xử lý/đóng alert được.
4. Booking change gửi notification đúng recipients.
5. Push fail không làm mất mutation chính.
