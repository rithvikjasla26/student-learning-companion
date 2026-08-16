import { Request, Response } from 'express';
import { checkinService } from '../services/checkin.service.js';

export const checkinController = {
  /**
   * Start a new check-in session
   */
  async startCheckIn(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const topic = await checkinService.startCheckIn(req.user.userId);
      res.json(topic);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to start check-in' });
    }
  },

  /**
   * Submit explanation and get evaluation
   */
  async evaluateExplanation(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { topicId, explanation } = req.body;

      if (!topicId || !explanation) {
        res.status(400).json({ error: 'topicId and explanation are required' });
        return;
      }

      if (explanation.trim().length < 10) {
        res.status(400).json({ error: 'Explanation must be at least 10 characters' });
        return;
      }

      const result = await checkinService.evaluateExplanation(
        req.user.userId,
        topicId,
        explanation
      );

      res.json(result);
    } catch (error: any) {
      console.error('Evaluation error:', error);
      res.status(500).json({ error: error.message || 'Failed to evaluate explanation' });
    }
  },

  /**
   * Get check-in history
   */
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await checkinService.getCheckInHistory(req.user.userId, limit, offset);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch history' });
    }
  },
};
