# FITNESS-MANAGE — Quy tắc làm việc cho AI Agent

**Phạm vi:** Toàn bộ repository FITNESS-MANAGE  
**Ngôn ngữ trao đổi:** Tiếng Việt  
**Nguồn nghiệp vụ, kiến trúc và công nghệ:** Bộ Source of Truth trong `docs/`

---

## 1. Mục tiêu

File này hướng dẫn AI Agent thực hiện task trong repository. Agent phải thay đổi đúng phạm vi yêu cầu, tuân thủ Source of Truth (SOT), và báo cáo kết quả có thể kiểm tra được.

Không suy diễn nghiệp vụ hoặc quyết định kỹ thuật ngoài những gì đã có trong codebase và SOT. Stack MVP đã được chốt trong `docs/04-tech-stack-sot.md` và phải được tuân thủ.

## 2. Giao tiếp với Owner

1. Luôn trả lời Owner bằng tiếng Việt, kể cả khi câu hỏi hoặc tài liệu tham khảo dùng ngôn ngữ khác.
2. Trước khi thực hiện thay đổi hoặc hành động, phải nói rõ: Owner yêu cầu gì, sẽ làm gì, phạm vi file/module dự kiến và vì sao việc đó cần thiết.
3. Nêu rủi ro có thể phát sinh và ảnh hưởng dự kiến. Nếu không thấy rủi ro đáng kể, nói rõ điều đó.
4. Với bước khảo sát chỉ đọc hoặc thao tác kiểm tra thông thường, có thể gộp lý do và rủi ro vào một cập nhật ngắn; không cần lặp lại giải thích dài cho từng lệnh.
5. Không biến phần giải thích thành yêu cầu xin phép nếu Owner đã giao rõ task và hành động nằm trong phạm vi đó.

### 2.1. Cập nhật tiến độ bắt buộc

Với task có dùng công cụ, Agent phải gửi cập nhật ngắn bằng tiếng Việt trước khi bắt đầu và sau từng mốc có ý nghĩa: đọc SOT, xác định nguyên nhân, hoàn tất implementation hoặc có kết quả test/build. Cập nhật phải giúp Owner biết chính xác Agent đang làm gì, đã làm gì và bước tiếp theo là gì.

Trước khi sửa, nội dung cập nhật tối thiểu gồm:

- mục tiêu/requirement đang xử lý;
- file hoặc module dự kiến tác động;
- hành động sẽ thực hiện;
- rủi ro hoặc giới hạn dự kiến; nếu không có rủi ro đáng kể phải nói rõ.

Khi hoàn tất, câu trả lời tối thiểu phải nêu:

- kết quả đã đạt được;
- file đã sửa và phần thay đổi chính;
- lệnh kiểm tra đã chạy cùng kết quả thực tế;
- phần chưa làm, giới hạn và rủi ro còn lại nếu có.

Không dùng câu trả lời chung chung như “đã xử lý” mà không nói rõ đã xử lý phần nào. Không tuyên bố đã đọc đủ tài liệu khi output bị rút gọn hoặc chưa kiểm tra đủ nội dung; phải nói rõ giới hạn và đọc lại phần cần thiết.

## 3. Đọc tài liệu trước khi làm

Với mỗi task, đọc theo thứ tự:

1. `docs/README.md`;
2. `docs/01-product-brief-sot.md`;
3. `docs/02-product-requirements-sot.md`;
4. `docs/03-technical-architecture-sot.md`;
5. `docs/04-tech-stack-sot.md`;
6. SOT chi tiết liên quan trong `docs/`;
7. `docs/CHANGELOG.md` nếu task thay đổi quyết định sản phẩm, kiến trúc hoặc stack.

Nếu task liên quan bảo mật, transaction, concurrency, audit hoặc dữ liệu nhạy cảm, đọc thêm `docs/10-tech-data-security-audit-sot.md`.

Nếu task liên quan AI, đọc `docs/09-business-ai-body-analysis-sot.md` và `docs/11-tech-ai-analysis-pipeline-sot.md`.

Nếu task chia nhỏ hoặc lập thứ tự triển khai, đọc `docs/12-Agent-task-splitting-sot.md`.

## 4. Tech stack bắt buộc

Dùng đúng stack MVP đã khóa trong `docs/04-tech-stack-sot.md`:

- **Client mobile/web:** React Native, Expo, TypeScript, React Native Web, Expo Router, Zustand, React Hook Form, Zod, Axios.
- **Backend/API:** NestJS, TypeScript, REST API, JWT + Refresh Token, Prisma.
- **Database/storage:** PostgreSQL trên Supabase Free và Supabase Storage.
- **AI service:** Python, FastAPI, OpenCV, MediaPipe Pose, OpenAI API qua OpenAI Python SDK.
- **Platform:** Expo Push Notifications; Git + GitHub; không dùng WebSocket/Realtime trong MVP.

NestJS là authority cho authentication, RBAC, nghiệp vụ và cấp quyền media. Supabase trong baseline chỉ cung cấp PostgreSQL managed và Storage; không tự dùng Supabase Auth, Realtime, Edge Functions hoặc truy cập database trực tiếp từ client. Không thay stack bằng framework/provider khác hoặc thêm công nghệ ngoài baseline nếu chưa cập nhật SOT và `docs/CHANGELOG.md` theo quy trình duyệt quyết định.

## 5. Quy tắc thực hiện

