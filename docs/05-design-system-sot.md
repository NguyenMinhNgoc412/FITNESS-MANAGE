# FITNESS-MANAGE SOT 05 — Design System & Role UI

## Counter check-in validation — 2026-10-08

Sau resolve QR hoặc tra cứu SĐT, Owner phải chọn gói đang hoạt động trước xác nhận; PT nội bộ còn cần booking. Thiếu lựa chọn phải báo rõ tại form và không gửi request. Quét mã mới xóa Member/token của mã cũ trước resolve để lỗi quét không giữ identity cũ.

## Conversion validation — 2026-10-08

Form chuyển Trial thành Member báo rõ lỗi CCCD, độ dài mật khẩu và trường gói không hợp lệ thay vì chỉ báo chung. Không hiển thị giá trị CCCD/mật khẩu trong lỗi. Ngày mặc định của gói dùng chuỗi ngày local YYYY-MM-DD độc lập locale cho web/native.

**Trạng thái:** Canonical UI/UX baseline

---

## 1. Direction

### Owner statistics — 2026-10-09

Trang Gói tập có thống kê người đăng ký từng nhóm gói, ghi rõ toàn lịch sử và số lần cấp/gia hạn. Logs/Báo cáo có báo cáo check-in 12 tháng, chọn năm trước/sau, Member/Trial và PT attendance tách rõ; tháng rỗng hiện 0. Cả hai panel có loading/error/retry; gói chưa có dữ liệu có empty state. Chỉ Owner nhìn thấy; không thêm báo cáo doanh thu.

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
- PT & Member
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

AI dùng flow từng bước: quay/chọn video → tự nhận diện và phân tích → nhận xét. Không có bước chọn bài.

Profile hiển thị CCCD nhưng không cho sửa trực tiếp nếu Owner là data owner.

---

## 9. Empty/error/loading

- Empty state nói rõ bước tiếp theo.
- Error message dùng ngôn ngữ nghiệp vụ, không hiện stack trace.
- Loading không khóa toàn trang nếu chỉ một panel đang fetch.
- Mutation button disable khi pending để chống double-submit.

## UI implementation — 2026-09-24

Expo Router tách owner/pt/member; Owner có sidebar ở màn rộng và menu wrap trên màn hẹp, PT/Member có navigation dưới. Dashboard tập trung KPI/queue; CRUD ở trang chức năng. Form dùng RHF, validation tại API, pending guard và Idempotency-Key; danh sách có loading/error/empty và refresh. Nút chọn Member/PT có phân trang, không giới hạn thao tác ở 30 hồ sơ đầu.

AI nhận diện heuristic Squat/chống đẩy/lunge; chọn/quay video → lưu local → nhận diện/phân tích có progress/cancel → nhận xét tự động hoặc failure → xóa phiên/video. UNKNOWN có thông báo riêng. Nêu rõ giới hạn số đo, ngưỡng app và không thay PT. Owner/PT không có màn AI.

## Design pattern implementation — 2026-09-24

- Owner dùng sidebar từ 900px; dưới 900px dùng menu mở/đóng, không dồn chín mục thành bottom tabs nhiều hàng. PT/Member giữ bottom tabs theo SOT.
- Customer CRM dùng master/detail: danh sách tìm kiếm ở trái và hồ sơ có các section Tổng quan/Gói tập/Lịch sử ở phải; mobile xếp dọc. Form tiếp nhận Trial chỉ mở khi Owner chọn CTA.
- Danh sách Member/PT dùng searchable record rows trong trang hiện tại; radio chips chỉ dùng cho tập lựa chọn ngắn như role, status và context.
- Dashboard dùng KPI 30px, tách Trial lượt cuối và Member sắp hết gói trong queue. Check-in dùng progressive disclosure: xác thực QR/SĐT trước, sau đó mới hiện package/context; queue PT ngoài thu gọn mặc định.
- Empty state phải mô tả đúng ngữ cảnh và bước tiếp theo. AI hiển thị bốn bước Chọn bài/Video/Phân tích/Kết quả và xác nhận trước khi xóa video local.

## Mobile app và Web CRM — 2026-09-24

- Token trong `theme.ts` là nguồn duy nhất cho màu, spacing, radius và typography dùng lại; trạng thái success/warning/danger có badge semantic kèm text.
- Button web có hover/focus; drawer Owner compact có scrim, đóng bằng backdrop và khai báo modal accessibility. Bottom tabs PT/Member luôn một hàng, vùng chạm tối thiểu 48px; tab đang mở rộng hơn để chứa nhãn.
- Trên mobile, chọn customer chuyển sang surface hồ sơ riêng với CTA quay lại; trên web giữ master/detail hai cột. Customer detail gồm Hồ sơ, Gói tập, PT, Booking, Check-in, Trial và Nhật ký.
- Lịch được nhóm theo ngày trên mọi role để quét nhanh; mutation vẫn chỉ xuất hiện cho Owner.

## Điều hướng dưới — 2026-09-29

- PT/Member: mục đang mở hiển thị icon kèm nhãn; các mục còn lại chỉ hiển thị icon trên cùng một hàng.
- Mọi mục vẫn có tên đầy đủ cho trợ năng, vùng chạm tối thiểu 48px và trạng thái chọn thể hiện bằng nền cùng nhãn, không chỉ bằng màu.
- Owner tiếp tục dùng sidebar hoặc menu có nhãn đầy đủ.

## Hoàn thiện mobile và CRM — 2026-09-29

