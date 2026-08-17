import express, { Request, Response, NextFunction } from 'express';
import { runNightlyScheduler } from '../jobs/scheduler.job.js';
import { schedulerController } from '../controllers/scheduler.controller.js';
import { authMiddleware, requireRole, requireStudent } from '../middleware/authMiddleware.js';

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
  schedulerController.getNextTopic
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
