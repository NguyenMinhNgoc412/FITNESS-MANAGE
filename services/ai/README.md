# AI feedback service

FastAPI nhận POST /ai/form-analysis với JSON allowlist và X-Service-Token. Body tối đa 8192 bytes; không nhận video, multipart, URL media hoặc base64. Endpoint upload video/tạo kế hoạch cũ đã bỏ.

Member phân tích video bằng MediaPipe trên thiết bị trước. Service phản hồi tiếng Việt cho INSUFFICIENT_DEPTH đã implement/test; không thấy pose/không đủ rep có trạng thái riêng. Phiên bản này dùng feedback xác định, chưa cần gọi OpenAI. Không tạo workout plan, chẩn đoán hoặc lưu video/results server.

Tạo .venv, cài requirements.txt, cấu hình token theo .env.example. Từ root chạy pnpm dev:ai; runner đọc .env của service. NestJS dùng cùng token và proxy JSON sau khi kiểm tra role Member.

pnpm test:ai kiểm tra auth, schema strict, payload media/quá lớn, failure state, unsupported issue và endpoint cũ trả 404. GET /health là healthcheck.
