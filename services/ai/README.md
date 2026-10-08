# AI feedback service

FastAPI nhận POST /ai/form-analysis với JSON allowlist và X-Service-Token. Body tối đa 8192 bytes; không nhận video, multipart, URL media hoặc base64. Endpoint upload video/tạo kế hoạch cũ đã bỏ.

Member phân tích video bằng MediaPipe trên thiết bị trước. Contract v1 vẫn giải thích độ sâu Squat. Contract v2 nhận tên bài SQUAT/PUSH_UP/LUNGE hoặc UNKNOWN, điểm hỗ trợ nhận diện, reps và tối đa mười báo cáo góc. Service ghép số đo/mục tiêu/verdict cố định, dùng OpenAI diễn giải tiếng Việt khi cấu hình hợp lệ. Không thấy pose/không đủ rep/không xác định bài có phản hồi riêng, không gọi mô hình. Không tạo workout plan, chẩn đoán hoặc lưu video/results server.

Tạo .venv, cài requirements.txt, cấu hình token theo .env.example. Từ root chạy pnpm dev:ai; runner đọc .env của service. NestJS dùng cùng token và proxy JSON sau khi kiểm tra role Member.

Đặt OPENAI_API_KEY và OPENAI_MODEL trong services/ai/.env (server-only); giữ model theo cấu hình, không có model mặc định. Responses API dùng structured output, store=false, timeout 18 giây và không tự retry. Thiếu cấu hình/429/refusal/timeout/output không đúng bằng chứng thì provider=LOCAL; UI vẫn có số đo. Khi AI_SERVICE_TOKEN không được đặt riêng ở service hoặc môi trường, runner dev kế thừa token hiện có từ apps/api/.env vào tiến trình, không ghi/sao chép secret ra file/log. Khởi động lại pnpm dev để nạp code/env FastAPI mới.

pnpm test:ai kiểm tra auth, schema strict, payload media/quá lớn, failure state, unsupported issue và endpoint cũ trả 404. GET /health là healthcheck.

Dev runner bật Uvicorn `--reload` chỉ theo dõi `services/ai/app`, để thay đổi prompt/contract tự được nạp. Sau cập nhật runner cần restart phiên dev một lần. Nếu v2 trả 422, kiểm tra `/openapi.json` có `AutoFormRequest`; chỉ có `FormRequest` nghĩa là tiến trình chưa nạp code mới. Không bỏ validation để xử lý lệch phiên bản.
