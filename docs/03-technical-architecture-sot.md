# FITNESS-MANAGE SOT 03 â€” Technical Architecture

**Tráº¡ng thÃ¡i:** Source of Truth chÃ­nh cho kiáº¿n trÃºc há»‡ thá»‘ng  
**Dá»± Ã¡n:** FITNESS-MANAGE  
**NgÃ y cáº­p nháº­t:** 2026-09-16  
**Pháº¡m vi:** CÃ¡ch há»‡ thá»‘ng Ä‘Ã¡p á»©ng `02-product-requirements-sot.md`  
**NgÃ´n ngá»¯:** Tiáº¿ng Viá»‡t  
**Quy táº¯c:** File nÃ y chá»‰ sá»Ÿ há»¯u kiáº¿n trÃºc vÃ  technical contracts cáº§n Ä‘á»ƒ Ä‘Ã¡p á»©ng requirement Ä‘Ã£ duyá»‡t. KhÃ´ng tá»± thÃªm feature má»›i.

---

## 1. Architecture principles

1. **Requirement-driven:** chá»‰ táº¡o module khi cÃ³ requirement tÆ°Æ¡ng á»©ng trong PRD.
2. **Role-safe:** quyá»n pháº£i Ä‘Æ°á»£c kiá»ƒm tra á»Ÿ server/service boundary, khÃ´ng chá»‰ áº©n nÃºt trÃªn UI.
3. **History-preserving:** assignment, attendance vÃ  AI analysis dÃ¹ng lá»‹ch sá»­ báº¥t biáº¿n theo thá»i Ä‘iá»ƒm; khÃ´ng ghi Ä‘Ã¨ sá»± kiá»‡n cÅ© báº±ng tráº¡ng thÃ¡i má»›i.
4. **Audit-friendly:** thay Ä‘á»•i quáº£n trá»‹ quan trá»ng pháº£i truy váº¿t Ä‘Æ°á»£c.
5. **AI pipeline cÃ³ cáº¥u trÃºc:** computer vision/pose analysis táº¡o structured output trÆ°á»›c; LLM khÃ´ng tá»± â€œxem raw video rá»“i quyáº¿t Ä‘á»‹nh táº¥t cáº£â€.
6. **Privacy-aware:** video cÆ¡ thá»ƒ vÃ  káº¿t quáº£ phÃ¢n tÃ­ch lÃ  dá»¯ liá»‡u nháº¡y cáº£m, pháº£i cÃ³ access control vÃ  retention rÃµ.
7. **Stack-locked:** implementation pháº£i dÃ¹ng stack canonical trong `04-tech-stack-sot.md`: Expo/React Native Web á»Ÿ client, NestJS REST backend, Prisma + PostgreSQL/Supabase, Supabase Storage, FastAPI + OpenCV + MediaPipe Pose + OpenAI API cho AI. KhÃ´ng tá»± thay provider/framework náº¿u chÆ°a cÃ³ decision change.

---

## 2. System context

Kiáº¿n trÃºc logic:

```text
Client Application(s)
  â”œâ”€â”€ Owner/Admin experience
  â”œâ”€â”€ PT experience
  â””â”€â”€ Member experience
          |
          v
Application API / Backend Service
  â”œâ”€â”€ Auth & RBAC
  â”œâ”€â”€ PT Management
  â”œâ”€â”€ Member Management
  â”œâ”€â”€ PT Assignment
  â”œâ”€â”€ Schedule / Training Window
  â”œâ”€â”€ Check-in & Reconciliation
  â”œâ”€â”€ Guest / Trial
  â”œâ”€â”€ AI Analysis Orchestration
  â””â”€â”€ Audit
          |
          +----------------------+
          |                      |
          v                      v
Relational Data Store       Private Media Storage
                                 |
                                 v
                         AI Analysis Pipeline
                         â”œâ”€â”€ Input validation
                         â”œâ”€â”€ Pose/CV extraction
                         â”œâ”€â”€ Structured feature result
                         â””â”€â”€ LLM recommendation/plan
```

