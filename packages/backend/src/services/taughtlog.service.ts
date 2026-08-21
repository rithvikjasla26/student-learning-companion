import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const taughtlogService = {
  /**
   * Create a new TaughtLog entry
   * Fast endpoint - no LLM, just structured logging
   */
  async createTaughtLog(
    studentId: string,
    subject: string,
    chapter: string,
    topicId: string,
    source: string = 'SCHOOL',
    coverageType: string = 'INTRODUCED',
    homeworkAssigned: boolean = false
  ): Promise<{
    taughtLogId: string;
    createdAt: Date;
  }> {
    // Verify topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new Error('Topic not found');
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Create TaughtLog entry
    const taughtLog = await prisma.taughtLog.create({
      data: {
        studentId,
        subject,
        chapter,
        topicId,
        source,
        coverageType,
        homeworkAssigned,
      },
    });

    return {
      taughtLogId: taughtLog.id,
      createdAt: taughtLog.createdAt,
    };
  },

  /**
   * Get recent TaughtLog entries for a student
   */
  async getTaughtLogHistory(
    studentId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    logs: Array<{
      id: string;
      subject: string;
      chapter: string;
      topicId: string;
      source: string;
      coverageType: string;
      homeworkAssigned: boolean;
      createdAt: Date;
    }>;
    total: number;
  }> {
    const [logs, total] = await Promise.all([
      prisma.taughtLog.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.taughtLog.count({
        where: { studentId },
      }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        subject: log.subject,
        chapter: log.chapter,
        topicId: log.topicId,
        source: log.source,
        coverageType: log.coverageType,
        homeworkAssigned: log.homeworkAssigned,
        createdAt: log.createdAt,
      })),
      total,
    };
  },
};
