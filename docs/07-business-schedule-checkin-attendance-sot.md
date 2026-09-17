# FITNESS-MANAGE SOT 07 — Business Spec: Schedule, Check-in & Attendance

**Trạng thái:** SOT nghiệp vụ chi tiết  
**Dự án:** FITNESS-MANAGE  
**Ngày cập nhật:** 2026-09-18  
**Requirement liên quan:** `PR-SCHEDULE-001..002`, `PR-CHECKIN-001..004`, `PR-AUDIT-002`  
**Nguyên tắc:** Check-in là raw evidence về sự có mặt; attendance là kết quả đối soát với lịch/assignment. Không sửa lịch sử để khớp trạng thái mới.

---

## 1. Mục tiêu

Hệ thống phải trả lời được:

1. Member có đến trong khung tập hay không?
2. PT phụ trách có có mặt trong khung liên quan hay không?
3. Trường hợp nào cần Owner kiểm tra?
4. Dữ liệu lịch sử lúc đó gắn với PT nào?

---

## 2. Khái niệm

### 2.1. Training Schedule

Lịch/khung tập giữa Member và PT có hiệu lực.

### 2.2. Fixed Window

Buổi tập có thời gian kỳ vọng tương đối cố định.

### 2.3. Flexible Window

Buổi/ca cho phép dao động trong cửa sổ được cấu hình.

Baseline đã chốt: cửa sổ linh hoạt phải hỗ trợ **tối đa 2 giờ** khi Owner dùng loại lịch này.

Đây là sai số thời gian của lịch, không phải quyền chọn PT bất kỳ.

### 2.4. Check-in

Check-in là event ghi nhận một actor đã có mặt tại một thời điểm.

Member và PT check-in độc lập.

### 2.5. Attendance Reconciliation

Là kết quả hệ thống đối chiếu:

- lịch/khung;
- assignment có hiệu lực;
- check-in của Member;
- check-in của PT.

---

## 3. Quy tắc lịch

1. Lịch phải phản ánh cặp Member–PT đúng tại thời điểm tương ứng.
2. Member xem được lịch của mình.
3. PT xem được lịch của Member mình phụ trách.
4. Owner xem toàn bộ lịch vận hành.
5. Lịch đã hoàn thành không bị đổi PT chỉ vì current assignment sau này thay đổi.
6. Lịch tương lai có thể cần cập nhật khi đổi PT.
7. Lịch tạo mới phải có giờ bắt đầu cách thời điểm tạo ít nhất 2 giờ. Client hỗ trợ chọn ngày/giờ và API là authority từ chối thời điểm không đạt điều kiện.
8. Member có thể gửi yêu cầu đổi thời gian cho lịch tương lai của chính mình. Yêu cầu chờ Owner xác nhận với PT/Member và không thay đổi lịch cho đến khi Owner duyệt; từ chối giữ nguyên lịch hiện hành.

---

## 4. Flexible window 2 giờ

Khi lịch là flexible:

- Owner phải biết đây là lịch linh hoạt;
- hệ thống không đánh dấu vắng trước khi cửa sổ hợp lệ kết thúc;
- việc đối soát phải dựa trên window đã cấu hình;
- tổng mức linh hoạt không vượt baseline 2 giờ.

Ví dụ nghiệp vụ hợp lệ:

```text
Khung dự kiến: 18:00–20:00
Member check-in 19:10
PT check-in 18:55
=> cả hai nằm trong cửa sổ hợp lệ
```

Không dùng flexible window để tạo booking PT theo buổi.

---

## 5. Member check-in

Flow:

```text
Member mở check-in
  -> hệ thống xác định identity Member
  -> ghi thời điểm check-in
  -> cố gắng resolve lịch/khung phù hợp
  -> lưu raw check-in
  -> chạy/đợi attendance reconciliation
```

Rule:

- Member không check-in thay tài khoản khác.
- Mỗi event phải có timestamp rõ ràng.
- Không sửa timestamp lịch sử để làm cho check-in “đúng giờ”.

