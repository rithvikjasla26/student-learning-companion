import { PrismaClient } from '@prisma/client';
import { gamificationService } from './gamification.service.js';

const prisma = new PrismaClient();

export const goalsService = {
  /**
   * Get overview of all goals for a student
   * Returns larger and smaller goals with computed progress
   */
  async getGoalsOverview(studentId: string): Promise<{
    largerGoals: Array<{
      id: string;
      title: string;
      subject: string | null;
      targetDate: Date;
      progress: number; // 0-100
      smallerGoalsCount: number;
    }>;
    smallerGoals: Array<{
      id: string;
      title: string;
      largerGoalId: string | null;
      targetDate: Date;
      status: string;
      progress: number; // 0-100 (average mastery of linked topics)
      topicCount: number;
    }>;
  }> {
    // Get all larger goals
    const largerGoals = await prisma.largerGoal.findMany({
      where: { studentId },
      include: {
        smallerGoals: {
          select: { id: true },
        },
      },
      orderBy: { targetDate: 'asc' },
    });

    // Get all smaller goals
    const smallerGoals = await prisma.smallerGoal.findMany({
      where: { studentId },
      orderBy: { targetDate: 'asc' },
    });

    // Calculate progress for larger goals
    const largerGoalProgress = await Promise.all(
      largerGoals.map(async (goal) => {
        let progress = 0;

        // If goal has subject, calculate average mastery across all topics in that subject
        if (goal.subject) {
          const topicsInSubject = await prisma.topic.findMany({
            where: { subject: goal.subject },
            select: { id: true },
          });

          const topicIds = topicsInSubject.map((t) => t.id);

          if (topicIds.length > 0) {
            const masteriesInSubject = await prisma.studentTopicProgress.findMany({
              where: {
                studentId,
                topicId: { in: topicIds },
              },
              select: { masteryScore: true },
            });

            if (masteriesInSubject.length > 0) {
              progress =
                Math.round(
                  masteriesInSubject.reduce((sum, p) => sum + p.masteryScore, 0) /
                    masteriesInSubject.length
                ) || 0;
            }
          }
        } else {
          // No subject specified - use all smaller goals' progress
          if (goal.smallerGoals.length > 0) {
            const smallerGoalProgresses = smallerGoals
              .filter((sg) => sg.largerGoalId === goal.id)
              .map((sg) => {
                // Calculate progress for this smaller goal
                if (sg.topicIds.length === 0) return 0;
                // Will be calculated below in the map for smaller goals
                return 0;
              });

            // Average the progress of smaller goals linked to this larger goal
            progress = Math.round(
              smallerGoalProgresses.reduce((a, b) => a + b, 0) / goal.smallerGoals.length
            );
          }
        }

        return {
          id: goal.id,
          title: goal.title,
          subject: goal.subject,
          targetDate: goal.targetDate,
          progress,
          smallerGoalsCount: goal.smallerGoals.length,
        };
      })
    );

    // Calculate progress for smaller goals
    const smallerGoalProgress = await Promise.all(
      smallerGoals.map(async (goal) => {
        let progress = 0;

        if (goal.topicIds.length > 0) {
          const masteries = await prisma.studentTopicProgress.findMany({
            where: {
              studentId,
              topicId: { in: goal.topicIds },
            },
            select: { masteryScore: true },
          });

          if (masteries.length > 0) {
            progress =
              Math.round(
                masteries.reduce((sum, p) => sum + p.masteryScore, 0) / masteries.length
              ) || 0;
          }
        }

        return {
          id: goal.id,
          title: goal.title,
          largerGoalId: goal.largerGoalId,
          targetDate: goal.targetDate,
          status: goal.status,
          progress,
          topicCount: goal.topicIds.length,
        };
      })
    );

    return {
      largerGoals: largerGoalProgress,
      smallerGoals: smallerGoalProgress,
    };
  },

  /**
   * Create a larger goal
   */
  async createLargerGoal(
    studentId: string,
    title: string,
    subject: string | null,
    targetDate: Date
  ): Promise<{
    id: string;
    title: string;
  }> {
    const goal = await prisma.largerGoal.create({
      data: {
        studentId,
        title,
        subject,
        targetDate,
      },
    });

    return {
      id: goal.id,
      title: goal.title,
    };
  },

  /**
   * Create a smaller goal
   */
  async createSmallerGoal(
    studentId: string,
    title: string,
    topicIds: string[],
    targetDate: Date,
    largerGoalId?: string
  ): Promise<{
    id: string;
    title: string;
  }> {
    const goal = await prisma.smallerGoal.create({
      data: {
        studentId,
        title,
        topicIds,
        targetDate,
        largerGoalId,
      },
    });

    return {
      id: goal.id,
      title: goal.title,
    };
  },

  /**
   * Auto-generate a weekly smaller goal from scheduler's due topics
   * Picks ~5 topics that are due or overdue and creates a goal
   */
  async autoSuggestWeeklyGoal(studentId: string): Promise<{
    id: string;
    title: string;
    topicIds: string[];
  }> {
    // Get topics that are due or overdue (next ~5)
    const dueTopics = await prisma.studentTopicProgress.findMany({
      where: {
        studentId,
        nextDueAt: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // Within next 7 days
      },
      include: { topic: true },
      orderBy: { nextDueAt: 'asc' },
      take: 5,
    });

    const topicIds = dueTopics.map((t) => t.topicId);
    const topicTitles = dueTopics.map((t) => t.topic.chapter).slice(0, 3); // First 3 for title

    // Create goal with 7-day deadline
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);

    const goal = await prisma.smallerGoal.create({
      data: {
        studentId,
        title: `Master: ${topicTitles.join(', ')}${dueTopics.length > 3 ? ' +' + (dueTopics.length - 3) + ' more' : ''}`,
        topicIds,
        targetDate,
        status: 'ACTIVE',
      },
    });

    return {
      id: goal.id,
      title: goal.title,
      topicIds: goal.topicIds,
    };
  },

  /**
   * Update goal status
   */
  async updateGoalStatus(
    studentId: string,
    goalId: string,
    status: 'ACTIVE' | 'COMPLETED' | 'MISSED'
  ): Promise<{
    id: string;
    status: string;
  }> {
    const goal = await prisma.smallerGoal.update({
      where: { id: goalId },
      data: { status },
    });

    return {
      id: goal.id,
      status: goal.status,
    };
  },

  /**
   * Get goals for a specific larger goal (for detailed view)
   */
  async getLargerGoalDetails(
    studentId: string,
    largerGoalId: string
  ): Promise<{
    largerGoal: {
      id: string;
      title: string;
      subject: string | null;
      targetDate: Date;
      progress: number;
    };
    smallerGoals: Array<{
      id: string;
      title: string;
      status: string;
      progress: number;
      topicCount: number;
    }>;
  }> {
    const largerGoal = await prisma.largerGoal.findUnique({
      where: { id: largerGoalId },
    });

    if (!largerGoal || largerGoal.studentId !== studentId) {
      throw new Error('Larger goal not found');
    }

    const smallerGoals = await prisma.smallerGoal.findMany({
      where: { largerGoalId },
    });

    // Calculate progress for larger goal
    let largerProgress = 0;
    if (largerGoal.subject) {
      const topicsInSubject = await prisma.topic.findMany({
        where: { subject: largerGoal.subject },
        select: { id: true },
      });

      if (topicsInSubject.length > 0) {
        const masteries = await prisma.studentTopicProgress.findMany({
          where: {
            studentId,
            topicId: { in: topicsInSubject.map((t) => t.id) },
          },
          select: { masteryScore: true },
        });

        if (masteries.length > 0) {
          largerProgress = Math.round(
            masteries.reduce((sum, p) => sum + p.masteryScore, 0) / masteries.length
          );
        }
      }
    }

    // Calculate progress for each smaller goal
    const smallerGoalDetails = await Promise.all(
      smallerGoals.map(async (goal) => {
        let progress = 0;
        if (goal.topicIds.length > 0) {
          const masteries = await prisma.studentTopicProgress.findMany({
            where: {
              studentId,
              topicId: { in: goal.topicIds },
            },
            select: { masteryScore: true },
          });

          if (masteries.length > 0) {
            progress = Math.round(
              masteries.reduce((sum, p) => sum + p.masteryScore, 0) / masteries.length
            );
          }
        }

        return {
          id: goal.id,
          title: goal.title,
          status: goal.status,
          progress,
          topicCount: goal.topicIds.length,
        };
      })
    );

    return {
      largerGoal: {
        id: largerGoal.id,
        title: largerGoal.title,
        subject: largerGoal.subject,
        targetDate: largerGoal.targetDate,
        progress: largerProgress,
      },
      smallerGoals: smallerGoalDetails,
    };
  },
};
