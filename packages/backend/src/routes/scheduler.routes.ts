import express, { Request, Response, NextFunction } from 'express';
import { runNightlyScheduler } from '../jobs/scheduler.job.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';
import { AuthorizationError } from '../types/errors.js';

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
