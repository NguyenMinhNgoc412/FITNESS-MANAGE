# FITNESS-MANAGE SOT 05 — Design System & Role UI

## Danh sách và thống kê dùng list → popup — 2026-10-29

- Theo yêu cầu Owner, danh sách bản ghi dùng hàng có tên/thời gian, mô tả ngắn, trạng thái chữ và dấu mở chi tiết; bỏ card lặp lại theo từng bản ghi. Các hàng nằm trong một list container không có gap giữa record, padding dọc 8px và vùng chạm ít nhất 56px; tránh giữ lại khoảng cách vốn dành cho các card. Bấm hàng mở popup. Áp dụng khách hàng CRM, gói đã cấp/Pass, lịch ba role, Sales/Logs, thống kê gói/tháng, lịch sử PT/check-in, Member phụ trách, nhật ký/số đo/bài mẫu/revisions/biểu đồ và phiên AI/chi tiết từng lần. Control chọn hồ sơ trong form vẫn là selection list/radio, không biến thành thao tác mở detail.
- CRM thay surface master/detail cũ bằng danh sách và popup trên cả web/mobile. Gói cấp/gia hạn/hủy, tạo gói/pass, lịch Owner và chăm sóc Sales thực hiện bên trong popup; giữ quyền Owner, lý do/idempotency, pagination và không thêm API/business rule. Mỗi cấp popup giữ nội dung đúng resource, close/Back/Escape trả về danh sách ở vị trí trước đó.
- Popup giới hạn chiều cao, safe-area/keyboard avoidance, header/nút đóng cố định, nội dung cuộn riêng và focus containment/restoration theo RN Modal. Form/useCommand đăng ký pending với popup; đang gửi khóa đóng, Escape và các control cạnh tranh. Nhật ký/số đo dirty xác nhận trước khi đóng; lỗi/conflict vẫn giữ form. Popup có scroll context riêng cho focus ô lỗi native, không cuộn Page phía sau.
- Giữ card cho KPI tổng quan, QR, vùng form/nhóm nhập liệu và hướng dẫn có ý nghĩa; padding/gap phổ biến 16/12px, không để vùng rỗng lớn. Không dùng card lặp cho từng record hoặc từng dòng report. Navigation tiles hoạt động là control chuyển mục, vẫn giữ icon/nhãn và vùng chạm.
- Giữ summary số liệu hiện hành, source/API và quyền từng role; PT/Member detail lịch không có sửa/hủy, Owner/PT không có route AI/tập luyện riêng tư của Member. Video local, metrics và lifecycle AI không đổi. Lịch sử vẫn xem đầy đủ qua phân trang.

## Quản lý PT/Member trong một màn hình — 2026-10-29

- Theo yêu cầu Owner, màn PT & Member dùng hàng danh sách (tên, SĐT, trạng thái có chữ), chiều cao giới hạn theo vùng nội dung. Số dòng mỗi trang tự điều chỉnh theo chiều cao; nút trang trước/sau luôn ở ngoài danh sách. Không render form hoặc detail nối dài dưới danh sách. Giữ khả năng truy cập các nhóm dữ liệu API 30 hồ sơ, không cắt mất các hồ sơ sau nhóm đầu. Lọc tên/SĐT chỉ trong nhóm dữ liệu hiện tại và ghi rõ phạm vi.
- Bấm một hàng mở popup chi tiết; Thông tin, Sửa hồ sơ và PT phụ trách tách thành mục. Thông tin Member giữ gói đã cấp, PT hiện tại và trạng thái hồ sơ; mục PT giữ phân trang chọn PT, lý do và lịch sử. Thêm PT/Member cũng mở popup.
- Popup giới hạn trong viewport, cuộn nội dung riêng; header và nút đóng luôn thấy. Có trợ năng modal và đóng bằng Escape/back khi không pending. Khóa đóng và các thao tác cạnh tranh khi lưu; lỗi giữ form. Đóng popup giữ trang/lọc hiện tại. Không đổi quyền Owner hoặc business/API/schema.

## Lịch dạng danh sách gọn — 2026-10-29

