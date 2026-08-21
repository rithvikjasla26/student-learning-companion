import { Request, Response, NextFunction } from 'express';
import { taughtlogService } from '../services/taughtlog.service.js';
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

export const taughtlogController = {
  /**
   * Create a new TaughtLog entry
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const { subject, chapter, topicId, source, coverageType, homeworkAssigned } = req.body;
      const studentId = await getStudentId(req.user.userId);

      const result = await taughtlogService.createTaughtLog(
        studentId,
        subject,
        chapter,
        topicId,
        source,
        coverageType,
        homeworkAssigned
      );

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get TaughtLog history for student
   */
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const { limit = 20, offset = 0 } = req.query;
      const studentId = await getStudentId(req.user.userId);

      const result = await taughtlogService.getTaughtLogHistory(
        studentId,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
