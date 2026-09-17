# FITNESS-MANAGE SOT 03 — Technical Architecture

**Trạng thái:** Source of Truth chính cho kiến trúc hệ thống  
**Dự án:** FITNESS-MANAGE  
**Ngày cập nhật:** 2026-09-16  
**Phạm vi:** Cách hệ thống đáp ứng `02-product-requirements-sot.md`  
**Ngôn ngữ:** Tiếng Việt  
**Quy tắc:** File này chỉ sở hữu kiến trúc và technical contracts cần để đáp ứng requirement đã duyệt. Không tự thêm feature mới.

---

## 1. Architecture principles

1. **Requirement-driven:** chỉ tạo module khi có requirement tương ứng trong PRD.
2. **Role-safe:** quyền phải được kiểm tra ở server/service boundary, không chỉ ẩn nút trên UI.
3. **History-preserving:** assignment, attendance và AI analysis dùng lịch sử bất biến theo thời điểm; không ghi đè sự kiện cũ bằng trạng thái mới.
4. **Audit-friendly:** thay đổi quản trị quan trọng phải truy vết được.
5. **AI pipeline có cấu trúc:** computer vision/pose analysis tạo structured output trước; LLM không tự “xem raw video rồi quyết định tất cả”.
6. **Privacy-aware:** video cơ thể và kết quả phân tích là dữ liệu nhạy cảm, phải có access control và retention rõ.
7. **Stack-locked:** implementation phải dùng stack canonical trong `04-tech-stack-sot.md`: Expo/React Native Web ở client, NestJS REST backend, Prisma + PostgreSQL/Supabase, Supabase Storage, FastAPI + OpenCV + MediaPipe Pose + OpenAI API cho AI. Không tự thay provider/framework nếu chưa có decision change.

---

## 2. System context

Kiến trúc logic:

```text
Client Application(s)
  ├── Owner/Admin experience
  ├── PT experience
  └── Member experience
          |
          v
Application API / Backend Service
  ├── Auth & RBAC
  ├── PT Management
  ├── Member Management
  ├── PT Assignment
  ├── Schedule / Training Window
  ├── Check-in & Reconciliation
  ├── Guest / Trial
  ├── AI Analysis Orchestration
  └── Audit
          |
          +----------------------+
          |                      |
          v                      v
Relational Data Store       Private Media Storage
                                 |
                                 v
                         AI Analysis Pipeline
                         ├── Input validation
                         ├── Pose/CV extraction
                         ├── Structured feature result
                         └── LLM recommendation/plan
```

Không có module Staff, marketplace booking hoặc multi-tenant trong baseline.

---

## 3. Logical layers

### 3.1. Presentation / Client layer

Chịu trách nhiệm:

- screen và navigation theo role;
- input validation cấp UI;
- hiển thị loading/error/empty state;
- tạo request tới application API;
- giữ session tách biệt theo tài khoản;
- upload video theo flow được backend cấp quyền.

Không chịu trách nhiệm:

- tự quyết định quyền truy cập cuối cùng;
- tự thay đổi assignment chỉ bằng local state;
- tự kết luận attendance exception;
- tự sinh kết quả AI cuối cùng từ raw video.

### 3.2. Application service layer

Chịu trách nhiệm:

- orchestration use case;
- enforce RBAC;
- validate domain invariants;
- mở transaction;
- gọi repository;
- tạo audit event;
- phát sinh job AI hoặc reconcile attendance.

### 3.3. Domain layer

Chứa các rule cốt lõi:

- một member chỉ có một primary PT assignment active tại một thời điểm bình thường;
- assignment mới phải đóng assignment cũ đúng thời điểm;
- lịch sử không bị overwrite;
- check-in được đánh giá theo assignment/lịch tại thời điểm phát sinh;
- khung linh hoạt dùng cửa sổ hợp lệ đã cấu hình, tối đa 2 giờ theo baseline product rule;
- guest conversion không xóa nguồn trial history;
- AI result phải gắn với analysis run cụ thể.

### 3.4. Data layer

