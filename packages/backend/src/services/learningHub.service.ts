import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculate days until a date
 */
function daysUntilDue(nextDueAt: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(nextDueAt);
  dueDate.setHours(0, 0, 0, 0);

  const diffMs = dueDate.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determine status label based on days until due
 */
function getStatusLabel(daysUntilDue: number): 'OVERDUE' | 'TODAY' | 'SOON' | 'FUTURE' {
  if (daysUntilDue < 0) return 'OVERDUE';
  if (daysUntilDue === 0) return 'TODAY';
  if (daysUntilDue <= 7) return 'SOON';
  return 'FUTURE';
}

export const learningHubService = {
  /**
   * Get topics due for review with SM-2 scheduling details
   * Filters: 'all' | 'today' | 'this-week' | 'overdue'
   */
  async getReviewQueue(
    studentId: string,
    filter: 'all' | 'today' | 'this-week' | 'overdue' = 'all',
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    dueTopics: Array<{
      id: string;
      topicId: string;
      subject: string;
      chapter: string;
      subtopic: string;
      masteryScore: number;
      confidenceScore: number;
      nextDueAt: Date;
      daysUntilDue: number;
      statusLabel: string;
      sm2State: {
        easeFactor: number;
        intervalDays: number;
        repetitions: number;
      };
    }>;
    totalDue: number;
    overdueCount: number;
  }> {
    // Calculate date filters
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Build where clause based on filter
    let dateFilter = {};
    switch (filter) {
      case 'today':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateFilter = { lte: today.toISOString().split('T')[0] + 'T23:59:59Z' };
        break;
      case 'this-week':
        dateFilter = { lte: weekEnd };
        break;
      case 'overdue':
        dateFilter = { lt: today };
        break;
      case 'all':
      default:
        // No filter needed for all
        break;
    }

    // Query topics due for review
    const whereClause = {
      studentId,
      ...(filter !== 'all' && { nextDueAt: dateFilter }),
    };

    const [progress, totalDue] = await Promise.all([
      prisma.studentTopicProgress.findMany({
        where: whereClause,
        include: { topic: true },
        orderBy: [{ nextDueAt: 'asc' }, { masteryScore: 'asc' }],
        take: limit,
        skip: offset,
      }),
      prisma.studentTopicProgress.count({ where: whereClause }),
    ]);

    // Count overdue
    const overdueCount = await prisma.studentTopicProgress.count({
      where: {
        studentId,
        nextDueAt: { lt: today },
      },
    });

    // Transform to response format
    const dueTopics = progress.map((p: any) => {
      const days = daysUntilDue(p.nextDueAt);
      return {
        id: p.id,
        topicId: p.topicId,
        subject: p.topic.subject,
        chapter: p.topic.chapter,
        subtopic: p.topic.subtopic,
        masteryScore: p.masteryScore,
        confidenceScore: p.confidenceScore,
        nextDueAt: p.nextDueAt,
        daysUntilDue: days,
        statusLabel: getStatusLabel(days),
        sm2State: {
          easeFactor: p.easeFactor,
          intervalDays: p.intervalDays,
          repetitions: p.repetitions,
        },
      };
    });

    return {
      dueTopics,
      totalDue,
      overdueCount,
    };
  },

  /**
   * Get quick stats for the dashboard header
   */
  async getQuickStats(studentId: string): Promise<{
    checkInsToday: number;
    streak: number;
    totalMastery: number;
    topicsDue: number;
    topicsDueOverdue: number;
  }> {
    // Get check-ins today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkInsToday = await prisma.checkInSession.count({
      where: {
        studentId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get stats
    const stats = await prisma.studentStats.findUnique({
      where: { studentId },
    });

    // Get topics due today or overdue
    const topicsDue = await prisma.studentTopicProgress.count({
      where: {
        studentId,
        nextDueAt: { lte: tomorrow },
      },
    });

    const topicsDueOverdue = await prisma.studentTopicProgress.count({
      where: {
        studentId,
        nextDueAt: { lt: today },
      },
    });

    // Calculate total mastery across all topics
    const topicProgress = await prisma.studentTopicProgress.findMany({
      where: { studentId },
    });

    const totalMastery =
      topicProgress.length > 0
        ? Math.round(topicProgress.reduce((sum: number, t: any) => sum + t.masteryScore, 0) / topicProgress.length)
        : 0;

    return {
      checkInsToday,
      streak: stats?.streakCount || 0,
      totalMastery,
      topicsDue,
      topicsDueOverdue,
    };
  },

  /**
   * Get hierarchical topic structure for selection dropdowns
   */
  async getTopicsHierarchy(): Promise<{
    subjects: Array<{
      name: string;
      count: number;
      chapters: Array<{
        name: string;
        count: number;
        topics: Array<{
          id: string;
          subtopic: string;
        }>;
      }>;
    }>;
  }> {
    const topics = await prisma.topic.findMany({
      orderBy: [{ subject: 'asc' }, { chapter: 'asc' }, { subtopic: 'asc' }],
    });

    // Build hierarchy
    const subjectMap: Record<
      string,
      {
        name: string;
        chapterMap: Record<
          string,
          {
            name: string;
            topics: Array<{ id: string; subtopic: string }>;
          }
        >;
      }
    > = {};

    topics.forEach((topic: any) => {
      if (!subjectMap[topic.subject]) {
        subjectMap[topic.subject] = {
          name: topic.subject,
          chapterMap: {},
        };
      }

      if (!subjectMap[topic.subject].chapterMap[topic.chapter]) {
        subjectMap[topic.subject].chapterMap[topic.chapter] = {
          name: topic.chapter,
          topics: [],
        };
      }

      subjectMap[topic.subject].chapterMap[topic.chapter].topics.push({
        id: topic.id,
        subtopic: topic.subtopic,
      });
    });

    // Transform to array format
    const subjects = Object.values(subjectMap).map((subject) => ({
      name: subject.name,
      count: Object.values(subject.chapterMap).reduce(
        (sum, ch: any) => sum + ch.topics.length,
        0
      ),
      chapters: Object.values(subject.chapterMap).map(
        (chapter: any) => ({
          name: chapter.name,
          count: chapter.topics.length,
          topics: chapter.topics,
        })
      ),
    }));

    return { subjects };
  },
};
