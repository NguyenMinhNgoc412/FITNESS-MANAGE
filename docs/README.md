# FITNESS-MANAGE â€” Source of Truth

**Tráº¡ng thÃ¡i:** Canonical SOT entry point  
**Dá»± Ã¡n:** FITNESS-MANAGE  
**NgÃ y cáº­p nháº­t:** 2026-09-16  
**NgÃ´n ngá»¯:** Tiáº¿ng Viá»‡t

---

## 1. Má»¥c Ä‘Ã­ch

Folder nÃ y lÃ  nguá»“n tham chiáº¿u chÃ­nh thá»©c Ä‘á»ƒ Product, Codex/AI Agent vÃ  developer hiá»ƒu **FITNESS-MANAGE Ä‘ang lÃ m gÃ¬, Ä‘Æ°á»£c phÃ©p lÃ m gÃ¬, dÃ¹ng cÃ´ng nghá»‡ nÃ o vÃ  pháº£i implement theo kiáº¿n trÃºc nÃ o**.

KhÃ´ng dÃ¹ng chat cÅ©, comment code hoáº·c suy Ä‘oÃ¡n cÃ¡ nhÃ¢n Ä‘á»ƒ override SOT.

Náº¿u code vÃ  SOT mÃ¢u thuáº«n, pháº£i xÃ¡c minh quyáº¿t Ä‘á»‹nh má»›i nháº¥t rá»“i cáº­p nháº­t Ä‘Ãºng tÃ i liá»‡u trÆ°á»›c khi má»Ÿ rá»™ng implementation.

---

## 2. Bá»™ tÃ i liá»‡u SOT

### 2.1. Core SOT báº¯t buá»™c

| File | Sá»Ÿ há»¯u | KhÃ´ng Ä‘Æ°á»£c sá»Ÿ há»¯u |
|---|---|---|
| `01-product-brief-sot.md` | why, positioning, audience, outcome, product principles, business model, boundary | workflow chi tiáº¿t, acceptance, framework, database |
| `02-product-requirements-sot.md` | canonical requirement IDs, behavior, scope, acceptance criteria | framework/provider, schema váº­t lÃ½, code pattern |
| `03-technical-architecture-sot.md` | kiáº¿n trÃºc há»‡ thá»‘ng, module boundary, domain contract, security/AI architecture | feature má»›i chÆ°a cÃ³ trong PRD |
| `04-tech-stack-sot.md` | framework, library, provider vÃ  stack cÃ´ng nghá»‡ Ä‘Ã£ chá»‘t | business behavior, requirement má»›i |
| `CHANGELOG.md` | lá»‹ch sá»­ thay Ä‘á»•i SOT | quyáº¿t Ä‘á»‹nh canonical thay cho file chÃ­nh |
| `README.md` | cÃ¡ch Ä‘á»c, conflict priority, báº£n Ä‘á»“ tÃ i liá»‡u, rule cho Agent | duplicate chi tiáº¿t feature |

### 2.2. Business SOT chi tiáº¿t theo chá»©c nÄƒng

CÃ¡c file nÃ y **chi tiáº¿t hÃ³a requirement ID Ä‘Ã£ tá»“n táº¡i trong `02`**. ChÃºng khÃ´ng Ä‘Æ°á»£c táº¡o feature má»›i náº¿u `02` chÆ°a cÃ³ requirement tÆ°Æ¡ng á»©ng.