Chịu trách nhiệm:

- relational persistence;
- transaction;
- optimistic/pessimistic concurrency khi cần;
- query theo role scope;
- migration/versioning;
- audit persistence.

### 3.5. Media layer

Chịu trách nhiệm:

- private upload/download;
- metadata file;
- signed URL hoặc access mechanism ngắn hạn của Supabase Storage do backend cấp quyền khi cần;
- lifecycle/retention;
- không public raw body video mặc định.

### 3.6. AI processing layer

Chịu trách nhiệm:

- kiểm tra input;
- decode video theo pipeline xử lý;
- trích xuất frame/keypoint/pose feature;
- quality/confidence calculation;
- tạo structured analysis JSON;
- gọi LLM bằng structured data và context được phép;
- validate output theo schema;
- lưu version/model metadata phục vụ audit/reproducibility ở mức cần thiết.

---

## 4. Module boundaries

| Module | Trách nhiệm | Không được làm |
|---|---|---|
| `auth` | session, identity, role, access token | không chứa logic assignment/check-in |
| `users` | profile Owner/PT/Member | không chứa attendance calculation |
| `pt` | hồ sơ PT, trạng thái hoạt động | không tự đổi assignment |
| `members` | hồ sơ member, mục tiêu tập | không quản lý lịch sử PT trực tiếp |
| `assignments` | quan hệ member–PT có hiệu lực theo thời gian | không sửa lịch sử check-in |
| `schedules` | lịch/khung tập, fixed/flexible window | không quyết định PT hiện tại nếu assignment không hợp lệ |
| `checkins` | record hiện diện | không tự đổi lịch/assignment |
| `attendance` | đối soát check-in + lịch + assignment | không xóa raw check-in |
| `guests` | trial record, conversion linkage | không tạo role đăng nhập guest |
| `ai-analysis` | analysis run, structured result, plan generation | không chẩn đoán y khoa |
| `owner-assistant` | truy vấn/tóm tắt dữ liệu vận hành theo scope Owner/Admin | không bypass RBAC, không mutate dữ liệu nghiệp vụ |
| `audit` | immutable audit events | không thay data source chính |

---

## 5. Core domain model

Tên model/table vật lý do Prisma/PostgreSQL triển khai có thể điều chỉnh theo naming convention, nhưng domain contract phải giữ ý nghĩa sau.

### 5.1. `users`

Đại diện identity đăng nhập.

Tối thiểu:

- `id`;
- `role`: OWNER_ADMIN | PT | MEMBER;
- `status`: ACTIVE | INACTIVE | LOCKED;
- identity/contact fields cần thiết;
- timestamps.

### 5.2. `pt_profiles`

Thông tin nghiệp vụ riêng của PT.

- `user_id`;
- display/profile fields;
- specialization/note nếu sản phẩm sử dụng;
- active state metadata.

### 5.3. `member_profiles`

Thông tin nghiệp vụ member.

- `user_id`;
- goal/notes phù hợp;
- membership state tối thiểu nếu cần để xác định active/inactive;
- source guest nếu convert;
- timestamps.

### 5.4. `member_pt_assignments`

Là source of truth cho quan hệ PT–member theo thời gian.

Tối thiểu:

- `id`;
- `member_id`;
- `pt_id`;
- `started_at`;
- `ended_at` nullable;
- `status`;
- `change_reason` optional;
- `created_by`;
- timestamps.

Invariant:

- không có hai primary active assignment chồng thời gian cho cùng một member;
- đóng assignment cũ và tạo assignment mới trong cùng transaction khi đổi PT.

### 5.5. `training_schedules`

Mô tả lịch/khung tập đã thống nhất.

Tối thiểu:

- `id`;
- `member_id`;
- `pt_id` snapshot/reference phù hợp;
- date/recurrence fields;
- `window_type`: FIXED | FLEXIBLE;
- expected start/end;
- flexible window metadata;
- status.

Rule:

- flexible window không vượt rule product baseline 2 giờ;
- schedule đã hoàn tất không bị viết lại chỉ vì assignment hiện tại đổi.

