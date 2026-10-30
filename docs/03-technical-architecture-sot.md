# FITNESS-MANAGE SOT 03 — Technical Architecture

**Trạng thái:** Canonical architecture overview  
**Lưu ý:** Tech stack cụ thể nằm ở `04-tech-stack-sot.md`.

---

## 1. Architecture overview

```text
Expo Client (Mobile + Web)
  ├─ Owner Web surface
  ├─ PT mobile surface
  ├─ Member mobile surface
  ├─ Local SQLite
  ├─ Local File System (AI raw video)
  └─ On-device pose processing
           │
           ├──────── REST ────────> NestJS API ─────> MongoDB Atlas
           │                         │
           │                         ├─ Auth/RBAC
           │                         ├─ CRM/Trial
           │                         ├─ Membership
           │                         ├─ PT/Booking
           │                         ├─ Check-in
           │                         ├─ External PT
           │                         ├─ Sales/Notification
           │                         └─ Audit
           │
           └──── JSON metrics ────> FastAPI AI Service ──> OpenAI API
```

Supabase Storage chỉ dùng cho file cloud được phép lưu. Raw workout video của AI bị loại trừ.

---

## 2. Architectural goals

1. Một codebase Expo cho mobile + web.
2. Server giữ source-of-truth cho business data chia sẻ đa thiết bị.
3. Local SQLite/File System giữ dữ liệu local/offline phù hợp, đặc biệt AI.
4. Owner-controlled mutation cho booking/PT/package.
5. REST đơn giản, không WebSocket MVP.
6. AI raw video không rời thiết bị.
7. Module hóa theo domain để Codex không trộn business logic.
8. Có audit và idempotency cho operation consume/quota quan trọng.

---

## 3. Client zones

### Owner zone

Web-first qua React Native Web. Bao gồm Dashboard, Customers, Packages, PT, Bookings, Check-in, Sales Alerts, Reports/Logs, Settings.

### PT zone

Mobile-first. Bao gồm Today, Schedule, Assigned Members, PT Check-in, Profile.

### Member zone

Mobile-first. Bao gồm Home, Schedule, QR Check-in, Package/History, External PT Pass, AI Form Check, Profile.

Route guard phải dựa trên role server-authenticated.

---

## 4. Backend modules

```text
auth
users
customers/trials
memberships
pt-assignments
bookings
member-checkins
pt-attendance
external-pt-passes
sales-alerts
notifications
audit
```

Business rules không đặt trong controller/component. Controller nhận request, service/domain xử lý rule, repository/data access đọc ghi DB.

---

## 5. AI boundary

### On device

- video capture/select;
- file local;
- pose extraction;
- feature/angle/repetition calculation nếu hỗ trợ;
- local session/result persistence.

### FastAPI

- nhận structured JSON/metrics, không nhận raw video trong flow chuẩn;
- normalize/aggregate form analysis;
- gọi OpenAI nếu cần diễn giải feedback;
- trả structured result.

### OpenAI

- chỉ nhận structured, minimized input;
- sinh diễn giải/gợi ý sửa form;
- không nhận raw video;
- không tạo lộ trình tập.

---

## 6. Data ownership

| Data | Source of truth |
|---|---|
| User/role/profile | MongoDB |
| Trial history/quota | MongoDB |
| Membership/package | MongoDB |
| PT assignment | MongoDB |
| Booking | MongoDB |
| Member check-in | MongoDB |
| PT attendance | MongoDB |
| External PT Pass | MongoDB |
| Sales alerts | MongoDB |
| Audit logs | MongoDB |
| AI raw video | Local File System only |
| Local AI session/result | SQLite |
| Cached business reads | SQLite optional |
| Cloud-safe media e.g. avatar | Supabase Storage |

---

## 7. Mutation flow

```text
UI action
 -> client validation
 -> REST request
 -> auth + RBAC
 -> service/domain validation
 -> idempotency/concurrency guard if needed
 -> MongoDB write
 -> audit/notification side effect
 -> response
 -> client refresh/cache update
```

---

## 8. Error principles

- Không crash khi QR invalid, package hết hạn, pass hết lượt, push thất bại hoặc AI không detect được pose.
- Business error dùng mã rõ ràng, không trả message database thô.
- Mutation thất bại phải không để quota/session bị consume một phần.
- Client chỉ hiển thị thông báo phù hợp role.

---

## 9. Deployment posture

MVP ưu tiên local/free tier. Không thêm Kafka, Redis cluster, Kubernetes, event bus hoặc microservice infrastructure trừ khi SOT thay đổi.

## Domain modules và side effects — 2026-10-20

