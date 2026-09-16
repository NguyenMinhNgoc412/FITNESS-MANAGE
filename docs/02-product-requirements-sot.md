# FITNESS-MANAGE SOT 02 — Product Requirements

**Trạng thái:** Source of Truth chính cho hành vi sản phẩm  
**Dự án:** FITNESS-MANAGE  
**Ngày cập nhật:** 2026-09-16  
**Phạm vi:** Functional scope và acceptance behavior  
**Ngôn ngữ:** Tiếng Việt  
**Quy tắc:** File này chỉ sở hữu hành vi sản phẩm, scope, requirement và acceptance criteria. Không chọn framework, database, cloud provider, AI provider hoặc thư viện.

---

## 1. Mục tiêu tài liệu

File này trả lời bốn câu hỏi:

1. Người dùng được phép làm gì?
2. Hệ thống phải phản ứng như thế nào?
3. Phạm vi hiện tại có gì và không có gì?
4. Khi nào một feature được coi là đạt?

Mọi chi tiết về kiến trúc/API/domain contract nằm ở `03-technical-architecture-sot.md`; framework, library và provider canonical nằm ở `04-tech-stack-sot.md`.

---

## 2. Role và quyền nghiệp vụ

### 2.1. Owner / Admin

Owner/Admin có quyền nghiệp vụ cao nhất.

Có thể:

- tạo, xem, cập nhật, khóa/ngừng hoạt động tài khoản PT và Member;
- quản lý assignment PT–member;
- xử lý yêu cầu đổi PT;
- xem lịch/khung tập;
- xem toàn bộ check-in và trường hợp bất thường;
- tạo hoặc quản lý guest/tập thử;
- xem dữ liệu cần thiết để vận hành;
- xem kết quả AI của member khi policy cho phép;
- xử lý dữ liệu và quyền riêng tư theo phạm vi sản phẩm.

### 2.2. PT

PT có thể:

- xem member đang được giao cho mình;
- xem lịch/khung tập liên quan đến member của mình;
- check-in khi đến phòng;
- xem thông tin tập luyện của member trong phạm vi được phép;
- xem lộ trình tập hoặc kết quả phân tích phục vụ việc huấn luyện;
- không được tự chuyển member sang PT khác nếu không qua quy trình được phép.

### 2.3. Member

Member có thể:

- xem PT đang phụ trách mình;
- xem lịch/khung tập của mình;
- check-in khi đến phòng;
- yêu cầu đổi PT hoặc thực hiện luồng đổi PT theo quyền được cấu hình;
- gửi video cơ thể để phân tích;
- xem kết quả phân tích, lời khuyên và lộ trình tập của mình.

### 2.4. Guest / Trial visitor

Guest không phải role đăng nhập.

Guest là record nghiệp vụ phục vụ:

- ghi nhận khách đến tập thử;
- lưu thông tin liên hệ tối thiểu;
- lưu thời điểm/lần tập thử;
- chuyển thành member khi đăng ký chính thức.

---

## 3. Product scope hiện tại

### 3.1. In scope

1. Authentication và phân quyền cho ba role chính.
2. Quản lý PT.
3. Quản lý Member.
4. Gán PT cho member ngay từ quá trình đăng ký.
5. Đổi PT có lịch sử thay đổi.
6. Lịch/khung tập giữa member và PT.
7. Check-in member và PT.
8. Đối soát member/PT theo lịch hoặc khung đã thống nhất.
9. Ghi nhận khách tập thử.
10. Chuyển guest thành member mà giữ được nguồn/lịch sử cơ bản.
11. Phân tích video cơ thể cho mục tiêu fitness.
12. Sinh lời khuyên và lộ trình tập từ kết quả phân tích có cấu trúc.
13. Audit các hành động quản trị quan trọng.
14. Cho phép kiểm thử đồng thời ba role bằng các tài khoản riêng biệt.

### 3.2. Out of scope hiện tại

1. Staff role riêng.
2. Dev role trong product permission model.
3. Booking PT tự do theo từng buổi.
4. Marketplace PT.
5. Multi-branch hoặc multi-tenant SaaS.
6. Payroll/HR đầy đủ.
7. CRM automation/marketing campaign đầy đủ.
8. Chẩn đoán bệnh/chấn thương bằng AI.
9. Tự động ra quyết định y tế hoặc thay PT quyết định chương trình tập.
10. Feature không được mô tả trong file này.

---

