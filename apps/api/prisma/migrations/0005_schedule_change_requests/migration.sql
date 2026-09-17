CREATE TYPE "ScheduleChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "ScheduleChangeRequest" (
  "id" TEXT NOT NULL,
  "scheduleId" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "requestedStart" TIMESTAMP(3) NOT NULL,
  "requestedEnd" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "status" "ScheduleChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reviewerId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScheduleChangeRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ScheduleChangeRequest" ADD CONSTRAINT "ScheduleChangeRequest_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TrainingSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScheduleChangeRequest" ADD CONSTRAINT "ScheduleChangeRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScheduleChangeRequest" ADD CONSTRAINT "ScheduleChangeRequest_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "ScheduleChangeRequest_scheduleId_status_idx" ON "ScheduleChangeRequest"("scheduleId", "status");
CREATE INDEX "ScheduleChangeRequest_requesterId_createdAt_idx" ON "ScheduleChangeRequest"("requesterId", "createdAt");
CREATE UNIQUE INDEX "ScheduleChangeRequest_one_pending_per_schedule" ON "ScheduleChangeRequest"("scheduleId") WHERE "status" = 'PENDING';
