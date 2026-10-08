# FITNESS-MANAGE SOT 14 — AI Workout Form Analysis

## 1. Positioning

AI là feature mở rộng cho Member tự kiểm tra form khi tập ở nhà hoặc tự tập.

AI không thay PT.

---

## 2. User

Chỉ `MEMBER` sử dụng và xem kết quả AI của chính mình.

Owner/PT không có màn xem AI result Member.

---

## 3. Input

Member:

1. quay video hoặc chọn video local, không chọn bài trước;
2. app lưu/copy video vào app-local storage nếu cần;
3. chạy pose, nhận diện bài và form analysis trên thiết bị;
4. tự lấy nhận xét từ JSON chỉ số khi có mạng, giữ kết quả local khi dịch vụ lỗi.

MVP có thể bắt đầu với ít bài, ví dụ Squat, thay vì tuyên bố hỗ trợ mọi bài tập.

Bản hiện hành hỗ trợ nhận diện heuristic Squat, chống đẩy và lunge, không nhận diện mọi bài/biến thể. Video nên quay một bài từ bên hông. UNKNOWN là kết quả hợp lệ khi thiếu bằng chứng; không được đổi UNKNOWN thành Squat bằng prompt.

---

## 4. Output

Có thể gồm:

- exercise;
- total reps nếu algorithm hỗ trợ;
- số/rep có lỗi;
- form issue code;
- confidence;
- feedback dễ hiểu;
- gợi ý sửa tư thế.

Ví dụ issue:

- knee valgus;
- insufficient depth;
- trunk instability;

Chỉ issue đã được implement/test mới được hiển thị.

---

## 5. Không làm

AI không:

- tạo workout plan;
- thay đổi PT assignment;
- đánh giá chất lượng PT;
- chẩn đoán chấn thương/bệnh;
- kết luận y khoa;
- chia sẻ result cho Owner/PT mặc định.

---

## 6. Privacy rule

Do video có thể chứa hình ảnh cơ thể nhạy cảm:

- raw video local-only;
- không upload NestJS;
- không upload FastAPI;
- không upload Supabase Storage;
- không gửi OpenAI.

Chỉ structured metrics/JSON tối thiểu được phép rời thiết bị nếu cần AI explanation/sync.

---

## 7. Failure UX

Nếu pose không detect đủ:

- không bịa feedback;
- báo quay lại với toàn thân rõ, đủ sáng, góc phù hợp;
- không đánh dấu form đúng chỉ vì model không phát hiện lỗi.

---

## 8. Acceptance

1. Raw video không xuất hiện trong network request.
2. Member chỉ thấy data của mình.
3. AI output chỉ trong scope form feedback.
4. Pose failure có trạng thái explicit.
5. Không tạo workout plan.

## So sánh góc Squat trên mobile và web — 2026-10-08

Phiên v1 theo FR-AI-007 dùng Squat không tạ, hai tay đưa trước. Phiên tự nhận diện v2 thay thế giả định mẫu này theo FR-AI-008. Với mỗi lần hoàn chỉnh, báo thời điểm thấp nhất và số đo 2D đồng thời tại thời điểm đó; không gọi đây là đánh giá mọi frame/toàn bộ kỹ thuật.

- Gối: góc trong hông–gối–cổ chân; mục tiêu app ≤100° tại điểm thấp nhất, kế thừa heuristic độ sâu v1, không phải chuẩn y khoa/khoa học chung.
- Thân: đoạn vai–hông nghiêng bao nhiêu so với phương thẳng đứng (0° là đứng thẳng); không đo độ cong cột sống. Không đặt ngưỡng chung. Member có thể nhập mục tiêu tối đa 0–90° theo hướng dẫn PT; không nhập thì chỉ đo, không kết luận.
- Khuỷu tay: góc vai–khuỷu–cổ tay. Mục tiêu app ≤100° tại điểm thấp nhất cho chống đẩy. Với Squat/lunge chỉ đo vì không xác định biến thể tay. Phiên v1 giữ mục tiêu tay gần duỗi 160–180°.
- Tay: độ nghiêng đoạn vai–cổ tay so với phương ngang; phiên tự nhận diện chỉ đo, không áp ngưỡng chung. Phiên v1 giữ mục tiêu 0–20° của mẫu tay đưa trước.
- Chống đẩy thêm đường vai–hông–cổ chân với mục tiêu app ≥160°, chỉ biểu thị đường cơ thể gần thẳng, không đo độ cong cột sống. Squat/lunge dùng mục tiêu gối ≤100°; các ngưỡng đều heuristic chưa kiểm chứng.
- Kết quả dùng “Trong/Ngoài mục tiêu tham chiếu”, “Chưa có tiêu chí kết luận”, “Không đủ dữ liệu”; không tự chấm toàn bộ form đúng. Không thấy rõ một bên thì không bịa góc bên đó.

Góc quay ảnh hưởng số đo; video ngang bên hông, toàn thân rõ. Không suy luận knee valgus, độ cong lưng hoặc chẩn đoán. Mobile và web dùng chung phép đo/so sánh, cùng hợp đồng kết quả local. Mobile cần Development Build có module bridge v2; Expo Go hoặc binary cũ phải báo lỗi rõ và hướng dẫn build/cài lại.

Nguồn đối chiếu: [NSCA — Anthropometrical considerations for customizing the squat pattern](https://dxpprod.nsca.com/contentassets/65ff7dabfee140d4876c556ddb748fef/ptq-5.4.1-anthropometrical-considerations-for-customizing-the-squat-pattern.pdf) giải thích khác biệt hình thể và nhu cầu tùy chỉnh squat; không dùng tài liệu này để gán tính khoa học cho các ngưỡng app 100°/160°/20°.

## Nhận xét tự động — 2026-10-08

FastAPI dùng OpenAI nếu có cấu hình, diễn giải tối đa sáu bằng chứng ưu tiên điểm ngoài mục tiêu từ tối đa mười lần đầu. Server ghép số đo, thời điểm, mục tiêu và verdict cố định; mô hình chỉ thêm giải thích/cue, không đổi bài tập, số đo hay đưa giáo án/chẩn đoán. UI có bảng mọi lần được nhận diện và lưu nguồn OPENAI/LOCAL. UNKNOWN/pose failure/incomplete không gửi yêu cầu diễn giải form đến mô hình. Kết quả không tuyên bố đã đánh giá mọi frame hoặc mọi kỹ thuật; chưa kiểm chứng nhận diện/góc trên video người thật.
