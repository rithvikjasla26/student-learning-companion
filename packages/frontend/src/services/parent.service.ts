import apiClient from './api';

export interface Child {
  id: string;
  name: string;
  gradeLevel: number;
  subjects: string[];
}

export interface ChildProgress {
  name: string;
  gradeLevel: number;
  subjects: string[];
  stats: {
    totalXp: number;
    level: number;
    streakCount: number;
    lastCheckInDate: string | null;
  };
  topicsProgress: Array<{
    subject: string;
    chapter: string;
    masteryScore: number;
  }>;
  weakTopics: Array<{
    subject: string;
    chapter: string;
    subtopic: string;
    masteryScore: number;
  }>;
}

export interface WeeklySummary {
  topicsCovered: Array<{
    subject: string;
    chapter: string;
    checkInCount: number;
    averageMastery: number;
  }>;
  totalCheckIns: number;
  averageXpPerDay: number;
  xpThisWeek: number;
}

export const parentService = {
  /**
   * Get list of linked children
   */
  async getLinkedChildren(): Promise<Child[]> {
    const response = await apiClient.get('/parent/children');
    return response.data.children;
  },

  /**
   * Get progress snapshot for a child
   */
  async getChildProgress(studentId: string): Promise<ChildProgress> {
    const response = await apiClient.get(`/parent/children/${studentId}/progress`);
    return response.data;
  },

  /**
   * Get weekly summary for a child
   */
  async getWeeklySummary(studentId: string): Promise<WeeklySummary> {
    const response = await apiClient.get(`/parent/children/${studentId}/weekly-summary`);
    return response.data;
  },

  /**
   * Generate an invite code
   */
  async generateInviteCode(): Promise<{ code: string; expiresAt: string }> {
    const response = await apiClient.post('/parent/invite-code');
    return response.data;
  },

  /**
   * Link a child by student ID
   */
  async linkChild(studentId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/parent/link-child', { studentId });
    return response.data;
  },
};
