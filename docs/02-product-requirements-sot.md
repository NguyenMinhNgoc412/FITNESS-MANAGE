# FITNESS-MANAGE SOT 02 — Product Requirements

**Trạng thái:** Canonical product requirements  
**Quy tắc:** File này sở hữu requirement ID, scope và acceptance cấp sản phẩm. Chi tiết workflow nằm ở file business tương ứng.

---

## 1. Role & access

### FR-AUTH-001
Hệ thống có đúng 3 role đăng nhập: `OWNER`, `PT`, `MEMBER`.

### FR-AUTH-002
Owner có quyền quản trị nghiệp vụ; PT và Member bị giới hạn theo role.

### FR-AUTH-003
Lead/Trial và External PT không phải role đăng nhập.

Chi tiết: `06-business-auth-role-access-sot.md`.

---

## 2. Lead / Trial / Conversion

### FR-TRIAL-001
Owner tạo Trial bằng tối thiểu tên + SĐT.

### FR-TRIAL-002
Mỗi Trial có đúng 3 lượt tập thử cố định.

### FR-TRIAL-003
Một SĐT chỉ được hưởng Trial một lần, kể cả hồ sơ Trial đã hết lượt.

### FR-TRIAL-004
Trial check-in bằng SĐT và mỗi check-in hợp lệ consume đúng một lượt.

### FR-TRIAL-005
Buổi Trial cuối tạo Sales Trigger.

### FR-TRIAL-006
Conversion Trial → Member giữ nguyên identity/history và bổ sung dữ liệu chính thức như CCCD.

Chi tiết: `07-business-lead-trial-conversion-sot.md`.

---

## 3. Membership & package

### FR-PKG-001
Hệ thống hỗ trợ package theo thời gian.

### FR-PKG-002
Hệ thống hỗ trợ package theo số buổi.

### FR-PKG-003
Hết package không xóa account Member.

### FR-PKG-004
Owner có thể kích hoạt/gia hạn package cho Member.

### FR-PKG-005
Member xem được trạng thái package, ngày hết hạn hoặc lượt còn lại.

### FR-PKG-006
Hệ thống tạo cảnh báo khi Member sắp hết package theo ngưỡng cấu hình/default đã duyệt.

### FR-PKG-007
Owner có 6 gói hội viên mẫu: 15/30/45 buổi và 3/6/12 tháng, kèm giá VNĐ tham khảo có thể sửa trước khi kích hoạt, gia hạn hoặc chuyển Trial. Giá ghi trên gói không đồng nghĩa đã thanh toán.

### FR-PKG-008
Owner xem số Member duy nhất đã đăng ký từng nhóm tên + loại gói và số lần cấp/gia hạn trong toàn bộ lịch sử. Gia hạn cùng nhóm không đếm thêm người; giữ cả gói hết hạn/hủy. Nhóm chưa từng được cấp không xuất hiện. PT/Member không truy cập thống kê toàn gym.

Chi tiết: `08-business-membership-package-sot.md`.

---

## 4. Profile & PT assignment

### FR-PROFILE-001
Hồ sơ Member/PT chính thức có họ tên, SĐT và CCCD; các field bổ sung có thể gồm ngày sinh, giới tính, địa chỉ, avatar.

### FR-PROFILE-002
SĐT unique cho identity đăng nhập/customer chính thức; CCCD unique khi đã nhập.

### FR-PT-001
Member dùng PT nội bộ có tối đa một primary PT active tại một thời điểm.

### FR-PT-002
Chỉ Owner được assign, đổi hoặc hủy PT của Member.

### FR-PT-003
Lưu lịch sử assignment và lý do thay đổi/hủy nếu có.

Chi tiết: `09-business-member-profile-pt-assignment-sot.md`.

---

## 5. Booking & schedule

### FR-BOOK-001
Booking là một buổi cụ thể có ngày, giờ bắt đầu, giờ kết thúc, Member và PT.

### FR-BOOK-002
Chỉ Owner tạo/sửa/hủy booking.

### FR-BOOK-003
Member và PT chỉ xem booking; muốn đổi/hủy phải liên hệ Owner.

### FR-BOOK-004
Khi Owner sửa/hủy booking phải lưu lý do và actor thực hiện.

### FR-BOOK-005
Không cho PT có booking overlap.

### FR-BOOK-006
Không cho Member có booking overlap.

### FR-BOOK-007
Không dùng khái niệm ca sáng/chiều/tối hoặc time-window dao động.

Chi tiết: `10-business-booking-schedule-sot.md`.

---

## 6. Check-in & attendance

### FR-CHECKIN-001
Member check-in ưu tiên QR; SĐT là fallback qua Owner.

### FR-CHECKIN-002
Hỗ trợ context: `TRIAL`, `SELF_TRAINING`, `WITH_INTERNAL_PT`, `WITH_EXTERNAL_PT`.

### FR-CHECKIN-003
Member có thể tự tập mà không cần PT.

### FR-CHECKIN-004
PT nội bộ có check-in/attendance log độc lập.

### FR-CHECKIN-005
Hệ thống không tự match Member log với PT log để kết luận PT vắng/có mặt cho booking.

### FR-CHECKIN-006
Owner có thể xem booking + Member check-in log + PT check-in log để đối chiếu thủ công.

### FR-CHECKIN-007
Owner xem lượt check-in theo 12 tháng của năm được chọn, theo UTC+7; tháng không có lượt hiển thị 0. Tổng lượt vào tập gồm Member + Trial, PT attendance hiển thị riêng. Đếm log đã ghi thành công, không suy ra số người duy nhất hoặc attendance cho booking. Không bổ sung báo cáo doanh thu trong yêu cầu này.

