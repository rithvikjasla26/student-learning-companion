import { useState } from 'react';
import { Flashcard } from '../components/Flashcard';
import { FillInBlank } from '../components/FillInBlank';
import { DragDropLabel } from '../components/DragDropLabel';
import { pickWidgetByGapType, generateSampleWidgetContent } from '../services/widgetRouter';
import apiClient from '../services/api';

interface WidgetPageProps {
  gapType: string;
  topicName: string;
  sessionId: string;
  onComplete: (xpEarned: number) => void;
}

export const WidgetPage: React.FC<WidgetPageProps> = ({ gapType, topicName, sessionId, onComplete }) => {
  const widgetType = pickWidgetByGapType(gapType);
  const widgetContent = generateSampleWidgetContent(gapType, topicName);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  const handleAnswer = (_answer: string, isCorrect: boolean) => {
    setTotalAttempts((prev) => prev + 1);
    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Calculate XP
      const baseXP = 10;
      const accuracy = totalAttempts > 0 ? correctAnswers / totalAttempts : 0;
      const bonus = accuracy > 0.8 ? 5 : 0;
      const totalXP = Math.min(baseXP + bonus, 15);

      // Submit widget response
      const response = await apiClient.post('/api/widgets/submit-response', {
        sessionId,
        widgetType,
        correctAnswers,
        totalAttempts,
        accuracy,
        xpEarned: totalXP,
      });

      const xpEarned = response.data.xpEarned || totalXP;
      onComplete(xpEarned);
    } catch (err: any) {
      // Fallback to calculated XP if submission fails
      const baseXP = 10;
      const accuracy = totalAttempts > 0 ? correctAnswers / totalAttempts : 0;
      const bonus = accuracy > 0.8 ? 5 : 0;
      const totalXP = Math.min(baseXP + bonus, 15);
      onComplete(totalXP);
    }
  };

  const renderWidget = () => {
    const content = widgetContent.content;

    switch (widgetType) {
      case 'flashcard':
        return (
          <Flashcard
            front={content.front}
            back={content.back}
            onNext={handleComplete}
          />
        );

      case 'fill_in_blank':
        return (
          <FillInBlank
            sentence={content.sentence}
            blankWord={content.blankWord}
            hints={content.hints || []}
            onAnswer={handleAnswer}
            onNext={handleComplete}
          />
        );

      case 'drag_drop_label':
        return (
          <DragDropLabel
            imageUrl={content.imageUrl}
            labels={content.labels || []}
            zones={content.zones || []}
            onComplete={handleComplete}
            onNext={handleComplete}
          />
        );

      default:
        return (
          <div className="text-center">
            <p className="text-gray-600">Unknown widget type</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice Widget</h1>
          <p className="text-gray-600">
            Let's practice with a {widgetType} to strengthen your understanding
          </p>
        </div>

        {/* Widget Container */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {renderWidget()}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>📚 Practice helps reinforce your learning</p>
        </div>
      </div>
    </div>
  );
};