| File | Pháº¡m vi | Requirement chÃ­nh |
|---|---|---|
| `05-business-auth-role-access-sot.md` | login, account status, RBAC, PT access, 3-role session test | `PR-AUTH-*`, `PR-PT-*`, `PR-TEST-001` |
| `06-business-member-pt-assignment-sot.md` | Member registration, PT 1-1 assignment, Ä‘á»•i PT, history | `PR-MEMBER-*`, `PR-ASSIGN-*` |
| `07-business-schedule-checkin-attendance-sot.md` | lá»‹ch, khung linh hoáº¡t 2h, Member/PT check-in, Ä‘á»‘i soÃ¡t | `PR-SCHEDULE-*`, `PR-CHECKIN-*` |
| `08-business-guest-trial-conversion-sot.md` | khÃ¡ch táº­p thá»­, trial history, Guest -> Member | `PR-GUEST-*` |
| `09-business-ai-body-analysis-sot.md` | AI body analysis behavior, structured result, plan, history | `PR-AI-*` |

### 2.3. Technical SOT chi tiáº¿t

| File | Pháº¡m vi |
|---|---|
| `10-tech-data-security-audit-sot.md` | transaction, invariant, concurrency, RBAC enforcement, time, audit, sensitive data |
| `11-tech-ai-analysis-pipeline-sot.md` | FastAPI/OpenCV/MediaPipe/OpenAI pipeline, structured schema, confidence gate, generation, versioning |
| `12-Agent-task-splitting-sot.md` | thá»© tá»± implement, mapping requirement -> SOT -> task -> acceptance |

---

## 3. Thá»© tá»± Ä‘á»c báº¯t buá»™c

### 3.1. Má»i task

1. `README.md`
2. `01-product-brief-sot.md`
3. `02-product-requirements-sot.md`
4. `03-technical-architecture-sot.md`
5. `04-tech-stack-sot.md`
6. file SOT chi tiáº¿t liÃªn quan task
7. `CHANGELOG.md` náº¿u cáº§n lá»‹ch sá»­ quyáº¿t Ä‘á»‹nh

### 3.2. Mapping theo task

| Task | Äá»c thÃªm |
|---|---|
| Setup project/dependency | `04`, `10`, `12` |
| Login / permission / PT management | `05`, `10` |
| Táº¡o Member / gÃ¡n PT / Ä‘á»•i PT | `06`, `10` |
| Lá»‹ch / check-in / attendance | `07`, `10` |
| Guest / táº­p thá»­ / conversion | `08`, `10` |
| AI behavior/UI flow | `09`, `11` |
| AI backend/pipeline | `09`, `10`, `11` |
| Chia task Codex/Agent | `12` |

KhÃ´ng nháº£y tháº³ng vÃ o file chi tiáº¿t rá»“i bá» qua `02`, `03`, `04`, vÃ¬ file chi tiáº¿t chá»‰ má»Ÿ rá»™ng requirement/architecture/stack Ä‘Ã£ Ä‘Æ°á»£c khÃ³a á»Ÿ core SOT.

---

## 4. Quy táº¯c Æ°u tiÃªn khi tÃ i liá»‡u mÃ¢u thuáº«n

1. **Product Brief (`01`)** quyáº¿t Ä‘á»‹nh sáº£n pháº©m lÃ  gÃ¬, phá»¥c vá»¥ ai vÃ  boundary á»Ÿ Ä‘Ã¢u.
2. **Product Requirements (`02`)** quyáº¿t Ä‘á»‹nh canonical requirement, scope vÃ  acceptance.
3. **Technical Architecture (`03`)** quyáº¿t Ä‘á»‹nh kiáº¿n trÃºc tá»•ng quan Ä‘á»ƒ Ä‘Ã¡p á»©ng requirement.
4. **Technology Stack (`04`)** quyáº¿t Ä‘á»‹nh framework/library/provider Ä‘Æ°á»£c phÃ©p dÃ¹ng trong baseline.
5. **Business detail (`05`â€“`09`)** quyáº¿t Ä‘á»‹nh flow/state/edge case chi tiáº¿t trong pháº¡m vi requirement Ä‘Ã£ cÃ³; khÃ´ng Ä‘Æ°á»£c trÃ¡i `02`.
6. **Technical detail (`10`â€“`11`)** quyáº¿t Ä‘á»‹nh invariant/technical contract chi tiáº¿t trong pháº¡m vi `03` + `04`; khÃ´ng Ä‘Æ°á»£c tá»± thÃªm business behavior.
7. **Task guide (`12`)** chá»‰ chia viá»‡c, khÃ´ng override nghiá»‡p vá»¥, architecture hoáº·c stack.
8. **README** quyáº¿t Ä‘á»‹nh cÃ¡ch Ä‘á»c vÃ  sá»­ dá»¥ng bá»™ SOT.
9. **CHANGELOG** chá»‰ ghi lá»‹ch sá»­, khÃ´ng override ná»™i dung hiá»‡n hÃ nh.