### 5.6. `checkins`

Raw event xác nhận hiện diện.

Tối thiểu:

- `id`;
- `actor_user_id`;
- `actor_role`;
- `checked_in_at`;
- location/context metadata nếu product sau này duyệt;
- associated schedule id nếu resolve được;
- immutable event metadata.

### 5.7. `attendance_reconciliations`

Derived/business result từ schedule + assignment + check-in.

Tối thiểu:

- `id`;
- `member_id`;
- `pt_id`;
- `schedule_id`;
- member check-in reference;
- PT check-in reference nullable;
- status: MATCHED | MEMBER_ONLY | PT_ONLY | MISSING | NEEDS_REVIEW;
- evaluated_at;
- resolution metadata nếu owner xử lý.

Không dùng bảng này để thay raw check-in.

### 5.8. `guest_trials`

Record khách tập thử.

Tối thiểu:

- `id`;
- name/identifier;
- contact fields theo consent;
- trial timestamp;
- note;
- conversion status;
- converted_member_id nullable;
- created_by.

### 5.9. `ai_analysis_runs`

Một lần phân tích video.

Tối thiểu:

- `id`;
- `member_id`;
- input media reference;
- status: UPLOADED | VALIDATING | ANALYZING | NEEDS_RETAKE | COMPLETED | FAILED;
- pipeline version;
- created_at/completed_at;
- error code an toàn nếu fail.

### 5.10. `ai_analysis_results`

Structured result của CV/pose stage.

Tối thiểu:

- `analysis_run_id`;
- input quality;
- extracted features JSON theo schema version;
- confidence metadata;
- warnings;
- analyzer version.

### 5.11. `training_plan_outputs`

Output sinh từ structured analysis.

Tối thiểu:

- `analysis_run_id`;
- goal context snapshot;
- recommendation summary;
- plan structure;
- safety/disclaimer flags;
- generation version;
- created_at.

### 5.12. `audit_events`

Append-only ở mức logic.

Tối thiểu:

- actor;
- action;
- entity type/id;
- timestamp;
- before/after summary hoặc metadata phù hợp;
- correlation/request id.

---

## 6. Key transactions

Các hành động sau phải là transaction hoặc có cơ chế đảm bảo atomic tương đương.

### 6.1. Đăng ký member + assignment

```text
Create/activate member
  -> create initial PT assignment
  -> optionally create initial schedule
  -> create audit event
  -> commit
```

Không được để member ở trạng thái “đăng ký hoàn tất” nhưng assignment ban đầu thất bại nếu product flow yêu cầu PT bắt buộc.

### 6.2. Đổi PT

```text
Lock/read current assignment
  -> validate new PT active
  -> close current assignment
  -> create new assignment
  -> update future schedule references/rules as designed
  -> write audit
  -> commit
```

Không update check-in hoặc historical schedule cũ.

### 6.3. Convert guest thành member

```text
Read guest
  -> create/link member
  -> mark guest converted
  -> preserve trial history
  -> create PT assignment
  -> audit
  -> commit
```

### 6.4. Resolve attendance exception

Raw check-in không bị sửa để “làm đẹp” kết quả.

Resolution cập nhật reconciliation/audit riêng.

---

## 7. Check-in reconciliation algorithm contract

Input:

- member check-in event;
- active/historical assignment tại thời điểm liên quan;
- schedule/training window;
- PT check-in events;
- allowed time window.

Logic tối thiểu:

```text
Resolve expected schedule/window
  -> resolve PT responsible at that time
  -> find member check-in in valid window
  -> find PT check-in in valid window
  -> classify
      both present      => MATCHED
      member only       => MEMBER_ONLY / exception
      pt only           => PT_ONLY
      neither           => MISSING or no-event depending schedule status
      ambiguous data    => NEEDS_REVIEW
```

Yêu cầu:

- algorithm dùng timestamp lịch sử, không dùng assignment hiện tại một cách mù quáng;
- flexible schedule phải tôn trọng cửa sổ tối đa 2 giờ được cấu hình;
- classification có thể chạy đồng bộ sau check-in hoặc bằng job, nhưng kết quả cuối phải idempotent.

