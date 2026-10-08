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
    {"code": "INSUFFICIENT_DEPTH", "confidence": 0.86}
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

## Web dev SQLite worker — 2026-10-08

- pnpm store ngoài workspace có thể làm URL dev worker bị chuẩn hóa mất đoạn `../` và trả 404. Metro rewrite đúng request SQLite worker sang entry trong workspace; entry chỉ import worker sẵn có của `expo-sqlite`, không thay thư viện hay sửa vendor.
- Expo có thể phục vụ HTML `/` trước middleware COOP/COEP. Entry web khi chưa đăng nhập và document thiếu isolation tải trực tiếp `/login`; không reload phiên web đã đăng nhập vì phiên auth nằm trong memory.
- Kiểm tra secure context, cross-origin isolation, SharedArrayBuffer và OPFS trước mở SQLite/chọn video. Mở database timeout sau 15 giây; connection tới muộn được đóng, retry tạo connection riêng để tránh chờ vô hạn hoặc đóng nhầm connection mới.
- Raw video vẫn chỉ ở OPFS/File System. Chọn video trên web chưa tự phân tích; UI phải báo các bước lưu và hướng dẫn CTA phân tích. Giới hạn duration web tính bằng giây, native tính bằng milliseconds theo ImagePicker hiện hành.

## Local angle report v2 — 2026-10-08

- Mobile và web dùng `sampleFromPose`/`measureAngles` chung, tính góc theo pixel để sửa tỷ lệ khung hình. Mỗi điểm dùng visibility hữu hạn trong [0.6,1]; điểm thiếu, không hữu hạn, kích thước ảnh không hợp lệ hoặc vector độ dài bằng 0 trả null, không thay bằng 0°.
- Các góc gối hai bên, khuỷu hai bên và tay hai bên độc lập. Độ nghiêng thân ưu tiên bên vai–hông có minimum visibility cao hơn; nếu một bên thiếu thì dùng bên còn đủ rõ.
- Giữ bộ đếm v1. Chọn gối đủ rõ, ưu tiên minimum visibility cao hơn thay vì trung bình của ba điểm; một bên bị che không lấn át bên còn đo được. Lưu góc tại sample có góc gối nhỏ nhất trong từng chu kỳ hoàn chỉnh; chu kỳ bị che/mất pose không tạo report. Mốc thời gian tính từ đầu video.
- Local JSON giữ envelope v1 và bổ sung `detail.schemaVersion = "2.0"`, profile BODYWEIGHT_ARMS_FORWARD, snapshot mục tiêu thân và repetitions. SQLite schema không đổi; JSON cũ thiếu detail vẫn đọc được, cần phân tích lại trên mobile/web để có góc.
- Native bridge `getAnalysisVersion()` trả 2; `analyze` trả timestamp, kích thước ảnh sau orientation transform và landmarks local. Chỉ trả tọa độ/visibility cho vai–tay (11–16), hông–chân (23–28); các index khác được che thành zero visibility, không đưa face/video frames qua bridge. Giữ field gối v1 cho tương thích bundle cũ nhưng JS mới chỉ dùng bộ tính chung. Landmarks chỉ là dữ liệu tạm, không vào React state, SQLite result hoặc HTTP; chỉ metrics mới được lưu.
- JS kiểm tra phiên bản bridge trước xử lý, validates native frame bounds/timestamp/dimensions, không chấp nhận kết quả đến muộn sau cancel. Module cũ cần rebuild Development Build; không fallback bí mật về báo cáo thiếu góc.
- `explanationPayload` chỉ project allowlist contract v1 trước gọi API; detail, mốc thời gian, mục tiêu cá nhân, landmarks và raw video không rời thiết bị. FastAPI/NestJS vẫn chỉ giải thích độ sâu, không giả lập phân tích góc mới.
- Chỉ số detectedRatio là độ phủ mẫu pose, không phải độ chính xác số đo. Chưa kiểm chứng ngưỡng và độ chính xác trên bộ video người thật; mục tiêu kỹ thuật tại SOT 14 phải được hiển thị rõ.

