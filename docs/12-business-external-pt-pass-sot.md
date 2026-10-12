# FITNESS-MANAGE SOT 12 — External PT Pass

## 1. Khái niệm

PT ngoài là người hướng dẫn không thuộc đội PT nội bộ của gym.

PT ngoài:

- không account;
- không role;
- không đăng nhập;
- không được assign trong internal PT model;
- không có internal booking schedule.

---

## 2. Mua/đăng ký pass

Member liên hệ Owner để mua/đăng ký External PT Pass.

Owner tạo pass gồm tối thiểu:

- member id;
- quota hoặc hiệu lực theo package được cấu hình;
- status;
- purchased/created time.

Member app chỉ xem pass; không tự tạo pass.

---

## 3. Check-in PT ngoài

Flow:

```text
Member + PT ngoài đến
 -> cung cấp SĐT Member
 -> Owner tìm Member
 -> kiểm tra Member/package + External PT Pass
 -> bắt đầu external PT confirmation
 -> Member xác nhận nếu push khả dụng
 -> consume pass
 -> tạo check-in WITH_EXTERNAL_PT
```

Không cần lưu identity đầy đủ của PT ngoài trong MVP nếu chưa có requirement.

---

## 4. Anti-fraud

Push confirmation giúp tránh Owner/PT ngoài dùng pass khi Member không đồng ý.

Nếu push không đến/offline/device token mất, Owner cần fallback nghiệp vụ có xác nhận trực tiếp tại quầy; fallback phải được audit rõ, không được treo transaction vô hạn.

---

## 5. Consume rule

Chỉ consume pass sau khi confirmation/fallback hợp lệ.

Double-submit/retry không được consume hai lần.

FR-CHECKIN-008 áp dụng chung: Member đã vào tập hôm nay không được initiate/confirm lượt mới để consume thêm gói/pass, kể cả đã tạo pending request trước lượt vào tập khác. Confirm request đã CONFIRMED chỉ trả lại checkinId cũ; daily guard tại consumeIn chạy trong cùng transaction trước cập nhật pass.

---

## 6. Acceptance

1. External PT không login.
2. Không có pass thì không check-in PT ngoài.
3. Tra cứu bằng SĐT Member.
4. Confirmation thành công mới consume.
5. Retry không double-consume.
6. Owner quản lý pass; Member read-only.
