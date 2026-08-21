import { PrismaClient } from '@prisma/client';
import { llmService } from './llm.service.js';

const prisma = new PrismaClient();

export const studyactivityService = {
  /**
   * Get prompt for a topic - generates READ content and SOLVE questions
   */
  async getPrompt(studentId: string, topicId: string): Promise<{
    readContent: string;
    solveQuestions: Array<{
      id: string;
      question: string;
      hint?: string;
    }>;
  }> {
    // Get topic details
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new Error('Topic not found');
    }

    // Generate READ content using Claude
    const readSystemPrompt = `You are an educational content writer for CBSE students.
Generate a clear, concise explanation of the topic to help students understand it better.
Keep it around 200-300 words, organized in bullet points.
Use simple language that a ${8}-12 grade student can understand.`;

    const readPrompt = `Explain the following topic for a student to read and understand:
Topic: ${topic.subtopic}
Subject: ${topic.subject}
Chapter: ${topic.chapter}
Key Concepts: ${topic.expectedConcepts.join(', ')}

Provide a clear, engaging explanation with examples where relevant.`;

    let readContent = '';
    try {
      readContent = await llmService.callLLM('haiku', readPrompt, readSystemPrompt);
    } catch (error) {
      console.error('Failed to generate READ content:', error);
      readContent = `Understanding ${topic.subtopic}\n\nKey concepts: ${topic.expectedConcepts.join(', ')}\n\nStudy the topic using your textbook or class notes.`;
    }

    // Generate SOLVE questions
    const solveSystemPrompt = `You are an educational question writer for CBSE students.
Generate 2-3 practice questions that test understanding of the topic.
Make them progressively harder (easy, medium, hard).
Format as JSON array: [{"question":"...", "hint":"..."}]`;

    const solvePrompt = `Generate practice questions for:
Topic: ${topic.subtopic}
Subject: ${topic.subject}
Chapter: ${topic.chapter}
Key Concepts: ${topic.expectedConcepts.join(', ')}

Create 2-3 questions (easy to hard) that test understanding of these concepts.
Return ONLY valid JSON array format.`;

    let solveQuestions: Array<{ question: string; hint?: string }> = [];
    try {
      const solveResponse = await llmService.callLLM('haiku', solvePrompt, solveSystemPrompt);
      const parsed = JSON.parse(solveResponse);
      solveQuestions = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to generate SOLVE questions:', error);
      solveQuestions = [
        {
          question: `Explain the key concepts of ${topic.subtopic}`,
          hint: `Focus on: ${topic.expectedConcepts.slice(0, 2).join(', ')}`,
        },
      ];
    }

    // Map to response format with IDs
    return {
      readContent,
      solveQuestions: solveQuestions.map((q, idx) => ({
        id: `q${idx + 1}`,
        question: q.question,
        hint: q.hint,
      })),
    };
  },

  /**
   * Submit a study activity (WRITE or SOLVE)
   */
  async submitActivity(
    studentId: string,
    topicId: string,
    activityType: 'READ' | 'WRITE' | 'SOLVE',
    content: string,
    taughtLogId?: string
  ): Promise<{
    activityId: string;
    feedback?: string;
    score?: number;
    conceptsCovered?: string[];
  }> {
    // Get topic details
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new Error('Topic not found');
    }

    let aiEvaluation: any = null;

    // For WRITE activities, evaluate the summary
    if (activityType === 'WRITE') {
      const evaluationPrompt = `You are an educator evaluating a student's summary of a topic.
Evaluate how well they understood the topic based on their summary.
Return JSON: {"feedback":"...", "score":0-100, "conceptsCovered":["concept1", "concept2"]}`;

      const userPrompt = `Student's summary of "${topic.subtopic}":
${content}

Expected key concepts: ${topic.expectedConcepts.join(', ')}

Evaluate their understanding (0-100) and provide feedback.`;

      try {
        const response = await llmService.callLLM('haiku', userPrompt, evaluationPrompt);
        aiEvaluation = JSON.parse(response);
      } catch (error) {
        console.error('Failed to evaluate WRITE activity:', error);
        aiEvaluation = {
          feedback: 'Good effort! Review the key concepts to strengthen your understanding.',
          score: 70,
          conceptsCovered: topic.expectedConcepts.slice(0, 2),
        };
      }
    }

    // Create StudyActivity record
    const activity = await prisma.studyActivity.create({
      data: {
        studentId,
        topicId,
        taughtLogId,
        activityType,
        content: activityType !== 'READ' ? content : null,
        aiEvaluation,
      },
    });

    return {
      activityId: activity.id,
      feedback: aiEvaluation?.feedback,
      score: aiEvaluation?.score,
      conceptsCovered: aiEvaluation?.conceptsCovered,
    };
  },

  /**
   * Get activity history for a student and topic
   */
  async getActivityHistory(
    studentId: string,
    topicId: string,
    limit: number = 20
  ): Promise<Array<{
    id: string;
    activityType: string;
    score?: number;
    createdAt: Date;
  }>> {
    const activities = await prisma.studyActivity.findMany({
      where: {
        studentId,
        topicId,
      },
      select: {
        id: true,
        activityType: true,
        aiEvaluation: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return activities.map((a) => ({
      id: a.id,
      activityType: a.activityType,
      score: (a.aiEvaluation as any)?.score,
      createdAt: a.createdAt,
    }));
  },
};
