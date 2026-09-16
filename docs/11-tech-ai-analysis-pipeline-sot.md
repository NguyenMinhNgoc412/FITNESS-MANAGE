# FITNESS-MANAGE SOT 11 â€” Technical Spec: AI Analysis Pipeline

**Tráº¡ng thÃ¡i:** SOT ká»¹ thuáº­t chi tiáº¿t  
**Dá»± Ã¡n:** FITNESS-MANAGE  
**NgÃ y cáº­p nháº­t:** 2026-09-16  
**LiÃªn quan:** `PR-AI-001..004`, `03-technical-architecture-sot.md`, `04-tech-stack-sot.md`, `09-business-ai-body-analysis-sot.md`  
**NguyÃªn táº¯c:** Pipeline Ä‘Ã£ khÃ³a `FastAPI -> OpenCV -> MediaPipe Pose -> structured JSON -> OpenAI API`. KhÃ´ng Ä‘Æ°á»£c Ä‘á»•i thÃ nh â€œraw video -> LLM -> káº¿t luáº­nâ€.

---

## 1. Pipeline chuáº©n

```text
Member video
  -> upload validation
  -> media preprocessing
  -> OpenCV frame preprocessing
  -> MediaPipe Pose extraction
  -> quality evaluation
  -> structured feature JSON
  -> recommendation context builder
  -> OpenAI API generation
  -> output schema validation
  -> persist result/version
```

---

## 2. Analysis run state machine

Tá»‘i thiá»ƒu:

```text
UPLOADED
  -> VALIDATING
  -> ANALYZING
  -> COMPLETED
```

NhÃ¡nh lá»—i:

```text
VALIDATING -> NEEDS_RETAKE
VALIDATING -> FAILED
ANALYZING  -> FAILED
```

KhÃ´ng set `COMPLETED` náº¿u chÆ°a cÃ³ output há»£p lá»‡ theo schema.

---

## 3. Upload boundary

Backend/service pháº£i validate:

- actor lÃ  Member há»£p lá»‡ hoáº·c flow Ä‘Æ°á»£c á»§y quyá»n;
- file type cho phÃ©p;
- file size/duration theo budget implementation Ä‘Ã£ duyá»‡t;
- media reference thuá»™c Ä‘Ãºng Member;
- khÃ´ng public upload path.

Budget sá»‘ cá»¥ thá»ƒ chÆ°a cÃ³ trong source hiá»‡n táº¡i, vÃ¬ váº­y khÃ´ng hard-code vÃ o SOT nÃ y.

---

## 4. Input preprocessing

Má»¥c tiÃªu:

- decode media an toÃ n;
- chá»n frame/keyframe cáº§n thiáº¿t;
- normalize orientation/resolution khi pipeline cáº§n;
- khÃ´ng Ä‘Æ°a toÃ n bá»™ binary vÃ o application state/cache khÃ´ng cáº§n thiáº¿t.

Implementation preprocessing náº±m trong Python/FastAPI service vÃ  dÃ¹ng OpenCV; output sang MediaPipe Pose pháº£i Ä‘á»§ deterministic Ä‘á»ƒ debug/version.

---

## 5. CV / Pose extraction contract

Output structured tá»‘i thiá»ƒu nÃªn cÃ³ shape logic:

```json
{
  "schemaVersion": "...",
  "inputQuality": {
    "status": "VALID|NEEDS_RETAKE|INSUFFICIENT",
    "reasons": []
  },
  "pose": {
    "features": {},
    "keypoints": [],
    "derivedMetrics": {}
  },
  "confidence": {},
  "warnings": [],
  "analyzerVersion": "..."
}
```

TÃªn field váº­t lÃ½ cÃ³ thá»ƒ khÃ¡c, nhÆ°ng pháº£i giá»¯ cÃ¡c nhÃ³m Ã½ nghÄ©a:

- quality;
- extracted feature;
- confidence;
- warning;
- schema/analyzer version.

KhÃ´ng Ä‘Æ°a diagnosis y khoa vÃ o structured result náº¿u product chÆ°a duyá»‡t.

---

## 6. Confidence gate

TrÆ°á»›c LLM:

1. náº¿u input invalid -> `NEEDS_RETAKE`/`FAILED`;
2. náº¿u feature critical thiáº¿u -> context pháº£i Ä‘Ã¡nh dáº¥u insufficient;
3. náº¿u confidence tháº¥p -> generation prompt/context pháº£i giá»¯ uncertainty;
4. khÃ´ng tá»± fill missing metric báº±ng giÃ¡ trá»‹ tÆ°á»Ÿng tÆ°á»£ng.

---

## 7. OpenAI context builder

OpenAI API chá»‰ nháº­n dá»¯ liá»‡u cáº§n thiáº¿t:

- structured CV/pose result;
- goal/context Member Ä‘Æ°á»£c phÃ©p;
- safety/product instruction;
- output schema.

