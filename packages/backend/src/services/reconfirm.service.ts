import { PrismaClient } from '@prisma/client';
import { llmService } from './llm.service.js';

const prisma = new PrismaClient();

const XP_BONUS_IMPROVEMENT = 10; // Bonus XP if mastery improved

export const reconfirmService = {
  /**
   * Re-evaluate student's understanding after widget practice
   */
  async evaluateReconfirmation(
    studentId: string,
    sessionId: string,
    newExplanation: string
  ): Promise<{
    mastery_score: number;
    gap_type: string;
    gap_description: string;
    xpBonus: number;
    improved: boolean;
  }> {
    // Get the original check-in session
    const originalSession = await prisma.checkInSession.findUnique({
      where: { id: sessionId },
      include: { topic: true },
    });

    if (!originalSession || !originalSession.topic) {
      throw new Error('Check-in session not found');
    }

    const originalMasteryScore = (originalSession.aiEvaluation as any)?.mastery_score || 0;

    // Re-evaluate with Sonnet for deeper reasoning
    const evaluation = await llmService.evaluateReconfirmation(
      originalSession.transcript,
      newExplanation,
      originalSession.topic.expectedConcepts,
      originalSession.topic.subtopic,
      originalMasteryScore
    );

    // Determine if improved
    const improved = evaluation.mastery_score > originalMasteryScore;
    const xpBonus = improved ? XP_BONUS_IMPROVEMENT : 0;

    // Update StudentTopicProgress with new mastery score
    await prisma.studentTopicProgress.update({
      where: {
        studentId_topicId: {
          studentId,
          topicId: originalSession.topicId!,
        },
      },
      data: {
        masteryScore: evaluation.mastery_score,
        lastReviewedAt: new Date(),
      },
    });

    // Award bonus XP if improved
    if (xpBonus > 0) {
      await prisma.studentStats.update({
        where: { studentId },
        data: {
          totalXp: { increment: xpBonus },
        },
      });
    }

    return {
      mastery_score: evaluation.mastery_score,
      gap_type: evaluation.gap_type,
      gap_description: evaluation.gap_description,
      xpBonus,
      improved,
    };
  },
};
