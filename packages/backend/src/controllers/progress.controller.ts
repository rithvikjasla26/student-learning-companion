import { Request, Response, NextFunction } from 'express';
import { progressService } from '../services/progress.service.js';
import { AuthError } from '../types/errors.js';

export const progressController = {
  /**
   * Get student's overall stats and badges
   */
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const stats = await progressService.getStudentStats(req.user.userId);
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

      const topicProgress = await progressService.getTopicProgress(req.user.userId);
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

      const limit = (req.query.limit as any) || 20;
      const offset = (req.query.offset as any) || 0;

      const history = await progressService.getCheckInHistory(req.user.userId, limit, offset);
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

      const trend = await progressService.getWeeklyTrend(req.user.userId);
      res.json({ trend });
    } catch (error) {
      next(error);
    }
  },
};
