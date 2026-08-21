import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// XP thresholds: 100 XP per level (1-100 levels)
const XP_PER_LEVEL = 100;
const MAX_LEVEL = 100;

// Badge criteria types
const BADGE_CRITERIA = {
  FIRST_CHECK_IN: { type: 'check_in_count', value: 1 },
  SEVEN_DAY_STREAK: { type: 'streak_days', value: 7 },
  HUNDRED_XP: { type: 'xp_threshold', value: 100 },
  CHAPTER_EXPERT: { type: 'topic_mastery', value: 90 },
  CONSISTENT_LEARNER: { type: 'check_in_count', value: 10 },
};

export const gamificationService = {
  /**
   * Award XP to a student
   */
  async awardXP(studentId: string, amount: number, reason: string): Promise<{ totalXp: number; leveledUp: boolean; newLevel?: number }> {
    const stats = await prisma.studentStats.findUnique({
      where: { studentId },
    });

    if (!stats) {
      throw new Error('Student stats not found');
    }

    const previousLevel = this.getLevel(stats.totalXp);
    const newTotalXp = stats.totalXp + amount;
    const newLevel = this.getLevel(newTotalXp);

    const updated = await prisma.studentStats.update({
      where: { studentId },
      data: {
        totalXp: newTotalXp,
        level: newLevel,
      },
    });

    const leveledUp = newLevel > previousLevel;

    return {
      totalXp: updated.totalXp,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
    };
  },

  /**
   * Award XP to a student for a specific subject
   * Updates both global XP and subject-specific XP/level tracking
   */
  async awardXPBySubject(
    studentId: string,
    subject: string,
    amount: number,
    reason: string
  ): Promise<{
    totalXp: number;
    globalLevel: number;
    subjectLevel: number;
    leveledUp: boolean;
  }> {
    const stats = await prisma.studentStats.findUnique({
      where: { studentId },
    });

    if (!stats) {
      throw new Error('Student stats not found');
    }

    // Update global XP
    const previousGlobalLevel = this.getLevel(stats.totalXp);
    const newTotalXp = stats.totalXp + amount;
    const newGlobalLevel = this.getLevel(newTotalXp);

    // Update subject-specific XP & level
    // Store both XP and level for each subject for proper progression tracking
    const subjectData = (stats.subjectLevels as Record<string, any>) || {};
    const currentSubjectRecord = typeof subjectData[subject] === 'object' ? subjectData[subject] : { xp: 0, level: 1 };
    const currentSubjectXp = currentSubjectRecord.xp || 0;
    const newSubjectXp = currentSubjectXp + amount;
    const previousSubjectLevel = currentSubjectRecord.level || this.getLevel(currentSubjectXp);
    const newSubjectLevel = this.getLevel(newSubjectXp);

    // Store subject level and XP together for tracking
    subjectData[subject] = { xp: newSubjectXp, level: newSubjectLevel };

    const updated = await prisma.studentStats.update({
      where: { studentId },
      data: {
        totalXp: newTotalXp,
        level: newGlobalLevel,
        subjectLevels: subjectData,
      },
    });

    const leveledUp = newSubjectLevel > previousSubjectLevel;

    return {
      totalXp: updated.totalXp,
      globalLevel: newGlobalLevel,
      subjectLevel: newSubjectLevel,
      leveledUp,
    };
  },

  /**
   * Update student's daily streak
   * Increments streak if check-in was today or yesterday
   * Resets streak if gap > 1 day
   */
  async updateStreak(studentId: string): Promise<{ streakCount: number }> {
    const stats = await prisma.studentStats.findUnique({
      where: { studentId },
    });

    if (!stats) {
      throw new Error('Student stats not found');
    }

    let newStreakCount = stats.streakCount;

    if (stats.lastCheckInDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastCheckIn = new Date(stats.lastCheckInDate);
      lastCheckIn.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Check-in from previous day, continue streak
        newStreakCount += 1;
      } else if (daysDiff === 0) {
        // Check-in same day, no change to streak
        // (one check-in per day only counts once)
      } else {
        // Gap > 1 day, reset streak (with grace period would be handled by caller)
        newStreakCount = 1;
      }
    } else {
      // First check-in
      newStreakCount = 1;
    }

    const updated = await prisma.studentStats.update({
      where: { studentId },
      data: {
        streakCount: newStreakCount,
        lastCheckInDate: new Date(),
      },
    });

    return { streakCount: updated.streakCount };
  },

  /**
   * Check and unlock badges for a student
   * Returns newly unlocked badges
   */
  async checkBadgeUnlock(studentId: string): Promise<Array<{ id: string; name: string; description: string }>> {
    const stats = await prisma.studentStats.findUnique({
      where: { studentId },
    });

    if (!stats) {
      throw new Error('Student stats not found');
    }

    // Get student's check-in count
    const checkInCount = await prisma.checkInSession.count({
      where: { studentId },
    });

    // Check which badges they don't have yet
    const earnedBadges = await prisma.studentBadge.findMany({
      where: { studentId },
      select: { badgeId: true },
    });

    const earnedBadgeIds = new Set(earnedBadges.map((b: { badgeId: string }) => b.badgeId));

    // Get all available badges
    const allBadges = await prisma.badge.findMany();

    const newBadges: Array<{ id: string; name: string; description: string }> = [];

    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) {
        continue; // Already earned
      }

      let shouldUnlock = false;

      if (badge.criteriaType === 'check_in_count' && checkInCount >= badge.criteriaValue) {
        shouldUnlock = true;
      } else if (badge.criteriaType === 'xp_threshold' && stats.totalXp >= badge.criteriaValue) {
        shouldUnlock = true;
      } else if (badge.criteriaType === 'streak_days' && stats.streakCount >= badge.criteriaValue) {
        shouldUnlock = true;
      } else if (badge.criteriaType === 'topic_mastery') {
        // Check if any topic has mastery >= criteriaValue
        const highMasteryTopic = await prisma.studentTopicProgress.findFirst({
          where: { studentId, masteryScore: { gte: badge.criteriaValue } },
        });
        shouldUnlock = !!highMasteryTopic;
      }

      if (shouldUnlock) {
        // Create student badge
        await prisma.studentBadge.create({
          data: {
            studentId,
            badgeId: badge.id,
          },
        });

        newBadges.push({
          id: badge.id,
          name: badge.name,
          description: badge.description,
        });
      }
    }

    return newBadges;
  },

  /**
   * Calculate level from total XP
   * Level = floor(XP / XP_PER_LEVEL) + 1
   * Capped at MAX_LEVEL
   */
  getLevel(totalXp: number): number {
    const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
    return Math.min(level, MAX_LEVEL);
  },

  /**
   * Calculate XP required for next level
   */
  getXpForNextLevel(currentLevel: number): number {
    if (currentLevel >= MAX_LEVEL) {
      return Infinity;
    }
    return (currentLevel) * XP_PER_LEVEL;
  },

  /**
   * Get gamification constants
   */
  getConstants() {
    return {
      XP_PER_LEVEL,
      MAX_LEVEL,
      BADGE_CRITERIA,
    };
  },
};