- Icon Member/Tài khoản/Check-in trên thanh dưới dùng hình phân biệt rõ, giữ nhãn khi chọn và tên trợ năng ở mọi trạng thái.
- Form sửa booking điền sẵn Member, PT và thời gian hiện tại để Owner chỉ sửa phần cần đổi.
- Hồ sơ CRM hiển thị nhật ký thao tác riêng của khách, có phân trang, thời gian và lý do khi có.
- CRM dùng hai cột khi viewport từ 1100px để danh sách và chi tiết có đủ chỗ; dưới ngưỡng này mở hồ sơ trên một surface riêng.

## Gói hội viên mẫu — 2026-09-29

- Trang Gói tập không có card liệt kê “6 gói hội viên mẫu” riêng; tên/giá hiển thị ngay trong lựa chọn khi tạo gói, gia hạn, chuyển Trial để tránh trùng thông tin.
- Form mẫu chỉ yêu cầu ngày bắt đầu và giá có thể sửa; quota hoặc ngày kết thúc được tính từ mẫu. Thành viên chỉ xem giá đã ghi trên gói của mình nếu có.

## Member packages và ngày gói — 2026-10-08

- Mục Owner `/owner/pt` đổi nhãn “PT & Member”; route và quyền giữ nguyên, chứa hai lựa chọn Huấn luyện viên/Hội viên.
- Khi Owner chọn Member ở màn này hoặc mở hồ sơ khách hàng đã liên kết Member, hiển thị gói đã cấp ngay trong hồ sơ: tên, trạng thái server, số lượt còn/tổng hoặc hạn hết, giá nếu có. Gói ACTIVE ưu tiên trước; lịch sử vẫn có nhãn trạng thái, không coi gói hết hạn/hủy là đang dùng. Có loading/error/retry/empty; chuyển Member không giữ gói của Member trước.
- Tab quản lý Gói tập đưa gói đã cấp lên trước form thêm gói/pass. Dùng memberUserId trong hồ sơ customer để gọi endpoint existing memberships; không dùng customerId thay Member id hoặc đoán từ SĐT.
- Ngày bắt đầu/kết thúc package dùng date-only picker trên web/native; gói thời gian tùy chỉnh chọn cả hai ngày, mẫu theo tháng tự tính hạn theo SOT 08. Conversion/gia hạn dùng cùng trường ngày. Booking vẫn dùng datetime. Không thay đổi tính trạng thái, quota, giá hay quyền mutation ở server.

## Chọn thời gian lịch tập — 2026-10-08

Owner tạo/sửa booking chọn ngày giờ bắt đầu và kết thúc bằng control datetime, không nhập chuỗi định dạng thủ công. Web dùng datetime-local và chặn nhập/paste trực tiếp, hỗ trợ mở picker bằng click/Enter/Space. Native dùng picker có sẵn trong repository: Android chọn ngày rồi giờ, iOS xác nhận hoặc hủy trong dialog; hủy không đổi giá trị. Các control khóa khi gửi, chỉnh sửa điền sẵn thời gian hiện tại. Giá trị local được chuyển ISO trước gọi API; server vẫn kiểm tra khoảng giờ, overlap và quyền Owner. PT/Member giữ lịch read-only.

## Sửa hồi quy design system — 2026-10-07

- Đổi mẫu gói trong conversion giữ CCCD/mật khẩu đã nhập; chỉ reset trường gói theo mẫu mới. Không đổi mẫu hoặc lựa chọn trong form khi đang gửi.
- Stepper AI theo phiên đang thao tác; video mới ở bước Video dù lịch sử đã có kết quả. Import/phân tích/xóa dùng chung khóa; xóa giữ pending cả khi chờ xác nhận và thao tác local.
- Record picker có dấu chọn hiển thị cùng trạng thái trợ năng; shortcut trên Home dùng liên kết có vùng chạm tối thiểu 48px và hover/focus.
- Typography, spacing, radius và kích thước control dùng lại trong UI/shell lấy từ `theme.ts`; kích thước hình học riêng của icon/layout không phải token spacing dùng lại.

## Phản hồi chọn video AI trên web — 2026-10-08

- Khi chọn/lưu/ghi phiên video, hiển thị stage và spinner ở nút đã bấm; khóa thao tác cạnh tranh. Lưu thành công phải có thông báo hướng dẫn bấm “Phân tích trên thiết bị”, không ngầm coi việc chọn video là đã phân tích.
- Môi trường web không hỗ trợ bộ nhớ AI phải báo lỗi rõ và trả nút về trạng thái thao tác được, không để chỉ mờ nút mà thiếu phản hồi.

## So sánh góc AI — 2026-10-08

- Bài được nhận diện hiển thị sau phân tích, không mặc định Squat/hai tay đưa trước cho phiên mới. Trước phân tích có input tùy chọn mục tiêu độ nghiêng thân theo hướng dẫn PT; input khóa khi pending.

Nhận xét được gọi tự động sau khi đo và hiển thị từng đoạn; ghi rõ OPENAI hoặc thuật toán local. Dịch vụ lỗi vẫn hiển thị kết quả local và cho phân tích lại. Stepper ba bước dùng chung web/mobile; lịch sử v1 vẫn đọc được. Các trường thiếu dữ liệu/thiếu tiêu chí không được biểu thị là đạt kỹ thuật.
- Kết quả hiển thị độ phủ nhận diện, CTA mở/ẩn chi tiết từng lần; mỗi lần có timestamp điểm thấp nhất và các hàng số đo/tiêu chí/kết luận/gợi ý. Layout xếp dọc trên mobile, trạng thái dùng chữ, không chỉ màu.
- Ghi rõ góc 2D, giới hạn cột sống/hướng tay/knee valgus, ngưỡng app chưa được kiểm chứng. Kết quả cũ thiếu detail hướng dẫn phân tích lại trên mobile/web; mobile báo cần Development Build mới nếu binary cũ/Expo Go. Nút dịch vụ ghi rõ chỉ giải thích độ sâu.
