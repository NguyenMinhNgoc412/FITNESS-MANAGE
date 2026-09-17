# FITNESS-MANAGE SOT 04 — Technology Stack

**Trạng thái:** Source of Truth chính cho lựa chọn công nghệ  
**Dự án:** FITNESS-MANAGE  
**Ngày cập nhật:** 2026-09-16  
**Phạm vi:** Stack triển khai MVP cho mobile, web, backend, data, storage, AI, notification và source control  
**Nguyên tắc:** File này chỉ sở hữu quyết định công nghệ. Không tự thêm feature hoặc thay đổi nghiệp vụ trong `02-product-requirements-sot.md`.

---

## 1. Kết luận stack đã chốt

FITNESS-MANAGE dùng stack sau cho MVP:

```text
Client
  React Native + Expo + TypeScript
  React Native Web từ cùng Expo codebase
  Expo Router
  Zustand
  React Hook Form + Zod
  Axios

Core Backend
  NestJS + TypeScript
  REST API
  JWT + Refresh Token
  Prisma ORM
  PostgreSQL trên Supabase Free
  Supabase Storage

AI Service
  Python + FastAPI
  OpenCV
  MediaPipe Pose
  OpenAI API

Platform
  Expo Push Notifications
  Không dùng WebSocket/Realtime trong MVP
  Ưu tiên local/free tier khi deploy
  Git + GitHub
```

---

## 2. Client stack

| Nhu cầu | Công nghệ đã chốt | Quy tắc |
|---|---|---|
| Mobile application | React Native + Expo | Một product codebase chính cho mobile |
| Language | TypeScript | Dùng xuyên suốt Expo client và NestJS backend |
| Web application | React Native Web qua Expo | Web dùng cùng codebase Expo; không tạo web app framework riêng trong MVP |
| Routing | Expo Router | Route theo role/feature nhưng authorization cuối cùng vẫn ở backend |
| Client/UI state | Zustand | Chỉ giữ UI/session state phù hợp; không thay database/server state |
| Form | React Hook Form | Quản lý form state |
| Validation | Zod | Validate input/form và có thể tái sử dụng schema ở boundary phù hợp |
| HTTP client | Axios | Gọi REST API từ client |
| Native session storage | Expo SecureStore | Lưu access/refresh token trên iOS/Android; không lưu token vào AsyncStorage |
| Private media upload | Expo FileSystem | Upload file trực tiếp tới signed URL do NestJS cấp, tránh nạp toàn bộ video vào JS memory |

### 2.1. Quy tắc dùng chung mobile và web

1. Ưu tiên component, hook, domain adapter và validation dùng chung.
2. Chỉ tách implementation theo platform khi capability mobile/web thực sự khác nhau.
3. Không tạo một frontend web riêng bằng framework khác chỉ để "dễ làm web" trong MVP.
4. UI có thể khác layout theo breakpoint nhưng business flow và API contract phải thống nhất.
5. Role visibility trên client chỉ phục vụ UX; quyền thật phải được NestJS kiểm tra ở API/service boundary.

---

## 3. Backend & API stack

| Nhu cầu | Công nghệ đã chốt | Quy tắc |
|---|---|---|
| Backend framework | NestJS | Backend nghiệp vụ chính |
| Language | TypeScript | Đồng bộ type discipline với client |
| API style | REST API | Không dùng GraphQL trong baseline MVP |
| Authentication | JWT + Refresh Token | NestJS quản lý auth/session lifecycle |
| ORM | Prisma | Truy cập relational data và migration |
| Database | PostgreSQL trên Supabase Free | Supabase đóng vai trò managed PostgreSQL |

### 3.1. Backend là authority

NestJS là application/backend authority cho:

- authentication và refresh-token flow;
- RBAC cho `Owner/Admin`, `PT`, `Member`;
- Member–PT assignment;
- schedule/check-in/attendance reconciliation;
- Guest conversion;
- audit/history;
- cấp quyền truy cập media;
- orchestration sang AI service.

Client không được truy cập trực tiếp PostgreSQL để bypass backend rule.

### 3.2. Supabase boundary

Trong MVP, Supabase được chốt cho:

1. **PostgreSQL managed database**;
2. **Supabase Storage**.

Không mặc định dùng thêm:

- Supabase Auth;
- Supabase Realtime;
- Edge Functions;
- database access trực tiếp từ client;
- feature Supabase khác chỉ vì có sẵn.

Muốn bổ sung phải update SOT và `CHANGELOG.md`.

---

## 4. Authentication