- Theo yêu cầu Owner, màn Lịch của Owner/PT/Member dùng các hàng phân cách theo ngày, giờ bắt đầu–kết thúc, tên Member/PT và trạng thái bằng chữ; không bọc từng buổi trong card. Giữ phân trang 30 buổi, responsive và vùng chạm 48px.
- Form tạo/sửa của Owner chỉ mở khi chủ động chọn; phân trang danh sách chọn nằm trong form. Khóa thao tác cạnh tranh khi đang lưu/hủy. PT và Member chỉ xem.

## Hoàn thiện CRM sau review — 2026-10-20

- Hồ sơ customer liên kết Member hiển thị thông tin chính thức gồm họ tên, CCCD, trạng thái tài khoản với nhãn tiếng Việt. Phân loại Member không thay cho trạng thái account. Trial không có account thì không hiển thị một hồ sơ chính thức giả định; Member thiếu liên kết có thông báo rõ.
- Booking và Check-in trong hồ sơ có bộ phân trang độc lập, 30 dòng/trang, loading/error/retry/empty. Chuyển khách reset trang qua identity của surface; không giữ dữ liệu khách cũ. Check-in dùng endpoint riêng theo customer, bao gồm Trial và Member liên kết; không dùng preview 100 dòng làm toàn bộ lịch sử.
- Sales có bộ lọc Chưa xử lý/Đã liên hệ/Đã mua hoặc gia hạn/Không tiếp tục/Tất cả. Mặc định Chưa xử lý, đổi bộ lọc về trang 1; alert đã đóng vẫn xem được bằng bộ lọc tương ứng. Không đổi workflow cập nhật trạng thái/ghi chú hoặc tự suy kết quả bán hàng.

## Sửa design system sau review — 2026-10-20

- Giữ `primary=#3A7BD5` và `danger=#D9534F` cho màu thương hiệu/đồ họa. Chữ nhỏ dùng semantic `primaryText=#245B9E`, `dangerText=#AD302D`; CTA nền `primaryStrong=#2864B5`, hover/pressed `#205397` với chữ trắng. Các cặp chữ/nền của button, link, badge và message đạt tối thiểu 4,5:1; không dùng màu thương hiệu sáng làm chữ trên nền nhạt.
- Cấp/gia hạn gói dùng Form ổn định theo revision; picker mẫu gói và mọi trường khóa cùng pending, không remount form để mở lại nút gửi. Conversion giữ cơ chế preserve identity hiện hành.
- Menu Owner có vùng cuộn độc lập ở drawer compact và sidebar màn rộng để truy cập được mọi mục trên màn thấp; giữ scrim, đóng menu và vùng chạm 48px.
- Form hỗ trợ destructive variant. Xác nhận hủy lịch, hủy PT, hủy gói dùng màu chữ danger semantic và nhãn rõ hành động, không dùng nhãn chung “Lưu”.
- Quầy check-in PT nội bộ hiển thị loading/error/retry/empty cho booking của Member đang chọn; khi chưa có dữ liệu hợp lệ thì khóa form xác nhận. Empty state hướng dẫn kiểm tra/tạo lịch. Tự tập không phụ thuộc trạng thái booking; validation/quota/quyền ở server giữ nguyên.

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
| `primary` | `#3A7BD5` | màu thương hiệu, icon/indicator |
| `primaryStrong` | `#2864B5` | nền CTA chính với chữ trắng |
| `primaryPressed` | `#205397` | nền CTA chính hover/pressed |
| `primaryText` | `#245B9E` | chữ link, navigation active, secondary CTA/badge |
| `primary-soft` | `#EAF2FD` | selected surface, info card |
| `secondary` | `#20A486` | success/fitness accent |
| `secondary-soft` | `#E8F7F2` | success surface |
| `accent` | `#F2B84B` | warning nhẹ, renewal/trial attention |
| `danger` | `#D9534F` | icon/indicator destructive/error |
| `dangerText` | `#AD302D` | chữ destructive/error trên nền nhạt |
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
- QR PT check-in trên Hôm nay, có đếm ngược/làm mới như Member; Owner quét và xác nhận tại quầy;
- lịch sử check-in của chính mình, có nút làm mới sau khi Owner xác nhận.

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

## PT QR tại quầy — 2026-10-21

