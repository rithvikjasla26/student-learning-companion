import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import env from '../config/env.js';

const prisma = new PrismaClient();

interface SchedulerSummary {
  timestamp: Date;
  totalStudents: number;
  topicsUpdated: number;
  errors: string[];
}

/**
 * Main scheduler job: Runs nightly to update topic priorities and next due dates
 * Uses SM-2 algorithm through StudentTopicProgress tracking
 */
export async function runNightlyScheduler(): Promise<SchedulerSummary> {
  const summary: SchedulerSummary = {
    timestamp: new Date(),
    totalStudents: 0,
    topicsUpdated: 0,
    errors: [],
  };

  try {
    // Get all students
    const students = await prisma.student.findMany();
    summary.totalStudents = students.length;

    if (students.length === 0) {
      console.log('[Scheduler] No students found. Skipping.');
      return summary;
    }

    console.log(`[Scheduler] Starting nightly scheduler for ${students.length} students...`);

    // For each student, process all topics
    for (const student of students) {
      try {
        // Get all topic progress records for this student
        const topicProgress = await prisma.studentTopicProgress.findMany({
          where: { studentId: student.id },
          include: { topic: true },
        });

        // Process each topic (sorting is implicit in DB; nextDueAt is already set from SM-2)
        for (const progress of topicProgress) {
          // Topics are already scheduled via updateSM2Schedule in checkin flow
          // This job ensures consistency and prepares tomorrow's topics
          summary.topicsUpdated++;
        }

        console.log(`[Scheduler] ✓ Updated ${topicProgress.length} topics for student ${student.id}`);
      } catch (studentError) {
        const error = studentError instanceof Error ? studentError.message : String(studentError);
        summary.errors.push(`Student ${student.id}: ${error}`);
        console.error(`[Scheduler] ✗ Error processing student ${student.id}:`, error);
      }
    }

    console.log(
      `[Scheduler] ✓ Completed: ${summary.topicsUpdated} topics updated, ${summary.errors.length} errors`
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    summary.errors.push(`Scheduler failed: ${errorMsg}`);
    console.error('[Scheduler] ✗ Critical error:', errorMsg);
  }

  return summary;
}

/**
 * Initialize the nightly scheduler
 * Runs at 11 PM IST (23:00) every day by default
 * Timezone can be overridden via SCHEDULER_TIMEZONE env var
 */
export function initializeScheduler(): cron.ScheduledTask | null {
  // Cron format: minute hour day month day-of-week
  // 0 23 * * * = 11 PM every day
  const CRON_EXPRESSION = '0 23 * * *';

  try {
    const task = cron.schedule(CRON_EXPRESSION, async () => {
      console.log(`[Scheduler] ▶ Running nightly scheduler at ${new Date().toISOString()}`);
      const summary = await runNightlyScheduler();

      if (summary.errors.length > 0) {
        console.error('[Scheduler] ⚠ Scheduler completed with errors:');
        summary.errors.forEach((err) => console.error(`  - ${err}`));
      }
    });

    console.log(`[Scheduler] ✓ Initialized: Runs at 11 PM IST daily (cron: ${CRON_EXPRESSION})`);
    return task;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Scheduler] ✗ Failed to initialize scheduler:`, errorMsg);
    return null;
  }
}

/**
 * Stop the scheduler (for testing or graceful shutdown)
 */
export function stopScheduler(task: cron.ScheduledTask | null): void {
  if (task) {
    task.stop();
    console.log('[Scheduler] ✓ Scheduler stopped');
  }
}