## 4. Requirement group A — Authentication & Role Access

### PR-AUTH-001 — Đăng nhập theo tài khoản

Hệ thống phải cho phép Owner/Admin, PT và Member đăng nhập bằng tài khoản riêng.

**Acceptance:**

- đăng nhập thành công đưa người dùng vào đúng khu vực theo role;
- đăng nhập thất bại không làm lộ thông tin nhạy cảm;
- tài khoản bị khóa/ngừng hoạt động không sử dụng được chức năng yêu cầu đăng nhập.

### PR-AUTH-002 — Phân quyền theo role

Mỗi role chỉ được truy cập hành động phù hợp.

**Acceptance:**

- Member không truy cập được chức năng quản trị PT/member toàn hệ thống;
- PT không truy cập được member không thuộc phạm vi được giao nếu policy không cho phép;
- Owner/Admin có thể thực hiện các hành động quản trị đã mô tả trong PRD;
- kiểm tra quyền phải áp dụng cho cả UI action và thao tác dữ liệu phía hệ thống.

---

## 5. Requirement group B — PT Management

### PR-PT-001 — Tạo và quản lý PT

Owner/Admin có thể tạo và cập nhật hồ sơ PT.

Thông tin tối thiểu ở mức sản phẩm:

- tên;
- thông tin liên hệ cần thiết;
- trạng thái hoạt động;
- ghi chú hoặc thông tin chuyên môn nếu owner sử dụng.

**Acceptance:**

- PT active có thể được gán member;
- PT inactive không được chọn cho assignment mới;
- việc chuyển PT sang inactive không làm mất lịch sử assignment cũ.

### PR-PT-002 — Xem member đang phụ trách

PT phải xem được danh sách member hiện đang được giao cho mình.

**Acceptance:**

- danh sách chỉ chứa assignment đang có hiệu lực;
- member đã chuyển sang PT khác không còn xuất hiện như member active của PT cũ;
- lịch sử cũ vẫn được giữ để owner tra cứu.

---

## 6. Requirement group C — Member Registration & PT Assignment

### PR-MEMBER-001 — Tạo member

Owner/Admin có thể tạo hồ sơ member khi đăng ký tập.

Thông tin nghiệp vụ tối thiểu gồm:

- thông tin nhận diện/liên hệ cần thiết;
- mục tiêu tập luyện ở mức mô tả;
- trạng thái member;
- PT được chọn/gán khi đăng ký hoặc ngay sau bước đăng ký.

### PR-MEMBER-002 — Member có PT phụ trách rõ ràng

Member active phải có quan hệ PT phụ trách theo mô hình 1-1 đã chốt, trừ trường hợp hệ thống đang ở trạng thái chuyển PT có kiểm soát.

**Acceptance:**

- sau khi hoàn tất đăng ký, member thấy PT hiện tại;
- PT thấy member trong danh sách được giao;
- owner thấy cùng một quan hệ assignment;
- không sử dụng booking PT theo từng buổi để thay cho assignment này.

### PR-MEMBER-003 — Lịch sử assignment

Mọi lần đổi PT phải giữ lịch sử.

**Acceptance:**

- owner xem được PT cũ, PT mới và thời điểm thay đổi;
- assignment cũ không bị xóa cứng chỉ vì có assignment mới;
- tại một thời điểm bình thường chỉ có một PT chính đang hiệu lực cho một member.

---

## 7. Requirement group D — Đổi PT

### PR-ASSIGN-001 — Member có thể đổi PT nếu không phù hợp

Sản phẩm phải hỗ trợ việc member thay PT khi trải nghiệm không phù hợp.

Luồng có thể do member khởi tạo yêu cầu hoặc owner thực hiện trực tiếp theo quy trình vận hành.

**Acceptance:**

- PT mới chỉ trở thành PT hiện tại sau khi thay đổi được xác nhận theo quyền;
- lịch sử PT cũ được giữ;
- lịch/khung tập tương lai phải được rà soát/cập nhật theo assignment mới;
- dữ liệu check-in lịch sử không bị chuyển sang PT mới.

### PR-ASSIGN-002 — Không book PT tại từng buổi

Hệ thống không được yêu cầu member chọn PT mới mỗi lần tập.

**Acceptance:**

- màn bắt đầu buổi tập/check-in không bắt member chọn PT từ danh sách toàn bộ PT;
- PT mặc định của member được lấy từ assignment hiện tại;
- chỉ luồng đổi PT mới thay đổi assignment.

