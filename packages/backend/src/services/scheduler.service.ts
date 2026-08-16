import { PrismaClient } from '@prisma/client';
import { calculateSM2, masteryToQuality, calculatePriority } from '../utils/sm2.js';

const prisma = new PrismaClient();

export const schedulerService = {
  /**
   * Update spaced repetition schedule for a topic after evaluation
   */
  async updateSM2Schedule(
    studentTopicProgressId: string,
    newMasteryScore: number
  ): Promise<void> {
    const progress = await prisma.studentTopicProgress.findUnique({
      where: { id: studentTopicProgressId },
    });

    if (!progress) {
      throw new Error('Progress record not found');
    }

    // Convert mastery score to SM-2 quality
    const quality = masteryToQuality(newMasteryScore);

    // Calculate new SM-2 state
    const sm2State = calculateSM2(progress.easeFactor, quality, progress.intervalDays);

    // Update progress
    await prisma.studentTopicProgress.update({
      where: { id: studentTopicProgressId },
      data: {
        easeFactor: sm2State.easeFactor,
        intervalDays: sm2State.interval,
        nextDueAt: sm2State.nextDueAt,
        repetitions: { increment: 1 },
      },
    });
  },

  /**
   * Pick next topic for student to review today
   */
  async pickTodaysTopic(studentId: string): Promise<{
    topicId: string;
    subject: string;
    chapter: string;
    subtopic: string;
    priority: number;
  } | null> {
    const topics = await prisma.studentTopicProgress.findMany({
      where: {
        studentId,
        nextDueAt: { lte: new Date() },
      },
      include: { topic: true },
    });

    if (topics.length === 0) {
      return null;
    }

    // Calculate priorities and pick the highest
    const topicsWithPriority = topics.map((t) => ({
      ...t,
      priority: calculatePriority(
        t.nextDueAt,
        t.masteryScore,
        t.confidenceScore,
        t.topic?.examWeight || 50
      ),
    }));

    topicsWithPriority.sort((a, b) => a.priority - b.priority);
    const topTopic = topicsWithPriority[0];

    return {
      topicId: topTopic.topicId,
      subject: topTopic.topic?.subject || 'Unknown',
      chapter: topTopic.topic?.chapter || 'Unknown',
      subtopic: topTopic.topic?.subtopic || 'Unknown',
      priority: topTopic.priority,
    };
  },

  /**
   * Get all due topics for student sorted by priority
   */
  async getDueTopics(
    studentId: string,
    limit = 10
  ): Promise<
    Array<{
      topicId: string;
      subject: string;
      chapter: string;
      subtopic: string;
      masteryScore: number;
      priority: number;
      daysSinceDue: number;
    }>
  > {
    const topics = await prisma.studentTopicProgress.findMany({
      where: {
        studentId,
        nextDueAt: { lte: new Date() },
      },
      include: { topic: true },
      take: limit * 2, // Fetch more to calculate priorities
    });

    const now = new Date();

    const topicsWithPriority = topics
      .map((t) => {
        const daysSinceDue = (now.getTime() - t.nextDueAt.getTime()) / (1000 * 60 * 60 * 24);
        return {
          topicId: t.topicId,
          subject: t.topic?.subject || 'Unknown',
          chapter: t.topic?.chapter || 'Unknown',
          subtopic: t.topic?.subtopic || 'Unknown',
          masteryScore: t.masteryScore,
          priority: calculatePriority(
            t.nextDueAt,
            t.masteryScore,
            t.confidenceScore,
            t.topic?.examWeight || 50
          ),
          daysSinceDue,
        };
      })
      .sort((a, b) => a.priority - b.priority)
      .slice(0, limit);

    return topicsWithPriority;
  },

  /**
   * Get next review date for a topic
   */
  async getNextReviewDate(
    studentId: string,
    topicId: string
  ): Promise<{ nextDueAt: Date; daysUntilDue: number } | null> {
    const progress = await prisma.studentTopicProgress.findUnique({
      where: {
        studentId_topicId: { studentId, topicId },
      },
    });

    if (!progress) {
      return null;
    }

    const now = new Date();
    const daysUntilDue = (progress.nextDueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    return {
      nextDueAt: progress.nextDueAt,
      daysUntilDue: Math.max(0, Math.ceil(daysUntilDue)),
    };
  },
};
