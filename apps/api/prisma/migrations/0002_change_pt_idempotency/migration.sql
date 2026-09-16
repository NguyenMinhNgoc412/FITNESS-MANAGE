ALTER TABLE "Assignment"
  ADD COLUMN "changeReason" TEXT,
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "scheduleReviewRequired" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "Assignment_idempotencyKey_key"
  ON "Assignment"("idempotencyKey");
