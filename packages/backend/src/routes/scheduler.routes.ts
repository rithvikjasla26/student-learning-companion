import express, { Request, Response, NextFunction } from 'express';
import { runNightlyScheduler } from '../jobs/scheduler.job.js';
import { schedulerService } from '../services/scheduler.service.js';
import { authMiddleware, requireRole, requireStudent } from '../middleware/authMiddleware.js';
import { AuthError } from '../types/errors.js';

const router = express.Router();

/**
 * Manual trigger endpoint for the scheduler
 * POST /api/scheduler/run-now
 * Admin only - useful for testing and on-demand scheduling
 */
router.post(
  '/run-now',
  authMiddleware,
  requireRole('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[API] Admin triggered manual scheduler run');
      const summary = await runNightlyScheduler();

      res.json({
        success: true,
        message: 'Scheduler executed successfully',
        summary,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get next priority topic for student to study
 * GET /api/scheduler/next-topic
 * Student only - returns the top-priority due topic based on SM-2 scheduling
 */
router.get(
  '/next-topic',
  authMiddleware,
  requireStudent,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthError('Unauthorized');
      }

      const topicData = await schedulerService.pickTodaysTopic(req.user.userId);

      if (!topicData) {
        return res.status(204).json({
          success: true,
          message: 'No topics due for review at this time',
          topic: null,
        });
      }

      res.json({
        success: true,
        topic: topicData,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Health check endpoint for scheduler
 * GET /api/scheduler/health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'scheduler',
    timestamp: new Date().toISOString(),
  });
});

export default router;
