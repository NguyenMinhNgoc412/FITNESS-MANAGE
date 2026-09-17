# FITNESS-MANAGE SOT 12 — AI Agent / Codex Task Splitting Guide

**Trạng thái:** Hướng dẫn triển khai  
**Dự án:** FITNESS-MANAGE  
**Ngày cập nhật:** 2026-09-16  
**Mục tiêu:** Chia task nhỏ, bám requirement, không để Agent tự thêm nghiệp vụ.

---

## 1. Quy tắc đọc trước mỗi task

Bắt buộc:

1. `README.md`
2. `01-product-brief-sot.md`
3. `02-product-requirements-sot.md`
4. `03-technical-architecture-sot.md`
5. `04-tech-stack-sot.md`
6. file chi tiết liên quan task

Nếu task chạm data/security/history: đọc thêm `10-tech-data-security-audit-sot.md`.

Nếu task AI: đọc `09-business-ai-body-analysis-sot.md` và `11-tech-ai-analysis-pipeline-sot.md`.

---

## 2. Rule chia task

Một task tốt:

- cover một nhóm requirement nhỏ;
- có output test được;
- không gom Auth + Assignment + Check-in + AI trong cùng một PR;
- ghi rõ requirement IDs;
- có migration nếu data contract đổi;
- có test cho invariant quan trọng.

Agent không được tự thêm Staff/Dev role, booking PT theo buổi hoặc thay stack đã khóa trong `04-tech-stack-sot.md`.

---

## 3. Thứ tự implement đề xuất

### T-000 — Project foundation

Đọc: `03`, `04`, `10`.

Output:

- project structure theo stack đã duyệt;
- env/config separation;
- lint/test baseline;
- migration framework;
- auth shell chưa có business feature sâu.

Acceptance:

- build/run được;
- test command chạy được;
- dùng đúng stack trong `04-tech-stack-sot.md`; không tự thay framework/provider.

---

### T-001 — Auth & role access

Đọc: `05`, `10`.

Requirement: `PR-AUTH-001`, `PR-AUTH-002`, `PR-TEST-001`.

Output:

- login/session;
- route/screen guard;
- backend/service authorization;
- seed/test accounts cho 3 role ở môi trường test.

Acceptance:

- ba session role độc lập;
- Member/PT không vượt quyền;
- inactive/locked bị chặn.

---

### T-002 — PT management

Đọc: `05`, `10`.

Requirement: `PR-PT-001`, `PR-PT-002`.

Output:

- PT CRUD cần thiết;
- active/inactive;
- PT member list scope.

Acceptance:

- inactive PT không assignment mới;
- history không mất.

---

### T-003 — Member registration + initial assignment

Đọc: `06`, `10`.

Requirement: `PR-MEMBER-001..003`.

Output:

- create Member;
- select PT;
- transaction initial assignment;
- Member/PT views cập nhật.

Acceptance:

- Member active có đúng một primary PT;
- fail assignment không để registration ở trạng thái sai.

---

### T-004 — Change PT

Đọc: `06`, `10`.

Requirement: `PR-ASSIGN-001..002`.

Output:

- change assignment transaction;
- history;
- future schedule review hook/flow;
- audit.

Acceptance:

- không hai active assignment;
- old history giữ nguyên;
- không booking PT theo buổi.

---

### T-005 — Schedule & flexible window

Đọc: `07`, `10`.

Requirement: `PR-SCHEDULE-001..002`.

Output:

- schedule CRUD cần thiết;
- fixed/flexible type;
- max 2h validation cho flexible baseline;
- role-scoped schedule queries.

Acceptance:

- lịch gắn đúng Member/PT context;
- lịch cũ không rewrite theo current PT.

---

### T-006 — Check-in raw events

Đọc: `07`, `10`.

Requirement: `PR-CHECKIN-001`, `PR-CHECKIN-002`.

Output:

- Member check-in;
- PT check-in;
- idempotency/double-tap protection;
- raw event history.

Acceptance:

- actor chỉ check-in chính mình;
- timestamp/context đúng;
- retry không duplicate bất hợp lý.

