# FITNESS-MANAGE SOT 04 â€” Technology Stack

**Tráº¡ng thÃ¡i:** Source of Truth chÃ­nh cho lá»±a chá»n cÃ´ng nghá»‡  
**Dá»± Ã¡n:** FITNESS-MANAGE  
**NgÃ y cáº­p nháº­t:** 2026-09-16  
**Pháº¡m vi:** Stack triá»ƒn khai MVP cho mobile, web, backend, data, storage, AI, notification vÃ  source control  
**NguyÃªn táº¯c:** File nÃ y chá»‰ sá»Ÿ há»¯u quyáº¿t Ä‘á»‹nh cÃ´ng nghá»‡. KhÃ´ng tá»± thÃªm feature hoáº·c thay Ä‘á»•i nghiá»‡p vá»¥ trong `02-product-requirements-sot.md`.

---

## 1. Káº¿t luáº­n stack Ä‘Ã£ chá»‘t

FITNESS-MANAGE dÃ¹ng stack sau cho MVP:

```text
Client
  React Native + Expo + TypeScript
  React Native Web tá»« cÃ¹ng Expo codebase
  Expo Router
  Zustand
  React Hook Form + Zod
  Axios

Core Backend
  NestJS + TypeScript
  REST API
  JWT + Refresh Token
  Prisma ORM
  PostgreSQL trÃªn Supabase Free
  Supabase Storage

AI Service
  Python + FastAPI
  OpenCV
  MediaPipe Pose
  OpenAI API

Platform
  Expo Push Notifications
  KhÃ´ng dÃ¹ng WebSocket/Realtime trong MVP
  Æ¯u tiÃªn local/free tier khi deploy
  Git + GitHub
```

---

## 2. Client stack

| Nhu cáº§u | CÃ´ng nghá»‡ Ä‘Ã£ chá»‘t | Quy táº¯c |
|---|---|---|
| Mobile application | React Native + Expo | Má»™t product codebase chÃ­nh cho mobile |
| Language | TypeScript | DÃ¹ng xuyÃªn suá»‘t Expo client vÃ  NestJS backend |
| Web application | React Native Web qua Expo | Web dÃ¹ng cÃ¹ng codebase Expo; khÃ´ng táº¡o web app framework riÃªng trong MVP |
| Routing | Expo Router | Route theo role/feature nhÆ°ng authorization cuá»‘i cÃ¹ng váº«n á»Ÿ backend |
| Client/UI state | Zustand | Chá»‰ giá»¯ UI/session state phÃ¹ há»£p; khÃ´ng thay database/server state |
| Form | React Hook Form | Quáº£n lÃ½ form state |
| Validation | Zod | Validate input/form vÃ  cÃ³ thá»ƒ tÃ¡i sá»­ dá»¥ng schema á»Ÿ boundary phÃ¹ há»£p |
| HTTP client | Axios | Gá»i REST API tá»« client |
| Native session storage | Expo SecureStore | LÆ°u access/refresh token trÃªn iOS/Android; khÃ´ng lÆ°u token vÃ o AsyncStorage |
| Private media upload | Expo FileSystem | Upload file trá»±c tiáº¿p tá»›i signed URL do NestJS cáº¥p, trÃ¡nh náº¡p toÃ n bá»™ video vÃ o JS memory |

### 2.1. Quy táº¯c dÃ¹ng chung mobile vÃ  web

1. Æ¯u tiÃªn component, hook, domain adapter vÃ  validation dÃ¹ng chung.
2. Chá»‰ tÃ¡ch implementation theo platform khi capability mobile/web thá»±c sá»± khÃ¡c nhau.
3. KhÃ´ng táº¡o má»™t frontend web riÃªng báº±ng framework khÃ¡c chá»‰ Ä‘á»ƒ "dá»… lÃ m web" trong MVP.
4. UI cÃ³ thá»ƒ khÃ¡c layout theo breakpoint nhÆ°ng business flow vÃ  API contract pháº£i thá»‘ng nháº¥t.
5. Role visibility trÃªn client chá»‰ phá»¥c vá»¥ UX; quyá»n tháº­t pháº£i Ä‘Æ°á»£c NestJS kiá»ƒm tra á»Ÿ API/service boundary.

