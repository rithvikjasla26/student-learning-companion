import apiClient from './api';

export interface NextTopic {
  topicId: string;
  subject: string;
  chapter: string;
  subtopic: string;
  priority: number;
}

export const schedulerService = {
  /**
   * Get the next priority topic for student to study
   * Uses SM-2 scheduling and priority weighting
   * Returns top-priority topic among all due topics
   */
  async getNextTopic(): Promise<NextTopic | null> {
    try {
      const response = await apiClient.get('/scheduler/next-topic');
      return response.data.topic;
    } catch (error: any) {
      // 204 No Content is not an error - just means no topics due
      if (error.response?.status === 204) {
        return null;
      }
      throw error;
    }
  },
};