KhÃ´ng cÃ³ module Staff, marketplace booking hoáº·c multi-tenant trong baseline.

---

## 3. Logical layers

### 3.1. Presentation / Client layer

Chá»‹u trÃ¡ch nhiá»‡m:

- screen vÃ  navigation theo role;
- input validation cáº¥p UI;
- hiá»ƒn thá»‹ loading/error/empty state;
- táº¡o request tá»›i application API;
- giá»¯ session tÃ¡ch biá»‡t theo tÃ i khoáº£n;
- upload video theo flow Ä‘Æ°á»£c backend cáº¥p quyá»n.

KhÃ´ng chá»‹u trÃ¡ch nhiá»‡m:

- tá»± quyáº¿t Ä‘á»‹nh quyá»n truy cáº­p cuá»‘i cÃ¹ng;
- tá»± thay Ä‘á»•i assignment chá»‰ báº±ng local state;
- tá»± káº¿t luáº­n attendance exception;
- tá»± sinh káº¿t quáº£ AI cuá»‘i cÃ¹ng tá»« raw video.

### 3.2. Application service layer

Chá»‹u trÃ¡ch nhiá»‡m:

- orchestration use case;
- enforce RBAC;
- validate domain invariants;
- má»Ÿ transaction;
- gá»i repository;
- táº¡o audit event;
- phÃ¡t sinh job AI hoáº·c reconcile attendance.

### 3.3. Domain layer

Chá»©a cÃ¡c rule cá»‘t lÃµi:

- má»™t member chá»‰ cÃ³ má»™t primary PT assignment active táº¡i má»™t thá»i Ä‘iá»ƒm bÃ¬nh thÆ°á»ng;
- assignment má»›i pháº£i Ä‘Ã³ng assignment cÅ© Ä‘Ãºng thá»i Ä‘iá»ƒm;
- lá»‹ch sá»­ khÃ´ng bá»‹ overwrite;
- check-in Ä‘Æ°á»£c Ä‘Ã¡nh giÃ¡ theo assignment/lá»‹ch táº¡i thá»i Ä‘iá»ƒm phÃ¡t sinh;
- khung linh hoáº¡t dÃ¹ng cá»­a sá»• há»£p lá»‡ Ä‘Ã£ cáº¥u hÃ¬nh, tá»‘i Ä‘a 2 giá» theo baseline product rule;
- guest conversion khÃ´ng xÃ³a nguá»“n trial history;
- AI result pháº£i gáº¯n vá»›i analysis run cá»¥ thá»ƒ.

### 3.4. Data layer

Chá»‹u trÃ¡ch nhiá»‡m:

- relational persistence;
- transaction;
- optimistic/pessimistic concurrency khi cáº§n;
- query theo role scope;
- migration/versioning;
- audit persistence.

### 3.5. Media layer

Chá»‹u trÃ¡ch nhiá»‡m:

- private upload/download;
- metadata file;
- signed URL hoáº·c access mechanism ngáº¯n háº¡n cá»§a Supabase Storage do backend cáº¥p quyá»n khi cáº§n;
- lifecycle/retention;
- khÃ´ng public raw body video máº·c Ä‘á»‹nh.

### 3.6. AI processing layer

Chá»‹u trÃ¡ch nhiá»‡m:

- kiá»ƒm tra input;
- decode video theo pipeline xá»­ lÃ½;
- trÃ­ch xuáº¥t frame/keypoint/pose feature;
- quality/confidence calculation;
- táº¡o structured analysis JSON;
- gá»i LLM báº±ng structured data vÃ  context Ä‘Æ°á»£c phÃ©p;
- validate output theo schema;
- lÆ°u version/model metadata phá»¥c vá»¥ audit/reproducibility á»Ÿ má»©c cáº§n thiáº¿t.

---

## 4. Module boundaries