---

## 8. Requirement group E — Lịch và khung tập

### PR-SCHEDULE-001 — Lịch gắn với cặp member–PT

Lịch tập phải phản ánh cặp member–PT đang có hiệu lực.

**Acceptance:**

- member xem được lịch của mình;
- PT xem được lịch liên quan đến member mình phụ trách;
- owner xem được toàn bộ lịch cần cho vận hành;
- lịch cũ vẫn gắn với PT đã phụ trách tại thời điểm lịch đó được tạo/thực hiện.

### PR-SCHEDULE-002 — Hỗ trợ khung giờ linh hoạt

Theo quyết định đã chốt, hệ thống phải hỗ trợ mô hình ca/khung tập có độ linh hoạt trong khoảng được cấu hình, thay vì coi mọi buổi là một điểm thời gian tuyệt đối.

Trong baseline hiện tại, quy tắc vận hành cần hỗ trợ **khung dao động tối đa 2 giờ** khi owner sử dụng loại lịch linh hoạt này.

**Acceptance:**

- owner có thể biết một lịch là cố định hay linh hoạt;
- check-in được đánh giá theo đúng loại khung đã cấu hình;
- không đánh dấu vắng ngay khi người dùng vẫn còn nằm trong cửa sổ hợp lệ;
- cửa sổ linh hoạt không được dùng để biến thành booking PT tùy ý.

---

## 9. Requirement group F — Check-in & Attendance Reconciliation

### PR-CHECKIN-001 — Member check-in

Member phải có cách xác nhận mình đã đến phòng.

**Acceptance:**

- mỗi check-in có thời điểm rõ ràng;
- member không thể tạo check-in cho tài khoản khác;
- check-in được liên kết với member thực hiện và context lịch phù hợp nếu xác định được.

### PR-CHECKIN-002 — PT check-in

PT phải có cách xác nhận mình đã có mặt.

**Acceptance:**

- mỗi check-in có thời điểm rõ ràng;
- PT không check-in thay PT khác;
- hệ thống có thể đối chiếu check-in PT với các member đang được PT đó phụ trách trong khung liên quan.

### PR-CHECKIN-003 — Đối soát member và PT

Khi member đến trong khung tập được kỳ vọng nhưng PT phụ trách không có mặt, hệ thống phải tạo trạng thái bất thường để owner kiểm tra.

**Acceptance:**

- trường hợp cả member và PT đều có mặt được coi là khớp;
- trường hợp member có mặt nhưng PT không có mặt trong cửa sổ hợp lệ được đánh dấu exception;
- exception không tự kết luận lỗi kỷ luật nếu dữ liệu chưa đủ;
- owner có thể xem ai, thời điểm nào, lịch/khung nào và PT nào liên quan.

### PR-CHECKIN-004 — Không làm mất lịch sử

Thay đổi PT sau này không được sửa ngược lịch sử check-in cũ.

**Acceptance:**

- check-in cũ vẫn tham chiếu context PT/assignment tại thời điểm phát sinh;
- báo cáo lịch sử không dùng PT hiện tại để ghi đè PT cũ.

---

## 10. Requirement group G — Guest / Trial Check-in

### PR-GUEST-001 — Ghi nhận khách mới tại check-in

Owner/Admin phải có thể tạo guest record khi khách mới đến tập thử.

Thông tin tối thiểu:

- tên hoặc cách nhận diện;
- thông tin liên hệ cần thiết nếu khách đồng ý cung cấp;
- thời điểm đến/tập thử;
- ghi chú ngắn nếu cần.

**Acceptance:**

- guest có thể được tạo mà không cần tài khoản đăng nhập;
- hệ thống lưu được lịch sử tập thử;
- không bắt buộc guest phải trở thành member ngay.

### PR-GUEST-002 — Chuyển guest thành member

Khi guest đăng ký chính thức, owner có thể chuyển/ghép record sang member.

**Acceptance:**

- thông tin guest cần thiết được giữ lại;
- lịch sử tập thử vẫn truy ngược được;
- không tạo hai hồ sơ tách rời nếu owner chọn chuyển đổi từ guest hiện có.

### PR-GUEST-003 — Dữ liệu phục vụ mở rộng sau

Sản phẩm hiện tại phải lưu dữ liệu guest đủ sạch để sau này làm thống kê/chăm sóc khách hàng, nhưng chưa triển khai CRM automation đầy đủ.

**Acceptance:**

