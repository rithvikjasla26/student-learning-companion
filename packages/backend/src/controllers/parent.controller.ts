import { Request, Response } from 'express';
import { parentService } from '../services/parent.service.js';

export const parentController = {
  /**
   * Get list of linked children
   */
  async getChildren(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const children = await parentService.getLinkedChildren(req.user.userId);
      res.json({ children });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch children' });
    }
  },

  /**
   * Get progress snapshot for a specific child
   */
  async getChildProgress(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { studentId } = req.params;

      if (!studentId) {
        res.status(400).json({ error: 'studentId is required' });
        return;
      }

      const progress = await parentService.getChildProgress(req.user.userId, studentId);
      res.json(progress);
    } catch (error: any) {
      res.status(error.message.includes('Access denied') ? 403 : 500).json({
        error: error.message || 'Failed to fetch child progress',
      });
    }
  },

  /**
   * Generate an invite code for sharing
   */
  async generateInviteCode(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await parentService.generateInviteCode(req.user.userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate invite code' });
    }
  },

  /**
   * Link a child to parent (simplified: assumes student is verified)
   * In production, would use invite codes with expiration
   */
  async linkChild(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { studentId } = req.body;

      if (!studentId) {
        res.status(400).json({ error: 'studentId is required' });
        return;
      }

      const result = await parentService.linkChildByCode(req.user.userId, studentId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to link child' });
    }
  },

  /**
   * Get weekly summary of child's progress
   */
  async getWeeklySummary(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { studentId } = req.params;

      if (!studentId) {
        res.status(400).json({ error: 'studentId is required' });
        return;
      }

      const summary = await parentService.getWeeklySummary(req.user.userId, studentId);
      res.json(summary);
    } catch (error: any) {
      res.status(error.message.includes('Access denied') ? 403 : 500).json({
        error: error.message || 'Failed to fetch weekly summary',
      });
    }
  },
};