| Module | TrÃ¡ch nhiá»‡m | KhÃ´ng Ä‘Æ°á»£c lÃ m |
|---|---|---|
| `auth` | session, identity, role, access token | khÃ´ng chá»©a logic assignment/check-in |
| `users` | profile Owner/PT/Member | khÃ´ng chá»©a attendance calculation |
| `pt` | há»“ sÆ¡ PT, tráº¡ng thÃ¡i hoáº¡t Ä‘á»™ng | khÃ´ng tá»± Ä‘á»•i assignment |
| `members` | há»“ sÆ¡ member, má»¥c tiÃªu táº­p | khÃ´ng quáº£n lÃ½ lá»‹ch sá»­ PT trá»±c tiáº¿p |
| `assignments` | quan há»‡ memberâ€“PT cÃ³ hiá»‡u lá»±c theo thá»i gian | khÃ´ng sá»­a lá»‹ch sá»­ check-in |
| `schedules` | lá»‹ch/khung táº­p, fixed/flexible window | khÃ´ng quyáº¿t Ä‘á»‹nh PT hiá»‡n táº¡i náº¿u assignment khÃ´ng há»£p lá»‡ |
| `checkins` | record hiá»‡n diá»‡n | khÃ´ng tá»± Ä‘á»•i lá»‹ch/assignment |
| `attendance` | Ä‘á»‘i soÃ¡t check-in + lá»‹ch + assignment | khÃ´ng xÃ³a raw check-in |
| `guests` | trial record, conversion linkage | khÃ´ng táº¡o role Ä‘Äƒng nháº­p guest |
| `ai-analysis` | analysis run, structured result, plan generation | khÃ´ng cháº©n Ä‘oÃ¡n y khoa |
| `audit` | immutable audit events | khÃ´ng thay data source chÃ­nh |

---

## 5. Core domain model

TÃªn model/table váº­t lÃ½ do Prisma/PostgreSQL triá»ƒn khai cÃ³ thá»ƒ Ä‘iá»u chá»‰nh theo naming convention, nhÆ°ng domain contract pháº£i giá»¯ Ã½ nghÄ©a sau.

### 5.1. `users`

Äáº¡i diá»‡n identity Ä‘Äƒng nháº­p.

Tá»‘i thiá»ƒu:

- `id`;
- `role`: OWNER_ADMIN | PT | MEMBER;
- `status`: ACTIVE | INACTIVE | LOCKED;
- identity/contact fields cáº§n thiáº¿t;
- timestamps.

### 5.2. `pt_profiles`

ThÃ´ng tin nghiá»‡p vá»¥ riÃªng cá»§a PT.

- `user_id`;
- display/profile fields;
- specialization/note náº¿u sáº£n pháº©m sá»­ dá»¥ng;
- active state metadata.

### 5.3. `member_profiles`

ThÃ´ng tin nghiá»‡p vá»¥ member.

- `user_id`;
- goal/notes phÃ¹ há»£p;
- membership state tá»‘i thiá»ƒu náº¿u cáº§n Ä‘á»ƒ xÃ¡c Ä‘á»‹nh active/inactive;
- source guest náº¿u convert;
- timestamps.

### 5.4. `member_pt_assignments`

LÃ  source of truth cho quan há»‡ PTâ€“member theo thá»i gian.

Tá»‘i thiá»ƒu:

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

- khÃ´ng cÃ³ hai primary active assignment chá»“ng thá»i gian cho cÃ¹ng má»™t member;
- Ä‘Ã³ng assignment cÅ© vÃ  táº¡o assignment má»›i trong cÃ¹ng transaction khi Ä‘á»•i PT.

### 5.5. `training_schedules`

MÃ´ táº£ lá»‹ch/khung táº­p Ä‘Ã£ thá»‘ng nháº¥t.

Tá»‘i thiá»ƒu:

- `id`;
- `member_id`;
- `pt_id` snapshot/reference phÃ¹ há»£p;
- date/recurrence fields;
- `window_type`: FIXED | FLEXIBLE;
- expected start/end;
- flexible window metadata;
- status.

