# FITNESS-MANAGE AI Service

AI service dùng FastAPI và thực hiện pipeline hai stage:

1. `POST /v1/analyze/pose`: nhận signed private video, tiền xử lý bằng OpenCV, chạy MediaPipe Pose và tạo structured JSON.
2. `POST /v1/generate/plan`: nhận structured JSON cùng mục tiêu của Member rồi gọi OpenAI API với Pydantic response schema.

Service không gửi raw video tới OpenAI API. Owner phải cấu hình các quality threshold và `OPENAI_MODEL`; source không tự chọn các giá trị canonical.

## Chạy local

Tạo virtual environment, cài [`requirements.txt`](requirements.txt), cấu hình [`.env.example`](.env.example), rồi chạy:

```text
uvicorn app.main:app --reload --port 8000
```

Có thể chạy từ root repository bằng:

```powershell
pnpm dev:ai
```