Náº¿u `05`â€“`09` mÃ¢u thuáº«n `02`, **`02` tháº¯ng** vÃ  file chi tiáº¿t pháº£i Ä‘Æ°á»£c Ä‘á»“ng bá»™.  
Náº¿u `10`â€“`11` mÃ¢u thuáº«n `03`, **`03` tháº¯ng** cho tá»›i khi owner duyá»‡t thay Ä‘á»•i kiáº¿n trÃºc.  
Náº¿u implementation dÃ¹ng cÃ´ng nghá»‡ khÃ¡c `04`, **`04` tháº¯ng** cho tá»›i khi owner duyá»‡t thay stack vÃ  cáº­p nháº­t SOT.

---

## 5. CÃ¡c quyáº¿t Ä‘á»‹nh sáº£n pháº©m Ä‘Ã£ khÃ³a

Baseline hiá»‡n táº¡i:

- mÃ´ hÃ¬nh lÃ  phÃ²ng gym cÃ¡ nhÃ¢n;
- chá»‰ cÃ³ ba role Ä‘Äƒng nháº­p chÃ­nh: `Owner/Admin`, `PT`, `Member`;
- khÃ´ng cÃ³ role Staff;
- khÃ´ng cÃ³ role Dev trong nghiá»‡p vá»¥;
- PT Ä‘Æ°á»£c gÃ¡n cho member tá»« khi Ä‘Äƒng kÃ½, khÃ´ng book PT theo tá»«ng buá»•i;
- member cÃ³ thá»ƒ Ä‘á»•i PT náº¿u khÃ´ng phÃ¹ há»£p;
- check-in dÃ¹ng Ä‘á»ƒ Ä‘á»‘i soÃ¡t member vÃ  PT;
- member Ä‘áº¿n nhÆ°ng PT khÃ´ng cÃ³ máº·t trong khung há»£p lá»‡ pháº£i táº¡o tráº¡ng thÃ¡i cáº§n owner kiá»ƒm tra;
- lá»‹ch cÃ³ thá»ƒ há»— trá»£ khung linh hoáº¡t tá»‘i Ä‘a 2 giá» theo baseline Ä‘Ã£ chá»‘t;
- khÃ¡ch má»›i cÃ³ thá»ƒ Ä‘Æ°á»£c ghi nháº­n ngay Ä‘á»ƒ táº­p thá»­, chÆ°a cáº§n tÃ i khoáº£n;
- guest data pháº£i giá»¯ Ä‘Æ°á»£c Ä‘á»ƒ thá»‘ng kÃª/chÄƒm sÃ³c vá» sau;
- AI phÃ¢n tÃ­ch video cÆ¡ thá»ƒ lÃ  feature Ä‘Ã£ duyá»‡t;
- video Ä‘Æ°á»£c chuyá»ƒn thÃ nh dá»¯ liá»‡u cÃ³ cáº¥u trÃºc trÆ°á»›c khi LLM sinh lá»i khuyÃªn/lá»™ trÃ¬nh;
- AI khÃ´ng Ä‘Æ°á»£c dÃ¹ng nhÆ° cÃ´ng cá»¥ cháº©n Ä‘oÃ¡n bá»‡nh/cháº¥n thÆ°Æ¡ng.

---

