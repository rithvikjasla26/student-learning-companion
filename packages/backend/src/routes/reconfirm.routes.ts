import { Router } from 'express';
import { reconfirmController } from '../controllers/reconfirm.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { reconfirmSchemas } from '../types/validation.schemas.js';

const router = Router();

// All reconfirm endpoints require authentication
router.post(
  '/submit',
  authMiddleware,
  validateBody(reconfirmSchemas.evaluateReconfirmation),
  reconfirmController.submitReconfirmation
);

export default router;