Cơ chế đã chốt:

```text
Login
  -> NestJS xác thực account
  -> issue access JWT + refresh token
  -> client lưu session theo cơ chế an toàn phù hợp platform
  -> access JWT dùng gọi REST API
  -> refresh token dùng lấy access JWT mới
```

Quy tắc:

1. Không dùng Supabase Auth trong baseline này.
2. Backend phải kiểm tra role/scope trên mỗi endpoint nhạy cảm.
3. Refresh token phải có lifecycle rõ: issue, rotate/revoke theo implementation được duyệt.
4. Không coi route guard phía client là security boundary.
5. Test phải có session độc lập cho ba role.
6. iOS/Android lưu session bằng Expo SecureStore với phạm vi thiết bị; web chỉ giữ token trong memory ở baseline và yêu cầu đăng nhập lại sau khi reload, không persist refresh token trong localStorage/AsyncStorage.

Chi tiết behavior role nằm ở `05-business-auth-role-access-sot.md` và security contract nằm ở `10-tech-data-security-audit-sot.md`.

---

## 5. Data stack

### 5.1. PostgreSQL + Prisma

PostgreSQL là relational source of truth cho dữ liệu nghiệp vụ như:

- users/account;
- PT profile;
- Member profile;
- Member–PT assignment history;
- schedule;
- raw check-in;
- attendance reconciliation;
- Guest/trial/conversion;
- AI analysis metadata/result;
- audit.

Prisma chịu trách nhiệm:

- schema mapping;
- migration;
- typed database access trong NestJS;
- transaction cho các flow cần atomicity.

Không dùng client-side ORM để truy cập database trực tiếp.

### 5.2. Transaction-critical flows

Bắt buộc dùng transaction phù hợp cho tối thiểu:

- tạo Member + initial PT assignment;
- đổi PT;
- Guest -> Member conversion;
- mutation attendance/audit có nhiều record liên quan;
- các flow khác được `10-tech-data-security-audit-sot.md` đánh dấu atomic.

---

## 6. Storage stack

Storage đã chốt: **Supabase Storage**.

Dùng cho binary/media như:

- video cơ thể phục vụ AI analysis;
- media/result artifact nếu requirement thực tế cần;
- file không phù hợp lưu trực tiếp trong PostgreSQL.

Quy tắc:

1. Raw body video phải private mặc định.
2. Metadata thuộc database; binary nằm trong Storage.
3. Backend kiểm soát quyền truy cập media.
4. Không dùng public bucket cho raw body video.
5. Client không được dựa vào path đoán được để coi là authorization.
6. Upload/download nên dùng access mechanism có thời hạn hoặc flow do backend cấp quyền nếu implementation cần client truyền file trực tiếp tới Storage.

---

## 7. AI service stack

| Nhu cầu | Công nghệ đã chốt |
|---|---|
| AI microservice/API | Python + FastAPI |
| Computer Vision | OpenCV |
| Pose estimation | MediaPipe Pose |
| Generative AI | OpenAI API qua OpenAI Python SDK |

### 7.1. Service boundary

Kiến trúc AI bắt buộc:

```text
NestJS/Core Backend
  -> yêu cầu AI analysis
  -> FastAPI AI Service
      -> OpenCV preprocessing
      -> MediaPipe Pose extraction
      -> structured JSON
      -> OpenAI API
      -> structured recommendation/training plan
  -> NestJS persist/result authorization
```

### 7.2. Rule bắt buộc

1. OpenAI API **không nhận raw body video làm nguồn phân tích chính trong baseline**.
2. Video phải qua OpenCV + MediaPipe Pose trước.
3. Tầng CV/Pose tạo structured JSON có quality/confidence/context cần thiết.
4. OpenAI API nhận structured JSON và context nghiệp vụ được phép để sinh lời khuyên/lộ trình.
5. AI output phải validate theo schema trước khi persist/hiển thị.
6. Không biến AI thành medical diagnosis.
7. Version của structured schema/pipeline/model phải được lưu đủ để debug/audit theo `11-tech-ai-analysis-pipeline-sot.md`.

---

## 8. Notification

Notification đã chốt: **Expo Push Notifications**.

Baseline:

- dùng cho push notification khi requirement tương ứng được implement;
- backend quản lý logic phát notification;
- Expo client đăng ký push token theo flow phù hợp;
- notification không được tự trở thành source of truth cho lịch/check-in/attendance.

File stack này không tự thêm loại notification mới nếu Product Requirements chưa yêu cầu.

---

## 9. Realtime

