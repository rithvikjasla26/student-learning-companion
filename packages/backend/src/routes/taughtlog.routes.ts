import { Router } from 'express';
import { taughtlogController } from '../controllers/taughtlog.controller.js';
import { authMiddleware, requireStudent } from '../middleware/authMiddleware.js';
import { validateBody, validateQuery } from '../middleware/validation.middleware.js';
import { taughtlogSchemas } from '../types/validation.schemas.js';

const router = Router();

// All routes require authentication and student role
router.use(authMiddleware, requireStudent);

router.post('/create', validateBody(taughtlogSchemas.create), taughtlogController.create);
router.get('/history', validateQuery(taughtlogSchemas.getHistory), taughtlogController.getHistory);

export default router;