Quầy Owner dùng chung máy quét cho Member/PT. Resolve PT chỉ hiện tên và CTA “Xác nhận PT có mặt”, không hiện form gói/context/booking của Member. Quét mã mới hoặc tra SĐT xóa identity/token trước; lỗi mã không giữ PT cũ. Form khóa khi pending, thông báo thành công/lỗi rõ ràng. QR PT dùng cùng component với Member, loading/error/retry, đếm ngược và tự làm mới trước hết hạn.


## Hoạt động tập luyện Member — 2026-10-28

Home Member có shortcut Hoạt động tập luyện; màn /member/workouts có Nhật ký, Tiến bộ, Số đo cơ thể và Bài tập mẫu. Dùng lại primitives/tokens, form RHF, ngày date-only, kg/cm rõ ràng. Pending khóa form và đổi mục; dirty form xác nhận bỏ thay đổi, lỗi/conflict giữ nội dung, tải bản mới có xác nhận. Biểu đồ cột có bảng ngày/giá trị/đơn vị, không bịa số liệu khi thiếu. Có lọc/phân trang/loading/empty/error/retry/success; account switch remount theo identity. Không thêm màn Owner/PT xem dữ liệu riêng. Nội dung chi tiết SOT 21.

### Hoàn thiện sau review — 2026-10-28

- Bộ lọc có nhãn hiển thị cố định “Từ ngày”/“Đến ngày” bên cạnh tên trợ năng; không chỉ đặt aria-label cho ô ngày.
- Bốn mục chức năng dùng Button có dấu ✓ cho mục đang chọn, trạng thái selected trên native và aria-pressed trên web, tên trợ năng giữ nguyên. Giữ hover/focus, vùng chạm 48px, wrap trên màn hẹp và khóa đổi mục khi mutation pending.
- Feedback lỗi/thành công dùng styles.error/styles.success với màu semantic trong theme, nội dung chữ và live region polite; lỗi có role alert. Áp dụng cho mutation, kết quả lưu ở danh sách, validation khoảng ngày và lỗi mở nguồn thư viện.
- Trạng thái nhật ký/số đo ở danh sách, chi tiết và revision dùng Badge với nhãn tiếng Việt; action lịch sử hiển thị Tạo mới/Cập nhật/Hoàn tất/Lưu trữ, không đưa mã enum vào giao diện. Nháp dùng warning, hoàn tất/đang hoạt động dùng success, lưu trữ dùng info.
- Ô lọc bài đã ghi có nhãn “Bài đã ghi”, placeholder “Nhập tên bài tập”; giữ placeholder tìm hồ sơ ở các màn khác theo ngữ cảnh của chúng.

### Giảm thao tác và độ dài màn Member — 2026-10-28

- Lưu nháp/lưu thay đổi nhật ký giữ màn nhập, cập nhật id/version và nội dung từ response server. Sau lưu nháp hiển thị hướng dẫn tiếp tục nhập hoặc hoàn tất; không tự hoàn tất, vẫn gửi request complete riêng khi người dùng chọn. Conflict giữ nội dung, tải bản mới cần xác nhận; tải lại thất bại không biến nhật ký đã có thành form tạo mới. Lưu trữ thành công về danh sách.
- Nhật ký, Số đo, Tiến bộ mặc định thu gọn bộ lọc, hiển thị khoảng ngày/trạng thái hoặc nhóm tuần/tháng đang áp dụng. Mở rộng mới hiện nhãn ngày/tuỳ chọn; đóng/mở không reset lựa chọn và không thay dữ liệu đã lưu. Lọc vẫn trước phân trang.
- Hiệp dùng hàng nhẹ, hai ô số lần/tạ song song khi đủ chỗ và tự xuống hàng trên màn hẹp; giữ đơn vị/vùng chạm 48px, không card lồng card cho từng hiệp.
- Lỗi nhập liệu gắn tại ô, nêu bài/hiệp và đơn vị liên quan; đánh dấu invalid, đưa ô lỗi đầu vào vùng nhìn thấy/focus. Validation vẫn dùng giới hạn hiện hành, không mất dữ liệu; thiếu reps được lưu nháp nhưng phải bổ sung trước complete.
- Tiến bộ đưa số buổi, cân nặng/chiều cao gần nhất cùng ngày đo riêng trong khoảng lọc lên trước các biểu đồ. Bảng ngày/giá trị/đơn vị thu gọn mặc định và mở bằng nút có tên theo biểu đồ; không bỏ bảng trợ năng hoặc suy diễn số liệu thiếu.
- Form chính ưu tiên trạng thái đã lưu/chưa lưu; số phiên bản ở lịch sử. Hướng dẫn số đo dùng “chưa ghi số đo” thay cho thuật ngữ null.