---

## 3. Backend & API stack

| Nhu cáº§u | CÃ´ng nghá»‡ Ä‘Ã£ chá»‘t | Quy táº¯c |
|---|---|---|
| Backend framework | NestJS | Backend nghiá»‡p vá»¥ chÃ­nh |
| Language | TypeScript | Äá»“ng bá»™ type discipline vá»›i client |
| API style | REST API | KhÃ´ng dÃ¹ng GraphQL trong baseline MVP |
| Authentication | JWT + Refresh Token | NestJS quáº£n lÃ½ auth/session lifecycle |
| ORM | Prisma | Truy cáº­p relational data vÃ  migration |
| Database | PostgreSQL trÃªn Supabase Free | Supabase Ä‘Ã³ng vai trÃ² managed PostgreSQL |

### 3.1. Backend lÃ  authority

NestJS lÃ  application/backend authority cho:

- authentication vÃ  refresh-token flow;
- RBAC cho `Owner/Admin`, `PT`, `Member`;
- Memberâ€“PT assignment;
- schedule/check-in/attendance reconciliation;
- Guest conversion;
- audit/history;
- cáº¥p quyá»n truy cáº­p media;
- orchestration sang AI service.

Client khÃ´ng Ä‘Æ°á»£c truy cáº­p trá»±c tiáº¿p PostgreSQL Ä‘á»ƒ bypass backend rule.

### 3.2. Supabase boundary

Trong MVP, Supabase Ä‘Æ°á»£c chá»‘t cho:

1. **PostgreSQL managed database**;
2. **Supabase Storage**.

KhÃ´ng máº·c Ä‘á»‹nh dÃ¹ng thÃªm:

- Supabase Auth;
- Supabase Realtime;
- Edge Functions;
- database access trá»±c tiáº¿p tá»« client;
- feature Supabase khÃ¡c chá»‰ vÃ¬ cÃ³ sáºµn.

Muá»‘n bá»• sung pháº£i update SOT vÃ  `CHANGELOG.md`.

---

## 4. Authentication

CÆ¡ cháº¿ Ä‘Ã£ chá»‘t:

```text
Login
  -> NestJS xÃ¡c thá»±c account
  -> issue access JWT + refresh token
  -> client lÆ°u session theo cÆ¡ cháº¿ an toÃ n phÃ¹ há»£p platform
  -> access JWT dÃ¹ng gá»i REST API
  -> refresh token dÃ¹ng láº¥y access JWT má»›i
```

Quy táº¯c:

1. KhÃ´ng dÃ¹ng Supabase Auth trong baseline nÃ y.
2. Backend pháº£i kiá»ƒm tra role/scope trÃªn má»—i endpoint nháº¡y cáº£m.
3. Refresh token pháº£i cÃ³ lifecycle rÃµ: issue, rotate/revoke theo implementation Ä‘Æ°á»£c duyá»‡t.
4. KhÃ´ng coi route guard phÃ­a client lÃ  security boundary.
5. Test pháº£i cÃ³ session Ä‘á»™c láº­p cho ba role.
6. iOS/Android lÆ°u session báº±ng Expo SecureStore vá»›i pháº¡m vi thiáº¿t bá»‹; web chá»‰ giá»¯ token trong memory á»Ÿ baseline vÃ  yÃªu cáº§u Ä‘Äƒng nháº­p láº¡i sau khi reload, khÃ´ng persist refresh token trong localStorage/AsyncStorage.

Chi tiáº¿t behavior role náº±m á»Ÿ `05-business-auth-role-access-sot.md` vÃ  security contract náº±m á»Ÿ `10-tech-data-security-audit-sot.md`.

---

## 5. Data stack

### 5.1. PostgreSQL + Prisma

PostgreSQL lÃ  relational source of truth cho dá»¯ liá»‡u nghiá»‡p vá»¥ nhÆ°:

- users/account;
- PT profile;
- Member profile;
- Memberâ€“PT assignment history;
- schedule;
- raw check-in;
- attendance reconciliation;
- Guest/trial/conversion;
- AI analysis metadata/result;
- audit.

