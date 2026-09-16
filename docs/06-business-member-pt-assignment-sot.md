# FITNESS-MANAGE SOT 06 — Business Spec: Member & PT Assignment

**Trạng thái:** SOT nghiệp vụ chi tiết  
**Dự án:** FITNESS-MANAGE  
**Ngày cập nhật:** 2026-09-16  
**Requirement liên quan:** `PR-MEMBER-001..003`, `PR-ASSIGN-001..002`, `PR-PT-002`  
**Nguyên tắc:** Member có PT phụ trách theo mô hình 1-1. Đây là assignment dài hạn, không phải booking PT theo từng buổi.

---

## 1. Mục tiêu

Quản lý quan hệ huấn luyện giữa Member và PT sao cho:

- member biết ai đang phụ trách mình;
- PT biết member nào đang được giao;
- Owner kiểm soát việc gán/chuyển PT;
- member có thể đổi PT nếu không phù hợp;
- lịch sử luôn được giữ.

---

## 2. Khái niệm nghiệp vụ

### 2.1. Member

Member là khách đã đăng ký chính thức và có account theo role `Member`.

### 2.2. PT Assignment

PT Assignment biểu diễn quan hệ:

```text
1 Member -> 1 Primary PT đang hiệu lực
```

Assignment có hiệu lực theo thời gian và phải giữ lịch sử khi thay đổi.

### 2.3. Current PT

Current PT là PT của assignment đang active tại thời điểm hiện tại.

Current PT không được suy ra từ:

- check-in gần nhất;
- lịch gần nhất;
- PT mà member tự chọn ở màn buổi tập.

---

## 3. Đăng ký Member

Flow chuẩn:

```text
Owner tạo Member
  -> nhập thông tin nhận diện/liên hệ
  -> nhập mục tiêu tập luyện ở mức mô tả
  -> chọn PT phù hợp
  -> xác nhận assignment
  -> cấu hình lịch ban đầu nếu cần
  -> hoàn tất đăng ký
```

### 3.1. Invariant khi hoàn tất

Member active bình thường phải có một PT chính rõ ràng.

Nếu assignment là bước bắt buộc trong flow triển khai hiện tại thì không được báo “đăng ký hoàn tất” khi việc tạo assignment thất bại.

### 3.2. Kết quả sau đăng ký

- Member thấy PT hiện tại.
- PT thấy Member trong danh sách active.
- Owner thấy cùng assignment.
- Lịch ban đầu nếu có phải dùng đúng cặp Member–PT đó.

---

## 4. Quy tắc 1-1

1. Một Member chỉ có một primary assignment active tại một thời điểm bình thường.
2. Một PT có thể phụ trách nhiều Member.
3. Không tạo hai assignment active chồng thời gian cho cùng một Member.
4. Không dùng booking từng buổi để phá rule 1-1.
5. Assignment lịch sử không xóa cứng chỉ vì Member đổi PT.

---

## 5. Luồng đổi PT

Member có thể không phù hợp với PT hiện tại. Hệ thống phải cho phép đổi PT có kiểm soát.

### 5.1. Nguồn khởi tạo

Luồng có thể được bắt đầu bởi:

- Member gửi yêu cầu đổi PT;
- Owner/Admin thực hiện trực tiếp theo vận hành.

PT hiện tại không tự chuyển Member sang PT khác nếu không có quyền đã được duyệt.

### 5.2. Flow chuẩn

```text
Khởi tạo đổi PT
  -> chọn PT mới đang active
  -> xem các lịch tương lai bị ảnh hưởng
  -> xác nhận thay đổi
  -> đóng assignment cũ tại thời điểm hiệu lực
  -> tạo assignment mới
  -> rà soát/cập nhật lịch tương lai
  -> giữ nguyên toàn bộ lịch sử cũ
```

### 5.3. Sau khi đổi

- Member thấy PT mới.
- PT mới thấy Member active.
- PT cũ không còn thấy Member trong danh sách active.
- lịch/check-in đã hoàn thành vẫn gắn với PT cũ đúng thời điểm.

---

## 6. Không booking PT từng buổi

Màn check-in hoặc bắt đầu buổi tập không được hỏi:

> “Hôm nay bạn muốn chọn PT nào?”

PT của Member phải lấy từ current assignment.

Chỉ flow đổi PT mới thay đổi current assignment.

Điều này không cấm Owner chỉnh lịch; nó chỉ cấm biến mỗi buổi thành một booking PT mới.

---

## 7. Trạng thái assignment

Ở mức nghiệp vụ cần phân biệt tối thiểu:

| Trạng thái | Ý nghĩa |
|---|---|
| Active | Đang là PT hiện tại |
| Ended | Assignment lịch sử đã kết thúc |
| Pending transition | Chỉ dùng nếu implementation thực sự cần giai đoạn chuyển có kiểm soát |

Nếu không cần `Pending transition`, không tự thêm state này vào UI. Baseline quan trọng là một active assignment duy nhất và lịch sử không mất.

---

## 8. Edge cases

### 8.1. PT mới inactive

Không cho xác nhận assignment mới.

### 8.2. Hai Owner đổi PT cùng lúc

Kết quả cuối không được có hai primary assignment active chồng nhau.

### 8.3. PT cũ bị inactive

Không tự xóa assignment lịch sử. Nếu Member còn cần PT active, Owner phải thực hiện flow đổi assignment rõ ràng.

### 8.4. Member có lịch tương lai với PT cũ

Hệ thống phải đưa các lịch đó vào phạm vi rà soát khi đổi PT; không âm thầm để lịch tương lai trỏ tới quan hệ sai mà Owner không biết.

### 8.5. Check-in lịch sử

Không re-link check-in cũ sang PT mới.

---

## 9. Acceptance checklist

- [ ] Owner tạo Member được.
- [ ] Member active có PT hiện tại rõ ràng.
- [ ] PT thấy Member đang được giao.
- [ ] Một Member không có hai primary PT active chồng thời gian.
- [ ] Member có thể đổi PT theo flow được phép.
- [ ] PT mới phải active.
- [ ] Assignment cũ được giữ lịch sử.
- [ ] Lịch tương lai được rà soát khi đổi PT.
- [ ] Check-in/lịch đã hoàn thành không bị rewrite sang PT mới.
- [ ] Không có booking PT theo từng buổi.
