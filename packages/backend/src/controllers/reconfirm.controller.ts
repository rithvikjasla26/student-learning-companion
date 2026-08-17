import { Request, Response, NextFunction } from 'express';
import { reconfirmService } from '../services/reconfirm.service.js';
import { AuthError } from '../types/errors.js';

export const reconfirmController = {
  /**
   * Submit re-confirmation explanation and get evaluation
   * Validation: Already done by validateBody middleware
   */
  async submitReconfirmation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const { explanation, sessionId } = req.body;

      const result = await reconfirmService.submitReconfirmation(
        req.user.userId,
        sessionId,
        explanation
      );

      res.json(result);
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) {
        return next(new AuthError(error.message));
      }
      next(error);
    }
  },
};
