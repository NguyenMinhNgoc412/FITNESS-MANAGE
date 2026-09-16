# FITNESS-MANAGE SOT 01 — Product Brief

**Trạng thái:** Source of Truth chính cho định hướng sản phẩm  
**Dự án:** FITNESS-MANAGE  
**Ngày cập nhật:** 2026-09-16  
**Phạm vi:** Bản nền sản phẩm đã chốt  
**Ngôn ngữ:** Tiếng Việt  
**Quy tắc:** File này chỉ sở hữu `why`, định vị, audience, outcome, product principles, business model và boundary. Không mô tả chi tiết workflow, acceptance criteria, database, API, framework hoặc provider.

---

## 1. Why — Vì sao sản phẩm tồn tại

FITNESS-MANAGE được xây dựng cho mô hình phòng gym cá nhân, nơi chủ phòng cần kiểm soát vận hành trực tiếp nhưng không muốn phụ thuộc vào nhiều sổ sách, tin nhắn rời rạc hoặc quy trình thủ công.

Bài toán cốt lõi không chỉ là “quản lý thành viên”, mà là giữ được một quan hệ vận hành rõ ràng giữa:

- chủ phòng gym;
- PT;
- member;
- khách mới đến tập thử.

Điểm cần giải quyết rõ nhất là:

1. Member phải biết ai là PT đang phụ trách mình.
2. PT phải có trách nhiệm với member đã được giao.
3. Chủ phòng phải nhìn thấy việc member và PT có thực sự có mặt theo lịch hay không.
4. Khách tập thử phải được ghi nhận từ lần đầu đến phòng để không mất dữ liệu chăm sóc về sau.
5. Member cần có một cách nhận định hướng tập luyện cá nhân hóa hơn thay vì chỉ dựa vào trao đổi thủ công.

Sản phẩm tồn tại để biến các hoạt động đó thành một quy trình nhất quán, có dữ liệu và có thể kiểm tra lại.

---

## 2. Định vị sản phẩm

FITNESS-MANAGE là **ứng dụng quản lý vận hành phòng gym cá nhân có PT 1-1**, tập trung vào:

- quản lý quan hệ Member ↔ PT;
- check-in và đối soát việc có mặt;
- quản lý lịch/khung tập đã thống nhất;
- tiếp nhận khách tập thử;
- hỗ trợ member bằng phân tích cơ thể qua video và lộ trình tập được cá nhân hóa.

Sản phẩm **không** được định vị là:

- marketplace để member đặt PT theo từng buổi;
- nền tảng nhiều phòng gym/chuỗi phòng gym ở giai đoạn hiện tại;
- hệ thống HR đầy đủ cho nhân viên;
- ứng dụng chẩn đoán y khoa;
- mạng xã hội thể hình;
- nền tảng bán phần mềm SaaS đa tenant ở phiên bản đầu.

---

## 3. Audience — Nhóm người dùng

### 3.1. Owner / Admin

Owner là người vận hành mô hình gym và có quyền quản trị cao nhất.

Owner cần:

- quản lý PT và member;
- xác nhận hoặc điều chỉnh quan hệ PT–member;
- kiểm tra check-in và các trường hợp bất thường;
- theo dõi khách tập thử;
- có dữ liệu đủ sạch để phục vụ thống kê và chăm sóc khách hàng về sau;
- kiểm soát dữ liệu AI và dữ liệu cá nhân của member.

### 3.2. PT

PT là người trực tiếp phụ trách member theo quan hệ đã thống nhất từ trước, không phải PT được đặt ngẫu nhiên theo từng buổi.

PT cần:

- biết danh sách member mình đang phụ trách;
- biết lịch/khung tập của từng member;
- check-in để xác nhận có mặt;
- xem thông tin liên quan đến lộ trình tập của member trong phạm vi được phép;
- theo dõi thay đổi assignment khi member đổi PT.

### 3.3. Member

Member là người sử dụng dịch vụ tập luyện của phòng gym.

Member cần:

- được gán PT từ quá trình đăng ký;
- có thể đổi PT nếu không phù hợp;
- xem lịch/khung tập đã thống nhất;
- check-in khi đến phòng;
- sử dụng tính năng phân tích cơ thể bằng video để nhận gợi ý và lộ trình tập phù hợp.

### 3.4. Khách tập thử

Khách tập thử **không phải một role đăng nhập độc lập** trong phạm vi hiện tại.

Đây là một lead/guest record được tạo tại thời điểm check-in hoặc tiếp nhận tại phòng để:

- ghi nhận người đã đến tập thử;
- giữ thông tin liên hệ tối thiểu;
- tránh mất lịch sử khi khách quay lại;
- làm nguồn dữ liệu cho thống kê và chăm sóc khách hàng trong các phase sau.

---

## 4. Product outcomes — Kết quả sản phẩm cần tạo ra

FITNESS-MANAGE cần tạo ra các outcome sau:

1. **Quan hệ PT–member rõ ràng:** mỗi member đang hoạt động có PT phụ trách cụ thể theo quy trình đăng ký hoặc thay đổi PT.
2. **Check-in có giá trị vận hành:** owner có thể biết member có đến và PT có có mặt trong khung được kỳ vọng hay không.
3. **Giảm tranh cãi về trách nhiệm:** dữ liệu hiện diện và assignment có thể kiểm tra lại.
4. **Không bỏ mất khách mới:** khách tập thử được ghi nhận ngay từ lần đầu.
5. **Cá nhân hóa tập luyện tốt hơn:** dữ liệu phân tích cơ thể có cấu trúc được dùng để sinh lời khuyên/lộ trình tập phù hợp với mục tiêu member.
6. **Một nguồn dữ liệu duy nhất:** thông tin member, PT, assignment, lịch, check-in, guest và kết quả AI không bị chia tách thành nhiều nguồn rời rạc.
7. **Đủ đơn giản cho mô hình cá nhân:** owner không phải vận hành một hệ thống ERP hoặc HR cồng kềnh.