1. Xác định requirement ID và tiêu chí chấp nhận trước khi sửa.
2. Không thêm feature ngoài Product Requirements.
3. Không đổi business rule để code dễ hơn.
4. Không tự thêm Staff/Dev role. Ba role đăng nhập là `Owner/Admin`, `PT`, `Member`; Guest/Trial không phải role đăng nhập.
5. Không biến PT assignment thành booking theo từng buổi.
6. Preserve history cho assignment, check-in và AI analysis; không ghi đè sự kiện cũ để thể hiện trạng thái mới.
7. Nếu task AI, video phải qua structured CV/pose analysis trước LLM theo pipeline `video -> structured CV/pose result -> LLM`; không thiết kế AI như công cụ chẩn đoán y khoa.
8. Nếu phát hiện SOT thiếu quyết định bắt buộc hoặc có mâu thuẫn, nêu đúng tài liệu và mục còn thiếu/mâu thuẫn. Không tự bịa provider hoặc behavior.
9. Kiểm tra quyền ở server/service boundary; ẩn thành phần UI không thay thế kiểm tra quyền.
10. Dùng quy ước và công cụ đã có trong codebase cùng stack tại mục 4. Không tự thêm framework, provider, thư viện hoặc nền tảng ngoài stack đã chốt.
11. Thay đổi sản phẩm, kiến trúc hoặc stack phải cập nhật đúng SOT sở hữu nội dung và ghi `docs/CHANGELOG.md`.

## 6. Quy ước code

- Trước khi sửa, xem các file lân cận để theo đúng cách tổ chức, đặt tên và định dạng đang dùng.
- Ưu tiên thay đổi nhỏ, nhất quán với cấu trúc hiện có; không định dạng lại diện rộng ngoài phạm vi task.
- Không thêm dependency nếu có thể đáp ứng yêu cầu bằng công cụ hoặc thư viện hiện có.
- Không đưa secret, thông tin cá nhân hoặc dữ liệu phân tích cơ thể nhạy cảm vào log, fixture hay tài liệu không cần thiết.
- Thay đổi schema/data contract phải có migration tương ứng theo công cụ hiện có.
- Thêm hoặc cập nhật kiểm thử cho logic nghiệp vụ, quyền truy cập và invariant bị ảnh hưởng theo chiến lược test của dự án.

Quy tắc chi tiết như dấu nháy, dấu chấm phẩy, cấu trúc thư mục và độ rộng dòng phải theo cấu hình và mã nguồn hiện có. Nếu chưa có cấu hình tương ứng, chọn cách nhất quán với phần gần nhất trong codebase; không tự áp đặt quy ước diện rộng.

## 7. Kiểm tra và hoàn tất task

Trước khi kết thúc:

1. Sau khi hoàn tất implementation, bắt buộc chạy test phù hợp với task trước khi trả kết quả cho Owner.
2. Chạy các lệnh kiểm tra khác phù hợp đã được cấu hình trong repository, như build, lint hoặc generate migration khi task có ảnh hưởng.
3. Không tuyên bố task hoàn tất, test hoặc build thành công nếu chưa chạy.
4. Nếu test không thể chạy, nêu rõ lệnh, nguyên nhân và rủi ro còn lại; không trình bày task như đã được xác minh hoàn toàn.
5. Nêu rõ lệnh đã chạy và kết quả.
6. Tóm tắt file đã sửa, test đã chạy và kết quả, requirement ID đã cover, cùng rủi ro còn lại nếu có.
7. Cập nhật SOT/CHANGELOG khi có thay đổi ở cấp quyết định sản phẩm hoặc kiến trúc.

## 8. Thứ tự ưu tiên khi có mâu thuẫn

Áp dụng thứ tự ưu tiên đã quy định trong `docs/README.md`. Tóm tắt:

1. `01-product-brief-sot.md` quyết định định hướng và ranh giới sản phẩm.
2. `02-product-requirements-sot.md` quyết định requirement, hành vi và acceptance.
3. `03-technical-architecture-sot.md` quyết định kiến trúc để đáp ứng requirement.
4. `04-tech-stack-sot.md` quyết định framework, thư viện và provider được dùng.
5. Các SOT chi tiết chỉ cụ thể hóa nội dung trong phạm vi được giao.
6. `AGENTS.md` hướng dẫn cách làm việc, không thay thế hoặc ghi đè SOT.

Nếu phát hiện mâu thuẫn, ưu tiên SOT có thẩm quyền theo `docs/README.md`, ghi nhận mâu thuẫn và cập nhật tài liệu liên quan khi được phép.
## 12. Quy chuẩn UI/UX theo ảnh tham chiếu

Khi task làm giao diện, bắt buộc đọc `docs/13-ui-ux-sot.md` và đối chiếu ảnh tương ứng trong `screenshots/`:

- `dashboard-owner.jpg`: Owner/Admin dashboard;
- `Quản-lí-member.JPG`: quản lý Member/PT theo phạm vi quyền;
- `lịch-tập-checkin.JPG`: lịch và check-in, phải biến thể theo từng role;
- `giao-diện-AI.JPG`: AI body analysis của Member;
- `Giao-diện-member.JPG`, `Giao-diện-PT.JPG`: dashboard Member/PT;
- `setting.JPG`: setting mở từ ảnh profile.

UI phải có loading, empty, error, success và permission state phù hợp; màu không phải nguồn thông tin duy nhất. Owner AI là chatbot trợ lý vận hành dạng đọc/tóm tắt, không để UI tự tính lại dữ liệu, tự thay đổi nghiệp vụ hoặc làm AI chẩn đoán. Kiểm tra quyền cuối cùng luôn nằm ở server/service boundary.
