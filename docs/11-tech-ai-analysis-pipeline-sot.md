# FITNESS-MANAGE SOT 11 — Technical Spec: AI Analysis Pipeline

**Trạng thái:** SOT kỹ thuật chi tiết  
**Dự án:** FITNESS-MANAGE  
**Ngày cập nhật:** 2026-09-16  
**Liên quan:** `PR-AI-001..004`, `03-technical-architecture-sot.md`, `04-tech-stack-sot.md`, `09-business-ai-body-analysis-sot.md`  
**Nguyên tắc:** Pipeline đã khóa `FastAPI -> OpenCV -> MediaPipe Pose -> structured JSON -> OpenAI API`. Không được đổi thành “raw video -> LLM -> kết luận”.

---

## 1. Pipeline chuẩn

```text
Member video
  -> upload validation
  -> media preprocessing
  -> OpenCV frame preprocessing
  -> MediaPipe Pose extraction
  -> quality evaluation
  -> structured feature JSON
  -> recommendation context builder
  -> OpenAI API generation
  -> output schema validation
  -> persist result/version
```

---

## 2. Analysis run state machine

Tối thiểu:

```text
UPLOADED
  -> VALIDATING
  -> ANALYZING
  -> COMPLETED
```

Nhánh lỗi:

```text
VALIDATING -> NEEDS_RETAKE
VALIDATING -> FAILED
ANALYZING  -> FAILED
```

Không set `COMPLETED` nếu chưa có output hợp lệ theo schema.

---

## 3. Upload boundary

Backend/service phải validate:

- actor là Member hợp lệ hoặc flow được ủy quyền;
- file type cho phép;
- file size/duration theo budget implementation đã duyệt;
- media reference thuộc đúng Member;
- không public upload path.

Budget số cụ thể chưa có trong source hiện tại, vì vậy không hard-code vào SOT này.

---

## 4. Input preprocessing

Mục tiêu:

- decode media an toàn;
- chọn frame/keyframe cần thiết;
- normalize orientation/resolution khi pipeline cần;
- không đưa toàn bộ binary vào application state/cache không cần thiết.

Implementation preprocessing nằm trong Python/FastAPI service và dùng OpenCV; output sang MediaPipe Pose phải đủ deterministic để debug/version.

---

## 5. CV / Pose extraction contract

Output structured tối thiểu nên có shape logic:

```json
{
  "schemaVersion": "...",
  "inputQuality": {
    "status": "VALID|NEEDS_RETAKE|INSUFFICIENT",
    "reasons": []
  },
  "pose": {
    "features": {},
    "keypoints": [],
    "derivedMetrics": {}
  },
  "confidence": {},
  "warnings": [],
  "analyzerVersion": "..."
}
```

Tên field vật lý có thể khác, nhưng phải giữ các nhóm ý nghĩa:

- quality;
- extracted feature;
- confidence;
- warning;
- schema/analyzer version.

Không đưa diagnosis y khoa vào structured result nếu product chưa duyệt.

---

## 6. Confidence gate

Trước LLM:

1. nếu input invalid -> `NEEDS_RETAKE`/`FAILED`;
2. nếu feature critical thiếu -> context phải đánh dấu insufficient;
3. nếu confidence thấp -> generation prompt/context phải giữ uncertainty;
4. không tự fill missing metric bằng giá trị tưởng tượng.

---

## 7. OpenAI context builder

OpenAI API chỉ nhận dữ liệu cần thiết:

- structured CV/pose result;
- goal/context Member được phép;
- safety/product instruction;
- output schema.

Không gửi raw video trực tiếp cho OpenAI API trong baseline; input chính là structured JSON từ OpenCV/MediaPipe Pose.

Không đưa secret/internal audit không liên quan vào prompt.

---

## 8. Output schema

Output logic nên có cấu trúc thay vì prose tự do duy nhất:

```json
{
  "summary": "...",
  "focusAreas": [],
  "recommendations": [],
  "trainingPlan": {
    "phases": []
  },
  "limitations": [],
  "safetyFlags": []
}
```

Schema cụ thể có thể mở rộng khi requirement thay đổi, nhưng phải validate trước khi persist `COMPLETED`.

---

## 9. Versioning

Mỗi run cần truy được:

- pipeline version;
- structured schema version;
- analyzer/model version ở mức hệ thống cho phép lưu;
- generation/prompt version;
- thời điểm tạo.

Mục tiêu là giải thích vì sao hai run khác nhau có thể cho output khác nhau mà không rewrite lịch sử.

---

## 10. Retry strategy

### 10.1. Upload retry

Phải tránh tạo nhiều run ngoài ý muốn nếu client retry cùng request.

### 10.2. CV fail

Cho retry theo policy; không tạo LLM output nếu structured result chưa hợp lệ.

### 10.3. LLM fail sau CV success

Có thể retry generation từ structured result đã lưu, không bắt buộc reprocess video nếu analyzer result vẫn hợp lệ.

### 10.4. Permanent failure

Persist trạng thái lỗi an toàn; không lộ stack trace/model secret cho Member.

---

## 11. Storage & access

- raw video ở private Supabase Storage;
- metadata/run ở relational/domain store;
- structured result và plan gắn run id;
- access raw video/result phải kiểm tra role scope;
- không dùng public URL lâu dài mặc định;
- retention không tự quyết định trong code nếu chưa có product policy.

---

## 12. Observability

Theo dõi tối thiểu:

- run duration theo stage;
- failure reason category;
- retake rate;
- analyzer/generation version;
- correlation id.

Không log raw body video hoặc prompt chứa dữ liệu nhạy cảm một cách không cần thiết.

---

## 13. Test strategy

### Unit

- quality gate;
- structured schema validation;
- confidence/insufficient-data mapping;
- output schema validation;
- permission mapping.

### Integration

- upload -> run creation;
- CV result -> generation;
- generation fail -> retry;
- history không overwrite.

### AI regression fixture

Dùng tập input fixture được kiểm soát để kiểm tra:

- pose extraction không đổi bất ngờ;
- low-quality input bị từ chối đúng;
- output luôn giữ safety boundary;
- schema backward compatibility khi version thay đổi.

---

## 14. Acceptance checklist kỹ thuật

- [ ] Không có đường tắt raw video -> LLM kết luận toàn bộ.
- [ ] Run có state rõ.
- [ ] CV structured output có version/confidence.
- [ ] Invalid input dừng trước generation.
- [ ] LLM context không tự fill missing data.
- [ ] Output validate schema trước `COMPLETED`.
- [ ] Run mới không overwrite run cũ.
- [ ] Retry không tạo duplicate run ngoài ý muốn.
- [ ] Raw media private và scope access đúng.
- [ ] Không chẩn đoán y khoa ở pipeline output.