KhÃ´ng gá»­i raw video trá»±c tiáº¿p cho OpenAI API trong baseline; input chÃ­nh lÃ  structured JSON tá»« OpenCV/MediaPipe Pose.

KhÃ´ng Ä‘Æ°a secret/internal audit khÃ´ng liÃªn quan vÃ o prompt.

---

## 8. Output schema

Output logic nÃªn cÃ³ cáº¥u trÃºc thay vÃ¬ prose tá»± do duy nháº¥t:

```json
{
  "summary": "...",
  "focusAreas": [],
  "recommendations": [],
  "trainingPlan": {
    "phases": []
  },
  "limitations": [],
  "safetyFlags": []
}
```

Schema cá»¥ thá»ƒ cÃ³ thá»ƒ má»Ÿ rá»™ng khi requirement thay Ä‘á»•i, nhÆ°ng pháº£i validate trÆ°á»›c khi persist `COMPLETED`.

---

## 9. Versioning

Má»—i run cáº§n truy Ä‘Æ°á»£c:

- pipeline version;
- structured schema version;
- analyzer/model version á»Ÿ má»©c há»‡ thá»‘ng cho phÃ©p lÆ°u;
- generation/prompt version;
- thá»i Ä‘iá»ƒm táº¡o.

Má»¥c tiÃªu lÃ  giáº£i thÃ­ch vÃ¬ sao hai run khÃ¡c nhau cÃ³ thá»ƒ cho output khÃ¡c nhau mÃ  khÃ´ng rewrite lá»‹ch sá»­.

---

## 10. Retry strategy

### 10.1. Upload retry

Pháº£i trÃ¡nh táº¡o nhiá»u run ngoÃ i Ã½ muá»‘n náº¿u client retry cÃ¹ng request.

### 10.2. CV fail

Cho retry theo policy; khÃ´ng táº¡o LLM output náº¿u structured result chÆ°a há»£p lá»‡.

### 10.3. LLM fail sau CV success

CÃ³ thá»ƒ retry generation tá»« structured result Ä‘Ã£ lÆ°u, khÃ´ng báº¯t buá»™c reprocess video náº¿u analyzer result váº«n há»£p lá»‡.

### 10.4. Permanent failure

Persist tráº¡ng thÃ¡i lá»—i an toÃ n; khÃ´ng lá»™ stack trace/model secret cho Member.

---

## 11. Storage & access

- raw video á»Ÿ private Supabase Storage;
- metadata/run á»Ÿ relational/domain store;
- structured result vÃ  plan gáº¯n run id;
- access raw video/result pháº£i kiá»ƒm tra role scope;
- khÃ´ng dÃ¹ng public URL lÃ¢u dÃ i máº·c Ä‘á»‹nh;
- retention khÃ´ng tá»± quyáº¿t Ä‘á»‹nh trong code náº¿u chÆ°a cÃ³ product policy.

---

## 12. Observability

Theo dÃµi tá»‘i thiá»ƒu:

- run duration theo stage;
- failure reason category;
- retake rate;
- analyzer/generation version;
- correlation id.

KhÃ´ng log raw body video hoáº·c prompt chá»©a dá»¯ liá»‡u nháº¡y cáº£m má»™t cÃ¡ch khÃ´ng cáº§n thiáº¿t.

---

## 13. Test strategy

### Unit

- quality gate;
- structured schema validation;
- confidence/insufficient-data mapping;
- output schema validation;
- permission mapping.

### Integration

- upload -> run creation;
- CV result -> generation;
- generation fail -> retry;
- history khÃ´ng overwrite.

### AI regression fixture

DÃ¹ng táº­p input fixture Ä‘Æ°á»£c kiá»ƒm soÃ¡t Ä‘á»ƒ kiá»ƒm tra:

- pose extraction khÃ´ng Ä‘á»•i báº¥t ngá»;
- low-quality input bá»‹ tá»« chá»‘i Ä‘Ãºng;
- output luÃ´n giá»¯ safety boundary;
- schema backward compatibility khi version thay Ä‘á»•i.

---

## 14. Acceptance checklist ká»¹ thuáº­t

- [ ] KhÃ´ng cÃ³ Ä‘Æ°á»ng táº¯t raw video -> LLM káº¿t luáº­n toÃ n bá»™.
- [ ] Run cÃ³ state rÃµ.
- [ ] CV structured output cÃ³ version/confidence.
- [ ] Invalid input dá»«ng trÆ°á»›c generation.
- [ ] LLM context khÃ´ng tá»± fill missing data.
- [ ] Output validate schema trÆ°á»›c `COMPLETED`.
- [ ] Run má»›i khÃ´ng overwrite run cÅ©.
- [ ] Retry khÃ´ng táº¡o duplicate run ngoÃ i Ã½ muá»‘n.
- [ ] Raw media private vÃ  scope access Ä‘Ãºng.
- [ ] KhÃ´ng cháº©n Ä‘oÃ¡n y khoa á»Ÿ pipeline output.
