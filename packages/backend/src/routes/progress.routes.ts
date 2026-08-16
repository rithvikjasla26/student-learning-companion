import { Router } from 'express';
import { progressController } from '../controllers/progress.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All progress endpoints require authentication
router.get('/overview', authMiddleware, progressController.getOverview);
router.get('/topics', authMiddleware, progressController.getTopics);
router.get('/check-ins', authMiddleware, progressController.getCheckIns);
router.get('/trend', authMiddleware, progressController.getTrend);

export default router;
