import { Router } from 'express';
import { parentController } from '../controllers/parent.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateParams, validateBody } from '../middleware/validation.middleware.js';
import { parentSchemas } from '../types/validation.schemas.js';

const router = Router();

// All parent endpoints require authentication
router.get('/children', authMiddleware, parentController.getChildren);
router.get(
  '/children/:studentId/progress',
  authMiddleware,
  validateParams(parentSchemas.getChildProgress),
  parentController.getChildProgress
);
router.get(
  '/children/:studentId/weekly-summary',
  authMiddleware,
  validateParams(parentSchemas.getWeeklySummary),
  parentController.getWeeklySummary
);
router.post('/invite-code', authMiddleware, parentController.generateInviteCode);
router.post('/link-child', authMiddleware, validateBody(parentSchemas.linkChild), parentController.linkChild);
router.post('/verify-code', validateBody(parentSchemas.verifyInviteCode), parentController.verifyInviteCode);

export default router;