- có thể phân biệt guest chưa chuyển đổi và guest đã thành member;
- dữ liệu nguồn không bị xóa khi chuyển đổi;
- không tự gửi chiến dịch marketing trong scope hiện tại.

---

## 11. Requirement group H — AI Body Analysis

### PR-AI-001 — Member gửi video phân tích cơ thể

Member có thể tạo một lần phân tích bằng video cơ thể theo hướng dẫn quay của ứng dụng.

**Acceptance:**

- hệ thống hiển thị hướng dẫn trước khi quay/chọn video;
- member biết video được dùng cho mục đích phân tích fitness;
- video chất lượng không đủ phải có trạng thái yêu cầu quay lại hoặc báo không thể phân tích;
- không tạo kết luận giả khi pipeline không đủ dữ liệu.

### PR-AI-002 — Phân tích video thành dữ liệu có cấu trúc

Hệ thống phải trích xuất kết quả phân tích thành dữ liệu có cấu trúc trước khi sinh lời khuyên bằng mô hình ngôn ngữ.

Dữ liệu có thể gồm các nhóm như:

- chất lượng input;
- pose/keypoint hoặc đặc trưng tư thế;
- chỉ số/cân đối quan sát được trong phạm vi mô hình hỗ trợ;
- cờ độ tin cậy;
- cảnh báo khi dữ liệu không đủ.

**Acceptance:**

- raw video không phải nguồn duy nhất được đưa trực tiếp cho LLM để tự suy luận toàn bộ;
- kết quả trung gian có cấu trúc được lưu cùng version/phương pháp phân tích;
- nếu confidence thấp, lời khuyên phải phản ánh sự không chắc chắn hoặc yêu cầu thu lại dữ liệu.

### PR-AI-003 — Sinh lời khuyên và lộ trình tập

Hệ thống dùng kết quả phân tích có cấu trúc cùng mục tiêu member để sinh gợi ý/lộ trình tập.

**Acceptance:**

- output mô tả mục tiêu, trọng tâm và gợi ý bài tập/lộ trình theo phạm vi fitness;
- không tuyên bố chẩn đoán bệnh/chấn thương;
- không khẳng định chắc chắn khi dữ liệu phân tích không đủ;
- member có thể xem kết quả của chính mình;
- PT/Owner chỉ xem theo policy quyền được cấu hình.

### PR-AI-004 — Lịch sử lần phân tích

Mỗi lần phân tích phải có record riêng để có thể so sánh về sau.

**Acceptance:**

- không ghi đè kết quả cũ khi phân tích lần mới;
- mỗi lần có thời điểm, trạng thái xử lý và kết quả tương ứng;
- output phải truy được về input analysis version đã tạo ra nó.

---

## 12. Requirement group I — Audit & Data Integrity

### PR-AUDIT-001 — Audit hành động quan trọng

Các hành động sau phải có lịch sử kiểm tra được:

- thay đổi assignment PT–member;
- khóa/ngừng hoạt động tài khoản;
- thay đổi dữ liệu quản trị quan trọng;
- xử lý exception check-in nếu có trạng thái xác nhận/đóng;
- thao tác AI có ảnh hưởng tới dữ liệu lịch sử nếu có chỉnh sửa thủ công.

**Acceptance:**

- audit cho biết loại hành động, đối tượng và thời điểm;
- audit không bị thay thế bởi việc sửa record hiện tại;
- quyền xem audit chỉ dành cho role phù hợp.

### PR-AUDIT-002 — Không sửa lịch sử để “khớp” dữ liệu mới

Dữ liệu lịch sử phải phản ánh trạng thái tại thời điểm phát sinh.

**Acceptance:**

- đổi PT không viết lại check-in cũ;
- đổi lịch tương lai không viết lại lịch đã hoàn thành;
- phân tích AI mới không xóa kết quả cũ.

---

## 13. Requirement group J — Testing behavior

### PR-TEST-001 — Test đồng thời ba role

Môi trường phát triển/test phải cho phép kiểm thử đồng thời Owner/Admin, PT và Member bằng ba session độc lập.

**Acceptance:**

- có thể đăng nhập ba tài khoản role khác nhau cùng lúc trên ba client/session riêng;
- thay đổi assignment/check-in ở một session phản ánh đúng sang session liên quan sau khi dữ liệu refresh;
- quyền role không bị lẫn vì dùng chung session local;
- dữ liệu test tách khỏi dữ liệu production.