## 6. Tech stack Ä‘Ã£ khÃ³a

Canonical chi tiáº¿t náº±m á»Ÿ `04-tech-stack-sot.md`.

Baseline:

- **Frontend mobile:** React Native + Expo + TypeScript;
- **Web:** cÃ¹ng Expo codebase qua React Native Web;
- **Routing:** Expo Router;
- **State:** Zustand;
- **Form/Validation:** React Hook Form + Zod;
- **API client:** Axios;
- **Backend:** NestJS + TypeScript;
- **API:** REST;
- **Authentication:** JWT + Refresh Token;
- **ORM:** Prisma;
- **Database:** PostgreSQL trÃªn Supabase Free;
- **Storage:** Supabase Storage;
- **AI Service:** Python + FastAPI;
- **CV/Pose:** OpenCV + MediaPipe Pose;
- **Generative AI:** OpenAI API nháº­n structured JSON tá»« táº§ng CV;
- **Notification:** Expo Push Notifications;
- **Realtime:** chÆ°a dÃ¹ng WebSocket trong MVP;
- **Deploy:** Æ°u tiÃªn local/free tier;
- **Source control:** Git + GitHub.

Supabase **khÃ´ng Ä‘á»“ng nghÄ©a dÃ¹ng toÃ n bá»™ Supabase stack**. MVP hiá»‡n chá»‰ khÃ³a PostgreSQL managed + Storage; auth váº«n do NestJS + JWT/Refresh Token quáº£n lÃ½.

---

## 7. Quy táº¯c cho Codex / AI Agent

TrÆ°á»›c khi code:

1. Ä‘á»c Ä‘á»§ `README`, `01`, `02`, `03`, `04` vÃ  file chi tiáº¿t Ä‘Ãºng chá»©c nÄƒng;
2. xÃ¡c Ä‘á»‹nh requirement ID Ä‘ang implement;
3. dÃ¹ng Ä‘Ãºng stack trong `04-tech-stack-sot.md`;
4. khÃ´ng thÃªm feature â€œcho tiá»‡nâ€;
5. khÃ´ng tá»± Ä‘á»•i role model;
6. khÃ´ng biáº¿n PT assignment thÃ nh booking theo buá»•i;
7. khÃ´ng ghi Ä‘Ã¨ lá»‹ch sá»­ assignment/check-in;
8. vá»›i AI, giá»¯ pipeline `video -> OpenCV/MediaPipe Pose -> structured JSON -> OpenAI API`;
9. khÃ´ng tá»± báº­t Supabase Auth/Realtime/Edge Functions;
10. khÃ´ng tá»± thay Axios, Zustand, Prisma hoáº·c REST báº±ng lá»±a chá»n khÃ¡c;
11. cuá»‘i task pháº£i ghi rÃµ file code Ä‘Ã£ sá»­a, test Ä‘Ã£ cháº¡y vÃ  requirement ID Ä‘Ã£ Ä‘Ã¡p á»©ng.

---

## 8. Prompt chuáº©n giao task cho Codex

```text
Báº¡n Ä‘ang implement FITNESS-MANAGE.
Tráº£ lá»i báº±ng tiáº¿ng Viá»‡t.

Äá»c trÆ°á»›c:
- README.md
- 01-product-brief-sot.md
- 02-product-requirements-sot.md
- 03-technical-architecture-sot.md
- 04-tech-stack-sot.md
- <file SOT chi tiáº¿t liÃªn quan>

Task:
<ghi task cá»¥ thá»ƒ>

Requirement IDs:
<vÃ­ dá»¥ PR-MEMBER-002, PR-CHECKIN-003>

YÃªu cáº§u:
- KhÃ´ng thÃªm feature ngoÃ i Product Requirements.
- KhÃ´ng Ä‘á»•i business rule Ä‘á»ƒ code dá»… hÆ¡n.
- DÃ¹ng Ä‘Ãºng stack trong 04-tech-stack-sot.md.
- KhÃ´ng tá»± thÃªm Staff/Dev role.
- KhÃ´ng biáº¿n PT assignment thÃ nh booking tá»«ng buá»•i.
- Preserve history cho assignment/check-in/AI analysis.
- Náº¿u task AI: video pháº£i qua OpenCV + MediaPipe Pose táº¡o structured JSON trÆ°á»›c OpenAI API.
- KhÃ´ng tá»± báº­t Supabase Auth/Realtime/Edge Functions.
- Sau khi hoÃ n thÃ nh: tÃ³m táº¯t file sá»­a, migration, test, requirement Ä‘Ã£ cover vÃ  rá»§i ro cÃ²n láº¡i.
```

