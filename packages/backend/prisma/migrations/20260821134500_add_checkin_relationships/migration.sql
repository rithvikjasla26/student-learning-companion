-- Add taughtLogId to check_in_sessions
ALTER TABLE "check_in_sessions" ADD COLUMN "taughtLogId" TEXT;

-- Add sessionType to check_in_sessions (FIRST_PASS | SPACED_REVIEW)
ALTER TABLE "check_in_sessions" ADD COLUMN "sessionType" TEXT NOT NULL DEFAULT 'FIRST_PASS';

-- Add checkInSessionId to study_activities
ALTER TABLE "study_activities" ADD COLUMN "checkInSessionId" TEXT;

-- Add foreign key for taughtLogId
ALTER TABLE "check_in_sessions" ADD CONSTRAINT "check_in_sessions_taughtLogId_fkey" FOREIGN KEY ("taughtLogId") REFERENCES "taught_logs"("id") ON DELETE SET NULL;

-- Add foreign key for checkInSessionId in study_activities
ALTER TABLE "study_activities" ADD CONSTRAINT "study_activities_checkInSessionId_fkey" FOREIGN KEY ("checkInSessionId") REFERENCES "check_in_sessions"("id") ON DELETE SET NULL;

-- Create index for efficient lookups
CREATE INDEX "check_in_sessions_taughtLogId_idx" ON "check_in_sessions"("taughtLogId");
CREATE INDEX "study_activities_checkInSessionId_idx" ON "study_activities"("checkInSessionId");
