# FITNESS-MANAGE SOT 05 — Business Spec: Authentication & Role Access

**Trạng thái:** SOT nghiệp vụ chi tiết  
**Dự án:** FITNESS-MANAGE  
**Ngày cập nhật:** 2026-09-16  
**Requirement liên quan:** `PR-AUTH-001`, `PR-AUTH-002`, `PR-PT-001`, `PR-PT-002`, `PR-TEST-001`  
**Nguyên tắc:** File này chi tiết hóa flow, state và edge case của requirement đã có. Không tạo role hoặc quyền mới ngoài `02-product-requirements-sot.md`.

---

## 1. Mục tiêu

Đảm bảo ba role đăng nhập chính của hệ thống được tách quyền rõ ràng:

- `Owner/Admin`;
- `PT`;
- `Member`.

`Guest` không phải role đăng nhập. Không có `Staff` hoặc `Dev` trong permission model nghiệp vụ.

---

## 2. Role model đã chốt

### 2.1. Owner/Admin

Có quyền vận hành hệ thống trong phạm vi sản phẩm hiện tại:

- quản lý PT;
- quản lý Member;
- quản lý PT assignment;
- xem lịch và check-in toàn hệ thống;
- xem/xử lý attendance exception;
- tạo và chuyển đổi guest;
- xem dữ liệu AI theo policy;
- xem audit phù hợp.

### 2.2. PT

PT chỉ thao tác trong phạm vi member đang được giao hoặc dữ liệu lịch sử mà policy cho phép:

- xem member hiện tại;
- xem lịch liên quan;
- check-in cho chính mình;
- xem dữ liệu tập luyện/AI phục vụ huấn luyện trong phạm vi cho phép.

PT không được:

- tự tạo assignment mới để lấy member;
- chuyển member sang PT khác;
- check-in thay PT khác;
- quản trị toàn bộ account.

### 2.3. Member

Member chỉ thao tác với dữ liệu của chính mình:

- xem PT hiện tại;
- xem lịch của mình;
- check-in cho chính mình;
- khởi tạo luồng đổi PT nếu UI hỗ trợ;
- gửi video AI;
- xem kết quả AI của mình.

### 2.4. Guest

Guest là record nghiệp vụ. Guest:

- không đăng nhập;
- không có session;
- không có permission riêng;
- chỉ được Owner/Admin tạo/quản lý trong flow trial.

---

## 3. Trạng thái tài khoản

Tối thiểu hỗ trợ các trạng thái nghiệp vụ:

| Trạng thái | Ý nghĩa |
|---|---|
| `ACTIVE` | Có thể đăng nhập và dùng chức năng theo role |
| `INACTIVE` | Không dùng cho hoạt động mới; vẫn giữ lịch sử |
| `LOCKED` | Bị khóa truy cập cho tới khi được mở lại |

Quy tắc:

1. PT `INACTIVE` không được chọn cho assignment mới.
2. PT bị inactive/locked không làm mất assignment/check-in lịch sử.
3. Member bị inactive/locked không làm mất lịch sử check-in hoặc AI.
4. Đổi trạng thái account là hành động quản trị phải truy vết được.

---

## 4. Luồng đăng nhập

```text
Người dùng nhập thông tin đăng nhập
  -> hệ thống xác thực identity
  -> kiểm tra account status
  -> xác định role
  -> tạo session
  -> điều hướng vào khu vực đúng role
```

### 4.1. Đăng nhập thành công

- Owner/Admin vào khu quản trị.
- PT vào khu PT.
- Member vào khu Member.

### 4.2. Đăng nhập thất bại

Hệ thống:

- báo lỗi đủ hiểu;
- không tiết lộ thông tin nhạy cảm về account;
- không tạo session một phần.

### 4.3. Account không active

- không cho truy cập chức năng yêu cầu đăng nhập;
- không tự đổi status chỉ vì login thất bại;
- giữ nguyên dữ liệu lịch sử.

---

## 5. Authorization behavior

UI có thể ẩn action không hợp lệ, nhưng quyền thực tế phải được kiểm tra ở hệ thống phía sau.

Các rule bắt buộc:

1. Member không đọc/sửa member khác.
2. Member không quản lý PT hoặc assignment của người khác.
3. PT không đọc member ngoài phạm vi được giao nếu policy không cho phép.
4. PT không check-in thay PT khác.
5. Member không check-in thay Member khác.
6. Owner/Admin có quyền quản trị đúng các chức năng đã có trong PRD.
7. Không dùng việc biết URL/route/API để vượt role.

---

## 6. PT management flow

### 6.1. Tạo PT

```text
Owner mở quản lý PT
  -> nhập thông tin tối thiểu
  -> tạo account/profile
  -> đặt trạng thái hoạt động
  -> PT có thể đăng nhập khi account hợp lệ
```

### 6.2. Chuyển PT sang inactive

Trước khi xác nhận, UI nên cho Owner biết PT đang có member active hay không.

Sau khi inactive:

- không gán member mới cho PT đó;
- không xóa assignment/check-in cũ;
- việc xử lý member hiện tại phải qua flow assignment riêng, không âm thầm chuyển sang PT khác.

### 6.3. PT xem member mình phụ trách

Danh sách active của PT chỉ gồm member có assignment hiện tại với PT đó.

Member đã đổi PT:

- không còn nằm trong danh sách active của PT cũ;
- vẫn tồn tại trong lịch sử nếu Owner/Admin cần tra cứu.

---

## 7. Session isolation để test ba role

Môi trường dev/test phải cho phép mở đồng thời:

- 1 session Owner/Admin;
- 1 session PT;
- 1 session Member.

Không dùng chung session/local auth state khiến role này ghi đè role khác.

Flow kiểm thử tối thiểu:

```text
Owner đăng nhập session A
PT đăng nhập session B
Member đăng nhập session C
  -> Owner thay đổi assignment/lịch
  -> PT và Member refresh dữ liệu
  -> mỗi role thấy đúng phạm vi của mình
```

---

## 8. Error & edge cases

1. Account bị khóa trong lúc đang có session: request tiếp theo phải bị từ chối theo policy session hiện hành.
2. PT chuyển inactive khi còn member active: không xóa lịch sử; cần Owner xử lý assignment rõ ràng.
3. Role trong client bị sửa thủ công: backend/service vẫn từ chối action trái quyền.
4. Hai Owner cùng sửa một account: không được tạo trạng thái dữ liệu nửa vời.
5. Guest không được vô tình tạo thành account chỉ vì có số điện thoại/email.

---

## 9. Acceptance checklist

- [ ] Chỉ có Owner/Admin, PT, Member là role đăng nhập.
- [ ] Guest không phải account role.
- [ ] PT inactive không được assignment mới.
- [ ] PT thấy đúng member đang phụ trách.
- [ ] Member chỉ truy cập dữ liệu của mình.
- [ ] PT không check-in thay người khác.
- [ ] Owner/Admin có quyền quản trị đúng PRD.
- [ ] Account status không làm mất lịch sử nghiệp vụ.
- [ ] Authorization được kiểm tra phía hệ thống, không chỉ ở UI.
- [ ] Test đồng thời ba role bằng session độc lập hoạt động đúng.
