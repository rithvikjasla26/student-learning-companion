import apiClient from './api';

export interface StudentStats {
  totalXp: number;
  level: number;
  subjectLevels: Record<string, number>;
  streakCount: number;
  lastCheckInDate: string | null;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string | null;
    earnedAt: string;
  }>;
}

export interface TopicProgress {
  topicId: string;
  subject: string;
  chapter: string;
  subtopic: string;
  masteryScore: number;
  confidenceScore: number;
  nextDueAt: string;
  lastReviewedAt: string | null;
}

export interface CheckInRecord {
  id: string;
  date: string;
  topicId: string | null;
  subject: string | null;
  chapter: string | null;
  gapType: string | null;
  xpEarned: number;
  masteryScore: number | null;
}

export interface TrendData {
  date: string;
  xpEarned: number;
}

export const progressService = {
  /**
   * Get student's overall stats
   */
  async getProgressOverview(): Promise<StudentStats> {
    const response = await apiClient.get('/progress/overview');
    return response.data;
  },

  /**
   * Get progress for all topics
   */
  async getTopicProgress(): Promise<TopicProgress[]> {
    const response = await apiClient.get('/progress/topics');
    return response.data.topics;
  },

  /**
   * Get check-in history with pagination
   */
  async getCheckInHistory(limit: number = 20, offset: number = 0): Promise<{
    checkIns: CheckInRecord[];
    total: number;
  }> {
    const response = await apiClient.get('/progress/check-ins', {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * Get XP trend for last 7 days
   */
  async getWeeklyTrend(): Promise<TrendData[]> {
    const response = await apiClient.get('/progress/trend');
    return response.data.trend;
  },
};
