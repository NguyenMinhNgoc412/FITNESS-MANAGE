# FITNESS-MANAGE SOT 06 — Auth, Role & Access

## 1. Role canonical

```text
OWNER
PT
MEMBER
```

Không có role `STAFF`, `DEV`, `TRIAL`, `LEAD`, `EXTERNAL_PT`.

---

## 2. Owner

Owner là role quản trị và kiêm nghiệp vụ quầy trong MVP.

Owner có thể:

- tạo/convert Trial;
- tạo/sửa Member/PT profile;
- quản lý CCCD;
- quản lý package;
- assign/đổi/hủy PT;
- tạo/sửa/hủy booking;
- thực hiện fallback check-in bằng SĐT;
- quản lý External PT Pass;
- xem Sales Trigger;
- xem Member/PT check-in log;
- xem audit phù hợp.

Owner không xem AI result/raw AI video của Member.

---

## 3. PT

PT có thể:

- đăng nhập;
- xem lịch của chính mình;
- xem Member được assign;
- xem thông tin đủ để phục vụ booking;
- PT check-in;
- xem profile của chính mình.

PT không thể:

- quản lý customer toàn hệ thống;
- tạo/sửa/hủy booking;
- assign/đổi PT;
- bán/gia hạn package;
- quản lý Trial;
- xem Sales Trigger;
- xem AI result của Member;
- xem CCCD đầy đủ của Member nếu không cần cho nghiệp vụ.

---

## 4. Member

Member có thể:

- xem profile của mình;
- xem package;
- xem PT hiện tại;
- xem booking read-only;
- mở QR check-in;
- xem lịch sử check-in;
- xem External PT Pass của mình;
- dùng AI form analysis;
- xem AI result của chính mình.

Member không thể:

- tạo/sửa/hủy booking;
- đổi/hủy PT assignment;
- tự sửa CCCD nếu Owner quản lý dữ liệu chính thức;
- xem Member khác;
- xem PT attendance log;
- xem Sales Trigger;
- xem AI result người khác.

---

## 5. Authentication behavior

- Login trả access token + refresh token.
- Role/subject lấy từ server identity.
- Client route guard để UX; backend guard mới là enforcement.
- Account disabled/locked không được refresh access hợp lệ.
- Không suy role từ route hoặc UI state.

---

## 6. Acceptance

1. Member gọi API Owner-only trả 403.
2. PT gọi booking mutation trả 403.
3. Member không thấy control đổi PT hoặc edit booking.
4. Owner không có API/screen để xem AI result Member.
5. Trial/External PT không có login flow.
