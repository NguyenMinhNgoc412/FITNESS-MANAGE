# FITNESS-MANAGE SOT 08 — Business Spec: Guest Trial & Conversion

**Trạng thái:** SOT nghiệp vụ chi tiết  
**Dự án:** FITNESS-MANAGE  
**Ngày cập nhật:** 2026-09-16  
**Requirement liên quan:** `PR-GUEST-001..003`, `PR-MEMBER-001..003`  
**Nguyên tắc:** Khách tập thử phải được ghi nhận ngay từ lần đến đầu tiên nhưng không bị ép tạo account/member trước khi đăng ký chính thức.

---

## 1. Mục tiêu

Cho phép phòng gym:

- tiếp nhận khách mới nhanh;
- ghi nhận khách đã tập thử;
- giữ dữ liệu đủ sạch để thống kê/chăm sóc sau này;
- chuyển Guest thành Member khi đăng ký mà không làm mất nguồn trial.

---

## 2. Guest không phải Member

Guest:

- không có role đăng nhập;
- không bắt buộc có account;
- không bắt buộc có PT assignment;
- không phải booking Member giả.

Member chỉ được tạo khi khách đăng ký chính thức.

---

## 3. Tạo Guest khi đến tập thử

Flow:

```text
Khách đến phòng
  -> Owner chọn “Khách tập thử”
  -> nhập tên/cách nhận diện
  -> nhập thông tin liên hệ nếu khách cung cấp
  -> ghi thời điểm trial
  -> thêm ghi chú nếu cần
  -> lưu Guest
```

Thông tin tối thiểu:

- tên hoặc cách nhận diện;
- thông tin liên hệ cần thiết nếu có consent;
- thời điểm đến/tập thử;
- ghi chú ngắn optional.

Không được chặn flow chỉ vì Guest chưa có email/account.

---

## 4. Trial history

Mỗi lần trial cần giữ được nguồn lịch sử đủ để sau này trả lời:

- khách này đã từng đến chưa;
- lần gần nhất khi nào;
- đã chuyển thành Member chưa.

Không yêu cầu CRM automation ở scope hiện tại.

---

## 5. Chuyển Guest thành Member

Khi Guest đăng ký:

```text
Owner mở Guest hiện có
  -> chọn chuyển thành Member
  -> bổ sung thông tin Member bắt buộc
  -> tạo account/profile Member
  -> gán PT
  -> giữ linkage về Guest/Trial
  -> hoàn tất đăng ký
```

Rule:

1. Không tạo một Member mới hoàn toàn tách rời nếu Owner đang convert từ Guest hiện có.
2. Guest/Trial source phải còn truy ngược được.
3. Sau khi convert, trạng thái Guest phải cho biết đã trở thành Member.
4. PT assignment tuân theo SOT 05, không lấy PT ngẫu nhiên từ trial.

---

## 6. Chống trùng dữ liệu

Nếu Owner nhập Guest có contact giống record cũ, UI có thể cảnh báo để kiểm tra.

Baseline không yêu cầu tự merge phức tạp. Không tự gộp record chỉ dựa trên tên giống nhau.

---

## 7. Dữ liệu phục vụ thống kê sau này

Baseline phải phân biệt được:

- Guest chưa convert;
- Guest đã convert;
- thời điểm trial;
- Member được convert từ Guest nào.

Không tự triển khai:

- campaign marketing;
- gửi SMS/email hàng loạt;
- lead scoring;
- sales pipeline phức tạp.

---

## 8. Privacy behavior

- chỉ thu thông tin liên hệ cần thiết;
- không biến “tập thử” thành consent marketing mặc định;
- dữ liệu Guest chỉ được role phù hợp xem/quản lý;
- conversion không được làm mất nguồn dữ liệu trial.

---

## 9. Edge cases

1. Guest không cung cấp contact: vẫn có thể tạo record với identifier phù hợp.
2. Guest quay lại nhiều lần: giữ lịch sử trial thay vì tạo Member giả.
3. Guest đã convert nhưng Owner cố convert lần nữa: hệ thống phải ngăn double conversion.
4. Tạo Member/assignment thất bại giữa conversion: không để Guest vừa “converted” nhưng Member không tồn tại đầy đủ.
5. Guest có contact trùng Member hiện có: cảnh báo Owner kiểm tra, không tự merge mù quáng.

---

## 10. Acceptance checklist

- [ ] Tạo Guest không cần account.
- [ ] Lưu được thời điểm trial.
- [ ] Contact là optional theo dữ liệu khách cung cấp.
- [ ] Guest chưa bị ép thành Member.
- [ ] Convert giữ linkage về Guest/Trial.
- [ ] Convert tạo/gắn PT theo flow Member chuẩn.
- [ ] Không double-convert cùng Guest.
- [ ] Dữ liệu đủ phân biệt Guest chưa/đã convert.
- [ ] Không tự triển khai CRM campaign ngoài scope.
