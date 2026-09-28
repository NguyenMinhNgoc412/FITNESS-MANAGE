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

1. chọn bài tập được hỗ trợ;
2. quay video hoặc chọn video local;
3. app lưu/copy video vào app-local storage nếu cần;
4. chạy pose/form analysis.

MVP có thể bắt đầu với ít bài, ví dụ Squat, thay vì tuyên bố hỗ trợ mọi bài tập.

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
