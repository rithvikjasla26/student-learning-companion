import { PrismaClient } from '@prisma/client';
import { llmService } from './llm.service.js';
import { SM2 } from '../utils/sm2.js';

const prisma = new PrismaClient();

// XP calculation: base + quality-based bonus
const calculateReconfirmXP = (improvement: number): number => {
  const baseXP = 5;
  const improvementBonus = Math.min(Math.round(improvement * 2), 10); // Cap at 10 for improvement
  return Math.min(baseXP + improvementBonus, 15); // Total cap at 15
};

export const reconfirmService = {
  /**
   * Re-evaluate student's understanding after widget practice
   * Updates mastery score, SM-2 metrics, and awards bonus XP based on improvement
   */
  async submitReconfirmation(
    studentId: string,
    sessionId: string,
    newExplanation: string
  ): Promise<{
    mastery_score: number;
    gap_type: string;
    gap_description: string;
    xpEarned: number;
    improved: boolean;
    feedback: string;
  }> {
    // Get the original check-in session
    const originalSession = await prisma.checkInSession.findUnique({
      where: { id: sessionId },
      include: { topic: true },
    });

    if (!originalSession || !originalSession.topic) {
      throw new Error('Check-in session not found');
    }

    if (originalSession.studentId !== studentId) {
      throw new Error('Unauthorized: This session does not belong to this student');
    }

    const originalMasteryScore = (originalSession.aiEvaluation as any)?.mastery_score || 0;

    // Re-evaluate with Claude for reasoning
    const evaluation = await llmService.evaluateReconfirmation(
      originalSession.transcript,
      newExplanation,
      originalSession.topic.expectedConcepts,
      originalSession.topic.subtopic,
      originalMasteryScore
    );

    // Calculate improvement and XP
    const improvement = evaluation.mastery_score - originalMasteryScore;
    const improved = improvement > 0;
    const xpEarned = calculateReconfirmXP(improvement);

    // Get current progress to update SM-2 metrics
    const currentProgress = await prisma.studentTopicProgress.findUnique({
      where: {
        studentId_topicId: {
          studentId,
          topicId: originalSession.topicId!,
        },
      },
    });

    if (!currentProgress) {
      throw new Error('Topic progress not found');
    }

    // Update SM-2 metrics based on new mastery score
    // Convert mastery (0-100) to SM-2 quality (0-5)
    const quality = Math.round((evaluation.mastery_score / 100) * 5);
    const sm2Update = SM2.calculateMetrics(quality, currentProgress);

    // Update StudentTopicProgress with new mastery score and SM-2 metrics
    await prisma.studentTopicProgress.update({
      where: {
        studentId_topicId: {
          studentId,
          topicId: originalSession.topicId!,
        },
      },
      data: {
        masteryScore: evaluation.mastery_score,
        confidenceScore: Math.min(100, currentProgress.confidenceScore + (improved ? 10 : -5)), // Increase confidence if improved
        easeFactor: sm2Update.easeFactor,
        intervalDays: sm2Update.intervalDays,
        repetitions: sm2Update.repetitions,
        lastReviewedAt: new Date(),
        nextDueAt: sm2Update.nextDueAt,
      },
    });

    // Update StudentStats with XP earned
    await prisma.studentStats.update({
      where: { studentId },
      data: {
        totalXp: { increment: xpEarned },
        // Recalculate level (every 100 XP = 1 level)
        level: { increment: Math.floor(xpEarned / 100) },
      },
    });

    // Persist the reconfirmation evaluation to the session
    await prisma.checkInSession.update({
      where: { id: sessionId },
      data: {
        reconfirmationEvaluation: {
          mastery_score: evaluation.mastery_score,
          gap_type: evaluation.gap_type,
          gap_description: evaluation.gap_description,
          improvement,
          xpEarned,
        },
      },
    });

    const feedback = improved
      ? `Great improvement! You've progressed from ${originalMasteryScore}% to ${evaluation.mastery_score}% mastery.`
      : `Keep practicing! Your mastery remains at ${evaluation.mastery_score}%. Focus on the areas needing more work.`;

    return {
      mastery_score: evaluation.mastery_score,
      gap_type: evaluation.gap_type,
      gap_description: evaluation.gap_description,
      xpEarned,
      improved,
      feedback,
    };
  },
};
