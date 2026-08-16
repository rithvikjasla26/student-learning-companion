import { Request, Response } from 'express';
import { widgetService } from '../services/widget.service.js';

export const widgetController = {
  /**
   * Get widget by gap type
   */
  async getWidgetByGapType(req: Request, res: Response): Promise<void> {
    try {
      const { topicId, gapType } = req.params;

      if (!topicId || !gapType) {
        res.status(400).json({ error: 'topicId and gapType are required' });
        return;
      }

      const widget = await widgetService.getWidgetByGapType(topicId, gapType);
      res.json(widget);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to get widget' });
    }
  },

  /**
   * Submit widget response
   */
  async submitWidgetResponse(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { widgetId, studentAnswer, sessionId } = req.body;

      if (!widgetId || !studentAnswer) {
        res.status(400).json({ error: 'widgetId and studentAnswer are required' });
        return;
      }

      const result = await widgetService.submitWidgetResponse(
        req.user.userId,
        widgetId,
        studentAnswer,
        sessionId
      );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to submit widget response' });
    }
  },

  /**
   * Get widget performance
   */
  async getPerformance(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const performance = await widgetService.getWidgetPerformance(req.user.userId);
      res.json(performance);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to get performance' });
    }
  },
};