---

## 8. API boundary

Tên endpoint cụ thể phụ thuộc stack, nhưng contract nên theo resource/action rõ ràng.

### 8.1. Auth

- login/logout/refresh session;
- current user profile/role.

### 8.2. PT

- list/get/create/update PT;
- activate/deactivate;
- list assigned members scoped by caller.

### 8.3. Member

- list/get/create/update member;
- get current PT;
- request/change PT through authorized action.

### 8.4. Assignment

- get current assignment;
- get assignment history;
- change assignment transactionally.

### 8.5. Schedule

- list/create/update/cancel future schedule;
- query by member/PT/date range;
- validate flexible window rule.

### 8.6. Check-in

- create self check-in;
- list own check-ins;
- owner query all scoped check-ins;
- query attendance reconciliation/exceptions.

### 8.7. Guest

- create trial guest;
- list/search guest;
- record trial visit;
- convert to member.

### 8.8. AI analysis

- request upload/analysis;
- upload media through private channel;
- get analysis status;
- get structured summary/recommendation/plan;
- list member analysis history.

### 8.9. Owner operational assistant

- submit an Owner/Admin question with an explicit operational scope;
- retrieve only permission-filtered summaries from application services;
- return answer metadata such as time range and source records when available;
- provide navigation references to detail screens;
- never mutate assignment, schedule, check-in, account or audit records through chat.

The assistant is a read-oriented application capability. It does not bypass RBAC, replace deterministic reconciliation/calculation, or receive raw body video.

---

## 9. AI pipeline architecture

### 9.1. Stage 1 — Capture guidance

Client cung cấp hướng dẫn quay:

- framing;
- khoảng cách;
- ánh sáng;
- góc/quỹ đạo quay nếu requirement UI định nghĩa;
- cảnh báo không quay nội dung ngoài mục đích cần thiết.

### 9.2. Stage 2 — Input validation

Kiểm tra:

- file có đọc được không;
- thời lượng/độ phân giải tối thiểu theo cấu hình kỹ thuật;
- có đủ cơ thể/pose trong frame hay không;
- blur/occlusion quá mức hay không.

Nếu fail => `NEEDS_RETAKE` hoặc `FAILED` với reason code thân thiện.

### 9.3. Stage 3 — CV / Pose extraction

Pipeline trích xuất:

- body keypoints/pose sequence;
- normalized geometric features;
- symmetry/posture observations trong phạm vi mô hình;
- confidence per feature;
- quality warnings.

Kết quả được serialize thành schema versioned JSON.

Ví dụ cấu trúc logic:

```json
{
  "schemaVersion": "1",
  "inputQuality": {
    "usable": true,
    "confidence": 0.91
  },
  "observations": [
    {
      "type": "posture_feature",
      "value": "...",
      "confidence": 0.84
    }
  ],
  "warnings": []
}
```

Đây chỉ là shape minh họa technical contract, không phải feature mới hoặc medical diagnosis schema.

### 9.4. Stage 4 — Recommendation generation

LLM nhận:

- structured analysis JSON;
- member goal snapshot;
- allowed training context;
- policy prompt yêu cầu không chẩn đoán y khoa.

LLM không cần raw video trong stage này.

Output phải qua schema validation trước khi lưu.

### 9.5. Stage 5 — Result persistence

Lưu:

- analysis run;
- structured analyzer result;
- model/pipeline version;
- generated recommendation/plan;
- warnings/confidence.

Không overwrite lần phân tích trước.

---

## 10. Authorization model

### 10.1. Owner/Admin

Có quyền rộng nhất trong tenant/single-gym scope.

### 10.2. PT

Chỉ truy cập:

- bản thân;
- member đang hoặc từng được giao trong phạm vi lịch sử cần thiết;
- lịch/check-in/AI result được policy cho phép.

Không query tùy ý toàn bộ member.

### 10.3. Member

Chỉ truy cập:

- profile của mình;
- PT assignment của mình;
- lịch/check-in của mình;
- AI analysis của mình.

### 10.4. Authorization enforcement

Phải áp dụng ở:

- API/service layer;
- repository/query scoping khi phù hợp;
- object/media access;
- AI result access.

UI hiding không phải security boundary.

---

## 11. Data integrity & concurrency

### 11.1. Assignment uniqueness

Cần constraint hoặc transactional guard để tránh hai PT active primary cho một member cùng lúc.

### 11.2. Idempotency

Các action có nguy cơ double-submit nên hỗ trợ idempotency hoặc duplicate guard:

- check-in;
- guest conversion;
- PT change;
- AI analysis request.

### 11.3. Time handling

- lưu timestamp theo chuẩn thống nhất;
- display theo timezone của gym/client;
- reconciliation dùng timestamp tuyệt đối + timezone schedule rõ ràng;
- không so sánh chuỗi thời gian local không chuẩn hóa.

### 11.4. Soft delete / deactivation

PT/member có lịch sử không nên hard-delete nếu việc xóa làm mất tính toàn vẹn audit.

Ưu tiên inactive/archive theo requirement vận hành.

---

## 12. Privacy & media security

Body video là dữ liệu nhạy cảm.

Bắt buộc:

1. media không public mặc định;
2. access phải theo authenticated authorization;
3. log không ghi raw URL/token bí mật;
4. không nhúng video binary/base64 vào audit hoặc application log;
5. có retention/cleanup policy được cấu hình;
6. xóa logical record phải xử lý media lifecycle phù hợp;
7. AI worker chỉ nhận quyền truy cập cần thiết cho job;
8. kết quả AI và raw video có policy quyền riêng biệt nếu cần.

---

## 13. Observability

Cần có structured log/metric tối thiểu cho:

- auth failure rate;
- assignment change failure;
- check-in creation/reconciliation failure;
- duplicate check-in guard;
- AI upload failure;
- AI validation `NEEDS_RETAKE`;
- analysis latency;
- AI pipeline failure by stage;
- permission denied events bất thường.

Không log dữ liệu body analysis chi tiết hoặc PII không cần thiết.

---

## 14. Testing strategy

### 14.1. Unit test

Bắt buộc cho:

- role permission rules;
- assignment invariant;
- change-PT transaction logic;
- flexible 2-hour window validation;
- attendance reconciliation classification;
- guest conversion rules;
- AI structured-result validator.

### 14.2. Integration test

Bắt buộc cho:

- create member + assign PT;
- change PT with history;
- member/PT check-in -> reconciliation;
- member-only check-in -> exception;
- guest -> member conversion;
- AI run state transitions.

### 14.3. E2E role test

Dùng ba account/session độc lập:

```text
Session A: Owner/Admin
Session B: PT
Session C: Member
```

Test flow tối thiểu:

1. Owner tạo member và gán PT.
2. PT thấy member.
3. Member thấy PT.
4. Member check-in.
5. PT check-in hoặc cố tình không check-in.
6. Owner thấy matched/exception đúng.
7. Owner đổi PT.
8. PT cũ mất active assignment; PT mới nhận assignment.
9. Lịch sử check-in cũ vẫn trỏ đúng context cũ.

### 14.4. AI test

- valid video -> completed;
- unusable video -> needs retake;
- analyzer confidence thấp -> output không overclaim;
- structured JSON schema mismatch -> fail safe;
- LLM output invalid schema -> reject/retry theo policy;
- member không đọc được analysis của member khác.

---

## 15. Technology stack integration

Technology stack canonical nằm ở `04-tech-stack-sot.md`. Architecture này bind vào các boundary sau:

| Layer | Stack đã chốt | Architecture responsibility |
|---|---|---|
| Mobile/Web client | React Native + Expo + TypeScript + React Native Web | UI theo role, Expo Router, Zustand, React Hook Form + Zod, Axios |
| Core backend | NestJS + TypeScript | REST API authority, auth/RBAC, domain orchestration, audit |
| Authentication | JWT + Refresh Token | NestJS issue/validate/refresh/revoke theo policy; không dùng Supabase Auth trong baseline |
| Data access | Prisma | schema, migration, typed access, transaction |
| Relational store | PostgreSQL trên Supabase Free | source of truth cho dữ liệu nghiệp vụ |
| Media | Supabase Storage | private body-video/media storage; backend kiểm soát quyền |
| AI service | Python + FastAPI | boundary riêng cho pipeline AI |
| CV/Pose | OpenCV + MediaPipe Pose | preprocessing, pose/keypoint/feature extraction, quality/confidence |
| Generative AI | OpenAI API qua OpenAI Python SDK | nhận structured JSON/context đã được chuẩn hóa; không thay CV layer |
| Notification | Expo Push Notifications | delivery channel khi requirement notification được implement |
| Realtime | Không dùng trong MVP | REST/refetch là baseline; không tự bật WebSocket/Supabase Realtime |

### 15.1. Core request path

```text
Expo mobile/web client
  -> Axios
  -> NestJS REST API
  -> domain/application services
  -> Prisma
  -> PostgreSQL (Supabase)
```

### 15.2. AI request path

```text
Expo client
  -> NestJS REST API
  -> private Supabase Storage + analysis metadata
  -> FastAPI AI Service
      -> OpenCV
      -> MediaPipe Pose
      -> structured JSON
      -> OpenAI API
  -> NestJS validates/persists result
  -> client reads authorized result
```

### 15.3. Supabase boundary

Supabase trong baseline chỉ là **managed PostgreSQL + Storage**. Không suy ra rằng dự án dùng Supabase Auth, Realtime hoặc Edge Functions. Backend NestJS vẫn là authority cho auth, RBAC và nghiệp vụ.

### 15.4. Change rule

Muốn đổi framework/provider phải cập nhật `04-tech-stack-sot.md`, đánh giá impact lên architecture này và ghi `CHANGELOG.md` trước khi coi lựa chọn mới là canonical.

---

## 16. Architecture acceptance checklist

Kiến trúc được coi là bám đúng PRD khi:

1. Có ba role và RBAC server-side.
2. Assignment PT–member là entity có lịch sử.
3. Check-in là raw event độc lập với reconciliation.
4. Reconciliation dùng đúng assignment/lịch tại thời điểm phát sinh.
5. Flexible window hỗ trợ rule tối đa 2 giờ.
6. Guest không cần role login và có thể convert thành member.
7. AI dùng pipeline raw video -> CV/pose -> structured result -> LLM recommendation.
8. Raw video được bảo vệ như private media.
9. AI output không được thiết kế như medical diagnosis.
10. Audit không dùng để thay source of truth.
11. Ba role có thể được test đồng thời bằng session tách biệt.
12. Architecture không thêm Staff, marketplace booking hoặc multi-tenant feature.

---

## 17. Quy tắc thay đổi Technical Architecture

Khi muốn đổi architecture:

1. chỉ được xuất phát từ requirement đã có hoặc non-functional need rõ ràng;
2. ghi impact lên module/data/API/security/testing;
3. không tự thêm hành vi người dùng mới;
4. nếu thay đổi làm xuất hiện behavior mới, phải sửa Product Requirements trước;
5. cập nhật `CHANGELOG.md`.

---

## 18. Mapping sang technical SOT chi tiết

| Chủ đề | File chi tiết |
|---|---|
| Technology stack/framework/provider | `04-tech-stack-sot.md` |
| Transaction, invariant, RBAC enforcement, concurrency, audit, sensitive data | `10-tech-data-security-audit-sot.md` |
| AI upload/CV/pose/structured schema/LLM/versioning | `11-tech-ai-analysis-pipeline-sot.md` |
| Thứ tự implement và test theo requirement | `12-Agent-task-splitting-sot.md` |

Các file này không được tự thêm feature ngoài Product Requirements hoặc thay đổi architecture cấp hệ thống mà không cập nhật file `03` và `CHANGELOG.md`.