### Điều hướng từ hoạt động tập luyện — 2026-10-29

Thanh điều hướng Member rời màn hoạt động dùng client navigation cả khi không có editor/guard (Nhật ký dạng danh sách, Tiến bộ, Số đo dạng danh sách, Bài tập mẫu). Không tải lại document làm mất phiên web. Editor dirty tiếp tục xác nhận rời; đang mutation thì giữ màn và nội dung. Không thay cơ chế token/auth guard.


### Hoạt động tập luyện mobile — làm mới giao diện 2026-10-29

- Dùng ActivityHeader nền primary-soft, tiêu đề/copy ngắn và biểu tượng hình học native. Bốn mục là ô có icon và nhãn, hai cột trên mobile/bốn cột từ 600px; selected có viền/dấu chọn và aria-pressed, pending vẫn khóa đổi mục. Giữ màu/spacing/radius/typography của theme, không thêm ảnh tải mạng, dependency hoặc animation.
- ActivityCard dùng padding 16px trên mobile để form có đủ không gian. Nhật ký/số đo có ô ngày và trạng thái chữ, tên và ngày đầy đủ vẫn đọc được; số đo tách cân nặng/chiều cao có đơn vị, thiếu dữ liệu ghi Chưa đo. Thẻ tiến bộ có icon/viền nhấn nhẹ, giá trị thật và ngày; không thêm streak, mục tiêu hoặc điểm sức khỏe suy diễn.
- Thư viện ưu tiên tìm tên và danh sách bài; bộ lọc nhóm cơ/dụng cụ thu gọn mặc định, có summary và giữ lựa chọn khi mở/đóng. Icon không thay cho tên bài/nhóm cơ. Nội dung tham khảo và giới hạn vẫn có, không tạo giáo án.
- Home trên thanh dưới là mục cha được chọn khi mở /member/workouts, giữ nút Home rõ nhãn. Điều hướng client, dirty/pending, biểu đồ bắt đầu 0 và bảng số liệu mở theo nhu cầu giữ nguyên.


### Thu gọn thống kê gói tập — 2026-10-29

Owner/Gói tập: thống kê dùng hàng chia hai nhóm Theo số buổi/Theo thời gian, bỏ card riêng và nhãn mode lặp ở mỗi gói. Từ 1100px hiển thị hai nhóm cạnh nhau, không kéo chiều cao khối ít dòng bằng khối nhiều dòng; màn nhỏ chọn Số buổi/Thời gian, chỉ hiển thị nhóm đang chọn. Chỉ dựng nhóm có dữ liệu. Mỗi nhóm tối đa 3 gói/trang, phân trang độc lập và giữ trang khi đổi nhóm; nhóm <=3 gói không có hàng phân trang thừa. Tên dài tối đa hai dòng; chữ đầy đủ vẫn trong nội dung/có thể sao chép. Dòng thống kê ghi người đăng ký và lần cấp; mô tả chung nêu lần cấp gồm gia hạn, toàn lịch sử cả hết hạn/hủy và cách khử trùng theo tên + mode. Nhãn trợ năng đầy đủ gồm lần cấp/gia hạn. Không cộng memberCount của các nhóm thành tổng người toàn gym. Giữ loading/error/retry/empty/refresh và Owner-only report hiện hành.


## Bộ lọc thư viện bài mẫu — 2026-10-30

Theo yêu cầu Owner, Nhóm cơ và Dụng cụ dùng combo box xổ xuống, không dùng dải lựa chọn cuộn ngang. Giữ nhãn, giá trị đã chọn, lựa chọn Tất cả, summary khi thu gọn bộ lọc và reset trang 1 khi đổi giá trị. Web dùng select hệ thống có keyboard/focus; native dùng trigger 48px và danh sách cuộn tối đa 240px, đánh dấu lựa chọn và tự đóng sau chọn. Dùng token màu/khoảng cách hiện hành, không thêm dependency. FilterSelect chỉ giữ presentation state; query/filter theo FR-WORKOUT-009 giữ nguyên.

