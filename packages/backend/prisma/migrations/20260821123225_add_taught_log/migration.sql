-- CreateTable
CREATE TABLE "taught_logs" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "chapter" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'SCHOOL',
    "coverageType" TEXT NOT NULL DEFAULT 'INTRODUCED',
    "homeworkAssigned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taught_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "taught_logs_studentId_idx" ON "taught_logs"("studentId");

-- CreateIndex
CREATE INDEX "taught_logs_createdAt_idx" ON "taught_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "taught_logs" ADD CONSTRAINT "taught_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "taught_logs" ADD CONSTRAINT "taught_logs_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE;
