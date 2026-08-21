import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Invite code config
const INVITE_CODE_LENGTH = 6;
const INVITE_CODE_VALID_DAYS = 7;

export const parentService = {
  /**
   * Get all children linked to a parent
   */
  async getLinkedChildren(parentId: string): Promise<
    Array<{
      id: string;
      name: string;
      gradeLevel: number;
      subjects: string[];
    }>
  > {
    const parentStudent = await prisma.parentStudent.findMany({
      where: { parentId },
      include: { student: true },
    });

    return parentStudent.map((ps: any) => ({
      id: ps.student.id,
      name: ps.student.name,
      gradeLevel: ps.student.gradeLevel,
      subjects: ps.student.subjects,
    }));
  },

  /**
   * Get a snapshot of child's progress
   */
  async getChildProgress(parentId: string, studentId: string): Promise<{
    name: string;
    gradeLevel: number;
    subjects: string[];
    stats: {
      totalXp: number;
      level: number;
      streakCount: number;
      lastCheckInDate: Date | null;
    };
    topicsProgress: Array<{
      subject: string;
      chapter: string;
      masteryScore: number;
    }>;
    weakTopics: Array<{
      subject: string;
      chapter: string;
      subtopic: string;
      masteryScore: number;
    }>;
  }> {
    // Verify parent has access to this student
    const link = await prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: { parentId, studentId },
      },
    });

    if (!link) {
      throw new Error('Access denied: Student not linked to this parent');
    }

    // Get student info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Get stats
    const stats = await prisma.studentStats.findUnique({
      where: { studentId },
    });

    if (!stats) {
      throw new Error('Student stats not found');
    }

    // Get topic progress
    const topicProgress = await prisma.studentTopicProgress.findMany({
      where: { studentId },
      include: { topic: true },
    });

    // Find weak topics (< 60% mastery)
    const weakTopics = topicProgress
      .filter((tp: any) => tp.masteryScore < 60)
      .map((tp: any) => ({
        subject: tp.topic.subject,
        chapter: tp.topic.chapter,
        subtopic: tp.topic.subtopic,
        masteryScore: tp.masteryScore,
      }));

    return {
      name: student.name,
      gradeLevel: student.gradeLevel,
      subjects: student.subjects,
      stats: {
        totalXp: stats.totalXp,
        level: stats.level,
        streakCount: stats.streakCount,
        lastCheckInDate: stats.lastCheckInDate,
      },
      topicsProgress: topicProgress.map((tp: any) => ({
        subject: tp.topic.subject,
        chapter: tp.topic.chapter,
        masteryScore: tp.masteryScore,
      })),
      weakTopics,
    };
  },

  /**
   * Generate an invite code for parent to share with students
   * Code format: 6-character alphanumeric (e.g., "ABC123")
   * Code is stored in database with 7-day expiry
   */
  async generateInviteCode(parentId: string): Promise<{
    code: string;
    expiresAt: Date;
  }> {
    // Generate random 6-char code
    const code = crypto
      .randomBytes(Math.ceil(INVITE_CODE_LENGTH / 2))
      .toString('hex')
      .substring(0, INVITE_CODE_LENGTH)
      .toUpperCase();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_CODE_VALID_DAYS);

    // Store in database
    await prisma.inviteCode.create({
      data: {
        code,
        parentId,
        expiresAt,
      },
    });

    return {
      code,
      expiresAt,
    };
  },

  /**
   * Verify an invite code and link student to parent
   * Returns success if code is valid (not expired, exists, and student not already linked)
   */
  async verifyInviteCode(code: string, studentId: string): Promise<{
    success: boolean;
    message: string;
    parentId?: string;
  }> {
    try {
      // Find the invite code
      const inviteCode = await prisma.inviteCode.findUnique({
        where: { code },
      });

      if (!inviteCode) {
        return { success: false, message: 'Invalid invite code' };
      }

      // Check if expired
      if (new Date() > inviteCode.expiresAt) {
        return { success: false, message: 'Invite code has expired' };
      }

      // Check if already used
      if (inviteCode.usedBy) {
        return { success: false, message: 'Invite code has already been used' };
      }

      // Verify student exists
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        return { success: false, message: 'Student not found' };
      }

      // Check if already linked
      const existing = await prisma.parentStudent.findUnique({
        where: {
          parentId_studentId: { parentId: inviteCode.parentId, studentId },
        },
      });

      if (existing) {
        return { success: false, message: 'Student already linked to this parent' };
      }

      // Create the link
      await prisma.parentStudent.create({
        data: {
          parentId: inviteCode.parentId,
          studentId,
        },
      });

      // Mark invite code as used
      await prisma.inviteCode.update({
        where: { code },
        data: { usedBy: studentId },
      });

      return {
        success: true,
        message: 'Successfully linked to parent',
        parentId: inviteCode.parentId,
      };
    } catch (error: any) {
      return { success: false, message: `Failed to verify code: ${error.message}` };
    }
  },

  /**
   * Link a child to parent using invite code
   * In MVP, this is simplified: parent provides student email + OTP verification
   * Actual linking is done via email verification flow in auth.service
   */
  async linkChildByCode(parentId: string, studentId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Check if already linked
      const existing = await prisma.parentStudent.findUnique({
        where: { parentId_studentId: { parentId, studentId } },
      });

      if (existing) {
        return { success: false, message: 'Student already linked to this parent' };
      }

      // Create link
      await prisma.parentStudent.create({
        data: {
          parentId,
          studentId,
        },
      });

      return { success: true, message: 'Child successfully linked' };
    } catch (error: any) {
      throw new Error(`Failed to link child: ${error.message}`);
    }
  },

  /**
   * Get weekly summary of child's progress
   */
  async getWeeklySummary(parentId: string, studentId: string): Promise<{
    topicsCovered: Array<{
      subject: string;
      chapter: string;
      checkInCount: number;
      averageMastery: number;
    }>;
    totalCheckIns: number;
    averageXpPerDay: number;
    xpThisWeek: number;
  }> {
    // Verify access
    const link = await prisma.parentStudent.findUnique({
      where: { parentId_studentId: { parentId, studentId } },
    });

    if (!link) {
      throw new Error('Access denied');
    }

    // Get check-ins from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCheckIns = await prisma.checkInSession.findMany({
      where: {
        studentId,
        date: { gte: sevenDaysAgo },
      },
      include: { topic: true },
    });

    // Group by topic
    const topicMap: Record<string, { topic: { subject: string; chapter: string }; checkIns: number; scores: number[] }> = {};

    recentCheckIns.forEach((ci: any) => {
      if (!ci.topic) return;

      const key = `${ci.topic.id}`;
      if (!topicMap[key]) {
        topicMap[key] = {
          topic: { subject: ci.topic.subject, chapter: ci.topic.chapter },
          checkIns: 0,
          scores: [],
        };
      }
      topicMap[key].checkIns += 1;
      const masteryScore = (ci.aiEvaluation as any)?.mastery_score;
      if (masteryScore) {
        topicMap[key].scores.push(masteryScore);
      }
    });

    const topicsCovered = Object.values(topicMap).map((t) => ({
      subject: t.topic.subject,
      chapter: t.topic.chapter,
      checkInCount: t.checkIns,
      averageMastery: t.scores.length > 0 ? Math.round(t.scores.reduce((a, b) => a + b, 0) / t.scores.length) : 0,
    }));

    const totalCheckIns = recentCheckIns.length;
    const totalXpThisWeek = recentCheckIns.reduce((sum: number, ci: any) => sum + ci.xpEarned, 0);
    const averageXpPerDay = totalCheckIns > 0 ? Math.round(totalXpThisWeek / 7) : 0;

    return {
      topicsCovered,
      totalCheckIns,
      averageXpPerDay,
      xpThisWeek: totalXpThisWeek,
    };
  },
};