## Trang chủ Member là hoạt động tập luyện — 2026-10-30

Theo yêu cầu Owner, /member hiển thị trực tiếp Nhật ký/Tiến bộ/Số đo cơ thể/Bài tập mẫu, không còn card hoặc link mở hoạt động. Bỏ shortcut/nội dung lặp Lịch, QR và AI vì đã có trên navigation. Mục Tài khoản (khu vực cài đặt Member) chứa PT chính, toàn bộ gói sở hữu, External PT Pass và yêu cầu xác nhận pass, cùng hồ sơ/thông báo/đăng xuất. Các gói dùng list → popup, chỉ xem; PT không có control đổi assignment. Giữ loading/error/retry/empty của từng resource. Bấm lại Trang chủ khi đang ở đó không reset section/form; rời sang mục khác vẫn giữ guard dirty/pending và client navigation không reload. Route /member/workouts cũ redirect về /member. Quyết định này thay cho mô tả mở hoạt động qua shortcut Home trong các mục lịch sử.


## Tìm bài và hiển thị kết quả — 2026-10-30

Nút Tìm bài tập là CTA chính. Nút và phím Search/Enter dùng cùng handler: blur input/Keyboard.dismiss, giữ bộ lọc, trim từ khóa, reset trang 1, đưa vùng kết quả vào viewport không animation. Native căn lại sau keyboardDidHide để phù hợp vùng nhìn mới. Tìm lại cùng từ khóa vẫn refresh. Kết quả có tiêu đề/số bài và từ khóa đang áp dụng, nền surface/viền nhấn; từng bài vẫn list → popup, không card lặp. Loading/error/retry/empty và pager nằm cùng vùng kết quả; pager khóa trong loading. Không đổi API/logic lọc/quyền hoặc dữ liệu catalog.

## Minh họa bài tập trong popup — 2026-10-30

Ảnh minh họa ưu tiên phía trên mô tả/bước tập của popup; giới hạn chiều cao 320px, contain không cắt người/dụng cụ, giữ header/nút đóng cố định. Hiển thị khung hiện tại/tổng số khung; điều khiển Trước/Phát hoặc Tạm dừng/Sau cùng một hàng, touch >=48px, không audio. Mặc định phát chậm từng vị trí chính sau khi toàn bộ 2–3 frame tải xong; reduced-motion mặc định dừng, vẫn có thể xem thủ công. Rời foreground dừng; unmount popup hủy timer. Không phát tất cả bài trong list.

Loading khóa playback; lỗi ảnh giữ hướng dẫn văn bản/nút chọn bài và có tải lại. Không gán media của phiên bản khác khi catalog thay đổi. Nguồn/giấy phép và nguồn hướng dẫn gốc nằm trong disclosure, ghi công tác giả và license link. Ảnh chụp nền nhạt; PNG nét trắng dùng surface tối để đọc rõ. Đây là ngoại lệ animation có mục đích minh họa theo yêu cầu Owner, không thêm animation trang trí khác.


## Sửa các điểm review Member/library — 2026-10-30

- Lỗi ảnh minh họa dùng trạng thái gọn: bỏ khung ảnh trống và control playback bị khóa, chỉ giữ thông báo/tải lại/nguồn và hướng dẫn. Retry dựng lại khung khi người dùng chủ động chọn, không giữ khoảng trắng cho media không tải được.
- Combo box native Nhóm cơ/Dụng cụ dùng một trạng thái mở ở parent, mở ô này đóng ô kia. Chọn giá trị, tìm bài, mở detail hoặc thu/mở bộ lọc đều đóng danh sách; Android Back đóng dropdown trước khi rời màn. Giữ giá trị lọc và query/page hiện hành. Web tiếp tục native select của browser.
- Popup chi tiết bài có CTA Chọn bài vào buổi nháp ở footer cố định, ngoài ScrollView, chỉ hiện khi detail tải thành công. Header/footer không co lại; nội dung giữa cuộn riêng. Chiều cao modal trừ cả safe-area top/bottom để CTA/close nằm trong viewport cả mobile ngang. Popup khác không có footer giữ flow hiện hành. Không đổi quyền, dữ liệu hoặc cách chọn bài vào nhật ký.
