-- CreateTable
CREATE TABLE "study_activities" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "taughtLogId" TEXT,
    "activityType" TEXT NOT NULL DEFAULT 'READ',
    "content" TEXT,
    "aiEvaluation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_activities_studentId_idx" ON "study_activities"("studentId");

-- CreateIndex
CREATE INDEX "study_activities_topicId_idx" ON "study_activities"("topicId");

-- AddForeignKey
ALTER TABLE "study_activities" ADD CONSTRAINT "study_activities_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "study_activities" ADD CONSTRAINT "study_activities_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE;