---

## 14. Core end-to-end flows

### 14.1. Đăng ký member và gán PT

```text
Owner tạo/chuyển guest thành member
  -> ghi thông tin member
  -> chọn PT phù hợp
  -> xác nhận assignment
  -> cấu hình lịch/khung tập ban đầu nếu có
  -> member thấy PT hiện tại
  -> PT thấy member được giao
```

### 14.2. Member đổi PT

```text
Member/Owner khởi tạo đổi PT
  -> chọn PT mới
  -> xác nhận thay đổi theo quyền
  -> đóng assignment cũ
  -> tạo assignment mới
  -> cập nhật lịch tương lai liên quan
  -> giữ nguyên lịch sử cũ
```

### 14.3. Check-in một buổi tập

```text
Member check-in
PT check-in
  -> hệ thống đối chiếu assignment + lịch/khung
  -> nếu cả hai hợp lệ: matched
  -> nếu member có mặt nhưng PT thiếu: exception
  -> owner có thể xem và xử lý
```

### 14.4. Khách tập thử

```text
Khách mới đến phòng
  -> Owner tạo guest record
  -> ghi nhận trial check-in
  -> khách tập thử
  -> nếu đăng ký: convert sang member
  -> gán PT
  -> giữ lại nguồn/lịch sử guest
```

### 14.5. AI body analysis

```text
Member mở phân tích
  -> đọc hướng dẫn quay
  -> quay/chọn video
  -> xác nhận gửi phân tích
  -> hệ thống kiểm tra chất lượng
  -> trích xuất dữ liệu có cấu trúc
  -> sinh lời khuyên/lộ trình
  -> member xem kết quả
  -> PT/Owner xem theo quyền
```

---

## 15. Acceptance cấp sản phẩm

Baseline hiện tại được coi là đạt khi:

1. Ba role đăng nhập và bị giới hạn quyền đúng.
2. Owner tạo được PT và member.
3. Member được gán PT từ lúc đăng ký, không cần book PT từng buổi.
4. Đổi PT giữ được lịch sử.
5. Lịch/khung tập gắn đúng cặp member–PT.
6. Hệ thống hỗ trợ loại khung linh hoạt tối đa 2 giờ theo quyết định vận hành đã chốt.
7. Member và PT check-in độc lập.
8. Member đến mà PT không có mặt trong khung hợp lệ tạo exception để owner xem.
9. Guest mới được ghi nhận ngay khi đến tập thử.
10. Guest có thể chuyển thành member mà không mất lịch sử cơ bản.
11. Member có thể gửi video phân tích cơ thể.
12. Video được chuyển thành dữ liệu có cấu trúc trước khi LLM sinh lời khuyên/lộ trình.
13. AI không đưa ra chẩn đoán y khoa như một kết luận sản phẩm.
14. Lịch sử assignment, check-in và phân tích AI không bị ghi đè bởi trạng thái mới.
15. Có thể test đồng thời ba role bằng session độc lập.

---

## 16. Quy tắc thay đổi Product Requirements

Muốn thêm feature mới phải:

1. mô tả user/role sử dụng;
2. mô tả behavior;
3. xác định in-scope/out-of-scope;
4. viết acceptance criteria;
5. cập nhật `CHANGELOG.md`;
6. chỉ sau đó mới cập nhật Technical Architecture nếu feature cần hệ thống hỗ trợ mới.

Không thêm framework/provider vào file này.

---

## 17. Mapping sang SOT chức năng chi tiết

`02-product-requirements-sot.md` vẫn là canonical index cho requirement ID và acceptance cấp requirement. Khi implement, đọc file chi tiết tương ứng:

| Requirement group | SOT chi tiết |
|---|---|
| `PR-AUTH-*`, `PR-PT-*`, `PR-TEST-001` | `05-business-auth-role-access-sot.md` |
| `PR-MEMBER-*`, `PR-ASSIGN-*` | `06-business-member-pt-assignment-sot.md` |
| `PR-SCHEDULE-*`, `PR-CHECKIN-*` | `07-business-schedule-checkin-attendance-sot.md` |
| `PR-GUEST-*` | `08-business-guest-trial-conversion-sot.md` |
| `PR-AI-*` | `09-business-ai-body-analysis-sot.md` |
| `PR-AUDIT-*` | business file liên quan + `10-tech-data-security-audit-sot.md` |

File chi tiết không được thêm requirement mới mà không cập nhật file này trước.
