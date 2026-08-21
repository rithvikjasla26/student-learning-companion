import { Router } from 'express';
import { studyactivityController } from '../controllers/studyactivity.controller.js';
import { authMiddleware, requireStudent } from '../middleware/authMiddleware.js';
import { validateBody, validateQuery } from '../middleware/validation.middleware.js';
import { studyactivitySchemas } from '../types/validation.schemas.js';

const router = Router();

// All routes require authentication and student role
router.use(authMiddleware, requireStudent);

router.get('/prompt', validateQuery(studyactivitySchemas.getPrompt), studyactivityController.getPrompt);
router.post('/submit', validateBody(studyactivitySchemas.submit), studyactivityController.submit);
router.get('/history', validateQuery(studyactivitySchemas.getHistory), studyactivityController.getHistory);

export default router;
