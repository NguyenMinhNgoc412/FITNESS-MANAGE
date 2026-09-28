# FITNESS-MANAGE SOT 10 — Booking & Schedule

## 1. Ownership

**Owner là người duy nhất quản lý booking.**

Member và PT chỉ xem.

Nếu Member/PT muốn thay đổi, họ liên hệ Owner để Owner ghi nhận lý do và điều chỉnh.

---

## 2. Booking model nghiệp vụ

Một booking đại diện một buổi tập PT nội bộ:

- Member;
- PT;
- start datetime;
- end datetime;
- status;
- notes nếu cần.

Bỏ hoàn toàn khái niệm ca sáng/chiều/tối hoặc khung dao động 2 giờ.

---

## 3. Tạo booking

Owner phải kiểm tra:

1. Member tồn tại và phù hợp;
2. PT là PT nội bộ active;
3. Member đang được assign PT phù hợp theo rule hiện hành;
4. khoảng thời gian hợp lệ;
5. PT không overlap booking khác;
6. Member không overlap booking khác.

Baseline: booking phải dùng **primary PT hiện tại** của Member, trừ khi Owner đổi assignment trước.

---

## 4. Sửa booking

Chỉ Owner.

Lưu:

- field/time cũ;
- field/time mới;
- reason;
- changed_by;
- changed_at.

Nếu đổi PT, phải tuân assignment rule; không dùng edit booking để lách đổi PT.

---

## 5. Hủy booking

Chỉ Owner.

Lưu:

- cancel reason;
- requested_by nếu Owner biết Member/PT là bên yêu cầu;
- cancelled_by = Owner;
- cancelled_at.

Không hard-delete booking đã có ý nghĩa lịch sử trừ maintenance đặc biệt.

---

## 6. Conflict rule

Một PT chỉ phục vụ một Member tại một thời điểm.

Hai interval overlap nếu:

```text
newStart < existingEnd AND newEnd > existingStart
```

Áp dụng tương tự cho Member.

Cancelled booking không giữ slot active.

---

## 7. Notification

Sau create/update/cancel thành công, gửi notification cho Member/PT liên quan nếu có device token.

Push failure không rollback booking đã commit; hệ thống ghi nhận notification failure để có thể retry/log.

---

## 8. Read-only UX

PT/Member schedule không có Create/Edit/Delete.

CTA thay đổi chỉ là hướng dẫn liên hệ phòng tập/Owner.

---

## 9. Acceptance

1. Owner tạo booking được.
2. PT/Member không mutation booking.
3. PT overlap bị chặn.
4. Member overlap bị chặn.
5. Edit/cancel có reason/history.
6. Booking dùng thời gian cụ thể, không có shift.