Rule:

- flexible window khÃ´ng vÆ°á»£t rule product baseline 2 giá»;
- schedule Ä‘Ã£ hoÃ n táº¥t khÃ´ng bá»‹ viáº¿t láº¡i chá»‰ vÃ¬ assignment hiá»‡n táº¡i Ä‘á»•i.

### 5.6. `checkins`

Raw event xÃ¡c nháº­n hiá»‡n diá»‡n.

Tá»‘i thiá»ƒu:

- `id`;
- `actor_user_id`;
- `actor_role`;
- `checked_in_at`;
- location/context metadata náº¿u product sau nÃ y duyá»‡t;
- associated schedule id náº¿u resolve Ä‘Æ°á»£c;
- immutable event metadata.

### 5.7. `attendance_reconciliations`

Derived/business result tá»« schedule + assignment + check-in.

Tá»‘i thiá»ƒu:

- `id`;
- `member_id`;
- `pt_id`;
- `schedule_id`;
- member check-in reference;
- PT check-in reference nullable;
- status: MATCHED | MEMBER_ONLY | PT_ONLY | MISSING | NEEDS_REVIEW;
- evaluated_at;
- resolution metadata náº¿u owner xá»­ lÃ½.

KhÃ´ng dÃ¹ng báº£ng nÃ y Ä‘á»ƒ thay raw check-in.

### 5.8. `guest_trials`

Record khÃ¡ch táº­p thá»­.

Tá»‘i thiá»ƒu:

- `id`;
- name/identifier;
- contact fields theo consent;
- trial timestamp;
- note;
- conversion status;
- converted_member_id nullable;
- created_by.

### 5.9. `ai_analysis_runs`

Má»™t láº§n phÃ¢n tÃ­ch video.

Tá»‘i thiá»ƒu:

- `id`;
- `member_id`;
- input media reference;
- status: UPLOADED | VALIDATING | ANALYZING | NEEDS_RETAKE | COMPLETED | FAILED;
- pipeline version;
- created_at/completed_at;
- error code an toÃ n náº¿u fail.

### 5.10. `ai_analysis_results`

Structured result cá»§a CV/pose stage.

Tá»‘i thiá»ƒu:

- `analysis_run_id`;
- input quality;
- extracted features JSON theo schema version;
- confidence metadata;
- warnings;
- analyzer version.

### 5.11. `training_plan_outputs`

Output sinh tá»« structured analysis.

Tá»‘i thiá»ƒu:

- `analysis_run_id`;
- goal context snapshot;
- recommendation summary;
- plan structure;
- safety/disclaimer flags;
- generation version;
- created_at.

### 5.12. `audit_events`

Append-only á»Ÿ má»©c logic.

Tá»‘i thiá»ƒu:

- actor;
- action;
- entity type/id;
- timestamp;
- before/after summary hoáº·c metadata phÃ¹ há»£p;
- correlation/request id.

---

## 6. Key transactions

CÃ¡c hÃ nh Ä‘á»™ng sau pháº£i lÃ  transaction hoáº·c cÃ³ cÆ¡ cháº¿ Ä‘áº£m báº£o atomic tÆ°Æ¡ng Ä‘Æ°Æ¡ng.

### 6.1. ÄÄƒng kÃ½ member + assignment

```text
Create/activate member
  -> create initial PT assignment
  -> optionally create initial schedule
  -> create audit event
  -> commit
```

KhÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ member á»Ÿ tráº¡ng thÃ¡i â€œÄ‘Äƒng kÃ½ hoÃ n táº¥tâ€ nhÆ°ng assignment ban Ä‘áº§u tháº¥t báº¡i náº¿u product flow yÃªu cáº§u PT báº¯t buá»™c.

### 6.2. Äá»•i PT

```text
Lock/read current assignment
  -> validate new PT active
  -> close current assignment
  -> create new assignment
  -> update future schedule references/rules as designed
  -> write audit
  -> commit
```

