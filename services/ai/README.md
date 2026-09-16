# FITNESS-MANAGE AI Service

FastAPI service thá»±c hiá»‡n hai stage tÃ¡ch biá»‡t:

1. `POST /v1/analyze/pose`: táº£i signed private video, OpenCV preprocessing, MediaPipe Pose vÃ  structured JSON.
2. `POST /v1/generate/plan`: nháº­n structured JSON cÃ¹ng má»¥c tiÃªu Member rá»“i gá»i OpenAI API vá»›i Pydantic response schema.

Service khÃ´ng gá»­i raw video tá»›i OpenAI API. CÃ¡c threshold cháº¥t lÆ°á»£ng vÃ  `OPENAI_MODEL` pháº£i Ä‘Æ°á»£c Owner cáº¥u hÃ¬nh; source khÃ´ng tá»± chá»n giÃ¡ trá»‹ canonical.

Cháº¡y local sau khi táº¡o virtual environment vÃ  cÃ i `requirements.txt`:

```text
uvicorn app.main:app --reload --port 8000
```
