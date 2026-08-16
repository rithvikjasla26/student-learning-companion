import { Request, Response, NextFunction } from 'express';
import { checkinService } from '../services/checkin.service.js';
import { AuthError } from '../types/errors.js';

export const checkinController = {
  /**
   * Start a new check-in session
   */
  async startCheckIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const topic = await checkinService.startCheckIn(req.user.userId);
      res.json(topic);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Submit explanation and get evaluation
   * Validation: Already done by validateBody middleware
   */
  async evaluateExplanation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const { topicId, explanation } = req.body;
      const result = await checkinService.evaluateExplanation(
        req.user.userId,
        topicId,
        explanation
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get check-in history
   * Validation: Already done by validateQuery middleware
   */
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const limit = (req.query.limit as any) || 20;
      const offset = (req.query.offset as any) || 0;

      const result = await checkinService.getCheckInHistory(req.user.userId, limit, offset);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
