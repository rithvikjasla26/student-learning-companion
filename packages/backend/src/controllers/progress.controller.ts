import { Request, Response, NextFunction } from 'express';
import { progressService } from '../services/progress.service.js';
import { AuthError } from '../types/errors.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to get student ID from user ID
async function getStudentId(userId: string): Promise<string> {
  const student = await prisma.student.findUnique({
    where: { userId },
  });

  if (!student) {
    throw new AuthError('Student profile not found');
  }

  return student.id;
}

export const progressController = {
  /**
   * Get student's overall stats and badges
   */
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const studentId = await getStudentId(req.user.userId);
      const stats = await progressService.getStudentStats(studentId);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get progress for all topics
   */
  async getTopics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const studentId = await getStudentId(req.user.userId);
      const topicProgress = await progressService.getTopicProgress(studentId);
      res.json({ topics: topicProgress });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get paginated check-in history
   * Validation: Already done by validateQuery middleware
   */
  async getCheckIns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const studentId = await getStudentId(req.user.userId);
      const limit = (req.query.limit as any) || 20;
      const offset = (req.query.offset as any) || 0;

      const history = await progressService.getCheckInHistory(studentId, limit, offset);
      res.json(history);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get XP trend for last 7 days
   */
  async getTrend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const studentId = await getStudentId(req.user.userId);
      const trend = await progressService.getWeeklyTrend(studentId);
      res.json({ trend });
    } catch (error) {
      next(error);
    }
  },
};
