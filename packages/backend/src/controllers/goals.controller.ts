import { Request, Response } from 'express';
import { goalsService } from '../services/goals.service.js';

export const goalsController = {
  /**
   * GET /api/goals/overview
   * Get overview of all goals
   */
  async getGoalsOverview(req: Request, res: Response): Promise<void> {
    try {
      const studentId = (req as any).studentId;

      const overview = await goalsService.getGoalsOverview(studentId);

      res.json(overview);
    } catch (error: any) {
      console.error('Error getting goals overview:', error);
      res.status(400).json({ error: error.message || 'Failed to get goals overview' });
    }
  },

  /**
   * POST /api/goals/larger
   * Create a larger goal
   */
  async createLargerGoal(req: Request, res: Response): Promise<void> {
    try {
      const studentId = (req as any).studentId;
      const { title, subject, targetDate } = req.body;

      if (!title || !targetDate) {
        res.status(400).json({ error: 'Title and targetDate are required' });
        return;
      }

      const goal = await goalsService.createLargerGoal(
        studentId,
        title,
        subject || null,
        new Date(targetDate)
      );

      res.status(201).json(goal);
    } catch (error: any) {
      console.error('Error creating larger goal:', error);
      res.status(400).json({ error: error.message || 'Failed to create goal' });
    }
  },

  /**
   * POST /api/goals/smaller
   * Create a smaller goal
   */
  async createSmallerGoal(req: Request, res: Response): Promise<void> {
    try {
      const studentId = (req as any).studentId;
      const { title, topicIds, targetDate, largerGoalId } = req.body;

      if (!title || !topicIds || !targetDate) {
        res.status(400).json({ error: 'Title, topicIds, and targetDate are required' });
        return;
      }

      const goal = await goalsService.createSmallerGoal(
        studentId,
        title,
        topicIds,
        new Date(targetDate),
        largerGoalId
      );

      res.status(201).json(goal);
    } catch (error: any) {
      console.error('Error creating smaller goal:', error);
      res.status(400).json({ error: error.message || 'Failed to create goal' });
    }
  },

  /**
   * POST /api/goals/smaller/auto-suggest
   * Auto-generate a weekly smaller goal from scheduler's due topics
   */
  async autoSuggestWeeklyGoal(req: Request, res: Response): Promise<void> {
    try {
      const studentId = (req as any).studentId;

      const goal = await goalsService.autoSuggestWeeklyGoal(studentId);

      res.status(201).json(goal);
    } catch (error: any) {
      console.error('Error auto-suggesting weekly goal:', error);
      res.status(400).json({ error: error.message || 'Failed to create suggested goal' });
    }
  },

  /**
   * PATCH /api/goals/smaller/:goalId
   * Update goal status
   */
  async updateGoalStatus(req: Request, res: Response): Promise<void> {
    try {
      const studentId = (req as any).studentId;
      const { goalId } = req.params;
      const { status } = req.body;

      if (!status || !['ACTIVE', 'COMPLETED', 'MISSED'].includes(status)) {
        res.status(400).json({ error: 'Valid status (ACTIVE, COMPLETED, MISSED) is required' });
        return;
      }

      const goal = await goalsService.updateGoalStatus(studentId, goalId, status);

      res.json(goal);
    } catch (error: any) {
      console.error('Error updating goal status:', error);
      res.status(400).json({ error: error.message || 'Failed to update goal' });
    }
  },

  /**
   * GET /api/goals/larger/:goalId
   * Get detailed view of a larger goal with its smaller goals
   */
  async getLargerGoalDetails(req: Request, res: Response): Promise<void> {
    try {
      const studentId = (req as any).studentId;
      const { goalId } = req.params;

      const details = await goalsService.getLargerGoalDetails(studentId, goalId);

      res.json(details);
    } catch (error: any) {
      console.error('Error getting larger goal details:', error);
      res.status(400).json({ error: error.message || 'Failed to get goal details' });
    }
  },
};
