# FITNESS-MANAGE SOT 09 — Business Spec: AI Body Analysis

**Trạng thái:** SOT nghiệp vụ chi tiết  
**Dự án:** FITNESS-MANAGE  
**Ngày cập nhật:** 2026-09-16  
**Requirement liên quan:** `PR-AI-001..004`, `PR-AUDIT-002`  
**Nguyên tắc:** AI hỗ trợ fitness. Không dùng như công cụ chẩn đoán y khoa. Raw video phải đi qua bước phân tích CV/pose tạo dữ liệu có cấu trúc trước khi LLM sinh lời khuyên/lộ trình.

---

## 1. Mục tiêu

Member có thể quay/chọn video cơ thể để hệ thống:

1. kiểm tra video có đủ chất lượng hay không;
2. phân tích pose/đặc trưng quan sát được trong phạm vi mô hình;
3. tạo kết quả structured;
4. kết hợp với mục tiêu Member;
5. sinh lời khuyên và lộ trình tập phù hợp phạm vi fitness.

---

## 2. Boundary sản phẩm

AI được phép:

- nhận diện/định lượng các đặc trưng tư thế hoặc cân đối mà pipeline hỗ trợ;
- phản ánh quality/confidence;
- gợi ý trọng tâm tập luyện;
- sinh lộ trình/bài tập theo mục tiêu fitness.

AI không được:

- chẩn đoán bệnh;
- chẩn đoán chấn thương;
- tuyên bố thay thế bác sĩ/chuyên gia y tế;
- khẳng định chắc chắn khi dữ liệu kém;
- bỏ qua structured analysis để LLM tự nhìn raw video và kết luận toàn bộ.

---

## 3. Luồng Member

```text
Member mở AI Analysis
  -> đọc hướng dẫn quay
  -> quay/chọn video
  -> xem/xác nhận video
  -> gửi phân tích
  -> hệ thống validate input
  -> CV/Pose tạo structured result
  -> LLM sinh recommendation/plan
  -> Member xem kết quả
```

---

## 4. Hướng dẫn quay

Trước khi Member gửi video, UI phải hướng dẫn đủ để tăng chất lượng input.

Nội dung cụ thể của hướng dẫn có thể được hoàn thiện ở UI/implementation, nhưng mục tiêu bắt buộc là:

- cơ thể đủ nhìn thấy cho loại phân tích đang chạy;
- video không quá tối/mờ/rung làm phân tích không đáng tin;
- Member biết video được dùng cho phân tích fitness.

Không tự thêm protocol y khoa vào hướng dẫn nếu chưa được duyệt.

---

## 5. Input quality state

Sau khi nhận video, hệ thống phải có khả năng phân biệt tối thiểu:

| State | Ý nghĩa |
|---|---|
| Valid | Có thể phân tích |
| Needs retake | Chất lượng chưa đủ, cần quay/chọn lại |
| Failed | Pipeline không thể xử lý |

Nếu video không đủ:

- không tạo kết luận giả;
- giải thích ngắn gọn;
- cho Member gửi lại nếu phù hợp.

---

## 6. Structured analysis

Trước LLM phải có structured result có thể chứa:

- input quality;
- pose/keypoint hoặc feature đã trích xuất;
- chỉ số/cân đối quan sát được trong phạm vi analyzer;
- confidence;
- warning/insufficient-data flag;
- analyzer/schema version.

Structured result là contract trung gian để:

- giảm việc LLM suy luận tùy ý từ video;
- kiểm tra chất lượng;
- audit/version;
- tái sử dụng khi sinh plan.

---

## 7. Recommendation & Training Plan

LLM nhận:

- structured analysis;
- Member goal/context được phép;
- rule/safety instruction của sản phẩm.

Output có thể gồm:

- tóm tắt quan sát;
- trọng tâm luyện tập;
- nhóm bài tập phù hợp;
- lộ trình theo giai đoạn;
- cảnh báo giới hạn dữ liệu;
- khuyến nghị hỏi chuyên gia y tế khi nội dung vượt phạm vi fitness, nếu cần.

Không đưa ra diagnosis dưới dạng kết luận chắc chắn.

---

## 8. Ai được xem kết quả

- Member: xem kết quả của chính mình.
- PT: xem Member thuộc phạm vi được giao nếu policy cho phép.
- Owner/Admin: xem theo quyền vận hành/policy.

Không public video/kết quả cho Member khác.

---

## 9. Lịch sử phân tích

Mỗi analysis là một run riêng.

Bắt buộc giữ:

- thời điểm;
- trạng thái;
- input reference;
- structured result/version;
- output plan/version.

Phân tích mới không ghi đè run cũ.

---

## 10. Confidence & uncertainty

Nếu confidence thấp hoặc input không đủ:

- không giả vờ chính xác;
- result phải phản ánh giới hạn;
- có thể yêu cầu retake;
- recommendation không được diễn đạt như kết luận chắc chắn.

---

## 11. Edge cases

1. Upload xong nhưng analysis fail: run ở trạng thái failed; không tạo fake plan.
2. CV result thiếu dữ liệu: LLM nhận flag thiếu dữ liệu, không tự bịa feature.
3. LLM fail sau khi CV thành công: giữ structured result và cho phép retry generation theo implementation; không chạy lại toàn bộ nếu không cần.
4. Member gửi run mới: giữ run cũ.
5. PT assignment đổi: quyền xem lịch sử phải theo policy; dữ liệu không tự đổi owner/history.
6. Raw video bị retention cleanup: metadata/result lịch sử vẫn phải tuân theo policy dữ liệu đã chốt; không tuyên bố có video nếu file đã bị xóa hợp lệ.

---

## 12. Acceptance checklist

- [ ] Member có hướng dẫn trước khi gửi video.
- [ ] Video kém chất lượng có thể yêu cầu retake.
- [ ] Không tạo kết luận khi input không đủ.
- [ ] CV/Pose tạo structured result trước LLM.
- [ ] Structured result có version/confidence.
- [ ] LLM dùng structured result + goal/context.
- [ ] Output không chẩn đoán y khoa.
- [ ] Member xem được kết quả của mình.
- [ ] PT/Owner bị giới hạn theo policy quyền.
- [ ] Mỗi analysis là một run riêng, không overwrite lịch sử.
