# FITNESS-MANAGE SOT 07 — Lead, Trial & Conversion

## 1. Mục tiêu

Cho khách mới thử tập nhanh, không cần app, đồng thời tạo dữ liệu CRM đủ để Owner chăm sóc và chuyển đổi.

---

## 2. Trial identity

Tạo Trial tối thiểu bằng:

- họ tên;
- SĐT.

Trial chưa bắt buộc CCCD.

SĐT là identity chống Trial lặp.

---

## 3. Rule 3 buổi cố định

Mỗi Trial mới hợp lệ có:

```text
total_trial_sessions = 3
used_trial_sessions = 0
remaining_trial_sessions = 3
```

Không có setting thay 3 thành số khác trong MVP.

---

## 4. One-phone-one-trial

Một SĐT chỉ được Trial một lần trong toàn lịch sử.

Không được reset quyền Trial bằng cách:

- archive hồ sơ;
- hết lượt;
- convert thành Member rồi hủy;
- tạo customer mới cùng SĐT.

Nếu SĐT từng có Trial, tạo Trial mới phải bị từ chối hoặc Owner được dẫn tới hồ sơ hiện có.

---

## 5. Trial check-in

Flow:

```text
Khách đọc SĐT
 -> Owner tìm hồ sơ
 -> hệ thống kiểm tra remaining > 0
 -> Owner xác nhận check-in
 -> tạo check-in log TRIAL
 -> consume đúng 1 session
 -> cập nhật remaining
```

Operation phải idempotent/chống double-click.

---

## 6. Sales trigger

Khi Trial dùng buổi cuối hoặc còn ngưỡng do business file quy định, tạo alert cho Owner.

MVP canonical: **buổi thứ 3 / lượt cuối**.

Alert không tự convert customer.

---

## 7. Conversion Trial → Member

Owner thực hiện conversion sau khi khách mua package.

Flow:

1. mở hồ sơ Trial;
2. bổ sung CCCD và thông tin chính thức;
3. chọn package;
4. tạo/kích hoạt Member account;
5. giữ nguyên customer identity, phone, Trial history và check-in history;
6. không tạo bản ghi customer thứ hai cùng SĐT.

---

## 8. Edge cases

- Trial hết lượt: không check-in Trial tiếp.
- Trial muốn vào bằng PT ngoài: phải convert/member có pass trước nếu nghiệp vụ yêu cầu.
- Push/app không áp dụng cho Trial vì Trial không cần account/app.
- Duplicate phone: ưu tiên mở hồ sơ hiện có.

---

## 9. Acceptance

1. Tạo Trial bằng tên + phone.
2. Có đúng 3 lượt.
3. Mỗi check-in giảm 1.
4. Double-submit không giảm 2.
5. SĐT đã Trial không Trial lần hai.
6. Buổi cuối sinh Sales Trigger.
7. Conversion giữ lịch sử và không tạo duplicate identity.
