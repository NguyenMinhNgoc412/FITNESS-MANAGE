# FITNESS-MANAGE — Source of Truth

**Trạng thái:** Canonical SOT entry point  
**Dự án:** FITNESS-MANAGE  
**Ngày cập nhật:** 2026-09-16  
**Ngôn ngữ:** Tiếng Việt

---

## 1. Mục đích

Folder này là nguồn tham chiếu chính thức để Product, Codex/AI Agent và developer hiểu **FITNESS-MANAGE đang làm gì, được phép làm gì, dùng công nghệ nào và phải implement theo kiến trúc nào**.

Không dùng chat cũ, comment code hoặc suy đoán cá nhân để override SOT.

Nếu code và SOT mâu thuẫn, phải xác minh quyết định mới nhất rồi cập nhật đúng tài liệu trước khi mở rộng implementation.

---

## 2. Bộ tài liệu SOT

### 2.1. Core SOT bắt buộc

| File | Sở hữu | Không được sở hữu |
|---|---|---|
| `01-product-brief-sot.md` | why, positioning, audience, outcome, product principles, business model, boundary | workflow chi tiết, acceptance, framework, database |
| `02-product-requirements-sot.md` | canonical requirement IDs, behavior, scope, acceptance criteria | framework/provider, schema vật lý, code pattern |
| `03-technical-architecture-sot.md` | kiến trúc hệ thống, module boundary, domain contract, security/AI architecture | feature mới chưa có trong PRD |
| `04-tech-stack-sot.md` | framework, library, provider và stack công nghệ đã chốt | business behavior, requirement mới |
| `CHANGELOG.md` | lịch sử thay đổi SOT | quyết định canonical thay cho file chính |
| `README.md` | cách đọc, conflict priority, bản đồ tài liệu, rule cho Agent | duplicate chi tiết feature |

### 2.2. Business SOT chi tiết theo chức năng

Các file này **chi tiết hóa requirement ID đã tồn tại trong `02`**. Chúng không được tạo feature mới nếu `02` chưa có requirement tương ứng.

| File | Phạm vi | Requirement chính |
|---|---|---|
| `05-business-auth-role-access-sot.md` | login, account status, RBAC, PT access, 3-role session test | `PR-AUTH-*`, `PR-PT-*`, `PR-TEST-001` |
| `06-business-member-pt-assignment-sot.md` | Member registration, PT 1-1 assignment, đổi PT, history | `PR-MEMBER-*`, `PR-ASSIGN-*` |
| `07-business-schedule-checkin-attendance-sot.md` | lịch, khung linh hoạt 2h, Member/PT check-in, đối soát | `PR-SCHEDULE-*`, `PR-CHECKIN-*` |
| `08-business-guest-trial-conversion-sot.md` | khách tập thử, trial history, Guest -> Member | `PR-GUEST-*` |
| `09-business-ai-body-analysis-sot.md` | AI body analysis behavior, structured result, plan, history | `PR-AI-*` |

### 2.3. Technical SOT chi tiết

| File | Phạm vi |
|---|---|
| `10-tech-data-security-audit-sot.md` | transaction, invariant, concurrency, RBAC enforcement, time, audit, sensitive data |
| `11-tech-ai-analysis-pipeline-sot.md` | FastAPI/OpenCV/MediaPipe/OpenAI pipeline, structured schema, confidence gate, generation, versioning |
| `12-Agent-task-splitting-sot.md` | thứ tự implement, mapping requirement -> SOT -> task -> acceptance |

---

## 3. Thứ tự đọc bắt buộc

### 3.1. Mọi task

1. `README.md`
2. `01-product-brief-sot.md`
3. `02-product-requirements-sot.md`
4. `03-technical-architecture-sot.md`
5. `04-tech-stack-sot.md`
6. file SOT chi tiết liên quan task
7. `CHANGELOG.md` nếu cần lịch sử quyết định

### 3.2. Mapping theo task

| Task | Đọc thêm |
|---|---|
| Setup project/dependency | `04`, `10`, `12` |
| Login / permission / PT management | `05`, `10` |
| Tạo Member / gán PT / đổi PT | `06`, `10` |
| Lịch / check-in / attendance | `07`, `10` |
| Guest / tập thử / conversion | `08`, `10` |
| AI behavior/UI flow | `09`, `11` |
| AI backend/pipeline | `09`, `10`, `11` |
| Chia task Codex/Agent | `12` |