KhÃ´ng update check-in hoáº·c historical schedule cÅ©.

### 6.3. Convert guest thÃ nh member

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

Raw check-in khÃ´ng bá»‹ sá»­a Ä‘á»ƒ â€œlÃ m Ä‘áº¹pâ€ káº¿t quáº£.

Resolution cáº­p nháº­t reconciliation/audit riÃªng.

---

## 7. Check-in reconciliation algorithm contract

Input:

- member check-in event;
- active/historical assignment táº¡i thá»i Ä‘iá»ƒm liÃªn quan;
- schedule/training window;
- PT check-in events;
- allowed time window.

Logic tá»‘i thiá»ƒu:

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

YÃªu cáº§u:

- algorithm dÃ¹ng timestamp lá»‹ch sá»­, khÃ´ng dÃ¹ng assignment hiá»‡n táº¡i má»™t cÃ¡ch mÃ¹ quÃ¡ng;
- flexible schedule pháº£i tÃ´n trá»ng cá»­a sá»• tá»‘i Ä‘a 2 giá» Ä‘Æ°á»£c cáº¥u hÃ¬nh;
- classification cÃ³ thá»ƒ cháº¡y Ä‘á»“ng bá»™ sau check-in hoáº·c báº±ng job, nhÆ°ng káº¿t quáº£ cuá»‘i pháº£i idempotent.

---

## 8. API boundary

TÃªn endpoint cá»¥ thá»ƒ phá»¥ thuá»™c stack, nhÆ°ng contract nÃªn theo resource/action rÃµ rÃ ng.

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

---

## 9. AI pipeline architecture

### 9.1. Stage 1 â€” Capture guidance

Client cung cáº¥p hÆ°á»›ng dáº«n quay:

- framing;
- khoáº£ng cÃ¡ch;
- Ã¡nh sÃ¡ng;
- gÃ³c/quá»¹ Ä‘áº¡o quay náº¿u requirement UI Ä‘á»‹nh nghÄ©a;
- cáº£nh bÃ¡o khÃ´ng quay ná»™i dung ngoÃ i má»¥c Ä‘Ã­ch cáº§n thiáº¿t.

### 9.2. Stage 2 â€” Input validation

Kiá»ƒm tra:

- file cÃ³ Ä‘á»c Ä‘Æ°á»£c khÃ´ng;
- thá»i lÆ°á»£ng/Ä‘á»™ phÃ¢n giáº£i tá»‘i thiá»ƒu theo cáº¥u hÃ¬nh ká»¹ thuáº­t;
- cÃ³ Ä‘á»§ cÆ¡ thá»ƒ/pose trong frame hay khÃ´ng;
- blur/occlusion quÃ¡ má»©c hay khÃ´ng.

Náº¿u fail => `NEEDS_RETAKE` hoáº·c `FAILED` vá»›i reason code thÃ¢n thiá»‡n.

### 9.3. Stage 3 â€” CV / Pose extraction

Pipeline trÃ­ch xuáº¥t:

- body keypoints/pose sequence;
- normalized geometric features;
- symmetry/posture observations trong pháº¡m vi mÃ´ hÃ¬nh;
- confidence per feature;
- quality warnings.

Káº¿t quáº£ Ä‘Æ°á»£c serialize thÃ nh schema versioned JSON.

VÃ­ dá»¥ cáº¥u trÃºc logic:

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

ÄÃ¢y chá»‰ lÃ  shape minh há»a technical contract, khÃ´ng pháº£i feature má»›i hoáº·c medical diagnosis schema.

### 9.4. Stage 4 â€” Recommendation generation

LLM nháº­n:

- structured analysis JSON;
- member goal snapshot;
- allowed training context;
- policy prompt yÃªu cáº§u khÃ´ng cháº©n Ä‘oÃ¡n y khoa.

LLM khÃ´ng cáº§n raw video trong stage nÃ y.

Output pháº£i qua schema validation trÆ°á»›c khi lÆ°u.

