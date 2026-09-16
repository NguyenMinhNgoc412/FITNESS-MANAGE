# FITNESS-MANAGE â€” Quy táº¯c lÃ m viá»‡c cho AI Agent

**Pháº¡m vi:** ToÃ n bá»™ repository FITNESS-MANAGE  
**NgÃ´n ngá»¯ trao Ä‘á»•i:** Tiáº¿ng Viá»‡t  
**Nguá»“n nghiá»‡p vá»¥, kiáº¿n trÃºc vÃ  cÃ´ng nghá»‡:** Bá»™ Source of Truth trong `docs/`

---

## 1. Má»¥c tiÃªu

File nÃ y hÆ°á»›ng dáº«n AI Agent thá»±c hiá»‡n task trong repository. Agent pháº£i thay Ä‘á»•i Ä‘Ãºng pháº¡m vi yÃªu cáº§u, tuÃ¢n thá»§ Source of Truth (SOT), vÃ  bÃ¡o cÃ¡o káº¿t quáº£ cÃ³ thá»ƒ kiá»ƒm tra Ä‘Æ°á»£c.

KhÃ´ng suy diá»…n nghiá»‡p vá»¥ hoáº·c quyáº¿t Ä‘á»‹nh ká»¹ thuáº­t ngoÃ i nhá»¯ng gÃ¬ Ä‘Ã£ cÃ³ trong codebase vÃ  SOT. Stack MVP Ä‘Ã£ Ä‘Æ°á»£c chá»‘t trong `docs/04-tech-stack-sot.md` vÃ  pháº£i Ä‘Æ°á»£c tuÃ¢n thá»§.

## 2. Giao tiáº¿p vá»›i Owner

1. LuÃ´n tráº£ lá»i Owner báº±ng tiáº¿ng Viá»‡t, ká»ƒ cáº£ khi cÃ¢u há»i hoáº·c tÃ i liá»‡u tham kháº£o dÃ¹ng ngÃ´n ngá»¯ khÃ¡c.
2. TrÆ°á»›c khi thá»±c hiá»‡n thay Ä‘á»•i hoáº·c hÃ nh Ä‘á»™ng, giáº£i thÃ­ch ngáº¯n gá»n sáº½ lÃ m gÃ¬ vÃ  vÃ¬ sao viá»‡c Ä‘Ã³ cáº§n thiáº¿t.
3. NÃªu rá»§i ro cÃ³ thá»ƒ phÃ¡t sinh vÃ  áº£nh hÆ°á»Ÿng dá»± kiáº¿n. Náº¿u khÃ´ng tháº¥y rá»§i ro Ä‘Ã¡ng ká»ƒ, nÃ³i rÃµ Ä‘iá»u Ä‘Ã³.
4. Vá»›i bÆ°á»›c kháº£o sÃ¡t chá»‰ Ä‘á»c hoáº·c thao tÃ¡c kiá»ƒm tra thÃ´ng thÆ°á»ng, cÃ³ thá»ƒ gá»™p lÃ½ do vÃ  rá»§i ro vÃ o má»™t cáº­p nháº­t ngáº¯n; khÃ´ng cáº§n láº·p láº¡i giáº£i thÃ­ch dÃ i cho tá»«ng lá»‡nh.
5. KhÃ´ng biáº¿n pháº§n giáº£i thÃ­ch thÃ nh yÃªu cáº§u xin phÃ©p náº¿u Owner Ä‘Ã£ giao rÃµ task vÃ  hÃ nh Ä‘á»™ng náº±m trong pháº¡m vi Ä‘Ã³.

## 3. Äá»c tÃ i liá»‡u trÆ°á»›c khi lÃ m

Vá»›i má»—i task, Ä‘á»c theo thá»© tá»±:

1. `docs/README.md`;
2. `docs/01-product-brief-sot.md`;
3. `docs/02-product-requirements-sot.md`;
4. `docs/03-technical-architecture-sot.md`;
5. `docs/04-tech-stack-sot.md`;
6. SOT chi tiáº¿t liÃªn quan trong `docs/`;
7. `docs/CHANGELOG.md` náº¿u task thay Ä‘á»•i quyáº¿t Ä‘á»‹nh sáº£n pháº©m, kiáº¿n trÃºc hoáº·c stack.

Náº¿u task liÃªn quan báº£o máº­t, transaction, concurrency, audit hoáº·c dá»¯ liá»‡u nháº¡y cáº£m, Ä‘á»c thÃªm `docs/10-tech-data-security-audit-sot.md`.

Náº¿u task liÃªn quan AI, Ä‘á»c `docs/09-business-ai-body-analysis-sot.md` vÃ  `docs/11-tech-ai-analysis-pipeline-sot.md`.

Náº¿u task chia nhá» hoáº·c láº­p thá»© tá»± triá»ƒn khai, Ä‘á»c `docs/12-Agent-task-splitting-sot.md`.

## 4. Tech stack báº¯t buá»™c

DÃ¹ng Ä‘Ãºng stack MVP Ä‘Ã£ khÃ³a trong `docs/04-tech-stack-sot.md`:

- **Client mobile/web:** React Native, Expo, TypeScript, React Native Web, Expo Router, Zustand, React Hook Form, Zod, Axios.
- **Backend/API:** NestJS, TypeScript, REST API, JWT + Refresh Token, Prisma.
- **Database/storage:** PostgreSQL trÃªn Supabase Free vÃ  Supabase Storage.
- **AI service:** Python, FastAPI, OpenCV, MediaPipe Pose, OpenAI API qua OpenAI Python SDK.
- **Platform:** Expo Push Notifications; Git + GitHub; khÃ´ng dÃ¹ng WebSocket/Realtime trong MVP.

NestJS lÃ  authority cho authentication, RBAC, nghiá»‡p vá»¥ vÃ  cáº¥p quyá»n media. Supabase trong baseline chá»‰ cung cáº¥p PostgreSQL managed vÃ  Storage; khÃ´ng tá»± dÃ¹ng Supabase Auth, Realtime, Edge Functions hoáº·c truy cáº­p database trá»±c tiáº¿p tá»« client. KhÃ´ng thay stack báº±ng framework/provider khÃ¡c hoáº·c thÃªm cÃ´ng nghá»‡ ngoÃ i baseline náº¿u chÆ°a cáº­p nháº­t SOT vÃ  `docs/CHANGELOG.md` theo quy trÃ¬nh duyá»‡t quyáº¿t Ä‘á»‹nh.

## 5. Quy táº¯c thá»±c hiá»‡n

