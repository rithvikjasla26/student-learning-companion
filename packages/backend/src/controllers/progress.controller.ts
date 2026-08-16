import { Request, Response } from 'express';
import { progressService } from '../services/progress.service.js';

export const progressController = {
  /**
   * Get student's overall stats and badges
   */
  async getOverview(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const stats = await progressService.getStudentStats(req.user.userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch overview' });
    }
  },

  /**
   * Get progress for all topics
   */
  async getTopics(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const topicProgress = await progressService.getTopicProgress(req.user.userId);
      res.json({ topics: topicProgress });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch topic progress' });
    }
  },

  /**
   * Get paginated check-in history
   */
  async getCheckIns(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const history = await progressService.getCheckInHistory(req.user.userId, limit, offset);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch check-in history' });
    }
  },

  /**
   * Get XP trend for last 7 days
   */
  async getTrend(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const trend = await progressService.getWeeklyTrend(req.user.userId);
      res.json({ trend });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch trend' });
    }
  },
};