---

### T-007 — Attendance reconciliation

Đọc: `07`, `10`.

Requirement: `PR-CHECKIN-003`, `PR-CHECKIN-004`.

Output:

- resolve schedule + assignment + check-ins;
- MATCHED/exception states;
- Owner review list/detail;
- history preservation.

Acceptance:

- Member present/PT missing tạo exception sau window hợp lệ;
- không tự kết luận kỷ luật;
- đổi PT không rewrite history.

---

### T-008 — Guest trial + conversion

Đọc: `08`, `10`.

Requirement: `PR-GUEST-001..003`.

Output:

- create Guest;
- trial history;
- convert Guest -> Member + assignment;
- conversion linkage.

Acceptance:

- Guest không cần account;
- conversion atomic;
- không mất trial source.

---

### T-009 — AI upload & analysis orchestration

Đọc: `09`, `11`, `10`.

Requirement: `PR-AI-001`, `PR-AI-002`, `PR-AI-004`.

Output:

- private upload flow;
- analysis run state machine;
- quality validation;
- CV/pose structured result persistence.

Acceptance:

- invalid video không tạo fake result;
- structured result tồn tại trước generation;
- run history không overwrite.

---

### T-010 — AI recommendation & training plan

Đọc: `09`, `11`.

Requirement: `PR-AI-003`, `PR-AI-004`.

Output:

- context builder;
- LLM generation;
- output schema validation;
- result view by role scope.

Acceptance:

- LLM không dùng raw video làm nguồn duy nhất;
- uncertainty được giữ;
- không chẩn đoán y khoa.

---

### T-011 — Audit, concurrency & E2E hardening

Đọc: toàn bộ, trọng tâm `10`.

Requirement: `PR-AUDIT-001..002`, `PR-TEST-001`.

Output:

- audit coverage;
- concurrency tests;
- E2E 3-role flows;
- regression cho assignment/check-in/history.

Acceptance:

- race change PT không tạo double assignment;
- check-in double tap an toàn;
- Guest không double convert;
- Owner/PT/Member flow chạy đồng thời đúng scope.

---

## 4. Prompt template cho Codex

```text
Bạn đang implement FITNESS-MANAGE.
Trả lời bằng tiếng Việt.

Đọc:
- README.md
- 01-product-brief-sot.md
- 02-product-requirements-sot.md
- 03-technical-architecture-sot.md
- 04-tech-stack-sot.md
- <file SOT chi tiết liên quan>

Task:
<task>

Requirement IDs:
<IDs>

Yêu cầu:
- Không thêm feature ngoài requirement.
- Không tự thêm Staff/Dev role.
- Không biến PT assignment thành booking PT theo buổi.
- Preserve assignment/check-in/AI history.
- Nếu task AI: bắt buộc OpenCV + MediaPipe Pose tạo structured JSON trước OpenAI API.
- Không tự bật Supabase Auth/Realtime/Edge Functions hoặc thay REST/Prisma/Zustand/Axios.
- Dùng đúng framework/provider đã khóa trong `04-tech-stack-sot.md`; nếu cần đổi thì dừng và đề xuất decision change.
- Implement nhỏ, test được.
- Sau khi xong: liệt kê file sửa, migration, test đã chạy, requirement đã cover, rủi ro còn lại.
```

---

## 5. Update SOT sau task

| Thay đổi | File cập nhật |
|---|---|
| why/audience/business boundary | `01` |
| requirement/acceptance/scope | `02` + file business chi tiết tương ứng |
| system architecture/module/domain contract | `03` + file tech chi tiết nếu có |
| technology stack | `04` |
| auth/role behavior | `05` |
| assignment behavior | `06` |
| schedule/check-in/attendance | `07` |
| guest/trial | `08` |
| AI behavior | `09` |
| data/security/audit | `10` |
| AI technical pipeline | `11` |
| task splitting | `12` |
| decision-level change | `CHANGELOG.md` |

Không sửa SOT chỉ để mô tả implementation detail tạm thời nếu quyết định sản phẩm/kiến trúc không đổi.