1. XÃ¡c Ä‘á»‹nh requirement ID vÃ  tiÃªu chÃ­ cháº¥p nháº­n trÆ°á»›c khi sá»­a.
2. KhÃ´ng thÃªm feature ngoÃ i Product Requirements.
3. KhÃ´ng Ä‘á»•i business rule Ä‘á»ƒ code dá»… hÆ¡n.
4. KhÃ´ng tá»± thÃªm Staff/Dev role. Ba role Ä‘Äƒng nháº­p lÃ  `Owner/Admin`, `PT`, `Member`; Guest/Trial khÃ´ng pháº£i role Ä‘Äƒng nháº­p.
5. KhÃ´ng biáº¿n PT assignment thÃ nh booking theo tá»«ng buá»•i.
6. Preserve history cho assignment, check-in vÃ  AI analysis; khÃ´ng ghi Ä‘Ã¨ sá»± kiá»‡n cÅ© Ä‘á»ƒ thá»ƒ hiá»‡n tráº¡ng thÃ¡i má»›i.
7. Náº¿u task AI, video pháº£i qua structured CV/pose analysis trÆ°á»›c LLM theo pipeline `video -> structured CV/pose result -> LLM`; khÃ´ng thiáº¿t káº¿ AI nhÆ° cÃ´ng cá»¥ cháº©n Ä‘oÃ¡n y khoa.
8. Náº¿u phÃ¡t hiá»‡n SOT thiáº¿u quyáº¿t Ä‘á»‹nh báº¯t buá»™c hoáº·c cÃ³ mÃ¢u thuáº«n, nÃªu Ä‘Ãºng tÃ i liá»‡u vÃ  má»¥c cÃ²n thiáº¿u/mÃ¢u thuáº«n. KhÃ´ng tá»± bá»‹a provider hoáº·c behavior.
9. Kiá»ƒm tra quyá»n á»Ÿ server/service boundary; áº©n thÃ nh pháº§n UI khÃ´ng thay tháº¿ kiá»ƒm tra quyá»n.
10. DÃ¹ng quy Æ°á»›c vÃ  cÃ´ng cá»¥ Ä‘Ã£ cÃ³ trong codebase cÃ¹ng stack táº¡i má»¥c 4. KhÃ´ng tá»± thÃªm framework, provider, thÆ° viá»‡n hoáº·c ná»n táº£ng ngoÃ i stack Ä‘Ã£ chá»‘t.
11. Thay Ä‘á»•i sáº£n pháº©m, kiáº¿n trÃºc hoáº·c stack pháº£i cáº­p nháº­t Ä‘Ãºng SOT sá»Ÿ há»¯u ná»™i dung vÃ  ghi `docs/CHANGELOG.md`.

## 6. Quy Æ°á»›c code

- TrÆ°á»›c khi sá»­a, xem cÃ¡c file lÃ¢n cáº­n Ä‘á»ƒ theo Ä‘Ãºng cÃ¡ch tá»• chá»©c, Ä‘áº·t tÃªn vÃ  Ä‘á»‹nh dáº¡ng Ä‘ang dÃ¹ng.
- Æ¯u tiÃªn thay Ä‘á»•i nhá», nháº¥t quÃ¡n vá»›i cáº¥u trÃºc hiá»‡n cÃ³; khÃ´ng Ä‘á»‹nh dáº¡ng láº¡i diá»‡n rá»™ng ngoÃ i pháº¡m vi task.
- KhÃ´ng thÃªm dependency náº¿u cÃ³ thá»ƒ Ä‘Ã¡p á»©ng yÃªu cáº§u báº±ng cÃ´ng cá»¥ hoáº·c thÆ° viá»‡n hiá»‡n cÃ³.
- KhÃ´ng Ä‘Æ°a secret, thÃ´ng tin cÃ¡ nhÃ¢n hoáº·c dá»¯ liá»‡u phÃ¢n tÃ­ch cÆ¡ thá»ƒ nháº¡y cáº£m vÃ o log, fixture hay tÃ i liá»‡u khÃ´ng cáº§n thiáº¿t.
- Thay Ä‘á»•i schema/data contract pháº£i cÃ³ migration tÆ°Æ¡ng á»©ng theo cÃ´ng cá»¥ hiá»‡n cÃ³.
- ThÃªm hoáº·c cáº­p nháº­t kiá»ƒm thá»­ cho logic nghiá»‡p vá»¥, quyá»n truy cáº­p vÃ  invariant bá»‹ áº£nh hÆ°á»Ÿng theo chiáº¿n lÆ°á»£c test cá»§a dá»± Ã¡n.

Quy táº¯c chi tiáº¿t nhÆ° dáº¥u nhÃ¡y, dáº¥u cháº¥m pháº©y, cáº¥u trÃºc thÆ° má»¥c vÃ  Ä‘á»™ rá»™ng dÃ²ng pháº£i theo cáº¥u hÃ¬nh vÃ  mÃ£ nguá»“n hiá»‡n cÃ³. Náº¿u chÆ°a cÃ³ cáº¥u hÃ¬nh tÆ°Æ¡ng á»©ng, chá»n cÃ¡ch nháº¥t quÃ¡n vá»›i pháº§n gáº§n nháº¥t trong codebase; khÃ´ng tá»± Ã¡p Ä‘áº·t quy Æ°á»›c diá»‡n rá»™ng.

