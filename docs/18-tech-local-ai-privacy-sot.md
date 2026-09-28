# FITNESS-MANAGE SOT 18 — Local AI, SQLite & Privacy

## 1. Privacy architecture

Raw workout video là dữ liệu local-sensitive.

Allowed:

```text
Camera/Library
 -> app local file
 -> on-device MediaPipe Pose
 -> local metrics/result
 -> optional minimized JSON to FastAPI
```

Forbidden:

```text
raw video -> NestJS
raw video -> FastAPI
raw video -> Supabase Storage
raw video -> OpenAI
raw video -> MongoDB
```

---

## 2. Local file lifecycle

- Import/capture vào app-managed local storage.
- Lưu URI trong SQLite.
- User có thể xóa session/video local nếu UI được implement.
- Temp frames/files cleanup sau processing.
- Không base64 toàn video vào JS state.

---

## 3. SQLite

`local_ai_sessions` là source cho history AI local.

State gợi ý:

- `PENDING`
- `PROCESSING`
- `COMPLETED`
- `FAILED`

Result JSON có version để migration nếu schema AI đổi.

---

## 4. Pose pipeline

1. validate video;
2. sample/decode frame phù hợp;
3. MediaPipe Pose lấy landmarks;
4. compute feature/angle/repetition;
5. detect supported issues;
6. tạo structured JSON;
7. nếu cần explanation, gửi JSON tối thiểu tới FastAPI;
8. lưu feedback local.

Không tuyên bố issue ngoài algorithm đã implement/test.

---

## 5. FastAPI payload

Payload chỉ chứa feature cần thiết, ví dụ:

```json
{
  "exercise": "SQUAT",
  "reps": 12,
  "metrics": {
    "minKneeAngle": 76
  },
  "issues": [
    {"code": "KNEE_VALGUS", "confidence": 0.86}
  ]
}
```

Không gửi frame image hoặc thumbnail nếu chưa có SOT privacy mới.

---

## 6. OpenAI contract

Prompt/system phải buộc output:

- giải thích dễ hiểu;
- gợi ý sửa form;
- không diagnosis;
- không workout plan;
- không claim certainty vượt confidence.

Structured response nên validate bằng schema trước khi hiển thị.

---

## 7. Offline behavior

Nếu on-device analysis đủ để tạo basic feedback, app có thể hiển thị local result khi offline.

Nếu phần natural-language explanation cần FastAPI/OpenAI, queue/retry JSON khi có mạng hoặc hiển thị local technical feedback. Không upload video để “giải quyết offline”.

---

## 8. Performance

- Không giữ toàn video trong JS memory.
- Không decode toàn bộ frame cùng lúc.
- Cleanup processor/resource khi cancel/unmount.
- Có progress stage thay vì progress giả nếu không đo bytes/frames chính xác.

---

## 9. Acceptance

1. Airplane/offline flow không mất raw video.
2. Network capture không có video payload.
3. SQLite giữ URI/result chính xác.
4. File missing có error state, không crash.
5. Unsupported exercise không bịa analysis.

## Algorithm v1 đã triển khai — 2026-09-24

Chỉ hỗ trợ SQUAT và issue INSUFFICIENT_DEPTH. Video tối đa 120 giây, lấy mẫu khoảng 10 fps; góc gối từ hip/knee/ankle ở phía nhìn rõ hơn. Visibility tối thiểu 0.6, ít nhất 10 mẫu hợp lệ và detectedRatio 0.6. Chu kỳ đứng (>=160°) → hạ (<140°) → đứng, kéo dài ít nhất 400 ms; góc nhỏ nhất >100° gợi ý thiếu độ sâu. Mất pose hoặc khoảng cách mẫu >500 ms reset chu kỳ. Đây là heuristic hỗ trợ form, chưa được đánh giá độ chính xác trên tập video người thật.

POSE_NOT_DETECTED/INSUFFICIENT_REPS không có issue bịa. Không suy luận knee valgus/thân người. Local result và file URI nằm SQLite riêng theo Member; native File System, web OPFS. Model/WASM được đóng gói cùng app, không tải video lên mạng. Nút giải thích chỉ gửi allowlist JSON; FastAPI hiện dùng feedback xác định, chưa cần gọi OpenAI.

Model lite có SHA-256 59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a; scripts/prepare-pose.mjs kiểm tra trước khi chép vào assets. Android/iOS cần development build. Web cần browser hỗ trợ SQLite WASM/OPFS và headers theo README.

MediaPipe web được pin 0.10.21 đồng bộ native. Bản 1.0.1 phát request telemetry tới Google trong browser verification nên không dùng trong baseline local-only. Không chỉnh sửa bundle vendor; dùng package/model local và kiểm tra network bằng browser runner.
