import { Request, Response, NextFunction } from 'express';
import { studyactivityService } from '../services/studyactivity.service.js';
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

export const studyactivityController = {
  /**
   * Get prompt for a topic (READ content + SOLVE questions)
   */
  async getPrompt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const { topicId } = req.query;
      if (!topicId) {
        throw new Error('Topic ID is required');
      }

      const studentId = await getStudentId(req.user.userId);

      const result = await studyactivityService.getPrompt(studentId, topicId as string);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Submit a study activity (WRITE or SOLVE)
   */
  async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const { topicId, activityType, content, taughtLogId } = req.body;
      const studentId = await getStudentId(req.user.userId);

      const result = await studyactivityService.submitActivity(
        studentId,
        topicId,
        activityType,
        content,
        taughtLogId
      );

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get activity history for a topic
   */
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const { topicId, limit = 20 } = req.query;
      if (!topicId) {
        throw new Error('Topic ID is required');
      }

      const studentId = await getStudentId(req.user.userId);

      const activities = await studyactivityService.getActivityHistory(
        studentId,
        topicId as string,
        parseInt(limit as string)
      );

      res.json({ activities });
    } catch (error) {
      next(error);
    }
  },
};
