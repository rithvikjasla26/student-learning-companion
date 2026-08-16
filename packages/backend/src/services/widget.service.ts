import { PrismaClient, WidgetType } from '@prisma/client';

const prisma = new PrismaClient();

export const widgetService = {
  /**
   * Get a widget by gap type for a topic
   */
  async getWidgetByGapType(
    topicId: string,
    gapType: string
  ): Promise<{
    widgetId: string;
    type: string;
    content: Record<string, any>;
  }> {
    // Find or create a widget for this gap type
    let widget = await prisma.widget.findFirst({
      where: {
        topicId,
        type: mapGapTypeToWidgetType(gapType) as WidgetType,
      },
    });

    if (!widget) {
      // Create a sample widget if none exists
      widget = await prisma.widget.create({
        data: {
          topicId,
          type: mapGapTypeToWidgetType(gapType) as WidgetType,
          contentJson: generateSampleContent(gapType),
        },
      });
    }

    return {
      widgetId: widget.id,
      type: widget.type,
      content: widget.contentJson as Record<string, any>,
    };
  },

  /**
   * Submit widget response
   */
  async submitWidgetResponse(
    studentId: string,
    widgetId: string,
    studentAnswer: string,
    sessionId?: string
  ): Promise<{
    isCorrect: boolean;
    score: number;
    feedback: string;
  }> {
    const widget = await prisma.widget.findUnique({
      where: { id: widgetId },
    });

    if (!widget) {
      throw new Error('Widget not found');
    }

    // Evaluate answer (simplified for MVP)
    const isCorrect = evaluateAnswer(widget.type, studentAnswer, widget.contentJson);
    const score = isCorrect ? 100 : 50;

    // Save response
    await prisma.widgetResponse.create({
      data: {
        widgetId,
        studentId,
        sessionId,
        studentAnswer,
        isCorrect,
        timeSpentMs: 0,
      },
    });

    return {
      isCorrect,
      score,
      feedback: isCorrect
        ? 'Great job! Your answer is correct.'
        : 'Your answer needs improvement. Review the concept and try again.',
    };
  },

  /**
   * Get widget performance for a student
   */
  async getWidgetPerformance(studentId: string): Promise<{
    totalAttempts: number;
    correctAttempts: number;
    accuracy: number;
  }> {
    const responses = await prisma.widgetResponse.findMany({
      where: { studentId },
    });

    const correct = responses.filter((r) => r.isCorrect).length;
    const total = responses.length;

    return {
      totalAttempts: total,
      correctAttempts: correct,
      accuracy: total > 0 ? (correct / total) * 100 : 0,
    };
  },
};

/**
 * Map gap type to widget type
 */
function mapGapTypeToWidgetType(gapType: string): string {
  switch (gapType) {
    case 'recall':
      return 'FLASHCARD';
    case 'structural':
      return 'DRAG_DROP_LABEL';
    case 'sequence':
      return 'FILL_IN_BLANK';
    case 'application':
      return 'DRAG_DROP_LABEL';
    default:
      return 'FLASHCARD';
  }
}

/**
 * Simple answer evaluation
 */
function evaluateAnswer(
  widgetType: WidgetType,
  studentAnswer: string,
  contentJson: any
): boolean {
  // MVP: Accept any non-empty answer
  // In production, implement proper validation
  if (widgetType === 'FLASHCARD') {
    return true; // Flashcards are self-evaluated
  }

  if (widgetType === 'FILL_IN_BLANK') {
    const correctAnswer = (contentJson as any)?.blankWord || '';
    return fuzzyMatch(studentAnswer, correctAnswer);
  }

  if (widgetType === 'DRAG_DROP_LABEL') {
    return studentAnswer.length > 0; // Basic check for MVP
  }

  return false;
}

/**
 * Fuzzy match for answers
 */
function fuzzyMatch(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '');

  const userNorm = normalize(userAnswer);
  const correctNorm = normalize(correctAnswer);

  if (userNorm === correctNorm) return true;
  if (correctNorm.length === 0) return false;

  const matches = [...userNorm].filter((char) => correctNorm.includes(char)).length;
  return matches / correctNorm.length >= 0.7;
}

/**
 * Generate sample widget content
 */
function generateSampleContent(gapType: string): any {
  switch (gapType) {
    case 'recall':
      return {
        front: 'What is the primary concept?',
        back: 'Understanding the fundamental principles',
      };

    case 'structural':
      return {
        imageUrl: 'https://via.placeholder.com/600x400',
        labels: [
          { id: 'label1', text: 'Component A' },
          { id: 'label2', text: 'Component B' },
        ],
        zones: [
          { id: 'zone1', x: 25, y: 50 },
          { id: 'zone2', x: 75, y: 50 },
        ],
      };

    case 'sequence':
      return {
        sentence: 'The process begins with _____ and continues to the next step.',
        blankWord: 'identification',
        hints: ['First step in any process', 'Finding what needs to be done'],
      };

    default:
      return {};
  }
}