### FR-CHECKIN-008
Một customer/Member chỉ có một lượt vào tập trong mỗi ngày UTC+7, bất kể QR/SĐT, gói hay context. Trial chuyển Member cùng ngày vẫn là cùng identity. PT chỉ có một attendance log/ngày độc lập. Request mới sau điểm danh bị chặn và không consume quota/pass; replay cùng Idempotency-Key giữ kết quả cũ. Sang ngày mới được điểm danh nếu quyền/gói hợp lệ.

Chi tiết: `11-business-checkin-attendance-sot.md`.

---

## 7. External PT Pass

### FR-EXTPT-001
PT ngoài không có account/role.

### FR-EXTPT-002
Member đăng ký/mua External PT Pass với Owner.

### FR-EXTPT-003
Khi check-in PT ngoài, Owner tra bằng SĐT Member và chỉ cho phép khi pass hợp lệ.

### FR-EXTPT-004
Có cơ chế Member xác nhận bằng push trước khi consume pass nếu notification khả dụng.

Chi tiết: `12-business-external-pt-pass-sot.md`.

---

## 8. Sales trigger & notification

### FR-SALES-001
Trial buổi cuối tạo lead-sale alert cho Owner.

### FR-SALES-002
Member sắp hết package tạo renewal alert cho Owner.

### FR-NOTI-001
Khi Owner tạo/sửa/hủy booking, PT và Member liên quan nhận notification phù hợp.

### FR-NOTI-002
External PT confirmation dùng push notification khi có device token hợp lệ; phải có fallback nghiệp vụ nếu push không đến.

Chi tiết: `13-business-sales-trigger-notification-sot.md`.

---

## 9. AI form analysis

### FR-AI-001
AI là feature bổ trợ cho Member tự kiểm tra form bài tập tại nhà.

### FR-AI-002
Input là video bài tập được quay/chọn trên thiết bị; không bắt Member chọn bài trước. App nhận diện bài từ pose/chuyển động local trong phạm vi được hỗ trợ.

### FR-AI-003
AI có thể trả rep count, form status, lỗi form được hỗ trợ và gợi ý sửa.

### FR-AI-004
AI không tạo workout plan và không thay PT.

### FR-AI-005
Chỉ Member xem result AI của chính mình.

### FR-AI-006
Raw AI video không upload lên server/cloud trong flow chuẩn.

### FR-AI-007
Member trên mobile (Android/iOS Development Build) và web có thể phân tích Squat không tạ, hai tay đưa trước và xem số đo góc tại điểm thấp nhất của từng lần hoàn chỉnh: gối trái/phải, độ nghiêng thân vai–hông, khuỷu tay và độ nghiêng tay. Kết quả so sánh phải nêu tiêu chí tham chiếu, phân biệt mục tiêu app với tiêu chuẩn đã kiểm chứng; điểm thiếu dữ liệu không được kết luận đúng. Mục tiêu độ nghiêng thân tùy chọn do Member nhập theo hướng dẫn PT; không có mục tiêu thì không chấm đúng/sai thân. Phiên cũ vẫn đọc được; cần phân tích lại để có báo cáo góc. Bản native cũ phải báo cần build/cài lại, không ngầm trả kết quả thiếu góc.

Chi tiết: `14-business-ai-form-analysis-sot.md`.

### FR-AI-008
Web và mobile dùng flow video → tự nhận diện và phân tích → nhận xét. Bản hiện hành nhận diện heuristic SQUAT/PUSH_UP/LUNGE; bài không rõ/ngoài phạm vi hoặc video trộn bài trả UNKNOWN, không ép thành Squat. Kết quả tự lấy nhận xét tiếng Việt từ chỉ số, so sánh số đo với mục tiêu tham chiếu và đưa gợi ý ngắn theo phong cách hướng dẫn kỹ thuật của PT. Không suy ra biến thể/tạ hoặc đánh giá tay đúng/sai khi thiếu tiêu chí phù hợp. OpenAI chỉ diễn giải bằng chứng đã đo; khi offline/lỗi dịch vụ vẫn giữ nhận xét local và ghi rõ nguồn. FR-AI-007 còn áp dụng cho phiên cũ; phiên tự nhận diện không mặc định mẫu Squat hai tay đưa trước.

---

## 10. UI/UX

### FR-UI-001
UI đơn giản, dễ đọc, dễ thao tác.

### FR-UI-002
Màu năng động/tươi sáng nhưng không chói/gắt.

### FR-UI-003
Animation tối thiểu, chỉ dùng micro-interaction cần thiết.

### FR-UI-004
Owner có information density cao hơn PT/Member; PT/Member giữ surface gọn theo task.

Chi tiết: `05-design-system-sot.md`.

---

## 11. Audit & integrity

### FR-AUDIT-001
Các mutation quan trọng phải lưu actor/time/reason phù hợp.

### FR-AUDIT-002
Không double-consume Trial session, Membership session hoặc External PT Pass vì double-tap/retry.

### FR-AUDIT-003
Server phải enforce authorization; ẩn nút frontend không được xem là đủ bảo mật.

Chi tiết: `17-tech-security-audit-sot.md`.

---

## 12. Out of scope mặc định

- Staff role riêng.
- Member/PT tự tạo booking.
- Member tự đổi PT.
- PT tự đổi/hủy assignment.
- AI workout plan.
- AI medical diagnosis.
- raw AI video cloud upload.
- WebSocket/realtime trong MVP.
- full accounting/payroll/payment gateway nếu chưa có SOT mới phê duyệt.
