# FITNESS-MANAGE SOT 01 — Product Brief

**Trạng thái:** Canonical product brief  
**Phạm vi:** Why / positioning / audience / outcomes / principles / business model / boundaries

---

## 1. Why

FITNESS-MANAGE số hóa vận hành một phòng gym quy mô cá nhân/nhỏ theo hướng thực tế: thu hút khách tập thử, chuyển đổi thành hội viên, quản lý gói tập, điều phối PT, booking từng buổi, check-in và chăm sóc gia hạn.

Sản phẩm đồng thời có một tính năng AI bổ trợ cho Member tự kiểm tra form bài tập tại nhà mà không biến AI thành PT thay thế.

---

## 2. Định vị

FITNESS-MANAGE là hệ thống quản lý gym đa nền tảng gồm:

- giao diện quản lý cho Owner;
- giao diện lịch/attendance tối giản cho PT;
- app cho Member để xem lịch, package, QR check-in, lịch sử và AI form check;
- CRM Trial đơn giản nhưng sát vận hành;
- ưu tiên chi phí triển khai thấp và free tier cho đồ án/MVP.

---

## 3. Audience

### 3.1. Owner

Chủ phòng gym, đồng thời là người quản lý quầy trong MVP. Owner cần nắm customer lifecycle, package, PT, lịch, check-in, sales trigger và ngoại lệ.

### 3.2. PT nội bộ

Chỉ cần xem lịch được phân công, thông tin Member cần cho buổi tập và thực hiện PT check-in.

### 3.3. Member

Hội viên chính thức sử dụng app để xem package, lịch, PT, QR check-in, lịch sử và AI form check.

### 3.4. Trial/Lead

Khách tiềm năng chưa phải role đăng nhập. Tương tác chủ yếu tại quầy qua tên + SĐT.

### 3.5. PT ngoài

Không phải user của hệ thống. Đi cùng Member có External PT Pass và được xử lý tại quầy qua SĐT của Member.

---

## 4. Outcomes

MVP thành công khi:

1. Owner tạo Trial trong vài thao tác và kiểm soát đúng 3 lượt.
2. Không thể lợi dụng cùng SĐT để Trial lại.
3. Trial có thể được chuyển thành Member mà không mất lịch sử.
4. Owner quản lý được package theo thời hạn hoặc số buổi.
5. Owner nhìn thấy khách sắp hết Trial/gói để chủ động chăm sóc.
6. Owner phân PT và quản lý booking không chồng lịch.
7. Member/PT không thể tự thay đổi lịch ngoài Owner.
8. Member check-in nhanh bằng QR và vẫn có SĐT fallback.
9. PT có attendance log riêng để Owner kiểm tra khi cần.
10. External PT Pass hoạt động mà PT ngoài không cần account.
11. AI giúp Member tự kiểm tra form nhưng raw video không rời thiết bị.

---

## 5. Product principles

1. **Owner-controlled operations:** mutation nhạy cảm về khách hàng, PT, package và lịch do Owner kiểm soát.
2. **Zero-friction Trial:** khách tập thử không bị ép cài app.
3. **Phone-first identity at counter:** SĐT là định danh tìm kiếm chính tại quầy; QR tăng tốc cho Member.
4. **History over overwrite:** assignment, booking cancellation, package và check-in cần lịch sử để đối soát.
5. **Simple role surfaces:** mỗi role chỉ thấy đúng chức năng cần dùng.
6. **Privacy-first AI:** raw body/workout video local-only.
7. **AI assists form, not coaching:** PT chịu trách nhiệm lộ trình; AI chỉ hỗ trợ form feedback.
8. **Cost-conscious MVP:** ưu tiên local/free tier, tránh hạ tầng nặng không cần thiết.
9. **Low-friction UI:** dễ đọc, ít bước, ít animation, màu sáng nhưng không gắt.

---

## 6. Business model trong phạm vi sản phẩm

Hệ thống hỗ trợ các nguồn giá trị/vận hành sau:

- Trial 3 buổi để thu hút lead;
- bán/gia hạn Membership;
- dịch vụ PT nội bộ;
- External PT Pass;
- chăm sóc khách sắp hết Trial hoặc package.

MVP không bắt buộc tích hợp payment gateway. Việc thanh toán có thể được Owner ghi nhận thủ công trong hệ thống nếu feature tài chính chi tiết chưa được duyệt.

---

## 7. Boundaries

### Trong MVP

- 3 role đăng nhập: Owner, PT, Member.
- Lead/Trial và conversion.
- Profile/CCCD.
- Membership theo tháng hoặc số buổi.
- PT assignment.
- Owner-managed booking.
- Member/Trial check-in và PT attendance.
- External PT Pass.
- Sales/renewal trigger.
- Notification cần thiết.
- AI form check cho Member.

### Ngoài MVP nếu chưa được duyệt

- Staff/Lễ tân role riêng.
- Payroll/chấm công tính lương.
- Accounting đầy đủ.
- Payment gateway.
- Multi-branch enterprise.
- Marketplace PT.
- Chat social/community.
- AI workout-plan generation.
- AI medical diagnosis/injury diagnosis.
- Owner/PT xem raw AI video hoặc AI result cá nhân của Member.


## Hoạt động tập luyện Member — 2026-10-28

Phạm vi mở rộng được Owner duyệt: nhật ký tự ghi, tiến bộ theo bài, cân nặng/chiều cao và thư viện 20 bài theo 10 nhóm cơ. Dữ liệu cá nhân chỉ Member sở hữu xem; thư viện tham khảo chung, không phải giáo án. Độc lập booking/check-in/quota/AI. Chi tiết SOT 21; requirement FR-WORKOUT trong SOT 02.
