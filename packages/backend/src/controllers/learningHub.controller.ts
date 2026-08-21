import { Request, Response, NextFunction } from 'express';
import { learningHubService } from '../services/learningHub.service.js';
import { AuthError } from '../types/errors.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Helper to get student ID from user ID
 */
async function getStudentId(userId: string): Promise<string> {
  const student = await prisma.student.findUnique({
    where: { userId },
  });

  if (!student) {
    throw new AuthError('Student profile not found');
  }

  return student.id;
}

export const learningHubController = {
  /**
   * Get topics due for review with SM-2 scheduling details
   * Query params: filter (all|today|this-week|overdue), limit, offset
   */
  async getReviewQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const studentId = await getStudentId(req.user.userId);
      const filter = (req.query.filter as string) || 'all';
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await learningHubService.getReviewQueue(studentId, filter as any, limit, offset);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get quick stats for dashboard header
   */
  async getQuickStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const studentId = await getStudentId(req.user.userId);
      const stats = await learningHubService.getQuickStats(studentId);

      res.json(stats);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get topic hierarchy for subject/chapter/topic selection dropdowns
   */
  async getTopicsHierarchy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const hierarchy = await learningHubService.getTopicsHierarchy();

      res.json(hierarchy);
    } catch (error) {
      next(error);
    }
  },
};
