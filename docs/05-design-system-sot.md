# FITNESS-MANAGE SOT 05 — Design System & Role UI

**Trạng thái:** Canonical UI/UX baseline

---

## 1. Direction

UI phải:

- đơn giản;
- dễ nhìn;
- dễ thao tác;
- ưu tiên thông tin và hành động hơn trang trí;
- năng động, tươi sáng nhưng không gắt/chói;
- ít animation;
- responsive tốt trên mobile, tablet và web.

Không thiết kế theo kiểu dashboard enterprise nặng nề hoặc fitness app neon/high-energy quá mức.

---

## 2. Palette đề xuất đã khóa cho baseline

| Token | Màu | Dùng cho |
|---|---|---|
| `primary` | `#3A7BD5` | CTA chính, navigation active |
| `primary-soft` | `#EAF2FD` | selected surface, info card |
| `secondary` | `#20A486` | success/fitness accent |
| `secondary-soft` | `#E8F7F2` | success surface |
| `accent` | `#F2B84B` | warning nhẹ, renewal/trial attention |
| `danger` | `#D9534F` | destructive/error thực sự |
| `background` | `#F7F9FC` | app background |
| `surface` | `#FFFFFF` | card/panel |
| `text` | `#1F2937` | primary text |
| `text-muted` | `#667085` | secondary text |
| `border` | `#E4E7EC` | divider/input border |

Không dùng neon. Không phủ đỏ/cam diện rộng cho dashboard.

---

## 3. Typography

Ưu tiên system font hoặc một sans-serif dễ đọc tương thích Expo. Không khóa font thương hiệu riêng nếu chưa được duyệt.

Scale:

- Page title: 28–32px, semibold/bold
- Section title: 20–24px, semibold
- Body: 15–17px
- Label: 13–14px
- Numeric/KPI: 24–32px tùy surface

Không dùng ALL CAPS cho đoạn dài.

---

## 4. Layout

- spacing theo nhịp 4/8px;
- touch target mobile tối thiểu khoảng 44–48px;
- card radius 12–16px;
- form label luôn rõ;
- trạng thái không chỉ thể hiện bằng màu, phải có text/icon;
- destructive action tách khỏi primary action.

---

## 5. Animation

Chỉ dùng animation ngắn cho:

- button press;
- loading/skeleton;
- modal/drawer;
- check-in success;
- tab/route transition nhẹ.

Tránh:

- background animation;
- parallax;
- particle/confetti mặc định;
- looping decoration;
- transition dài làm chậm nghiệp vụ.

---

## 6. Owner UI

### Navigation

- Dashboard
- Khách hàng
- Gói tập
- Lịch tập
- Check-in
- PT
- Sales/Cảnh báo
- Logs/Báo cáo
- Cài đặt

### Dashboard

KPI/queue ưu tiên:

- check-in hôm nay;
- Trial đang active;
- Trial buổi cuối;
- Member sắp hết gói;
- booking hôm nay;
- PT có lịch hôm nay.

Không biến Dashboard thành nơi làm mọi CRUD.

### Customer management

Search chính:

- SĐT;
- tên;
- CCCD.

Customer detail có tabs/sections rõ:

- Profile;
- Membership;
- PT assignment;
- Booking;
- Check-in;
- Trial history;
- Notes/History.

### Booking

Calendar/day list rõ thời gian. Owner có Create/Edit/Cancel; edit/cancel yêu cầu reason khi business rule yêu cầu.

### Check-in counter

Màn ưu tiên tốc độ:

1. Scan QR;
2. hoặc nhập SĐT;
3. hiển thị identity/package/context;
4. một CTA check-in rõ ràng.

---

## 7. PT UI

Bottom tabs đề xuất:

- Hôm nay
- Lịch
- Member
- Tài khoản

PT chỉ thấy:

- lịch của mình;
- Member được assign;
- detail booking;
- nút PT check-in;
- lịch sử check-in của chính mình nếu cần.

Không hiển thị Create/Edit/Delete booking.

Không hiển thị sales, doanh thu hoặc customer database toàn gym.

---

## 8. Member UI

Bottom tabs đề xuất:

- Trang chủ
- Lịch
- Check-in
- AI
- Tài khoản

Home ưu tiên:

- package hiện tại;
- buổi/ngày còn lại;
- PT hiện tại nếu có;
- booking tiếp theo;
- shortcut QR.

Schedule là read-only.

Check-in hiển thị QR lớn, đơn giản.

AI dùng flow từng bước: chọn bài → quay/chọn video → phân tích → kết quả.

Profile hiển thị CCCD nhưng không cho sửa trực tiếp nếu Owner là data owner.

---

## 9. Empty/error/loading

- Empty state nói rõ bước tiếp theo.
- Error message dùng ngôn ngữ nghiệp vụ, không hiện stack trace.
- Loading không khóa toàn trang nếu chỉ một panel đang fetch.
- Mutation button disable khi pending để chống double-submit.

## UI implementation — 2026-09-24

Expo Router tách owner/pt/member; Owner có sidebar ở màn rộng và menu wrap trên màn hẹp, PT/Member có navigation dưới. Dashboard tập trung KPI/queue; CRUD ở trang chức năng. Form dùng RHF, validation tại API, pending guard và Idempotency-Key; danh sách có loading/error/empty và refresh. Nút chọn Member/PT có phân trang, không giới hạn thao tác ở 30 hồ sơ đầu.

AI hiện cung cấp một bài được hỗ trợ là Squat; chọn/quay video → lưu local → phân tích có progress/cancel → kết quả hoặc failure → xóa phiên/video. Nêu rõ chỉ đánh giá độ sâu và không thay PT. Owner/PT không có màn AI.

## Design pattern implementation — 2026-09-24

- Owner dùng sidebar từ 900px; dưới 900px dùng menu mở/đóng, không dồn chín mục thành bottom tabs nhiều hàng. PT/Member giữ bottom tabs theo SOT.
- Customer CRM dùng master/detail: danh sách tìm kiếm ở trái và hồ sơ có các section Tổng quan/Gói tập/Lịch sử ở phải; mobile xếp dọc. Form tiếp nhận Trial chỉ mở khi Owner chọn CTA.
- Danh sách Member/PT dùng searchable record rows trong trang hiện tại; radio chips chỉ dùng cho tập lựa chọn ngắn như role, status và context.
- Dashboard dùng KPI 30px, tách Trial lượt cuối và Member sắp hết gói trong queue. Check-in dùng progressive disclosure: xác thực QR/SĐT trước, sau đó mới hiện package/context; queue PT ngoài thu gọn mặc định.
- Empty state phải mô tả đúng ngữ cảnh và bước tiếp theo. AI hiển thị bốn bước Chọn bài/Video/Phân tích/Kết quả và xác nhận trước khi xóa video local.

## Mobile app và Web CRM — 2026-09-24

- Token trong `theme.ts` là nguồn duy nhất cho màu, spacing, radius và typography dùng lại; trạng thái success/warning/danger có badge semantic kèm text.
- Button web có hover/focus; drawer Owner compact có scrim, đóng bằng backdrop và khai báo modal accessibility. Bottom tabs PT/Member luôn một hàng, chia đều touch target.
- Trên mobile, chọn customer chuyển sang surface hồ sơ riêng với CTA quay lại; trên web giữ master/detail hai cột. Customer detail gồm Hồ sơ, Gói tập, PT, Booking, Check-in, Trial và Nhật ký.
- Lịch được nhóm theo ngày trên mọi role để quét nhanh; mutation vẫn chỉ xuất hiện cho Owner.
