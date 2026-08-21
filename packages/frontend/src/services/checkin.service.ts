import apiClient from './api';

export interface Topic {
  topicId: string;
  subject: string;
  chapter: string;
  subtopic: string;
  expectedConcepts: string[];
}

export interface EvaluationResult {
  sessionId: string;
  mastery_score: number;
  gap_type: string;
  gap_description: string;
  follow_up_question?: string;
  xpEarned: number;
}

export interface CheckInSession {
  id: string;
  date: string;
  topic: {
    subject: string;
    chapter: string;
    subtopic: string;
  };
  gapType: string;
  xpEarned: number;
}

export interface AudioUploadResult {
  success: boolean;
  file: {
    filename: string;
    originalName: string;
    size: number;
  };
  transcription: {
    text: string;
    confidence: number;
    language: string;
  };
}

export const checkinService = {
  /**
   * Start a new check-in session
   */
  async startCheckIn(): Promise<Topic> {
    const response = await apiClient.post('/checkin/start');
    return response.data;
  },

  /**
   * Evaluate student's explanation
   */
  async evaluateExplanation(
    topicId: string,
    explanation: string
  ): Promise<EvaluationResult> {
    const response = await apiClient.post('/checkin/evaluate', {
      topicId,
      explanation,
    });
    return response.data;
  },

  /**
   * Upload audio file for transcription
   */
  async uploadAudio(audioBlob: Blob, duration: number): Promise<AudioUploadResult> {
    const formData = new FormData();
    formData.append('audio', audioBlob, `recording-${Date.now()}.webm`);
    formData.append('duration', duration.toString());

    const response = await apiClient.post('/checkin/upload-audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get check-in history
   */
  async getHistory(limit = 20, offset = 0): Promise<{
    total: number;
    sessions: CheckInSession[];
  }> {
    const response = await apiClient.get('/checkin/history', {
      params: { limit, offset },
    });
    return response.data;
  },
};
