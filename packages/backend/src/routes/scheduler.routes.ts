import express, { Request, Response } from 'express';
import { runNightlyScheduler } from '../jobs/scheduler.job.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Manual trigger endpoint for the scheduler
 * POST /api/scheduler/run-now
 * Admin only - useful for testing and on-demand scheduling
 */
router.post('/run-now', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can trigger the scheduler' });
    }

    console.log('[API] Admin triggered manual scheduler run');
    const summary = await runNightlyScheduler();

    res.json({
      success: true,
      message: 'Scheduler executed successfully',
      summary,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[API] Scheduler endpoint error:', errorMsg);
    res.status(500).json({
      error: 'Failed to run scheduler',
      details: errorMsg,
    });
  }
});

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
