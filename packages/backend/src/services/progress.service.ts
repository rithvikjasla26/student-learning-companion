import { PrismaClient } from '@prisma/client';
import { gamificationService } from './gamification.service.js';

const prisma = new PrismaClient();

export const progressService = {
  /**
   * Get student's overall stats: XP, level, streak, badges
   */
  async getStudentStats(studentId: string): Promise<{
    totalXp: number;
    level: number;
    subjectLevels: Record<string, number>;
    streakCount: number;
    lastCheckInDate: Date | null;
    badges: Array<{ id: string; name: string; description: string; icon: string | null; earnedAt: Date }>;
  }> {
    const stats = await prisma.studentStats.findUnique({
      where: { studentId },
    });

    if (!stats) {
      // Return default stats if student hasn't been initialized yet
      return {
        totalXp: 0,
        level: 1,
        subjectLevels: {},
        streakCount: 0,
        lastCheckInDate: null,
        badges: [],
      };
    }

    const badges = await prisma.studentBadge.findMany({
      where: { studentId },
      include: { badge: true },
    });

    // Extract subject levels from stored data (handle both old format and new format)
    const subjectLevelMap: Record<string, number> = {};
    const subjectData = (stats.subjectLevels as Record<string, any>) || {};
    for (const [subject, data] of Object.entries(subjectData)) {
      if (typeof data === 'object' && data.level) {
        subjectLevelMap[subject] = data.level;
      } else if (typeof data === 'number') {
        // Backwards compatibility: old format stored just numbers
        subjectLevelMap[subject] = data;
      }
    }

    return {
      totalXp: stats.totalXp,
      level: stats.level,
      subjectLevels: subjectLevelMap,
      streakCount: stats.streakCount,
      lastCheckInDate: stats.lastCheckInDate,
      badges: badges.map((sb: any) => ({
        id: sb.badge.id,
        name: sb.badge.name,
        description: sb.badge.description,
        icon: sb.badge.icon,
        earnedAt: sb.earnedAt,
      })),
    };
  },

  /**
   * Get progress for all topics the student is tracking
   */
  async getTopicProgress(studentId: string): Promise<
    Array<{
      topicId: string;
      subject: string;
      chapter: string;
      subtopic: string;
      masteryScore: number;
      confidenceScore: number;
      nextDueAt: Date;
      lastReviewedAt: Date | null;
    }>
  > {
    const progress = await prisma.studentTopicProgress.findMany({
      where: { studentId },
      include: { topic: true },
      orderBy: { masteryScore: 'asc' },
    });

    return progress.map((p: any) => ({
      topicId: p.topicId,
      subject: p.topic.subject,
      chapter: p.topic.chapter,
      subtopic: p.topic.subtopic,
      masteryScore: p.masteryScore,
      confidenceScore: p.confidenceScore,
      nextDueAt: p.nextDueAt,
      lastReviewedAt: p.lastReviewedAt,
    }));
  },

  /**
   * Get paginated check-in history with scores
   */
  async getCheckInHistory(
    studentId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    checkIns: Array<{
      id: string;
      date: Date;
      topicId: string | null;
      subject: string | null;
      chapter: string | null;
      gapType: string | null;
      xpEarned: number;
      masteryScore: number | null;
    }>;
    total: number;
  }> {
    const [checkIns, total] = await Promise.all([
      prisma.checkInSession.findMany({
        where: { studentId },
        include: { topic: true },
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.checkInSession.count({ where: { studentId } }),
    ]);

    return {
      checkIns: checkIns.map((c: any) => ({
        id: c.id,
        date: c.date,
        topicId: c.topicId,
        subject: c.topic?.subject || null,
        chapter: c.topic?.chapter || null,
        gapType: c.gapType,
        xpEarned: c.xpEarned,
        masteryScore: (c.aiEvaluation as any)?.mastery_score || null,
      })),
      total,
    };
  },

  /**
   * Get XP trend for last 7 days
   */
  async getWeeklyTrend(studentId: string): Promise<
    Array<{
      date: string;
      xpEarned: number;
    }>
  > {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const checkIns = await prisma.checkInSession.findMany({
      where: {
        studentId,
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: 'asc' },
    });

    // Group by date
    const dailyXp: Record<string, number> = {};
    checkIns.forEach((c: any) => {
      const dateStr = c.date.toISOString().split('T')[0];
      dailyXp[dateStr] = (dailyXp[dateStr] || 0) + c.xpEarned;
    });

    // Return last 7 days
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        xpEarned: dailyXp[dateStr] || 0,
      });
    }

    return result;
  },
};