## 7. Kiá»ƒm tra vÃ  hoÃ n táº¥t task

TrÆ°á»›c khi káº¿t thÃºc:

1. Sau khi hoÃ n táº¥t implementation, báº¯t buá»™c cháº¡y test phÃ¹ há»£p vá»›i task trÆ°á»›c khi tráº£ káº¿t quáº£ cho Owner.
2. Cháº¡y cÃ¡c lá»‡nh kiá»ƒm tra khÃ¡c phÃ¹ há»£p Ä‘Ã£ Ä‘Æ°á»£c cáº¥u hÃ¬nh trong repository, nhÆ° build, lint hoáº·c generate migration khi task cÃ³ áº£nh hÆ°á»Ÿng.
3. KhÃ´ng tuyÃªn bá»‘ task hoÃ n táº¥t, test hoáº·c build thÃ nh cÃ´ng náº¿u chÆ°a cháº¡y.
4. Náº¿u test khÃ´ng thá»ƒ cháº¡y, nÃªu rÃµ lá»‡nh, nguyÃªn nhÃ¢n vÃ  rá»§i ro cÃ²n láº¡i; khÃ´ng trÃ¬nh bÃ y task nhÆ° Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c minh hoÃ n toÃ n.
5. NÃªu rÃµ lá»‡nh Ä‘Ã£ cháº¡y vÃ  káº¿t quáº£.
6. TÃ³m táº¯t file Ä‘Ã£ sá»­a, test Ä‘Ã£ cháº¡y vÃ  káº¿t quáº£, requirement ID Ä‘Ã£ cover, cÃ¹ng rá»§i ro cÃ²n láº¡i náº¿u cÃ³.
7. Cáº­p nháº­t SOT/CHANGELOG khi cÃ³ thay Ä‘á»•i á»Ÿ cáº¥p quyáº¿t Ä‘á»‹nh sáº£n pháº©m hoáº·c kiáº¿n trÃºc.

## 8. Thá»© tá»± Æ°u tiÃªn khi cÃ³ mÃ¢u thuáº«n

Ãp dá»¥ng thá»© tá»± Æ°u tiÃªn Ä‘Ã£ quy Ä‘á»‹nh trong `docs/README.md`. TÃ³m táº¯t:

1. `01-product-brief-sot.md` quyáº¿t Ä‘á»‹nh Ä‘á»‹nh hÆ°á»›ng vÃ  ranh giá»›i sáº£n pháº©m.
2. `02-product-requirements-sot.md` quyáº¿t Ä‘á»‹nh requirement, hÃ nh vi vÃ  acceptance.
3. `03-technical-architecture-sot.md` quyáº¿t Ä‘á»‹nh kiáº¿n trÃºc Ä‘á»ƒ Ä‘Ã¡p á»©ng requirement.
4. `04-tech-stack-sot.md` quyáº¿t Ä‘á»‹nh framework, thÆ° viá»‡n vÃ  provider Ä‘Æ°á»£c dÃ¹ng.
5. CÃ¡c SOT chi tiáº¿t chá»‰ cá»¥ thá»ƒ hÃ³a ná»™i dung trong pháº¡m vi Ä‘Æ°á»£c giao.
6. `AGENTS.md` hÆ°á»›ng dáº«n cÃ¡ch lÃ m viá»‡c, khÃ´ng thay tháº¿ hoáº·c ghi Ä‘Ã¨ SOT.

Náº¿u phÃ¡t hiá»‡n mÃ¢u thuáº«n, Æ°u tiÃªn SOT cÃ³ tháº©m quyá»n theo `docs/README.md`, ghi nháº­n mÃ¢u thuáº«n vÃ  cáº­p nháº­t tÃ i liá»‡u liÃªn quan khi Ä‘Æ°á»£c phÃ©p.