Không nhảy thẳng vào file chi tiết rồi bỏ qua `02`, `03`, `04`, vì file chi tiết chỉ mở rộng requirement/architecture/stack đã được khóa ở core SOT.

---

## 4. Quy tắc ưu tiên khi tài liệu mâu thuẫn

1. **Product Brief (`01`)** quyết định sản phẩm là gì, phục vụ ai và boundary ở đâu.
2. **Product Requirements (`02`)** quyết định canonical requirement, scope và acceptance.
3. **Technical Architecture (`03`)** quyết định kiến trúc tổng quan để đáp ứng requirement.
4. **Technology Stack (`04`)** quyết định framework/library/provider được phép dùng trong baseline.
5. **Business detail (`05`–`09`)** quyết định flow/state/edge case chi tiết trong phạm vi requirement đã có; không được trái `02`.
6. **Technical detail (`10`–`11`)** quyết định invariant/technical contract chi tiết trong phạm vi `03` + `04`; không được tự thêm business behavior.
7. **Task guide (`12`)** chỉ chia việc, không override nghiệp vụ, architecture hoặc stack.
8. **README** quyết định cách đọc và sử dụng bộ SOT.
9. **CHANGELOG** chỉ ghi lịch sử, không override nội dung hiện hành.

Nếu `05`–`09` mâu thuẫn `02`, **`02` thắng** và file chi tiết phải được đồng bộ.  
Nếu `10`–`11` mâu thuẫn `03`, **`03` thắng** cho tới khi owner duyệt thay đổi kiến trúc.  
Nếu implementation dùng công nghệ khác `04`, **`04` thắng** cho tới khi owner duyệt thay stack và cập nhật SOT.

---

## 5. Các quyết định sản phẩm đã khóa

Baseline hiện tại:

- mô hình là phòng gym cá nhân;
- chỉ có ba role đăng nhập chính: `Owner/Admin`, `PT`, `Member`;
- không có role Staff;
- không có role Dev trong nghiệp vụ;
- PT được gán cho member từ khi đăng ký, không book PT theo từng buổi;
- member có thể đổi PT nếu không phù hợp;
- check-in dùng để đối soát member và PT;
- member đến nhưng PT không có mặt trong khung hợp lệ phải tạo trạng thái cần owner kiểm tra;
- lịch có thể hỗ trợ khung linh hoạt tối đa 2 giờ theo baseline đã chốt;
- khách mới có thể được ghi nhận ngay để tập thử, chưa cần tài khoản;
- guest data phải giữ được để thống kê/chăm sóc về sau;
- AI phân tích video cơ thể là feature đã duyệt;
- video được chuyển thành dữ liệu có cấu trúc trước khi LLM sinh lời khuyên/lộ trình;
- AI không được dùng như công cụ chẩn đoán bệnh/chấn thương.

---

## 6. Tech stack đã khóa

Canonical chi tiết nằm ở `04-tech-stack-sot.md`.

Baseline:

- **Frontend mobile:** React Native + Expo + TypeScript;
- **Web:** cùng Expo codebase qua React Native Web;
- **Routing:** Expo Router;
- **State:** Zustand;
- **Form/Validation:** React Hook Form + Zod;
- **API client:** Axios;
- **Backend:** NestJS + TypeScript;
- **API:** REST;
- **Authentication:** JWT + Refresh Token;
- **ORM:** Prisma;
- **Database:** PostgreSQL trên Supabase Free;
- **Storage:** Supabase Storage;
- **AI Service:** Python + FastAPI;
- **CV/Pose:** OpenCV + MediaPipe Pose;
- **Generative AI:** OpenAI API nhận structured JSON từ tầng CV;
- **Notification:** Expo Push Notifications;
- **Realtime:** chưa dùng WebSocket trong MVP;
- **Deploy:** ưu tiên local/free tier;
- **Source control:** Git + GitHub.

Supabase **không đồng nghĩa dùng toàn bộ Supabase stack**. MVP hiện chỉ khóa PostgreSQL managed + Storage; auth vẫn do NestJS + JWT/Refresh Token quản lý.

---

## 7. Quy tắc cho Codex / AI Agent

Trước khi code:

1. đọc đủ `README`, `01`, `02`, `03`, `04` và file chi tiết đúng chức năng;
2. xác định requirement ID đang implement;
3. dùng đúng stack trong `04-tech-stack-sot.md`;
4. không thêm feature “cho tiện”;
5. không tự đổi role model;
6. không biến PT assignment thành booking theo buổi;
7. không ghi đè lịch sử assignment/check-in;
8. với AI, giữ pipeline `video -> OpenCV/MediaPipe Pose -> structured JSON -> OpenAI API`;
9. không tự bật Supabase Auth/Realtime/Edge Functions;
10. không tự thay Axios, Zustand, Prisma hoặc REST bằng lựa chọn khác;
11. cuối task phải ghi rõ file code đã sửa, test đã chạy và requirement ID đã đáp ứng.

---

## 8. Prompt chuẩn giao task cho Codex

```text
Bạn đang implement FITNESS-MANAGE.
Trả lời bằng tiếng Việt.

Đọc trước:
- README.md
- 01-product-brief-sot.md
- 02-product-requirements-sot.md
- 03-technical-architecture-sot.md
- 04-tech-stack-sot.md
- <file SOT chi tiết liên quan>

Task:
<ghi task cụ thể>

Requirement IDs:
<ví dụ PR-MEMBER-002, PR-CHECKIN-003>

Yêu cầu:
- Không thêm feature ngoài Product Requirements.
- Không đổi business rule để code dễ hơn.
- Dùng đúng stack trong 04-tech-stack-sot.md.
- Không tự thêm Staff/Dev role.
- Không biến PT assignment thành booking từng buổi.
- Preserve history cho assignment/check-in/AI analysis.
- Nếu task AI: video phải qua OpenCV + MediaPipe Pose tạo structured JSON trước OpenAI API.
- Không tự bật Supabase Auth/Realtime/Edge Functions.
- Sau khi hoàn thành: tóm tắt file sửa, migration, test, requirement đã cover và rủi ro còn lại.
```

---

## 9. Definition of Done cho một task

Một task chỉ được coi là xong khi:

- bám đúng requirement ID;
- dùng đúng stack canonical;
- không phá boundary role;
- business invariant có test nếu có logic;
- error/empty/permission state được xử lý;
- migration được thêm nếu data model thay đổi;
- không sửa lịch sử ngoài ý muốn;
- không tạo data race/double-submit ở action quan trọng;
- test phù hợp chạy thành công;
- SOT/CHANGELOG được cập nhật nếu decision thay đổi.

---

## 10. Quy tắc update SOT

### Product Brief

Chỉ khi đổi:

- why;
- positioning;
- audience;
- outcome;
- principles;
- business model;
- boundary.

### Product Requirements

Khi đổi:

- behavior;
- flow;
- scope;
- requirement;
- acceptance criteria.

### Technical Architecture

Khi đổi:

- module boundary;
- domain model;
- API/data contract;
- transaction/invariant;
- security architecture;
- AI architecture;
- testing architecture.

### Technology Stack

Khi đổi:

- framework;
- library chính;
- ORM/database provider;
- auth mechanism;
- storage provider;
- AI/CV/LLM provider;
- realtime strategy;
- deploy baseline;
- source-control baseline.

### CHANGELOG

Mọi thay đổi decision-level phải ghi vào `CHANGELOG.md`.

---

## 11. Những điều tuyệt đối không tự thêm/thay

- Staff role;
- Dev role;
- booking PT tự do theo buổi;
- marketplace;
- multi-tenant SaaS;
- payroll/HR;
- CRM automation đầy đủ;
- medical diagnosis bằng AI;
- Supabase Auth thay JWT/Refresh Token của NestJS;
- Supabase Realtime/WebSocket ở MVP nếu chưa có quyết định mới;
- GraphQL thay REST;
- ORM khác thay Prisma;
- frontend web riêng thay React Native Web cùng Expo codebase;
- raw video đưa thẳng vào LLM để bỏ qua CV/Pose;
- provider/framework mới chỉ vì Agent thích dùng;
- feature không có requirement ID hoặc chưa được owner duyệt.
## 12. UI/UX SOT

`13-ui-ux-sot.md` là quy chuẩn cho visual language, ảnh tham chiếu, dashboard theo role, lịch/check-in theo từng role, AI UI, setting, responsive và accessibility. File này phải được đọc thêm khi task làm giao diện; requirement và quyền canonical vẫn lấy từ các SOT ưu tiên cao hơn.