### 9.5. Stage 5 â€” Result persistence

LÆ°u:

- analysis run;
- structured analyzer result;
- model/pipeline version;
- generated recommendation/plan;
- warnings/confidence.

KhÃ´ng overwrite láº§n phÃ¢n tÃ­ch trÆ°á»›c.

---

## 10. Authorization model

### 10.1. Owner/Admin

CÃ³ quyá»n rá»™ng nháº¥t trong tenant/single-gym scope.

### 10.2. PT

Chá»‰ truy cáº­p:

- báº£n thÃ¢n;
- member Ä‘ang hoáº·c tá»«ng Ä‘Æ°á»£c giao trong pháº¡m vi lá»‹ch sá»­ cáº§n thiáº¿t;
- lá»‹ch/check-in/AI result Ä‘Æ°á»£c policy cho phÃ©p.

KhÃ´ng query tÃ¹y Ã½ toÃ n bá»™ member.

### 10.3. Member

Chá»‰ truy cáº­p:

- profile cá»§a mÃ¬nh;
- PT assignment cá»§a mÃ¬nh;
- lá»‹ch/check-in cá»§a mÃ¬nh;
- AI analysis cá»§a mÃ¬nh.

### 10.4. Authorization enforcement

Pháº£i Ã¡p dá»¥ng á»Ÿ:

- API/service layer;
- repository/query scoping khi phÃ¹ há»£p;
- object/media access;
- AI result access.

UI hiding khÃ´ng pháº£i security boundary.

---

## 11. Data integrity & concurrency

### 11.1. Assignment uniqueness

Cáº§n constraint hoáº·c transactional guard Ä‘á»ƒ trÃ¡nh hai PT active primary cho má»™t member cÃ¹ng lÃºc.

### 11.2. Idempotency

CÃ¡c action cÃ³ nguy cÆ¡ double-submit nÃªn há»— trá»£ idempotency hoáº·c duplicate guard:

- check-in;
- guest conversion;
- PT change;
- AI analysis request.

### 11.3. Time handling

- lÆ°u timestamp theo chuáº©n thá»‘ng nháº¥t;
- display theo timezone cá»§a gym/client;
- reconciliation dÃ¹ng timestamp tuyá»‡t Ä‘á»‘i + timezone schedule rÃµ rÃ ng;
- khÃ´ng so sÃ¡nh chuá»—i thá»i gian local khÃ´ng chuáº©n hÃ³a.

### 11.4. Soft delete / deactivation

PT/member cÃ³ lá»‹ch sá»­ khÃ´ng nÃªn hard-delete náº¿u viá»‡c xÃ³a lÃ m máº¥t tÃ­nh toÃ n váº¹n audit.

Æ¯u tiÃªn inactive/archive theo requirement váº­n hÃ nh.

---

## 12. Privacy & media security

Body video lÃ  dá»¯ liá»‡u nháº¡y cáº£m.

Báº¯t buá»™c:

1. media khÃ´ng public máº·c Ä‘á»‹nh;
2. access pháº£i theo authenticated authorization;
3. log khÃ´ng ghi raw URL/token bÃ­ máº­t;
4. khÃ´ng nhÃºng video binary/base64 vÃ o audit hoáº·c application log;
5. cÃ³ retention/cleanup policy Ä‘Æ°á»£c cáº¥u hÃ¬nh;
6. xÃ³a logical record pháº£i xá»­ lÃ½ media lifecycle phÃ¹ há»£p;
7. AI worker chá»‰ nháº­n quyá»n truy cáº­p cáº§n thiáº¿t cho job;
8. káº¿t quáº£ AI vÃ  raw video cÃ³ policy quyá»n riÃªng biá»‡t náº¿u cáº§n.

---

## 13. Observability

Cáº§n cÃ³ structured log/metric tá»‘i thiá»ƒu cho:

