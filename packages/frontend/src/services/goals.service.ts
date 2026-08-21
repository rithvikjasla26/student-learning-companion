import apiClient from './api';

export interface LargerGoal {
  id: string;
  title: string;
  subject: string | null;
  targetDate: string;
  progress: number; // 0-100
  smallerGoalsCount: number;
}

export interface SmallerGoal {
  id: string;
  title: string;
  largerGoalId: string | null;
  targetDate: string;
  status: string; // ACTIVE | COMPLETED | MISSED
  progress: number; // 0-100
  topicCount: number;
}

export interface GoalsOverview {
  largerGoals: LargerGoal[];
  smallerGoals: SmallerGoal[];
}

export const goalsService = {
  /**
   * Get overview of all goals
   */
  async getGoalsOverview(): Promise<GoalsOverview> {
    const response = await apiClient.get('/goals/overview');
    return response.data;
  },

  /**
   * Create a larger goal
   */
  async createLargerGoal(
    title: string,
    subject: string | null,
    targetDate: Date
  ): Promise<{ id: string; title: string }> {
    const response = await apiClient.post('/goals/larger', {
      title,
      subject,
      targetDate,
    });
    return response.data;
  },

  /**
   * Create a smaller goal
   */
  async createSmallerGoal(
    title: string,
    topicIds: string[],
    targetDate: Date,
    largerGoalId?: string
  ): Promise<{ id: string; title: string }> {
    const response = await apiClient.post('/goals/smaller', {
      title,
      topicIds,
      targetDate,
      largerGoalId,
    });
    return response.data;
  },

  /**
   * Auto-suggest a weekly goal
   */
  async autoSuggestWeeklyGoal(): Promise<{
    id: string;
    title: string;
    topicIds: string[];
  }> {
    const response = await apiClient.post('/goals/smaller/auto-suggest');
    return response.data;
  },

  /**
   * Update goal status
   */
  async updateGoalStatus(
    goalId: string,
    status: 'ACTIVE' | 'COMPLETED' | 'MISSED'
  ): Promise<{ id: string; status: string }> {
    const response = await apiClient.patch(`/goals/smaller/${goalId}`, {
      status,
    });
    return response.data;
  },

  /**
   * Get detailed view of a larger goal
   */
  async getLargerGoalDetails(largerGoalId: string): Promise<{
    largerGoal: {
      id: string;
      title: string;
      subject: string | null;
      targetDate: string;
      progress: number;
    };
    smallerGoals: Array<{
      id: string;
      title: string;
      status: string;
      progress: number;
      topicCount: number;
    }>;
  }> {
    const response = await apiClient.get(`/goals/larger/${largerGoalId}`);
    return response.data;
  },
};
