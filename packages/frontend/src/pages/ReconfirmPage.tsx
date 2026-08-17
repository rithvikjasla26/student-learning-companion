import { useState, useEffect } from 'react';
import apiClient from '../services/api';

interface ReconfirmPageProps {
  sessionId: string;
  topicName: string;
  onComplete: (xpEarned: number, improved: boolean) => void;
}

export const ReconfirmPage: React.FC<ReconfirmPageProps> = ({
  sessionId,
  topicName,
  onComplete,
}) => {
  const [explanation, setExplanation] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 second timer
  const [timerActive, setTimerActive] = useState(true);
  const [feedback, setFeedback] = useState<{
    mastery_score: number;
    improved: boolean;
    xpEarned: number;
    feedback: string;
  } | null>(null);

  // Timer effect
  useEffect(() => {
    if (!timerActive || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, timeRemaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (explanation.trim().length < 10) {
      setError('Please write at least 10 characters');
      return;
    }

    setIsEvaluating(true);
    setError(null);
    setTimerActive(false); // Stop timer while evaluating

    try {
      const response = await apiClient.post('/api/reconfirm/submit', {
        sessionId,
        explanation,
      });

      setFeedback({
        mastery_score: response.data.mastery_score,
        improved: response.data.improved,
        xpEarned: response.data.xpEarned,
        feedback: response.data.feedback,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to evaluate. Please try again.');
      setTimerActive(true); // Resume timer on error
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

            {/* XP Earned */}
            <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">XP Earned</p>
              <p className="text-3xl font-bold text-yellow-600">+{feedback.xpEarned} XP</p>
            </div>

            {/* Mastery Score */}
            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4">
              <p className="text-lg font-semibold text-indigo-700">Mastery Score</p>
              <p className="text-indigo-600">
                {feedback.mastery_score}% - {feedback.improved ? 'Improved!' : 'Keep practicing'}
              </p>
            </div>

            {/* Feedback Message */}
            <div className={`rounded-lg p-4 ${feedback.improved ? 'bg-green-50 border-l-4 border-green-500' : 'bg-orange-50 border-l-4 border-orange-500'}`}>
              <p className={feedback.improved ? 'text-green-700' : 'text-orange-700'}>
                {feedback.feedback}
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={() => onComplete(feedback.xpEarned, feedback.improved)}
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
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Let's Check Your Understanding</h1>
              <p className="text-gray-600 mt-2">
                Explain {topicName} again after practicing with the widget
              </p>
            </div>
            {/* Timer */}
            <div className={`text-right p-3 rounded-lg ${timeRemaining <= 10 ? 'bg-red-50' : 'bg-blue-50'}`}>
              <p className="text-xs text-gray-600 mb-1">Time Remaining</p>
              <p className={`text-2xl font-bold ${timeRemaining <= 10 ? 'text-red-600' : 'text-blue-600'}`}>
                {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
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
                disabled={isEvaluating}
              />
              <p className="text-xs text-gray-500 mt-2">{explanation.length} characters (minimum 10)</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isEvaluating || explanation.trim().length < 10}
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
