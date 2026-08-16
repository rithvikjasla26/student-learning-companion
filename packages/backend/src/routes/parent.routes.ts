import { Router } from 'express';
import { parentController } from '../controllers/parent.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All parent endpoints require authentication
router.get('/children', authMiddleware, parentController.getChildren);
router.get('/children/:studentId/progress', authMiddleware, parentController.getChildProgress);
router.get('/children/:studentId/weekly-summary', authMiddleware, parentController.getWeeklySummary);
router.post('/invite-code', authMiddleware, parentController.generateInviteCode);
router.post('/link-child', authMiddleware, parentController.linkChild);

export default router;
