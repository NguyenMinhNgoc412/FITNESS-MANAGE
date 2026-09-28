# FITNESS-MANAGE SOT 19 — Codex/Agent Task Splitting

## 1. Rule chung

Mỗi task phải:

1. đọc `README.md`;
2. đọc `01`, `02`, `03`;
3. đọc file business/technical đúng phạm vi;
4. không thêm feature ngoài SOT;
5. không đổi stack;
6. có acceptance/test checklist;
7. nếu phát hiện conflict, dừng và nêu rõ conflict thay vì tự quyết.

---

## 2. Thứ tự implement đề xuất

### T-000 Project setup

Đọc: `03`, `04`, `05`.

Output:

- Expo TypeScript app + web;
- Expo Router zones;
- NestJS API;
- FastAPI skeleton;
- Prisma MongoDB config;
- lint/test/env skeleton.

Không làm feature business.

### T-001 Auth & RBAC

Đọc: `06`, `16`, `17`.

Output:

- login/refresh/logout/me;
- role guards;
- route surfaces.

### T-002 Data schema & indexes

Đọc: `15`, `17`.

Output:

- Prisma MongoDB schema;
- indexes/invariants;
- seed Owner/dev fixture nếu cần.

### T-003 Trial CRM

Đọc: `07`, `11`, `13`.

Output:

- create Trial;
- phone search;
- 3-session counter;
- Trial check-in;
- sales trigger;
- conversion.

### T-004 Membership

Đọc: `08`, `13`.

Output:

- time/session packages;
- renewal;
- expiry/quota;
- alerts.

### T-005 PT profiles & assignment

Đọc: `09`.

Output:

- PT CRUD Owner;
- Member/CCCD profile;
- assignment history;
- PT scoped Member list.

### T-006 Owner-managed booking

Đọc: `10`, `13`, `16`.

Output:

- Owner create/edit/cancel;
- conflict validation;
- read-only PT/Member schedule;
- notifications.

### T-007 Check-in & PT attendance

Đọc: `11`, `17`.

Output:

- QR/member check-in;
- phone fallback;
- contexts;
- PT self check-in;
- Owner log views;
- **không làm auto matching**.

### T-008 External PT Pass

Đọc: `12`, `13`.

Output:

- pass management;
- initiate/confirm/fallback;
- idempotent consume.

### T-009 Owner UI pass

Đọc: `05` + business files liên quan.

Output:

- Dashboard;
- Customers;
- Package;
- Booking;
- Check-in;
- PT;
- Alerts.

### T-010 PT UI pass

Đọc: `05`, `06`, `09`, `10`, `11`.

Output read-only đúng quyền.

### T-011 Member UI pass

Đọc: `05`, `08`, `10`, `11`, `12`.

Output package/schedule/QR/history/pass.

### T-012 Local AI storage

Đọc: `14`, `18`.

Output:

- file import/capture;
- SQLite local session;
- cleanup/privacy guard.

### T-013 Pose/form analysis

Đọc: `14`, `18`, `04`.

Output:

- supported exercise pipeline;
- structured metrics;
- failure states.

### T-014 FastAPI/OpenAI feedback

Đọc: `14`, `18`.

Output:

- JSON-only endpoint;
- schema validation;
- feedback constraints.

### T-015 Security/concurrency hardening

Đọc: `17`, `20`.

Output:

- idempotency;
- race tests;
- audit;
- PII log check.

### T-016 E2E

Đọc: `20`.

Output core flows cho 3 roles.

---

## 3. Prompt template

```text
Bạn đang implement FITNESS-MANAGE.
Trả lời bằng tiếng Việt.

Đọc bắt buộc:
- README.md
- 01-product-brief-sot.md
- 02-product-requirements-sot.md
- 03-technical-architecture-sot.md
- <business/technical files liên quan>

Task:
<task cụ thể>

Rules:
- Không thêm feature/role ngoài SOT.
- Không đổi tech stack.
- Owner-only booking mutation.
- Không auto match PT attendance với Member check-in.
- Raw AI video local-only.
- Nếu SOT mâu thuẫn, dừng và báo conflict.
- Sau khi xong: liệt kê file code đã sửa, test đã chạy, acceptance đạt/chưa đạt, risk còn lại.
```

