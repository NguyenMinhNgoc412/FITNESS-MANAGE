CREATE TYPE "WindowType" AS ENUM ('FIXED', 'FLEXIBLE');
CREATE TYPE "ScheduleStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "AttendanceStatus" AS ENUM ('MATCHED', 'MEMBER_ONLY', 'PT_ONLY', 'MISSING', 'NEEDS_REVIEW');

CREATE TABLE "TrainingSchedule" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "ptId" TEXT NOT NULL,
  "windowType" "WindowType" NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "windowEnd" TIMESTAMP(3) NOT NULL,
  "status" "ScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingSchedule_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Checkin" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "actorRole" "Role" NOT NULL,
  "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "scheduleId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Checkin_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AttendanceReconciliation" (
  "id" TEXT NOT NULL,
  "scheduleId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "ptId" TEXT NOT NULL,
  "memberCheckinId" TEXT,
  "ptCheckinId" TEXT,
  "status" "AttendanceStatus" NOT NULL,
  "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AttendanceReconciliation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GuestTrial" (
  "id" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "note" TEXT,
  "trialAt" TIMESTAMP(3) NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "convertedAt" TIMESTAMP(3),
  "convertedMemberId" TEXT,
  "conversionIdempotencyKey" TEXT,
  CONSTRAINT "GuestTrial_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "TrainingSchedule" ADD CONSTRAINT "TrainingSchedule_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MemberProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainingSchedule" ADD CONSTRAINT "TrainingSchedule_ptId_fkey" FOREIGN KEY ("ptId") REFERENCES "PTProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainingSchedule" ADD CONSTRAINT "TrainingSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Checkin" ADD CONSTRAINT "Checkin_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Checkin" ADD CONSTRAINT "Checkin_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TrainingSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AttendanceReconciliation" ADD CONSTRAINT "AttendanceReconciliation_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TrainingSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AttendanceReconciliation" ADD CONSTRAINT "AttendanceReconciliation_memberCheckinId_fkey" FOREIGN KEY ("memberCheckinId") REFERENCES "Checkin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AttendanceReconciliation" ADD CONSTRAINT "AttendanceReconciliation_ptCheckinId_fkey" FOREIGN KEY ("ptCheckinId") REFERENCES "Checkin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GuestTrial" ADD CONSTRAINT "GuestTrial_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GuestTrial" ADD CONSTRAINT "GuestTrial_convertedMemberId_fkey" FOREIGN KEY ("convertedMemberId") REFERENCES "MemberProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Checkin_idempotencyKey_key" ON "Checkin"("idempotencyKey");
CREATE UNIQUE INDEX "AttendanceReconciliation_scheduleId_key" ON "AttendanceReconciliation"("scheduleId");
CREATE UNIQUE INDEX "GuestTrial_convertedMemberId_key" ON "GuestTrial"("convertedMemberId");
CREATE UNIQUE INDEX "GuestTrial_conversionIdempotencyKey_key" ON "GuestTrial"("conversionIdempotencyKey");
CREATE INDEX "TrainingSchedule_memberId_windowStart_idx" ON "TrainingSchedule"("memberId", "windowStart");
CREATE INDEX "TrainingSchedule_ptId_windowStart_idx" ON "TrainingSchedule"("ptId", "windowStart");
CREATE INDEX "Checkin_actorUserId_checkedInAt_idx" ON "Checkin"("actorUserId", "checkedInAt");
CREATE INDEX "Checkin_scheduleId_idx" ON "Checkin"("scheduleId");
CREATE INDEX "AttendanceReconciliation_status_evaluatedAt_idx" ON "AttendanceReconciliation"("status", "evaluatedAt");
CREATE INDEX "GuestTrial_phone_idx" ON "GuestTrial"("phone");
CREATE INDEX "GuestTrial_email_idx" ON "GuestTrial"("email");
CREATE INDEX "GuestTrial_trialAt_idx" ON "GuestTrial"("trialAt");
