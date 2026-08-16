import { Request, Response } from 'express';
import { reconfirmService } from '../services/reconfirm.service.js';

export const reconfirmController = {
  /**
   * Re-evaluate student's understanding
   */
  async evaluateReconfirmation(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { sessionId, explanation } = req.body;

      if (!sessionId || !explanation) {
        res.status(400).json({ error: 'sessionId and explanation are required' });
        return;
      }

      const result = await reconfirmService.evaluateReconfirmation(
        req.user.userId,
        sessionId,
        explanation
      );

      res.json(result);
    } catch (error: any) {
      console.error('Re-confirmation error:', error);
      res.status(500).json({ error: error.message || 'Failed to evaluate re-confirmation' });
    }
  },
};
