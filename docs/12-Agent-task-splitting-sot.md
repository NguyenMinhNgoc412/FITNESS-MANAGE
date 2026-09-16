# FITNESS-MANAGE SOT 12 â€” AI Agent / Codex Task Splitting Guide

**Tráº¡ng thÃ¡i:** HÆ°á»›ng dáº«n triá»ƒn khai  
**Dá»± Ã¡n:** FITNESS-MANAGE  
**NgÃ y cáº­p nháº­t:** 2026-09-16  
**Má»¥c tiÃªu:** Chia task nhá», bÃ¡m requirement, khÃ´ng Ä‘á»ƒ Agent tá»± thÃªm nghiá»‡p vá»¥.

---

## 1. Quy táº¯c Ä‘á»c trÆ°á»›c má»—i task

Báº¯t buá»™c:

1. `README.md`
2. `01-product-brief-sot.md`
3. `02-product-requirements-sot.md`
4. `03-technical-architecture-sot.md`
5. `04-tech-stack-sot.md`
6. file chi tiáº¿t liÃªn quan task

Náº¿u task cháº¡m data/security/history: Ä‘á»c thÃªm `10-tech-data-security-audit-sot.md`.

Náº¿u task AI: Ä‘á»c `09-business-ai-body-analysis-sot.md` vÃ  `11-tech-ai-analysis-pipeline-sot.md`.

---

## 2. Rule chia task

Má»™t task tá»‘t:

- cover má»™t nhÃ³m requirement nhá»;
- cÃ³ output test Ä‘Æ°á»£c;
- khÃ´ng gom Auth + Assignment + Check-in + AI trong cÃ¹ng má»™t PR;
- ghi rÃµ requirement IDs;
- cÃ³ migration náº¿u data contract Ä‘á»•i;
- cÃ³ test cho invariant quan trá»ng.

Agent khÃ´ng Ä‘Æ°á»£c tá»± thÃªm Staff/Dev role, booking PT theo buá»•i hoáº·c thay stack Ä‘Ã£ khÃ³a trong `04-tech-stack-sot.md`.

---

## 3. Thá»© tá»± implement Ä‘á» xuáº¥t

### T-000 â€” Project foundation

Äá»c: `03`, `04`, `10`.

Output:

- project structure theo stack Ä‘Ã£ duyá»‡t;
- env/config separation;
- lint/test baseline;
- migration framework;
- auth shell chÆ°a cÃ³ business feature sÃ¢u.

Acceptance:

- build/run Ä‘Æ°á»£c;
- test command cháº¡y Ä‘Æ°á»£c;
- dÃ¹ng Ä‘Ãºng stack trong `04-tech-stack-sot.md`; khÃ´ng tá»± thay framework/provider.

---

### T-001 â€” Auth & role access

Äá»c: `05`, `10`.

Requirement: `PR-AUTH-001`, `PR-AUTH-002`, `PR-TEST-001`.

Output:

- login/session;
- route/screen guard;
- backend/service authorization;
- seed/test accounts cho 3 role á»Ÿ mÃ´i trÆ°á»ng test.

Acceptance:

- ba session role Ä‘á»™c láº­p;
- Member/PT khÃ´ng vÆ°á»£t quyá»n;
- inactive/locked bá»‹ cháº·n.

---

### T-002 â€” PT management

Äá»c: `05`, `10`.

Requirement: `PR-PT-001`, `PR-PT-002`.

Output:

- PT CRUD cáº§n thiáº¿t;
- active/inactive;
- PT member list scope.

Acceptance:

- inactive PT khÃ´ng assignment má»›i;
- history khÃ´ng máº¥t.

---

### T-003 â€” Member registration + initial assignment

Äá»c: `06`, `10`.

Requirement: `PR-MEMBER-001..003`.

Output:

- create Member;
- select PT;
- transaction initial assignment;
- Member/PT views cáº­p nháº­t.

Acceptance:

- Member active cÃ³ Ä‘Ãºng má»™t primary PT;
- fail assignment khÃ´ng Ä‘á»ƒ registration á»Ÿ tráº¡ng thÃ¡i sai.

---

### T-004 â€” Change PT

Äá»c: `06`, `10`.

Requirement: `PR-ASSIGN-001..002`.

Output:

- change assignment transaction;
- history;
- future schedule review hook/flow;
- audit.

Acceptance:

- khÃ´ng hai active assignment;
- old history giá»¯ nguyÃªn;
- khÃ´ng booking PT theo buá»•i.

---

### T-005 â€” Schedule & flexible window

Äá»c: `07`, `10`.

Requirement: `PR-SCHEDULE-001..002`.

Output:

- schedule CRUD cáº§n thiáº¿t;
- fixed/flexible type;
- max 2h validation cho flexible baseline;
- role-scoped schedule queries.

Acceptance:

- lá»‹ch gáº¯n Ä‘Ãºng Member/PT context;
- lá»‹ch cÅ© khÃ´ng rewrite theo current PT.

---

### T-006 â€” Check-in raw events

Äá»c: `07`, `10`.

Requirement: `PR-CHECKIN-001`, `PR-CHECKIN-002`.

Output:

