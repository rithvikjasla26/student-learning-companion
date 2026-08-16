import { useState } from 'react';
import apiClient from '../services/api';

interface ReconfirmPageProps {
  sessionId: string;
  topicName: string;
  onComplete: (xpBonus: number, improved: boolean) => void;
}

export const ReconfirmPage: React.FC<ReconfirmPageProps> = ({
  sessionId,
  topicName,
  onComplete,
}) => {
  const [explanation, setExplanation] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    mastery_score: number;
    improved: boolean;
    xpBonus: number;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (explanation.trim().length < 10) {
      setError('Please write at least 10 characters');
      return;
    }

    setIsEvaluating(true);
    setError(null);

    try {
      const response = await apiClient.post('/checkin/reconfirm', {
        sessionId,
        explanation,
      });

      setFeedback({
        mastery_score: response.data.mastery_score,
        improved: response.data.improved,
        xpBonus: response.data.xpBonus,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to evaluate');
    } finally {
      setIsEvaluating(false);
    }
  };

  if (feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Progress Assessment</h1>

            {/* XP Bonus */}
            {feedback.xpBonus > 0 && (
              <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Bonus XP Earned</p>
                <p className="text-3xl font-bold text-yellow-600">+{feedback.xpBonus} XP</p>
              </div>
            )}

            {/* Improvement Indicator */}
            {feedback.improved && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <p className="text-lg font-semibold text-green-700">✓ You Improved!</p>
                <p className="text-green-600">
                  Your mastery score increased to {feedback.mastery_score}%
                </p>
              </div>
            )}

            {!feedback.improved && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="text-lg font-semibold text-blue-700">Keep Practicing</p>
                <p className="text-blue-600">
                  Your mastery score is {feedback.mastery_score}%. Review and try again!
                </p>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => onComplete(feedback.xpBonus, feedback.improved)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Let's Check Your Understanding</h1>
          <p className="text-gray-600 mb-8">
            Explain {topicName} again after practicing with the widget
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Your Updated Explanation
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Now that you've practiced, explain what you've learned..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                rows={6}
              />
              <p className="text-xs text-gray-500 mt-2">{explanation.length} characters</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isEvaluating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
            >
              {isEvaluating ? 'Evaluating...' : 'Evaluate Progress'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