- auth failure rate;
- assignment change failure;
- check-in creation/reconciliation failure;
- duplicate check-in guard;
- AI upload failure;
- AI validation `NEEDS_RETAKE`;
- analysis latency;
- AI pipeline failure by stage;
- permission denied events báº¥t thÆ°á»ng.

KhÃ´ng log dá»¯ liá»‡u body analysis chi tiáº¿t hoáº·c PII khÃ´ng cáº§n thiáº¿t.

---

## 14. Testing strategy

### 14.1. Unit test

Báº¯t buá»™c cho:

- role permission rules;
- assignment invariant;
- change-PT transaction logic;
- flexible 2-hour window validation;
- attendance reconciliation classification;
- guest conversion rules;
- AI structured-result validator.

### 14.2. Integration test

Báº¯t buá»™c cho:

- create member + assign PT;
- change PT with history;
- member/PT check-in -> reconciliation;
- member-only check-in -> exception;
- guest -> member conversion;
- AI run state transitions.

### 14.3. E2E role test

DÃ¹ng ba account/session Ä‘á»™c láº­p:

```text
Session A: Owner/Admin
Session B: PT
Session C: Member
```

Test flow tá»‘i thiá»ƒu:

1. Owner táº¡o member vÃ  gÃ¡n PT.
2. PT tháº¥y member.
3. Member tháº¥y PT.
4. Member check-in.
5. PT check-in hoáº·c cá»‘ tÃ¬nh khÃ´ng check-in.
6. Owner tháº¥y matched/exception Ä‘Ãºng.
7. Owner Ä‘á»•i PT.
8. PT cÅ© máº¥t active assignment; PT má»›i nháº­n assignment.
9. Lá»‹ch sá»­ check-in cÅ© váº«n trá» Ä‘Ãºng context cÅ©.

### 14.4. AI test

- valid video -> completed;
- unusable video -> needs retake;
- analyzer confidence tháº¥p -> output khÃ´ng overclaim;
- structured JSON schema mismatch -> fail safe;
- LLM output invalid schema -> reject/retry theo policy;
- member khÃ´ng Ä‘á»c Ä‘Æ°á»£c analysis cá»§a member khÃ¡c.

---

## 15. Technology stack integration

Technology stack canonical náº±m á»Ÿ `04-tech-stack-sot.md`. Architecture nÃ y bind vÃ o cÃ¡c boundary sau:

| Layer | Stack Ä‘Ã£ chá»‘t | Architecture responsibility |
|---|---|---|
| Mobile/Web client | React Native + Expo + TypeScript + React Native Web | UI theo role, Expo Router, Zustand, React Hook Form + Zod, Axios |
| Core backend | NestJS + TypeScript | REST API authority, auth/RBAC, domain orchestration, audit |
| Authentication | JWT + Refresh Token | NestJS issue/validate/refresh/revoke theo policy; khÃ´ng dÃ¹ng Supabase Auth trong baseline |
| Data access | Prisma | schema, migration, typed access, transaction |
| Relational store | PostgreSQL trÃªn Supabase Free | source of truth cho dá»¯ liá»‡u nghiá»‡p vá»¥ |
| Media | Supabase Storage | private body-video/media storage; backend kiá»ƒm soÃ¡t quyá»n |
| AI service | Python + FastAPI | boundary riÃªng cho pipeline AI |
| CV/Pose | OpenCV + MediaPipe Pose | preprocessing, pose/keypoint/feature extraction, quality/confidence |
| Generative AI | OpenAI API qua OpenAI Python SDK | nháº­n structured JSON/context Ä‘Ã£ Ä‘Æ°á»£c chuáº©n hÃ³a; khÃ´ng thay CV layer |
| Notification | Expo Push Notifications | delivery channel khi requirement notification Ä‘Æ°á»£c implement |
| Realtime | KhÃ´ng dÃ¹ng trong MVP | REST/refetch lÃ  baseline; khÃ´ng tá»± báº­t WebSocket/Supabase Realtime |

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