---

## 4. Tiến độ triển khai theo baseline hiện hành

### 2026-09-24 — Rebuild theo SOT mới

Code legacy đã được thay bằng các module dưới đây. Đây là trạng thái implementation và bằng chứng kiểm tra, không đồng nghĩa mọi release gate đã hoàn tất.

| Task | Implementation | Verification / phần còn lại |
|---|---|---|
| T-000 | Expo zones, NestJS, FastAPI JSON-only, Prisma MongoDB, env/scripts | Build/typecheck/lint và web export pass |
| T-001 | Phone auth, refresh rotation, revoke/lock, ba role, server scope | Unit + MongoDB HTTP integration pass |
| T-002 | MongoDB schema, partial indexes, Owner seed từ env | Database test replica set/indexes pass; chưa chuyển dữ liệu thật |
| T-003 | Trial ba lượt, unique phone, conversion giữ customer/history | Duplicate/retry/concurrent consume/conversion pass |
| T-004 | Time/session membership, renew/cancel, expiry/quota, alerts | Quota/expiry test pass |
| T-005 | Owner profile, assignment history, PT scoped members | CCCD privacy/unique, assignment permission pass |
| T-006 | Owner create/edit/cancel booking, conflict hai phía, notification outbox | Race/overlap/cancel và PT/Member denied pass; push thiết bị chưa verify |
| T-007 | QR ký hạn hai phút, phone fallback, contexts, PT log độc lập | QR decoder độc lập và HTTP consume pass; camera thật chưa verify |
| T-008 | Pass, initiate/member-confirm/Owner-fallback, audit | Concurrent confirmation/consume/fallback pass |
| T-009 | Owner dashboard/customer/package/booking/check-in/PT/alerts/logs/account | Browser flow Trial đã chạy; chưa mọi nhánh UI |
| T-010 | PT home/schedule/members/account, self attendance | Browser attendance và booking read-only đã chạy |
| T-011 | Member home/schedule/QR/history/pass/account | Browser QR đã chạy; push thiết bị chưa verify |
| T-012 | SQLite theo Member, File System native/OPFS web, import/delete/cancel | Browser import/SQLite/OPFS/pose failure/delete pass; native thiết bị chưa verify |
| T-013 | MediaPipe on-device, squat depth heuristic, failure rõ ràng | Algorithm unit pass; Android Kotlin compile pass; iOS/người thật chưa verify |
| T-014 | Strict JSON-only FastAPI, feedback theo supported issue | 7 Python tests pass; chưa cần OpenAI cho feedback hiện tại |
| T-015 | Transaction lock, idempotency, audit, payload allowlist | 7 integration scenarios pass, gồm release blockers RBAC/quota/overlap |
| T-016 | Browser smoke ba role, network interception, synthetic fixtures | Browser E2E ba role pass; network không raw video/ngoài origin; giới hạn ở file 20 |

Requirement được triển khai: FR-AUTH, FR-TRIAL, FR-PKG, FR-PROFILE, FR-PT, FR-BOOK, FR-CHECKIN, FR-EXTPT, FR-SALES, FR-NOTI, FR-AI, FR-UI, FR-AUDIT theo phạm vi file 02. Coverage test cụ thể là các case trong apps/api/test/core.integration.ts, unit specs và scripts/browser-smoke.cjs; không coi nhãn nhóm requirement là khẳng định mọi acceptance đã qua E2E.

Bằng chứng: pnpm check pass (API 13, app 15, AI 7 tests); test:integration pass 7 scenarios trên database test riêng; Expo export web pass; OpenCV giải mã QR ba độ dài pass; Gradle :fitness-pose:compileDebugKotlin BUILD SUCCESSFUL. Cảnh báo dependency deprecation không làm các lệnh thất bại.

Chưa triển khai lên production, chưa chuyển dữ liệu PostgreSQL cũ, chưa sửa .env cá nhân hoặc seed dữ liệu thật. iOS cần macOS/Xcode; real-device camera/push và chất lượng pose cần kiểm chứng riêng. Không đánh dấu toàn dự án release-ready.