Prisma chá»‹u trÃ¡ch nhiá»‡m:

- schema mapping;
- migration;
- typed database access trong NestJS;
- transaction cho cÃ¡c flow cáº§n atomicity.

KhÃ´ng dÃ¹ng client-side ORM Ä‘á»ƒ truy cáº­p database trá»±c tiáº¿p.

### 5.2. Transaction-critical flows

Báº¯t buá»™c dÃ¹ng transaction phÃ¹ há»£p cho tá»‘i thiá»ƒu:

- táº¡o Member + initial PT assignment;
- Ä‘á»•i PT;
- Guest -> Member conversion;
- mutation attendance/audit cÃ³ nhiá»u record liÃªn quan;
- cÃ¡c flow khÃ¡c Ä‘Æ°á»£c `10-tech-data-security-audit-sot.md` Ä‘Ã¡nh dáº¥u atomic.

---

## 6. Storage stack

Storage Ä‘Ã£ chá»‘t: **Supabase Storage**.

DÃ¹ng cho binary/media nhÆ°:

- video cÆ¡ thá»ƒ phá»¥c vá»¥ AI analysis;
- media/result artifact náº¿u requirement thá»±c táº¿ cáº§n;
- file khÃ´ng phÃ¹ há»£p lÆ°u trá»±c tiáº¿p trong PostgreSQL.

Quy táº¯c:

1. Raw body video pháº£i private máº·c Ä‘á»‹nh.
2. Metadata thuá»™c database; binary náº±m trong Storage.
3. Backend kiá»ƒm soÃ¡t quyá»n truy cáº­p media.
4. KhÃ´ng dÃ¹ng public bucket cho raw body video.
5. Client khÃ´ng Ä‘Æ°á»£c dá»±a vÃ o path Ä‘oÃ¡n Ä‘Æ°á»£c Ä‘á»ƒ coi lÃ  authorization.
6. Upload/download nÃªn dÃ¹ng access mechanism cÃ³ thá»i háº¡n hoáº·c flow do backend cáº¥p quyá»n náº¿u implementation cáº§n client truyá»n file trá»±c tiáº¿p tá»›i Storage.

---

## 7. AI service stack

| Nhu cáº§u | CÃ´ng nghá»‡ Ä‘Ã£ chá»‘t |
|---|---|
| AI microservice/API | Python + FastAPI |
| Computer Vision | OpenCV |
| Pose estimation | MediaPipe Pose |
| Generative AI | OpenAI API qua OpenAI Python SDK |

### 7.1. Service boundary

Kiáº¿n trÃºc AI báº¯t buá»™c:

```text
NestJS/Core Backend
  -> yÃªu cáº§u AI analysis
  -> FastAPI AI Service
      -> OpenCV preprocessing
      -> MediaPipe Pose extraction
      -> structured JSON
      -> OpenAI API
      -> structured recommendation/training plan
  -> NestJS persist/result authorization
```

### 7.2. Rule báº¯t buá»™c

1. OpenAI API **khÃ´ng nháº­n raw body video lÃ m nguá»“n phÃ¢n tÃ­ch chÃ­nh trong baseline**.
2. Video pháº£i qua OpenCV + MediaPipe Pose trÆ°á»›c.
3. Táº§ng CV/Pose táº¡o structured JSON cÃ³ quality/confidence/context cáº§n thiáº¿t.
4. OpenAI API nháº­n structured JSON vÃ  context nghiá»‡p vá»¥ Ä‘Æ°á»£c phÃ©p Ä‘á»ƒ sinh lá»i khuyÃªn/lá»™ trÃ¬nh.
5. AI output pháº£i validate theo schema trÆ°á»›c khi persist/hiá»ƒn thá»‹.
6. KhÃ´ng biáº¿n AI thÃ nh medical diagnosis.
7. Version cá»§a structured schema/pipeline/model pháº£i Ä‘Æ°á»£c lÆ°u Ä‘á»§ Ä‘á»ƒ debug/audit theo `11-tech-ai-analysis-pipeline-sot.md`.

---

## 8. Notification

Notification Ä‘Ã£ chá»‘t: **Expo Push Notifications**.

Baseline:

- dÃ¹ng cho push notification khi requirement tÆ°Æ¡ng á»©ng Ä‘Æ°á»£c implement;
- backend quáº£n lÃ½ logic phÃ¡t notification;
- Expo client Ä‘Äƒng kÃ½ push token theo flow phÃ¹ há»£p;
- notification khÃ´ng Ä‘Æ°á»£c tá»± trá»Ÿ thÃ nh source of truth cho lá»‹ch/check-in/attendance.

File stack nÃ y khÃ´ng tá»± thÃªm loáº¡i notification má»›i náº¿u Product Requirements chÆ°a yÃªu cáº§u.

---

## 9. Realtime

MVP **khÃ´ng cáº§n WebSocket**.

Quy táº¯c:

1. REST API lÃ  transport chÃ­nh.
2. KhÃ´ng báº­t Supabase Realtime chá»‰ vÃ¬ database Ä‘ang Ä‘áº·t trÃªn Supabase.
3. Dá»¯ liá»‡u cáº§n refresh cÃ³ thá»ƒ dÃ¹ng request láº¡i, refetch hoáº·c polling cÃ³ kiá»ƒm soÃ¡t náº¿u requirement thá»±c táº¿ cáº§n.
4. WebSocket/Realtime chá»‰ Ä‘Æ°á»£c bá»• sung sau khi cÃ³ use case rÃµ vÃ  owner duyá»‡t.

---

## 10. Deployment & cost rule

Má»¥c tiÃªu triá»ƒn khai MVP:

- Æ°u tiÃªn cháº¡y local trong quÃ¡ trÃ¬nh phÃ¡t triá»ƒn;
- Æ°u tiÃªn free tier hoáº·c chi phÃ­ tháº¥p;
- PostgreSQL dÃ¹ng Supabase Free theo quyáº¿t Ä‘á»‹nh hiá»‡n táº¡i;
- Storage dÃ¹ng Supabase Storage;
- khÃ´ng tá»± chá»n thÃªm paid infrastructure khi chÆ°a cÃ³ nhu cáº§u;
- provider deploy cá»¥ thá»ƒ cho NestJS/FastAPI/web **chÆ°a Ä‘Æ°á»£c khÃ³a bá»Ÿi danh sÃ¡ch stack nÃ y**, vÃ¬ váº­y Agent khÃ´ng Ä‘Æ°á»£c tá»± biáº¿n má»™t lá»±a chá»n deploy táº¡m thÃ nh SOT canonical.

Khi owner chá»‘t host cá»¥ thá»ƒ, cáº­p nháº­t file nÃ y + `CHANGELOG.md`.

---

## 11. Source control

Source control Ä‘Ã£ chá»‘t:

```text
Git + GitHub
```

Quy táº¯c:

- code vÃ  migration pháº£i version-controlled;
- khÃ´ng commit secret/API key;
- `.env` tháº­t khÃ´ng Ä‘Æ°a lÃªn repository;
- tÃ i liá»‡u SOT náº±m cÃ¹ng repository/project docs Ä‘á»ƒ Codex Ä‘á»c trÆ°á»›c khi implement;
- thay Ä‘á»•i decision-level pháº£i Ä‘i cÃ¹ng update SOT/CHANGELOG phÃ¹ há»£p.

---

## 12. Testing tooling status

Requirement báº¯t buá»™c cÃ³ test Ä‘Ã£ náº±m trong Product Requirements/Technical Architecture, nhÆ°ng **tÃªn testing library cá»¥ thá»ƒ chÆ°a Ä‘Æ°á»£c owner khÃ³a trong danh sÃ¡ch tech stack nÃ y**.

Do Ä‘Ã³:

- khÃ´ng ghi Jest/Vitest/Playwright/Maestro/Detox thÃ nh canonical chá»‰ báº±ng suy Ä‘oÃ¡n;
- cÃ³ thá»ƒ dÃ¹ng tooling Ä‘Ã£ tá»“n táº¡i trong codebase sau khi project setup náº¿u phÃ¹ há»£p, nhÆ°ng náº¿u muá»‘n khÃ³a thÃ nh SOT pháº£i cáº­p nháº­t file nÃ y;
- invariant quan trá»ng váº«n báº¯t buá»™c cÃ³ test báº¥t ká»ƒ thÆ° viá»‡n test cuá»‘i cÃ¹ng lÃ  gÃ¬.

