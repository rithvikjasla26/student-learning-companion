import apiClient from './api';

export interface ReviewQueueTopic {
  id: string;
  topicId: string;
  subject: string;
  chapter: string;
  subtopic: string;
  masteryScore: number;
  confidenceScore: number;
  nextDueAt: string;
  daysUntilDue: number;
  statusLabel: 'OVERDUE' | 'TODAY' | 'SOON' | 'FUTURE';
  sm2State: {
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
  };
}

export interface QuickStats {
  checkInsToday: number;
  streak: number;
  totalMastery: number;
  topicsDue: number;
  topicsDueOverdue: number;
}

export interface TopicHierarchy {
  name: string;
  count: number;
  chapters: Array<{
    name: string;
    count: number;
    topics: Array<{
      id: string;
      subtopic: string;
    }>;
  }>;
}

export interface ReviewQueueResponse {
  dueTopics: ReviewQueueTopic[];
  totalDue: number;
  overdueCount: number;
}

export interface TopicHierarchyResponse {
  subjects: TopicHierarchy[];
}

export const learningHubService = {
  /**
   * Get topics due for review with filtering
   */
  async getReviewQueue(
    filter: 'all' | 'today' | 'this-week' | 'overdue' = 'all'
  ): Promise<ReviewQueueResponse> {
    const response = await apiClient.get('/learning-hub/review-queue', {
      params: { filter },
    });
    return response.data;
  },

  /**
   * Get quick stats for dashboard header
   */
  async getQuickStats(): Promise<QuickStats> {
    const response = await apiClient.get('/learning-hub/quick-stats');
    return response.data;
  },

  /**
   * Get hierarchical topic structure for selection dropdowns
   */
  async getTopicsHierarchy(): Promise<TopicHierarchyResponse> {
    const response = await apiClient.get('/learning-hub/topics-hierarchy');
    return response.data;
  },

  /**
   * Log a teaching session
   */
  async logTeaching(
    subject: string,
    chapter: string,
    topicId: string,
    source: 'SCHOOL' | 'COACHING' | 'SELF_STUDY',
    coverageType: 'INTRODUCED' | 'PRACTICE' | 'REVISION',
    homeworkAssigned: boolean = false
  ): Promise<{ taughtLogId: string; createdAt: string }> {
    const response = await apiClient.post('/taught-log', {
      subject,
      chapter,
      topicId,
      source,
      coverageType,
      homeworkAssigned,
    });
    return response.data;
  },
};
