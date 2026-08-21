import { Request, Response, NextFunction } from 'express';
import { reconfirmService } from '../services/reconfirm.service.js';
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
      const studentId = await getStudentId(req.user.userId);

      const result = await reconfirmService.submitReconfirmation(
        studentId,
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