---

## 6. PT check-in

Flow tương tự Member nhưng actor là PT.

Rule:

- PT chỉ check-in cho chính mình.
- Một PT check-in có thể liên quan tới nhiều Member đang thuộc phạm vi PT trong cùng ca/khung, nhưng việc ghép attendance phải theo đúng lịch/context.
- Không tự coi PT có mặt cho mọi Member cả ngày chỉ vì có một check-in ngoài cửa sổ liên quan.

---

## 7. Kết quả đối soát

Các trạng thái logic tối thiểu có thể biểu diễn:

| Trạng thái | Ý nghĩa |
|---|---|
| `MATCHED` | Member và PT đều có mặt phù hợp |
| `MEMBER_ONLY` | Member có mặt, PT chưa có evidence hợp lệ |
| `PT_ONLY` | PT có mặt, Member chưa có evidence hợp lệ |
| `MISSING` | Chưa có check-in phù hợp của cả hai |
| `NEEDS_REVIEW` | Dữ liệu mâu thuẫn/không đủ để kết luận tự động |

Tên UI có thể khác, nhưng ý nghĩa không được đổi.

---

## 8. Trường hợp Member đến nhưng PT không đến

Đây là business case quan trọng đã chốt.

```text
Member check-in hợp lệ
  + schedule/window hợp lệ
  + PT assignment xác định được
  + không có PT check-in hợp lệ trong cửa sổ
  -> tạo exception để Owner kiểm tra
```

Hệ thống không tự kết luận:

- PT vi phạm kỷ luật;
- Member nói sai;
- buổi tập chắc chắn bị hủy.

Nó chỉ tạo evidence + trạng thái bất thường để Owner xử lý.

---

## 9. Owner review

Owner phải xem được tối thiểu:

- Member;
- PT liên quan;
- lịch/khung;
- thời điểm Member check-in;
- thời điểm PT check-in nếu có;
- trạng thái đối soát;
- lịch sử xử lý nếu implementation có thao tác đóng/xác nhận exception.

Không xóa raw check-in khi Owner xử lý exception.

---

## 10. History rules

1. Đổi PT hôm nay không thay PT của check-in tháng trước.
2. Sửa lịch tương lai không sửa lịch đã hoàn thành.
3. Attendance result phải truy được về raw check-in đã dùng.
4. Nếu logic reconciliation thay đổi ở version sau, không được âm thầm rewrite toàn bộ lịch sử nếu chưa có migration/recompute được duyệt.

---

## 11. Edge cases

### 11.1. Không tìm thấy lịch phù hợp

Vẫn có thể giữ raw check-in, nhưng attendance phải `NEEDS_REVIEW` hoặc trạng thái tương đương thay vì gắn bừa lịch.

### 11.2. Nhiều lịch chồng nhau

Không chọn ngẫu nhiên. Cần rule resolve rõ hoặc Owner review.

### 11.3. Check-in trùng do double tap/retry

Không được tạo nhiều attendance sai chỉ vì request lặp.

### 11.4. Member đổi PT giữa ngày

Mỗi lịch/check-in phải dùng assignment có hiệu lực tại thời điểm business event, không dùng current PT một cách mù quáng.

### 11.5. PT check-in ngoài window

Không tự coi là matched nếu không nằm trong context hợp lệ.

---

## 12. Acceptance checklist

- [ ] Member check-in độc lập.
- [ ] PT check-in độc lập.
- [ ] Không ai check-in thay account khác.
- [ ] Lịch cố định và linh hoạt được phân biệt.
- [ ] Flexible window hỗ trợ tối đa 2 giờ theo baseline.
- [ ] Không đánh dấu vắng khi vẫn còn trong window hợp lệ.
- [ ] Member có mặt + PT thiếu tạo exception cho Owner.
- [ ] Exception không tự kết luận kỷ luật.
- [ ] Owner xem đủ context để xử lý.
- [ ] Raw check-in không bị xóa khi resolve attendance.
- [ ] Đổi PT không rewrite check-in cũ.
