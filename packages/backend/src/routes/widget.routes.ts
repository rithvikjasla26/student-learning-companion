import { Router } from 'express';
import { widgetController } from '../controllers/widget.controller.js';
import { authMiddleware, requireStudent } from '../middleware/authMiddleware.js';
import { validateParams, validateBody } from '../middleware/validation.middleware.js';
import { widgetSchemas } from '../types/validation.schemas.js';

const router = Router();

// Public endpoint to get widget by gap type
router.get(
  '/by-gap-type/:topicId/:gapType',
  validateParams(widgetSchemas.getByGapType),
  widgetController.getWidgetByGapType
);

// Protected endpoints
router.use(authMiddleware, requireStudent);

router.post('/submit', validateBody(widgetSchemas.submitResponse), widgetController.submitWidgetResponse);
router.get('/performance', widgetController.getPerformance);

export default router;
