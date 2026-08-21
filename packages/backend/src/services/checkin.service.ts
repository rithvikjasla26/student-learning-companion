import { PrismaClient } from '@prisma/client';
import { llmService, LLMEvaluationResponse } from './llm.service.js';
import { gamificationService } from './gamification.service.js';

const prisma = new PrismaClient();

const XP_BASE = 10; // Base XP per check-in
const XP_GAP_CLOSURE = 5; // Bonus XP for improvement
const XP_WIDGET_COMPLETE = 5; // Bonus XP for widget completion

export const checkinService = {
  /**
   * Start a check-in session and get the next topic to review
   */
  async startCheckIn(studentId: string): Promise<{
    topicId: string;
    subject: string;
    chapter: string;
    subtopic: string;
    expectedConcepts: string[];
  }> {
    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error('Student not found. Please complete your profile first.');
    }

    // Get student's next due topic
    const nextTopic = await prisma.studentTopicProgress.findFirst({
      where: {
        studentId,
        nextDueAt: { lte: new Date() },
      },
      orderBy: [
        { nextDueAt: 'asc' },
        { masteryScore: 'asc' },
      ],
      include: { topic: true },
    });

    if (nextTopic && nextTopic.topic) {
      return {
        topicId: nextTopic.topicId,
        subject: nextTopic.topic.subject,
        chapter: nextTopic.topic.chapter,
        subtopic: nextTopic.topic.subtopic,
        expectedConcepts: nextTopic.topic.expectedConcepts,
      };
    }

    // If no overdue topics, get any topic
    const anyTopic = await prisma.studentTopicProgress.findFirst({
      where: { studentId },
      include: { topic: true },
    });

    if (anyTopic && anyTopic.topic) {
      return {
        topicId: anyTopic.topicId,
        subject: anyTopic.topic.subject,
        chapter: anyTopic.topic.chapter,
        subtopic: anyTopic.topic.subtopic,
        expectedConcepts: anyTopic.topic.expectedConcepts,
      };
    }

    // If student has no topics, assign a random one
    const randomTopic = await prisma.topic.findFirst();
    if (!randomTopic) {
      throw new Error('No topics available in the system');
    }

    const topicProgress = await prisma.studentTopicProgress.create({
      data: {
        studentId,
        topicId: randomTopic.id,
      },
    });

    return {
      topicId: topicProgress.topicId,
      subject: randomTopic.subject,
      chapter: randomTopic.chapter,
      subtopic: randomTopic.subtopic,
      expectedConcepts: randomTopic.expectedConcepts,
    };
  },

  /**
   * Evaluate student's explanation and save check-in session
   */
  async evaluateExplanation(
    studentId: string,
    topicId: string,
    explanation: string
  ): Promise<{
    sessionId: string;
    mastery_score: number;
    gap_type: string;
    gap_description: string;
    follow_up_question?: string;
    xpEarned: number;
    newBadges: Array<{ id: string; name: string }>;
  }> {
    // Get topic details
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new Error('Topic not found');
    }

    // Get current progress
    const currentProgress = await prisma.studentTopicProgress.findUnique({
      where: {
        studentId_topicId: { studentId, topicId },
      },
    });

    const previousMasteryScore = currentProgress?.masteryScore || 0;

    // Evaluate with LLM
    const evaluation = await llmService.evaluateExplanation(
      explanation,
      topic.expectedConcepts,
      topic.subtopic
    );

    // Calculate XP earned
    let xpEarned = XP_BASE;

    // Bonus if mastery improved
    if (evaluation.mastery_score > previousMasteryScore) {
      xpEarned += XP_GAP_CLOSURE;
    }

    // Save check-in session
    const session = await prisma.checkInSession.create({
      data: {
        studentId,
        topicId,
        transcript: explanation,
        gapType: evaluation.gap_type,
        aiEvaluation: evaluation as any,
        xpEarned,
      },
    });

    // Update student progress
    await prisma.studentTopicProgress.upsert({
      where: {
        studentId_topicId: { studentId, topicId },
      },
      create: {
        studentId,
        topicId,
        masteryScore: evaluation.mastery_score,
      },
      update: {
        masteryScore: evaluation.mastery_score,
        confidenceScore: 50, // Reset to baseline after evaluation
        lastReviewedAt: new Date(),
      },
    });

    // Award XP by subject
    await gamificationService.awardXPBySubject(
      studentId,
      topic.subject,
      xpEarned,
      `check_in_${topicId}`
    );

    // Update streak and check for badges
    await gamificationService.updateStreak(studentId);
    const newBadges = await gamificationService.checkBadgeUnlock(studentId);

    return {
      sessionId: session.id,
      mastery_score: evaluation.mastery_score,
      gap_type: evaluation.gap_type,
      gap_description: evaluation.gap_description,
      follow_up_question: evaluation.follow_up_question,
      xpEarned,
      newBadges: newBadges.map((b) => ({ id: b.id, name: b.name })),
    };
  },

  /**
   * Get check-in history for student
   */
  async getCheckInHistory(
    studentId: string,
    limit = 20,
    offset = 0
  ): Promise<{
    total: number;
    sessions: any[];
  }> {
    const [sessions, total] = await Promise.all([
      prisma.checkInSession.findMany({
        where: { studentId },
        include: {
          topic: {
            select: {
              subject: true,
              chapter: true,
              subtopic: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.checkInSession.count({ where: { studentId } }),
    ]);

    return { total, sessions };
  },
};
