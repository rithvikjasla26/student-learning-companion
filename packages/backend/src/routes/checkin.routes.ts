import { Router } from 'express';
import { checkinController } from '../controllers/checkin.controller.js';
import { reconfirmController } from '../controllers/reconfirm.controller.js';
import { authMiddleware, requireStudent } from '../middleware/authMiddleware.js';
import { validateBody, validateQuery } from '../middleware/validation.middleware.js';
import { checkinSchemas, reconfirmSchemas } from '../types/validation.schemas.js';

const router = Router();

// All routes require authentication and student role
router.use(authMiddleware, requireStudent);

router.post('/start', checkinController.startCheckIn);
router.post('/evaluate', validateBody(checkinSchemas.evaluateExplanation), checkinController.evaluateExplanation);
router.post('/reconfirm', validateBody(reconfirmSchemas.evaluateReconfirmation), reconfirmController.evaluateReconfirmation);
router.get('/history', validateQuery(checkinSchemas.getHistory), checkinController.getHistory);

export default router;
