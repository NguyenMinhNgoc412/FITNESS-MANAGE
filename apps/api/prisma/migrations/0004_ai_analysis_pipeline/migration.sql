CREATE TYPE "AiRunStatus" AS ENUM ('UPLOAD_PENDING', 'UPLOADED', 'VALIDATING', 'ANALYZING', 'NEEDS_RETAKE', 'COMPLETED', 'FAILED');
CREATE TABLE "AiAnalysisRun" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "mediaPath" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "status" "AiRunStatus" NOT NULL DEFAULT 'UPLOAD_PENDING',
  "idempotencyKey" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "pipelineVersion" TEXT NOT NULL,
  "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "AiAnalysisRun_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AiAnalysisResult" (
  "id" TEXT NOT NULL,
  "analysisRunId" TEXT NOT NULL,
  "inputQuality" JSONB NOT NULL,
  "extractedFeatures" JSONB NOT NULL,
  "confidence" JSONB NOT NULL,
  "warnings" JSONB NOT NULL,
  "schemaVersion" TEXT NOT NULL,
  "analyzerVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiAnalysisResult_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TrainingPlanOutput" (
  "id" TEXT NOT NULL,
  "analysisRunId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "focusAreas" JSONB NOT NULL,
  "recommendations" JSONB NOT NULL,
  "trainingPlan" JSONB NOT NULL,
  "limitations" JSONB NOT NULL,
  "safetyFlags" JSONB NOT NULL,
  "promptVersion" TEXT NOT NULL,
  "modelVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrainingPlanOutput_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "AiAnalysisRun" ADD CONSTRAINT "AiAnalysisRun_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MemberProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AiAnalysisResult" ADD CONSTRAINT "AiAnalysisResult_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AiAnalysisRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainingPlanOutput" ADD CONSTRAINT "TrainingPlanOutput_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AiAnalysisRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "AiAnalysisRun_idempotencyKey_key" ON "AiAnalysisRun"("idempotencyKey");
CREATE UNIQUE INDEX "AiAnalysisRun_correlationId_key" ON "AiAnalysisRun"("correlationId");
CREATE UNIQUE INDEX "AiAnalysisResult_analysisRunId_key" ON "AiAnalysisResult"("analysisRunId");
CREATE UNIQUE INDEX "TrainingPlanOutput_analysisRunId_key" ON "TrainingPlanOutput"("analysisRunId");
CREATE INDEX "AiAnalysisRun_memberId_createdAt_idx" ON "AiAnalysisRun"("memberId", "createdAt");
CREATE INDEX "AiAnalysisRun_status_createdAt_idx" ON "AiAnalysisRun"("status", "createdAt");