---

## 9. Definition of Done cho má»™t task

Má»™t task chá»‰ Ä‘Æ°á»£c coi lÃ  xong khi:

- bÃ¡m Ä‘Ãºng requirement ID;
- dÃ¹ng Ä‘Ãºng stack canonical;
- khÃ´ng phÃ¡ boundary role;
- business invariant cÃ³ test náº¿u cÃ³ logic;
- error/empty/permission state Ä‘Æ°á»£c xá»­ lÃ½;
- migration Ä‘Æ°á»£c thÃªm náº¿u data model thay Ä‘á»•i;
- khÃ´ng sá»­a lá»‹ch sá»­ ngoÃ i Ã½ muá»‘n;
- khÃ´ng táº¡o data race/double-submit á»Ÿ action quan trá»ng;
- test phÃ¹ há»£p cháº¡y thÃ nh cÃ´ng;
- SOT/CHANGELOG Ä‘Æ°á»£c cáº­p nháº­t náº¿u decision thay Ä‘á»•i.

---

## 10. Quy táº¯c update SOT

### Product Brief

Chá»‰ khi Ä‘á»•i:

- why;
- positioning;
- audience;
- outcome;
- principles;
- business model;
- boundary.

### Product Requirements

Khi Ä‘á»•i:

- behavior;
- flow;
- scope;
- requirement;
- acceptance criteria.

### Technical Architecture

Khi Ä‘á»•i:

- module boundary;
- domain model;
- API/data contract;
- transaction/invariant;
- security architecture;
- AI architecture;
- testing architecture.

### Technology Stack

Khi Ä‘á»•i:

- framework;
- library chÃ­nh;
- ORM/database provider;
- auth mechanism;
- storage provider;
- AI/CV/LLM provider;
- realtime strategy;
- deploy baseline;
- source-control baseline.

### CHANGELOG

Má»i thay Ä‘á»•i decision-level pháº£i ghi vÃ o `CHANGELOG.md`.

---

## 11. Nhá»¯ng Ä‘iá»u tuyá»‡t Ä‘á»‘i khÃ´ng tá»± thÃªm/thay

- Staff role;
- Dev role;
- booking PT tá»± do theo buá»•i;
- marketplace;
- multi-tenant SaaS;
- payroll/HR;
- CRM automation Ä‘áº§y Ä‘á»§;
- medical diagnosis báº±ng AI;
- Supabase Auth thay JWT/Refresh Token cá»§a NestJS;
- Supabase Realtime/WebSocket á»Ÿ MVP náº¿u chÆ°a cÃ³ quyáº¿t Ä‘á»‹nh má»›i;
- GraphQL thay REST;
- ORM khÃ¡c thay Prisma;
- frontend web riÃªng thay React Native Web cÃ¹ng Expo codebase;
- raw video Ä‘Æ°a tháº³ng vÃ o LLM Ä‘á»ƒ bá» qua CV/Pose;
- provider/framework má»›i chá»‰ vÃ¬ Agent thÃ­ch dÃ¹ng;
- feature khÃ´ng cÃ³ requirement ID hoáº·c chÆ°a Ä‘Æ°á»£c owner duyá»‡t.