- Dashboard chỉ đọc dữ liệu đã lưu, không gọi refresh cảnh báo hoặc lấy business write lock; DashboardModule không phụ thuộc SalesAlertsModule. KPI check-in và booking hôm nay dùng cùng khoảng ngày UTC+7 `[đầu ngày, đầu ngày kế tiếp)` với helper check-in, độc lập timezone máy chủ.
- Sales Alerts scheduler refresh lúc khởi động và mỗi 60 giây; KPI Dashboard phản ánh lần refresh thành công gần nhất (có thể trễ khoảng một chu kỳ khi worker hoạt động bình thường). Hai scheduler ghi mã lỗi cố định bằng Nest Logger khi một vòng thất bại và tiếp tục ở vòng kế tiếp; không log exception, stack, payload hoặc PII.
- `apps/api/src/domain/*.module.ts` tổ chức Customers, Memberships, People/PT assignment, Bookings, Checkins/PT attendance, External PT, Sales Alerts, Notifications, Reports, Dashboard và Audit thành module NestJS riêng. Controller theo domain giữ nguyên endpoint, strict validation và quyền explicit từng handler; route `me` đứng trước route `:id` tương ứng.
- `AppModule` chỉ compose module và AI gateway. Service domain được export khi domain khác sử dụng; không đăng ký lặp provider. Reports, Dashboard, Audit, Device Tokens và Sales Alerts không còn chung một OperationsService.
- Sales Alerts scheduler chỉ refresh alerts. Notifications scheduler chạy mỗi 5 giây và một lần khi khởi động; có guard chống chạy chồng trong cùng process và atomic claim giữa các process.
- Booking/external initiation ghi notification trong cùng transaction nghiệp vụ. Request trả sau commit, không đợi network push. Worker gửi ngoài transaction, dùng lease/claim token và retry có giới hạn; MongoDB vẫn là nguồn dữ liệu, không thêm queue/provider.
- Client: `src/ui.tsx` giữ visual primitives; `src/components/form.tsx` giữ form/pending/idempotency UI; `src/hooks/use-load.ts` giữ REST loading và chống response cũ; `src/lib/http.ts`, `src/lib/date-time.ts` chứa helper riêng. Consumer import trực tiếp, tránh UI phụ thuộc HTTP.

## AI automatic flow — 2026-10-08

App web/native dùng chung domain pose metrics → nhận diện heuristic bài → cycles/góc/so sánh → SQLite. Với kết quả hoàn chỉnh, app tự gửi JSON allowlist v2 qua gateway MEMBER đến FastAPI; OpenAI chỉ diễn giải bằng chứng do app đo, server ghép lại số đo/mục tiêu/verdict. Provider LOCAL fallback khi không thể lấy diễn giải. Pipeline raw video local → on-device metrics → JSON → FastAPI → OpenAI nếu cấu hình → structured feedback giữ nguyên provider/stack baseline. Chi tiết scope/heuristic/privacy tại SOT 14/18.


## Module hoạt động tập luyện — 2026-10-28

WorkoutsModule đăng ký WorkoutsController và ba service qua NestJS DI: WorkoutsService sở hữu nhật ký/revisions/tiến bộ theo bài, BodyMeasurementsService sở hữu số đo/revisions/tiến bộ số đo, ExerciseLibraryService sở hữu API đọc thư viện. Controller chuyển request trực tiếp tới service đúng trách nhiệm. AuthModule cung cấp TransactionService. workout-rules giữ schema/validation và hàm tính thống kê dùng chung; rangeQuery suy luận kiểu bộ lọc từ Zod, không trả index signature unknown hoặc yêu cầu ép kiểu tại consumer. MongoDB là canonical cho nhật ký/revisions, số đo/revisions, catalog/version. Client Member mở /member/workouts từ Home, dùng REST refresh, không thêm tab chính/provider. Mutation không gọi booking/check-in/quota/attendance/AI hoặc audit chung. Hợp đồng chi tiết tại SOT 21 mục 8/11.

Client hoạt động tập luyện dùng chung `components/workout-revision-history.tsx` và `hooks/use-dirty-effect.ts`; màn số đo không import component/hook từ màn nhật ký. API, UI flow, quyền MEMBER self, schema/index và transaction/idempotency/version giữ nguyên qua lần refactor ngày 2026-10-28.


### Presentation list/detail dùng chung — 2026-10-29

`components/record-row.tsx` sở hữu RecordRow/PopupRow cho record list, `detail-modal.tsx` sở hữu RN Modal, focus/viewport/scroll và khóa đóng. `detail-state.ts` chia sẻ trạng thái pending của Form/useCommand cho popup; `form-scroll-context.ts` cho field lỗi cuộn đúng vùng đang chứa form. Các context chỉ điều phối presentation, không thay authorization, validation hoặc transaction ở service/API. Form và command giữ cơ chế idempotency hiện hành; không thêm layer data/provider/schema.

## Entry hoạt động Member — 2026-10-30

/member/index render trực tiếp screens/workouts; /member/workouts redirect về /member để giữ liên kết cũ. screens/member-services tách các read model gói/PT/Pass/yêu cầu xác nhận, chỉ mount trong Account khi role MEMBER. Home không fetch các resource này. Shell áp dụng client navigation/WorkoutLeaveContext cho navigation Member tại route Home mới; same-route click là no-op để giữ form/tab. REST/services/auth/privacy boundary giữ nguyên. Mục này thay cho mô tả shortcut /member/workouts trước đây.

## Media minh họa bài Member — 2026-10-30

features/exercise-demos.ts là manifest presentation tĩnh theo catalog code + nameEn + contentVersion đã review, dùng literal require tới ảnh bundled. components/exercise-demo.tsx điều phối index/play/pause/load/error/retry, reduced-motion và AppState, chỉ mount trong popup detail. Không gọi dịch vụ ảnh hoặc API mới; API library đã trả code, client khai báo code optional để tương thích dữ liệu cũ. Media không nằm trong workout snapshots, không đổi MongoDB/Prisma. Tệp nguồn/giấy phép/hash đồng hành assets; giới hạn frame và tải chỉ media của bài đang mở.


DetailModal hỗ trợ footer ReactNode tùy chọn ngoài vùng FormScroll/ScrollView; footer không quản lý data/business. ExerciseDetail sở hữu fetch detail và render modal/body/footer từ cùng response, không double fetch hoặc giữ bản data phụ. FilterSelect là controlled presentation component; ExerciseLibrary sở hữu một openFilter key cho mutual exclusion và Android Back cleanup. Cập nhật presentation ngày 2026-10-30, API/transaction/privacy giữ nguyên.
