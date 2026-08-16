import { Request, Response, NextFunction } from 'express';
import { reconfirmService } from '../services/reconfirm.service.js';
import { AuthError } from '../types/errors.js';

export const reconfirmController = {
  /**
   * Re-evaluate student's understanding
   * Validation: Already done by validateBody middleware
   */
  async evaluateReconfirmation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const { topicId, explanation, sessionId } = req.body;

      const result = await reconfirmService.evaluateReconfirmation(
        req.user.userId,
        sessionId,
        explanation
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
