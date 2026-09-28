# FITNESS-MANAGE SOT 08 — Membership & Package Lifecycle

## 1. Package model nghiệp vụ

MVP hỗ trợ hai mode chính:

### TIME_BASED

Ví dụ 1/3/6/12 tháng.

Có:

- start date;
- end date.

### SESSION_BASED

Ví dụ 10/20/30 buổi.

Có:

- total sessions;
- used sessions;
- remaining sessions.

Không ép hai mode thành một rule duy nhất.

---

## 2. Package lifecycle

Các trạng thái nghiệp vụ tối thiểu:

- `PENDING` nếu đã tạo nhưng chưa kích hoạt;
- `ACTIVE`;
- `EXPIRING` là derived/UI alert state, không bắt buộc persist;
- `EXPIRED`/`EXHAUSTED` tùy mode;
- `CANCELLED` nếu Owner hủy theo nghiệp vụ.

Account Member không bị xóa khi package hết hạn.

---

## 3. Kích hoạt/gia hạn

Chỉ Owner thực hiện.

Member chỉ xem trạng thái và liên hệ Owner.

History cần giữ:

- package type;
- thời điểm bắt đầu/kết thúc;
- quota;
- actor tạo/gia hạn;
- trạng thái.

---

## 4. Consume session

Với SESSION_BASED, chỉ business event được duyệt mới consume session.

MVP cần phân biệt rõ package gym session với Trial session và External PT Pass; không dùng chung counter mơ hồ.

Nếu self-training/member check-in được quyết định là event consume package session thì service phải làm atomically với check-in. Nếu package chỉ giới hạn số buổi PT, rule phải được cấu hình rõ trước implementation; Codex không tự đoán.

**Diễn giải canonical cho MVP:** package `SESSION_BASED` là quyền vào/tập theo số lượt; mỗi Member gym check-in hợp lệ sẽ consume đúng 1 session của package đang được dùng. Đây là cách hiểu được khóa để Codex không tự biến số buổi thành “số buổi PT”. Nếu business sau này muốn tách gói PT-session riêng, phải tạo requirement/SOT mới.

---

## 5. Renewal alert

Owner nhận cảnh báo khi:

- TIME_BASED gần end date;
- SESSION_BASED còn ít lượt.

Ngưỡng nên là configuration server-side hoặc constant có SOT; UI không hard-code business threshold rải rác.

Default MVP nếu chưa cấu hình khác:

- còn 7 ngày;
- còn 3 buổi.

---

## 6. Invalid access

Nếu không có package hợp lệ:

- Member QR vẫn có thể resolve identity;
- check-in business action phải bị chặn hoặc yêu cầu Owner xử lý ngoại lệ;
- không tự tạo package.

---

## 7. Acceptance

1. Time-based package hết đúng theo end date.
2. Session-based không âm quota.
3. Double check-in không double-consume.
4. Expired package không xóa Member.
5. Owner thấy renewal alert đúng ngưỡng.
6. Member chỉ xem, không tự gia hạn/mutation package.
