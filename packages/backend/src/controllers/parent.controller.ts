import { Request, Response, NextFunction } from 'express';
import { parentService } from '../services/parent.service.js';
import { AuthError, AuthorizationError } from '../types/errors.js';

export const parentController = {
  /**
   * Get list of linked children
   */
  async getChildren(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const children = await parentService.getLinkedChildren(req.user.userId);
      res.json({ children });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get progress snapshot for a specific child
   * Validation: Already done by validateParams middleware
   */
  async getChildProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const { studentId } = req.params;
      const progress = await parentService.getChildProgress(req.user.userId, studentId);
      res.json(progress);
    } catch (error: any) {
      if (error instanceof Error && error.message.includes('Access denied')) {
        return next(new AuthorizationError(error.message));
      }
      next(error);
    }
  },

  /**
   * Generate an invite code for sharing
   */
  async generateInviteCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const result = await parentService.generateInviteCode(req.user.userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Link a child to parent
   * Validation: Already done by validateBody middleware
   */
  async linkChild(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const { studentId } = req.body;
      const result = await parentService.linkChildByCode(req.user.userId, studentId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get weekly summary of child's progress
   * Validation: Already done by validateParams middleware
   */
  async getWeeklySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const { studentId } = req.params;
      const summary = await parentService.getWeeklySummary(req.user.userId, studentId);
      res.json(summary);
    } catch (error: any) {
      if (error instanceof Error && error.message.includes('Access denied')) {
        return next(new AuthorizationError(error.message));
      }
      next(error);
    }
  },
};