---

## 13. Stack khÃ´ng dÃ¹ng trong baseline MVP

KhÃ´ng tá»± thay baseline báº±ng:

| KhÃ´ng dÃ¹ng/thÃªm máº·c Ä‘á»‹nh | LÃ½ do |
|---|---|
| Flutter | Client Ä‘Ã£ chá»‘t React Native + Expo |
| Web frontend riÃªng báº±ng framework khÃ¡c | Web Ä‘Ã£ chá»‘t React Native Web cÃ¹ng Expo codebase |
| Redux lÃ m state chÃ­nh | Zustand Ä‘Ã£ chá»‘t |
| GraphQL | REST API Ä‘Ã£ chá»‘t |
| Supabase Auth | Auth Ä‘Ã£ chá»‘t JWT + Refresh Token do NestJS quáº£n lÃ½ |
| Firebase lÃ m backend/database chÃ­nh | Backend/data stack Ä‘Ã£ chá»‘t NestJS + PostgreSQL/Supabase |
| WebSocket/Supabase Realtime á»Ÿ MVP | ChÆ°a cáº§n realtime |
| Raw video -> LLM trá»±c tiáº¿p | TrÃ¡i pipeline AI Ä‘Ã£ chá»‘t |
| ORM khÃ¡c thay Prisma | Prisma Ä‘Ã£ chá»‘t |

Danh sÃ¡ch nÃ y lÃ  baseline hiá»‡n táº¡i, khÃ´ng pháº£i cáº¥m vÄ©nh viá»…n. Má»i thay Ä‘á»•i cáº§n owner duyá»‡t vÃ  update SOT.

---

## 14. Dependency/implementation rule

1. Æ¯u tiÃªn package tÆ°Æ¡ng thÃ­ch chÃ­nh thá»©c vá»›i phiÃªn báº£n Expo/NestJS/FastAPI Ä‘ang dÃ¹ng khi báº¯t Ä‘áº§u implementation.
2. KhÃ´ng hard-code version package vÃ o SOT náº¿u owner chÆ°a chá»‘t version cá»¥ thá»ƒ.
3. Khi package native thuá»™c Expo ecosystem, dÃ¹ng cÃ¡ch cÃ i Ä‘áº·t tÆ°Æ¡ng thÃ­ch Expo thay vÃ¬ Ã©p version khÃ´ng phÃ¹ há»£p.
4. KhÃ´ng thÃªm má»™t library thá»© hai giáº£i cÃ¹ng bÃ i toÃ¡n náº¿u stack hiá»‡n táº¡i Ä‘Ã£ Ä‘Ã¡p á»©ng Ä‘á»§.
5. KhÃ´ng thay Axios báº±ng client khÃ¡c, Prisma báº±ng ORM khÃ¡c hoáº·c Zustand báº±ng state library khÃ¡c náº¿u chÆ°a cÃ³ decision change.

---

## 15. Quy táº¯c thay Ä‘á»•i tech stack

Muá»‘n thay báº¥t ká»³ lá»±a chá»n nÃ o trong file nÃ y pháº£i ghi rÃµ:

1. cÃ´ng nghá»‡ hiá»‡n táº¡i;
2. cÃ´ng nghá»‡ Ä‘á» xuáº¥t;
3. lÃ½ do;
4. requirement/non-functional need nÃ o yÃªu cáº§u thay Ä‘á»•i;
5. áº£nh hÆ°á»Ÿng client/backend/database/AI;
6. migration plan;
7. áº£nh hÆ°á»Ÿng deploy/cost;
8. áº£nh hÆ°á»Ÿng testing;
9. rollback plan náº¿u phÃ¹ há»£p.

Sau khi owner duyá»‡t:

- cáº­p nháº­t `04-tech-stack-sot.md`;
- cáº­p nháº­t `03-technical-architecture-sot.md` náº¿u architecture bá»‹ áº£nh hÆ°á»Ÿng;
- cáº­p nháº­t technical detail liÃªn quan;
- ghi `CHANGELOG.md`.
