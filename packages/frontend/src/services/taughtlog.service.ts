import apiClient from './api';

export interface TaughtLog {
  id: string;
  subject: string;
  chapter: string;
  topicId: string;
  source: 'SCHOOL' | 'COACHING' | 'SELF_STUDY';
  coverageType: 'INTRODUCED' | 'PRACTICE' | 'REVISION';
  homeworkAssigned: boolean;
  createdAt: string;
}

export const taughtlogService = {
  /**
   * Log what was taught
   */
  async createTaughtLog(
    subject: string,
    chapter: string,
    topicId: string,
    source: 'SCHOOL' | 'COACHING' | 'SELF_STUDY' = 'SCHOOL',
    coverageType: 'INTRODUCED' | 'PRACTICE' | 'REVISION' = 'INTRODUCED',
    homeworkAssigned: boolean = false
  ): Promise<{
    taughtLogId: string;
    createdAt: string;
  }> {
    const response = await apiClient.post('/taught-log/create', {
      subject,
      chapter,
      topicId,
      source,
      coverageType,
      homeworkAssigned,
    });
    return response.data;
  },

  /**
   * Get teaching log history
   */
  async getTaughtLogHistory(
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    logs: TaughtLog[];
    total: number;
  }> {
    const response = await apiClient.get('/taught-log/history', {
      params: { limit, offset },
    });
    return response.data;
  },
};
