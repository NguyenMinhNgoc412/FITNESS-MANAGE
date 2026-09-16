# FITNESS-MANAGE

MVP quáº£n lÃ½ phÃ²ng gym cÃ¡ nhÃ¢n theo SOT trong `docs/`.

## Cháº¡y dá»± Ã¡n

1. Sao chÃ©p `apps/api/.env.example` thÃ nh `apps/api/.env` vÃ  Ä‘áº·t connection string PostgreSQL/Supabase cÃ¹ng JWT secrets.
2. Sao chÃ©p `apps/app/.env.example` thÃ nh `apps/app/.env` vÃ  Ä‘áº·t URL API phÃ¹ há»£p thiáº¿t bá»‹.
3. Cháº¡y `pnpm install`.
4. Cháº¡y `pnpm --filter @fitness/api prisma:generate`.
5. Cháº¡y `pnpm --filter @fitness/api prisma:migrate`.
6. Cháº¡y `pnpm --filter @fitness/api prisma:seed` Ä‘á»ƒ táº¡o tÃ i khoáº£n test.
7. DÃ¹ng `pnpm dev:api` vÃ  `pnpm dev:app`.

TÃ i khoáº£n seed dÃ¹ng máº­t kháº©u `ChangeMe123!`: `owner@example.test`, `pt@example.test`, `member@example.test`.

KhÃ´ng dÃ¹ng cÃ¡c tÃ i khoáº£n nÃ y trong mÃ´i trÆ°á»ng tháº­t.

## AI service

AI service náº±m táº¡i `services/ai`. Táº¡o mÃ´i trÆ°á»ng Python riÃªng, cÃ i `services/ai/requirements.txt`, cáº¥u hÃ¬nh theo `services/ai/.env.example`, rá»“i cháº¡y:

```text
uvicorn app.main:app --app-dir services/ai --port 8000
```

`OPENAI_MODEL` vÃ  cÃ¡c quality threshold pháº£i Ä‘Æ°á»£c Owner cáº¥u hÃ¬nh. Raw video chá»‰ Ä‘Æ°á»£c lÆ°u trong private Supabase Storage vÃ  khÃ´ng Ä‘Æ°á»£c gá»­i tá»›i OpenAI API.
