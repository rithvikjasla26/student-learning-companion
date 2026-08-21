import { Router } from 'express';
import { learningHubController } from '../controllers/learningHub.controller.js';
import { authMiddleware, requireStudent } from '../middleware/authMiddleware.js';
import { validateQuery } from '../middleware/validation.middleware.js';
import { learningHubSchemas } from '../types/validation.schemas.js';

const router = Router();

// All routes require authentication and student role
router.use(authMiddleware, requireStudent);

// Get topics due for review with SM-2 details and filtering
router.get('/review-queue', validateQuery(learningHubSchemas.reviewQueueFilters), learningHubController.getReviewQueue);

// Get quick stats for dashboard header
router.get('/quick-stats', learningHubController.getQuickStats);

// Get hierarchical topic structure for selection dropdowns
router.get('/topics-hierarchy', learningHubController.getTopicsHierarchy);

export default router;
