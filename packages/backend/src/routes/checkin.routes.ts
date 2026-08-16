import { Router } from 'express';
import { checkinController } from '../controllers/checkin.controller.js';
import { reconfirmController } from '../controllers/reconfirm.controller.js';
import { authMiddleware, requireStudent } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication and student role
router.use(authMiddleware, requireStudent);

router.post('/start', checkinController.startCheckIn);
router.post('/evaluate', checkinController.evaluateExplanation);
router.post('/reconfirm', reconfirmController.evaluateReconfirmation);
router.get('/history', checkinController.getHistory);

export default router;