MVP **không cần WebSocket**.

Quy tắc:

1. REST API là transport chính.
2. Không bật Supabase Realtime chỉ vì database đang đặt trên Supabase.
3. Dữ liệu cần refresh có thể dùng request lại, refetch hoặc polling có kiểm soát nếu requirement thực tế cần.
4. WebSocket/Realtime chỉ được bổ sung sau khi có use case rõ và owner duyệt.

---

## 10. Deployment & cost rule

Mục tiêu triển khai MVP:

- ưu tiên chạy local trong quá trình phát triển;
- ưu tiên free tier hoặc chi phí thấp;
- PostgreSQL dùng Supabase Free theo quyết định hiện tại;
- Storage dùng Supabase Storage;
- không tự chọn thêm paid infrastructure khi chưa có nhu cầu;
- provider deploy cụ thể cho NestJS/FastAPI/web **chưa được khóa bởi danh sách stack này**, vì vậy Agent không được tự biến một lựa chọn deploy tạm thành SOT canonical.

Khi owner chốt host cụ thể, cập nhật file này + `CHANGELOG.md`.

---

## 11. Source control

Source control đã chốt:

```text
Git + GitHub
```

Quy tắc:

- code và migration phải version-controlled;
- không commit secret/API key;
- `.env` thật không đưa lên repository;
- tài liệu SOT nằm cùng repository/project docs để Codex đọc trước khi implement;
- thay đổi decision-level phải đi cùng update SOT/CHANGELOG phù hợp.

---

## 12. Testing tooling status

Requirement bắt buộc có test đã nằm trong Product Requirements/Technical Architecture, nhưng **tên testing library cụ thể chưa được owner khóa trong danh sách tech stack này**.

Do đó:

- không ghi Jest/Vitest/Playwright/Maestro/Detox thành canonical chỉ bằng suy đoán;
- có thể dùng tooling đã tồn tại trong codebase sau khi project setup nếu phù hợp, nhưng nếu muốn khóa thành SOT phải cập nhật file này;
- invariant quan trọng vẫn bắt buộc có test bất kể thư viện test cuối cùng là gì.

---

## 13. Stack không dùng trong baseline MVP

Không tự thay baseline bằng:

| Không dùng/thêm mặc định | Lý do |
|---|---|
| Flutter | Client đã chốt React Native + Expo |
| Web frontend riêng bằng framework khác | Web đã chốt React Native Web cùng Expo codebase |
| Redux làm state chính | Zustand đã chốt |
| GraphQL | REST API đã chốt |
| Supabase Auth | Auth đã chốt JWT + Refresh Token do NestJS quản lý |
| Firebase làm backend/database chính | Backend/data stack đã chốt NestJS + PostgreSQL/Supabase |
| WebSocket/Supabase Realtime ở MVP | Chưa cần realtime |
| Raw video -> LLM trực tiếp | Trái pipeline AI đã chốt |
| ORM khác thay Prisma | Prisma đã chốt |

Danh sách này là baseline hiện tại, không phải cấm vĩnh viễn. Mọi thay đổi cần owner duyệt và update SOT.

---

## 14. Dependency/implementation rule

1. Ưu tiên package tương thích chính thức với phiên bản Expo/NestJS/FastAPI đang dùng khi bắt đầu implementation.
2. Không hard-code version package vào SOT nếu owner chưa chốt version cụ thể.
3. Khi package native thuộc Expo ecosystem, dùng cách cài đặt tương thích Expo thay vì ép version không phù hợp.
4. Không thêm một library thứ hai giải cùng bài toán nếu stack hiện tại đã đáp ứng đủ.
5. Không thay Axios bằng client khác, Prisma bằng ORM khác hoặc Zustand bằng state library khác nếu chưa có decision change.

---

## 15. Quy tắc thay đổi tech stack

Muốn thay bất kỳ lựa chọn nào trong file này phải ghi rõ:

1. công nghệ hiện tại;
2. công nghệ đề xuất;
3. lý do;
4. requirement/non-functional need nào yêu cầu thay đổi;
5. ảnh hưởng client/backend/database/AI;
6. migration plan;
7. ảnh hưởng deploy/cost;
8. ảnh hưởng testing;
9. rollback plan nếu phù hợp.

Sau khi owner duyệt:

- cập nhật `04-tech-stack-sot.md`;
- cập nhật `03-technical-architecture-sot.md` nếu architecture bị ảnh hưởng;
- cập nhật technical detail liên quan;
- ghi `CHANGELOG.md`.
