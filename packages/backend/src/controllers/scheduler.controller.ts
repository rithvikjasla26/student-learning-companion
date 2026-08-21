import { Request, Response, NextFunction } from 'express';
import { schedulerService } from '../services/scheduler.service.js';
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

export const schedulerController = {
  /**
   * Get next priority topic for student to study
   * Uses SM-2 scheduling and priority weighting
   */
  async getNextTopic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const studentId = await getStudentId(req.user.userId);
      const topicData = await schedulerService.pickTodaysTopic(studentId);

      if (!topicData) {
        res.status(204).json({
          success: true,
          message: 'No topics due for review at this time',
          topic: null,
        });
        return;
      }

      res.json({
        success: true,
        topic: topicData,
      });
    } catch (error) {
      next(error);
    }
  },
};
