import { Request, Response, NextFunction } from 'express';
import { widgetService } from '../services/widget.service.js';
import { AuthError } from '../types/errors.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to get student ID from user ID
async function getStudentId(userId: string): Promise<string> {
  const student = await prisma.student.findUnique({
    where: { userId },
  });

  if (!student) {
    throw new AuthError('Student profile not found');
  }

  return student.id;
}

export const widgetController = {
  /**
   * Get widget by gap type
   * Validation: Already done by validateParams middleware
   */
  async getWidgetByGapType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { topicId, gapType } = req.params;
      const widget = await widgetService.getWidgetByGapType(topicId, gapType);
      res.json(widget);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Submit widget response
   * Validation: Already done by validateBody middleware
   */
  async submitWidgetResponse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const { widgetId, studentAnswer, sessionId } = req.body;
      const studentId = await getStudentId(req.user.userId);

      const result = await widgetService.submitWidgetResponse(
        studentId,
        widgetId,
        studentAnswer,
        sessionId
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get widget performance
   */
  async getPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const studentId = await getStudentId(req.user.userId);
      const performance = await widgetService.getWidgetPerformance(studentId);
      res.json(performance);
    } catch (error) {
      next(error);
    }
  },
};
