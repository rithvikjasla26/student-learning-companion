-- CreateTable LargerGoal
CREATE TABLE "larger_goals" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "larger_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable SmallerGoal
CREATE TABLE "smaller_goals" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "largerGoalId" TEXT,
    "title" TEXT NOT NULL,
    "topicIds" TEXT[],
    "targetDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smaller_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "larger_goals_studentId_idx" ON "larger_goals"("studentId");
CREATE INDEX "larger_goals_targetDate_idx" ON "larger_goals"("targetDate");

-- CreateIndex
CREATE INDEX "smaller_goals_studentId_idx" ON "smaller_goals"("studentId");
CREATE INDEX "smaller_goals_largerGoalId_idx" ON "smaller_goals"("largerGoalId");
CREATE INDEX "smaller_goals_targetDate_idx" ON "smaller_goals"("targetDate");

-- AddForeignKey
ALTER TABLE "larger_goals" ADD CONSTRAINT "larger_goals_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "smaller_goals" ADD CONSTRAINT "smaller_goals_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "smaller_goals" ADD CONSTRAINT "smaller_goals_largerGoalId_fkey" FOREIGN KEY ("largerGoalId") REFERENCES "larger_goals"("id") ON DELETE SET NULL;