---

## 5. Product principles — Nguyên tắc sản phẩm

### 5.1. PT continuity over per-session booking

PT được thống nhất với member từ quá trình đăng ký và duy trì như một quan hệ phụ trách liên tục.

Không biến sản phẩm thành luồng “đến buổi mới chọn hoặc book PT”.

### 5.2. Check-in là bằng chứng vận hành, không chỉ là điểm danh

Check-in phải giúp trả lời được:

- member đã đến hay chưa;
- PT phụ trách có mặt hay chưa;
- có xuất hiện trường hợp member đến nhưng PT không có mặt trong khung được kỳ vọng hay không.

### 5.3. Owner giữ quyền kiểm soát cuối

Owner có quyền:

- quản lý tài khoản;
- xác nhận assignment;
- xử lý đổi PT;
- xem các trường hợp check-in bất thường;
- quản lý dữ liệu khách tập thử;
- quản lý quyền truy cập dữ liệu nhạy cảm.

### 5.4. Khách tập thử phải được ghi nhận ngay

Không yêu cầu khách trở thành member rồi mới có record.

Dữ liệu guest phải có thể chuyển tiếp thành dữ liệu member khi khách đăng ký chính thức mà không tạo một lịch sử rời rạc không liên quan.

### 5.5. AI hỗ trợ, không chẩn đoán

AI được dùng để:

- phân tích dữ liệu hình thể/tư thế trong phạm vi fitness;
- đưa ra gợi ý;
- đề xuất lộ trình tập.

AI không được trình bày kết quả như chẩn đoán bệnh, kết luận chấn thương hoặc thay thế bác sĩ/chuyên gia y tế.

### 5.6. Không đưa raw video trực tiếp vào LLM nếu không cần thiết

Video cơ thể phải được xử lý thành dữ liệu có cấu trúc bằng pipeline phân tích hình ảnh/pose trước.

LLM chỉ dùng dữ liệu có cấu trúc cùng mục tiêu tập luyện và context được cho phép để sinh phần giải thích/lộ trình.

### 5.7. Ít role, ít quy trình thừa

Phạm vi hiện tại chỉ giữ ba role đăng nhập chính:

- Owner/Admin;
- PT;
- Member.

Không có role Staff riêng và không có role Dev trong nghiệp vụ sản phẩm.

### 5.8. Dữ liệu phải phục vụ quyết định thật

Chỉ thu thập dữ liệu có mục đích vận hành rõ ràng.

Ví dụ: guest data được lưu để theo dõi tập thử và hỗ trợ thống kê/chăm sóc về sau, không phải để tạo form dài không cần thiết.

---

## 6. Business model — Mô hình kinh doanh được sản phẩm hỗ trợ

FITNESS-MANAGE phục vụ **mô hình phòng gym cá nhân do owner trực tiếp quản lý**.

Sản phẩm hỗ trợ business model trong đó:

- member đăng ký tập tại phòng;
- member được gắn với PT phù hợp từ đầu;
- PT cung cấp dịch vụ huấn luyện theo quan hệ phụ trách đã được thống nhất;
- owner kiểm soát chất lượng vận hành thông qua assignment, lịch và check-in;
- khách tập thử có thể trở thành member sau khi được tư vấn/chăm sóc;
- dữ liệu phân tích cơ thể và lộ trình tập là giá trị gia tăng cho trải nghiệm member.

Trong phạm vi hiện tại, ứng dụng là **công cụ vận hành nội bộ cho mô hình gym**, không phải nền tảng bán license cho nhiều phòng gym độc lập.

---

## 7. Product boundary — Ranh giới sản phẩm

### 7.1. Nằm trong boundary hiện tại

- ba role đăng nhập: Owner/Admin, PT, Member;
- quản lý member và PT;
- gán PT cho member từ quá trình đăng ký;
- đổi PT khi cần;
- quản lý lịch/khung tập đã thống nhất;
- check-in member và PT;
- phát hiện trường hợp member đến nhưng PT không có mặt trong khung được kỳ vọng;
- tiếp nhận khách mới/tập thử và giữ thông tin để dùng về sau;
- AI phân tích video cơ thể theo pipeline có cấu trúc;
- sinh lời khuyên và lộ trình tập từ dữ liệu phân tích;
- lịch sử các thay đổi nghiệp vụ quan trọng cần audit.

### 7.2. Ngoài boundary hiện tại

- role Staff riêng;
- role Dev trong sản phẩm;
- booking PT tự do theo từng buổi;
- marketplace PT;
- multi-gym / multi-tenant SaaS;
- payroll/HR đầy đủ;
- mạng xã hội, feed, chat cộng đồng;
- chẩn đoán y khoa hoặc đánh giá chấn thương bằng AI;
- tự động thay thế quyết định của PT/owner bằng AI;
- CRM marketing nâng cao; ở giai đoạn này chỉ cần giữ dữ liệu guest đủ để mở rộng sau;
- các feature chưa được Product Requirements xác nhận.

---

## 8. Quy tắc thay đổi Product Brief

Chỉ sửa file này khi thay đổi một trong các quyết định cấp sản phẩm sau:

1. vì sao sản phẩm tồn tại;
2. sản phẩm được định vị là gì;
3. nhóm người dùng chính;
4. outcome cần tạo ra;
5. product principles;
6. business model;
7. boundary.

Không đưa requirement chi tiết hoặc giải pháp kỹ thuật vào file này.
