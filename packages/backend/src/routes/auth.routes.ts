import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { authSchemas } from '../types/validation.schemas.js';

const router = Router();

// Public endpoints
router.post('/send-otp', validateBody(authSchemas.sendOTP), authController.sendOTP);
router.post('/verify-otp', validateBody(authSchemas.verifyOTP), authController.verifyOTP);
router.post('/refresh-token', validateBody(authSchemas.refreshToken), authController.refreshToken);

// Protected endpoints
router.get('/profile', authMiddleware, authController.getProfile);

export default router;
