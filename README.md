# FITNESS-MANAGE

FITNESS-MANAGE là ứng dụng quản lý vận hành cho phòng gym cá nhân có mô hình PT 1-1. Ứng dụng tập trung vào quản lý Member, PT assignment, lịch tập, check-in/đối soát, khách tập thử và phân tích cơ thể hỗ trợ fitness bằng AI.

> Trạng thái: MVP đang phát triển.

## Tính năng chính

- Quản lý ba role đăng nhập: `Owner/Admin`, `PT`, `Member`.
- Quản lý Member, PT và lịch sử assignment Member–PT.
- Quản lý lịch tập, check-in và đối soát attendance.
- Ghi nhận khách tập thử và hỗ trợ chuyển đổi thành Member.
- Phân tích video cơ thể theo pipeline CV/Pose trước khi tạo gợi ý tập luyện.

## Kiến trúc tổng quan

```text
React Native + Expo + React Native Web
              |
              v
       NestJS REST API
              |
        Prisma + PostgreSQL
              |
     Supabase Storage (private media)

NestJS REST API --> FastAPI AI Service
                    OpenCV
                    MediaPipe Pose
                    OpenAI API
```

Các thành phần chính:

| Thành phần | Thư mục | Công nghệ | Cổng mặc định |
|---|---|---|---:|
| Client | [`apps/app`](apps/app) | React Native, Expo, TypeScript, Expo Router | Expo mặc định |
| Core API | [`apps/api`](apps/api) | NestJS, REST, Prisma | `3000` |
| AI service | [`services/ai`](services/ai) | Python, FastAPI, OpenCV, MediaPipe Pose | `8000` |
| Database/storage | Supabase | PostgreSQL và Supabase Storage | Theo cấu hình |

NestJS là authority cho authentication, RBAC, nghiệp vụ và quyền truy cập media. Client không truy cập database trực tiếp.

## Yêu cầu môi trường

- Node.js.
- pnpm `10.34.4` hoặc phiên bản tương thích với `packageManager` trong [`package.json`](package.json).
- Python và pip để chạy AI service.
- PostgreSQL local hoặc một project Supabase.
- OpenAI API key nếu chạy chức năng sinh kế hoạch/gợi ý AI.

## Cài đặt lần đầu

### 1. Cài dependency JavaScript

```bash
pnpm install
```

### 2. Tạo file môi trường

PowerShell:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/app/.env.example apps/app/.env
Copy-Item services/ai/.env.example services/ai/.env
```

Linux/macOS:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/app/.env.example apps/app/.env
cp services/ai/.env.example services/ai/.env
```

Điền các giá trị bắt buộc trong ba file `.env`, tối thiểu gồm:

- API: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, thông tin Supabase và `AI_SERVICE_TOKEN`.
- App: `EXPO_PUBLIC_API_URL`.
- AI: `AI_SERVICE_TOKEN`, `OPENAI_API_KEY`, `OPENAI_MODEL` và các threshold chất lượng đã được Owner quyết định.

Không commit file `.env`, secret hoặc raw body video vào repository.

### 3. Tạo Python virtual environment cho AI

Windows:

```powershell
py -m venv services/ai/.venv
services/ai/.venv/Scripts/python.exe -m pip install -r services/ai/requirements.txt
```

Linux/macOS:

```bash
python3 -m venv services/ai/.venv
services/ai/.venv/bin/python -m pip install -r services/ai/requirements.txt
```

### 4. Khởi tạo database

```bash
pnpm --filter @fitness/api prisma:generate
pnpm --filter @fitness/api prisma:migrate
```

Tạo dữ liệu local/test mẫu nếu cần:

```bash
pnpm --filter @fitness/api prisma:seed
```

## Chạy dự án

### Chạy toàn bộ stack

Sau khi cài JavaScript dependencies và Python dependencies:

```bash
pnpm dev
```

Lệnh này khởi động đồng thời API, AI service và Expo app. Nhấn `Ctrl+C` để dừng toàn bộ service.

### Chạy từng service

```bash
pnpm dev:api
pnpm dev:ai
pnpm dev:app
```

`pnpm dev:ai` dùng đường dẫn virtual environment kiểu Windows theo script hiện tại. Trên Linux/macOS, dùng lệnh `uvicorn` ở phần bên dưới hoặc chạy `pnpm dev` để script tự chọn đường dẫn theo platform.

Nếu muốn chạy Expo trên web:

```bash
pnpm --filter @fitness/app web
```

AI service có thể chạy trực tiếp:

```bash
uvicorn app.main:app --app-dir services/ai --host 0.0.0.0 --port 8000
```

## Tài khoản seed

Sau khi chạy `prisma:seed`, môi trường local có các tài khoản mẫu:

| Role | Email |
|---|---|
| Owner/Admin | `owner@example.test` |
| PT | `pt@example.test` |
| Member | `member@example.test` |

Mật khẩu mặc định: `ChangeMe123!`. Chỉ sử dụng các tài khoản này trong local/test; không dùng trong môi trường thật.

## Kiểm tra chất lượng

```bash
pnpm build
pnpm test
```

- `pnpm build`: build NestJS API và typecheck Expo app.
- `pnpm test`: chạy test của API và app.

Có thể chạy riêng:

```bash
pnpm --filter @fitness/api test
pnpm --filter @fitness/app test
pnpm --filter @fitness/api build
pnpm --filter @fitness/app typecheck
```

## Quy tắc AI và dữ liệu nhạy cảm

Pipeline AI bắt buộc:

```text
raw video -> OpenCV/MediaPipe Pose -> structured JSON -> OpenAI API -> validated result
```

- Không gửi raw body video trực tiếp tới OpenAI API.
- Raw video phải nằm trong private Supabase Storage.
- Backend kiểm soát quyền truy cập media và kết quả phân tích.
- AI chỉ hỗ trợ fitness, không phải công cụ chẩn đoán bệnh hoặc chấn thương.

## Cấu trúc repository

```text
.
├── apps/
│   ├── api/                 # NestJS API, Prisma schema/migrations và test
│   └── app/                 # Expo app cho mobile và web
├── services/
│   └── ai/                  # FastAPI AI service và test
├── docs/                    # Product, requirements, architecture, stack và UI/UX SOT
├── screenshots/             # Ảnh tham chiếu giao diện
├── scripts/                 # Script chạy development
├── package.json             # Workspace scripts
└── pnpm-workspace.yaml
```

## Tài liệu dự án

- [Product brief](docs/01-product-brief-sot.md)
- [Product requirements](docs/02-product-requirements-sot.md)
- [Technical architecture](docs/03-technical-architecture-sot.md)
- [Technology stack](docs/04-tech-stack-sot.md)
- [SOT index và quy tắc ưu tiên](docs/README.md)
- [AI service README](services/ai/README.md)

Khi thay đổi behavior, architecture hoặc technology decision, phải cập nhật SOT tương ứng và `docs/CHANGELOG.md` theo quy tắc trong [`docs/README.md`](docs/README.md).
