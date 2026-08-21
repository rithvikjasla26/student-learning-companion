import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { goalsController } from '../controllers/goals.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Get overview of all goals
router.get('/overview', goalsController.getGoalsOverview);

// Create a larger goal
router.post('/larger', goalsController.createLargerGoal);

// Create a smaller goal
router.post('/smaller', goalsController.createSmallerGoal);

// Auto-suggest a weekly goal based on due topics
router.post('/smaller/auto-suggest', goalsController.autoSuggestWeeklyGoal);

// Update goal status
router.patch('/smaller/:goalId', goalsController.updateGoalStatus);

// Get detailed view of a larger goal
router.get('/larger/:goalId', goalsController.getLargerGoalDetails);

export default router;