- Member check-in;
- PT check-in;
- idempotency/double-tap protection;
- raw event history.

Acceptance:

- actor chá»‰ check-in chÃ­nh mÃ¬nh;
- timestamp/context Ä‘Ãºng;
- retry khÃ´ng duplicate báº¥t há»£p lÃ½.

---

### T-007 â€” Attendance reconciliation

Äá»c: `07`, `10`.

Requirement: `PR-CHECKIN-003`, `PR-CHECKIN-004`.

Output:

- resolve schedule + assignment + check-ins;
- MATCHED/exception states;
- Owner review list/detail;
- history preservation.

Acceptance:

- Member present/PT missing táº¡o exception sau window há»£p lá»‡;
- khÃ´ng tá»± káº¿t luáº­n ká»· luáº­t;
- Ä‘á»•i PT khÃ´ng rewrite history.

---

### T-008 â€” Guest trial + conversion

Äá»c: `08`, `10`.

Requirement: `PR-GUEST-001..003`.

Output:

- create Guest;
- trial history;
- convert Guest -> Member + assignment;
- conversion linkage.

Acceptance:

- Guest khÃ´ng cáº§n account;
- conversion atomic;
- khÃ´ng máº¥t trial source.

---

### T-009 â€” AI upload & analysis orchestration

Äá»c: `09`, `11`, `10`.

Requirement: `PR-AI-001`, `PR-AI-002`, `PR-AI-004`.

Output:

- private upload flow;
- analysis run state machine;
- quality validation;
- CV/pose structured result persistence.

Acceptance:

- invalid video khÃ´ng táº¡o fake result;
- structured result tá»“n táº¡i trÆ°á»›c generation;
- run history khÃ´ng overwrite.

---

### T-010 â€” AI recommendation & training plan

Äá»c: `09`, `11`.

Requirement: `PR-AI-003`, `PR-AI-004`.

Output:

- context builder;
- LLM generation;
- output schema validation;
- result view by role scope.

Acceptance:

- LLM khÃ´ng dÃ¹ng raw video lÃ m nguá»“n duy nháº¥t;
- uncertainty Ä‘Æ°á»£c giá»¯;
- khÃ´ng cháº©n Ä‘oÃ¡n y khoa.

---

### T-011 â€” Audit, concurrency & E2E hardening

Äá»c: toÃ n bá»™, trá»ng tÃ¢m `10`.

Requirement: `PR-AUDIT-001..002`, `PR-TEST-001`.

Output:

- audit coverage;
- concurrency tests;
- E2E 3-role flows;
- regression cho assignment/check-in/history.

Acceptance:

- race change PT khÃ´ng táº¡o double assignment;
- check-in double tap an toÃ n;
- Guest khÃ´ng double convert;
- Owner/PT/Member flow cháº¡y Ä‘á»“ng thá»i Ä‘Ãºng scope.

---

## 4. Prompt template cho Codex

```text
Báº¡n Ä‘ang implement FITNESS-MANAGE.
Tráº£ lá»i báº±ng tiáº¿ng Viá»‡t.

Äá»c:
- README.md
- 01-product-brief-sot.md
- 02-product-requirements-sot.md
- 03-technical-architecture-sot.md
- 04-tech-stack-sot.md
- <file SOT chi tiáº¿t liÃªn quan>

Task:
<task>

Requirement IDs:
<IDs>

YÃªu cáº§u:
- KhÃ´ng thÃªm feature ngoÃ i requirement.
- KhÃ´ng tá»± thÃªm Staff/Dev role.
- KhÃ´ng biáº¿n PT assignment thÃ nh booking PT theo buá»•i.
- Preserve assignment/check-in/AI history.
- Náº¿u task AI: báº¯t buá»™c OpenCV + MediaPipe Pose táº¡o structured JSON trÆ°á»›c OpenAI API.
- KhÃ´ng tá»± báº­t Supabase Auth/Realtime/Edge Functions hoáº·c thay REST/Prisma/Zustand/Axios.
- DÃ¹ng Ä‘Ãºng framework/provider Ä‘Ã£ khÃ³a trong `04-tech-stack-sot.md`; náº¿u cáº§n Ä‘á»•i thÃ¬ dá»«ng vÃ  Ä‘á» xuáº¥t decision change.
- Implement nhá», test Ä‘Æ°á»£c.
- Sau khi xong: liá»‡t kÃª file sá»­a, migration, test Ä‘Ã£ cháº¡y, requirement Ä‘Ã£ cover, rá»§i ro cÃ²n láº¡i.
```

---

## 5. Update SOT sau task

| Thay Ä‘á»•i | File cáº­p nháº­t |
|---|---|
| why/audience/business boundary | `01` |
| requirement/acceptance/scope | `02` + file business chi tiáº¿t tÆ°Æ¡ng á»©ng |
| system architecture/module/domain contract | `03` + file tech chi tiáº¿t náº¿u cÃ³ |
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

KhÃ´ng sá»­a SOT chá»‰ Ä‘á»ƒ mÃ´ táº£ implementation detail táº¡m thá»i náº¿u quyáº¿t Ä‘á»‹nh sáº£n pháº©m/kiáº¿n trÃºc khÃ´ng Ä‘á»•i.
