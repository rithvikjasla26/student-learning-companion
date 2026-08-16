import { Router } from 'express';
import { widgetController } from '../controllers/widget.controller.js';
import { authMiddleware, requireStudent } from '../middleware/authMiddleware.js';

const router = Router();

// Public endpoint to get widget by gap type
router.get('/by-gap-type/:topicId/:gapType', widgetController.getWidgetByGapType);

// Protected endpoints
router.use(authMiddleware, requireStudent);

router.post('/submit', widgetController.submitWidgetResponse);
router.get('/performance', widgetController.getPerformance);

export default router;