## Automatic recognition/result v2 — 2026-10-08 (hiện hành)

Phần này thay thế giả định một bài và payload v1 cho phiên mới; v1/detail v2 vẫn đọc được trong lịch sử.

- Trên cùng pose helper web/native, tính thêm tỷ lệ khoảng cách ngang hai cổ chân / chiều dài vai–hông, góc vai–hông–cổ chân và khuỷu phía đủ rõ. Không lưu/gửi landmarks hay motion features dùng nhận diện.
- Vote theo frame hợp lệ: PUSH_UP nếu thân ≥65° so với phương đứng, đường cơ thể ≥150° và khuỷu đủ rõ; LUNGE nếu thân <65° và tỷ lệ chân ≥0.8; SQUAT nếu thân <65° và tỷ lệ chân <0.6. Khoảng giữa/thiếu dữ liệu là UNKNOWN. Tối thiểu mười mẫu, coverage ≥0.6, vote thắng ≥0.7 trên mẫu hợp lệ và ≥0.6 toàn video, biên độ joint ≥25°. Điểm vote là heuristic, chưa hiệu chuẩn xác suất; góc quay/bài gần giống vẫn có thể nhận diện nhầm.
- Chu kỳ dùng joint gối cho Squat/lunge, khuỷu cho chống đẩy; kế thừa ngưỡng đứng/duỗi ≥160°, hạ <140°, ít nhất 400 ms, reset khi pose mất hoặc gap >500 ms. UNKNOWN/POSE_NOT_DETECTED/INSUFFICIENT_REPS không tạo kết luận form.
- Local envelope schemaVersion=2.0 chứa exercise/status/recognitionScore/reps/metrics/reference/perRep và explanation có provider. Lưu tất cả báo cáo lần được nhận diện; lịch sử v1 vẫn đọc được. Không mặc định mẫu tay đưa trước khi chỉ biết tên bài.
- HTTP allowlist v2 chỉ project schemaVersion/exercise/status/recognitionScore/reps, metrics detectedRatio/minJointAngle, reference trunkMax tùy chọn và tối đa mười perRep: index/timeSeconds/góc gối/thân/khuỷu/tay/bodyLine. Mốc tương đối là giây từ đầu video; không gửi URI, identity, frame, thumbnail, coordinates, motion features hay lời nhắc tự do. Body tối đa 8192 bytes.
- FastAPI chỉ gửi tới OpenAI tên bài, reps/score và tối đa sáu bằng chứng góc/mục tiêu/verdict ưu tiên ngoài ngưỡng. Responses structured output với store=false; OPENAI_API_KEY/OPENAI_MODEL server-only, giữ model đã cấu hình. Timeout 18 giây/max_retries=0; gateway 25 giây/client 30 giây. Server giữ số đo/verdict bất biến, từ chối rewrite sai index/metric/thêm chữ số hoặc nội dung cấm đã kiểm tra; lỗi/refusal/429 dùng phản hồi LOCAL. Prompt chỉ diễn giải form, không xem video/đoán biến thể/chẩn đoán/giáo án. Không tuyên bố guard kiểm chứng được mọi câu trả lời về ngữ nghĩa.
- Không auto-upload raw video để xử lý lỗi/unknown; việc gọi nhận xét JSON diễn ra tự động sau phân tích hoàn chỉnh. UI ghi rõ OPENAI/LOCAL và vẫn hiển thị kết quả khi offline.
- SQLite user_version=2 thêm local_ai_results lưu từng kết quả trong transaction cùng cập nhật latest snapshot; migration copy kết quả cũ một lần. PROCESSING/FAILED không xóa kết quả trước. User xóa phiên thì xóa cả lịch sử kết quả và video local. Không có collection/migration MongoDB cho AI.