Supabase trong baseline chá»‰ lÃ  **managed PostgreSQL + Storage**. KhÃ´ng suy ra ráº±ng dá»± Ã¡n dÃ¹ng Supabase Auth, Realtime hoáº·c Edge Functions. Backend NestJS váº«n lÃ  authority cho auth, RBAC vÃ  nghiá»‡p vá»¥.

### 15.4. Change rule

Muá»‘n Ä‘á»•i framework/provider pháº£i cáº­p nháº­t `04-tech-stack-sot.md`, Ä‘Ã¡nh giÃ¡ impact lÃªn architecture nÃ y vÃ  ghi `CHANGELOG.md` trÆ°á»›c khi coi lá»±a chá»n má»›i lÃ  canonical.

---

## 16. Architecture acceptance checklist

Kiáº¿n trÃºc Ä‘Æ°á»£c coi lÃ  bÃ¡m Ä‘Ãºng PRD khi:

1. CÃ³ ba role vÃ  RBAC server-side.
2. Assignment PTâ€“member lÃ  entity cÃ³ lá»‹ch sá»­.
3. Check-in lÃ  raw event Ä‘á»™c láº­p vá»›i reconciliation.
4. Reconciliation dÃ¹ng Ä‘Ãºng assignment/lá»‹ch táº¡i thá»i Ä‘iá»ƒm phÃ¡t sinh.
5. Flexible window há»— trá»£ rule tá»‘i Ä‘a 2 giá».
6. Guest khÃ´ng cáº§n role login vÃ  cÃ³ thá»ƒ convert thÃ nh member.
7. AI dÃ¹ng pipeline raw video -> CV/pose -> structured result -> LLM recommendation.
8. Raw video Ä‘Æ°á»£c báº£o vá»‡ nhÆ° private media.
9. AI output khÃ´ng Ä‘Æ°á»£c thiáº¿t káº¿ nhÆ° medical diagnosis.
10. Audit khÃ´ng dÃ¹ng Ä‘á»ƒ thay source of truth.
11. Ba role cÃ³ thá»ƒ Ä‘Æ°á»£c test Ä‘á»“ng thá»i báº±ng session tÃ¡ch biá»‡t.
12. Architecture khÃ´ng thÃªm Staff, marketplace booking hoáº·c multi-tenant feature.

---

## 17. Quy táº¯c thay Ä‘á»•i Technical Architecture

Khi muá»‘n Ä‘á»•i architecture:

1. chá»‰ Ä‘Æ°á»£c xuáº¥t phÃ¡t tá»« requirement Ä‘Ã£ cÃ³ hoáº·c non-functional need rÃµ rÃ ng;
2. ghi impact lÃªn module/data/API/security/testing;
3. khÃ´ng tá»± thÃªm hÃ nh vi ngÆ°á»i dÃ¹ng má»›i;
4. náº¿u thay Ä‘á»•i lÃ m xuáº¥t hiá»‡n behavior má»›i, pháº£i sá»­a Product Requirements trÆ°á»›c;
5. cáº­p nháº­t `CHANGELOG.md`.

---

## 18. Mapping sang technical SOT chi tiáº¿t

| Chá»§ Ä‘á» | File chi tiáº¿t |
|---|---|
| Technology stack/framework/provider | `04-tech-stack-sot.md` |
| Transaction, invariant, RBAC enforcement, concurrency, audit, sensitive data | `10-tech-data-security-audit-sot.md` |
| AI upload/CV/pose/structured schema/LLM/versioning | `11-tech-ai-analysis-pipeline-sot.md` |
| Thá»© tá»± implement vÃ  test theo requirement | `12-Agent-task-splitting-sot.md` |

CÃ¡c file nÃ y khÃ´ng Ä‘Æ°á»£c tá»± thÃªm feature ngoÃ i Product Requirements hoáº·c thay Ä‘á»•i architecture cáº¥p há»‡ thá»‘ng mÃ  khÃ´ng cáº­p nháº­t file `03` vÃ  `CHANGELOG.md`.
