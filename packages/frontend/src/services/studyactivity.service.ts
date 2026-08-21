import apiClient from './api';

export interface StudyActivityPrompt {
  readContent: string;
  solveQuestions: Array<{
    id: string;
    question: string;
    hint?: string;
  }>;
}

export interface StudyActivityResult {
  activityId: string;
  feedback?: string;
  score?: number;
  conceptsCovered?: string[];
}

export const studyactivityService = {
  /**
   * Get prompt for a topic (READ content + SOLVE questions)
   */
  async getPrompt(topicId: string): Promise<StudyActivityPrompt> {
    const response = await apiClient.get('/study-activity/prompt', {
      params: { topicId },
    });
    return response.data;
  },

  /**
   * Submit a study activity (WRITE or SOLVE)
   */
  async submitActivity(
    topicId: string,
    activityType: 'READ' | 'WRITE' | 'SOLVE',
    content?: string,
    taughtLogId?: string
  ): Promise<StudyActivityResult> {
    const response = await apiClient.post('/study-activity/submit', {
      topicId,
      activityType,
      content,
      taughtLogId,
    });
    return response.data;
  },

  /**
   * Get activity history for a topic
   */
  async getHistory(
    topicId: string,
    limit: number = 20
  ): Promise<{
    activities: Array<{
      id: string;
      activityType: string;
      score?: number;
      createdAt: string;
    }>;
  }> {
    const response = await apiClient.get('/study-activity/history', {
      params: { topicId, limit },
    });
    return response.data;
  },
};
