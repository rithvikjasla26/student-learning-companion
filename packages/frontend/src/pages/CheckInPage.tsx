import { useState, useEffect } from 'react';
import { checkinService, Topic, EvaluationResult } from '../services/checkin.service';
import { EvaluationFeedback } from '../components/EvaluationFeedback';

type CheckInStep = 'loading' | 'input' | 'feedback';

export const CheckInPage: React.FC = () => {
  const [step, setStep] = useState<CheckInStep>('loading');
  const [topic, setTopic] = useState<Topic | null>(null);
  const [explanation, setExplanation] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load topic on mount
  useEffect(() => {
    loadTopic();
  }, []);

  const loadTopic = async () => {
    try {
      setStep('loading');
      setError(null);
      const result = await checkinService.startCheckIn();
      setTopic(result);
      setStep('input');
    } catch (err: any) {
      setError(err.message || 'Failed to load topic');
      setStep('input');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;

    if (explanation.trim().length < 10) {
      setError('Please write at least 10 characters');
      return;
    }

    setIsEvaluating(true);
    setError(null);

    try {
      const result = await checkinService.evaluateExplanation(topic.topicId, explanation);
      setEvaluation(result);
      setStep('feedback');
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate explanation');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleStartNew = () => {
    setExplanation('');
    setEvaluation(null);
    loadTopic();
  };

  if (!topic && step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading today's topic...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Check-in</h1>
          <p className="text-gray-600">Tell us what you studied today</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {step === 'input' && topic && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Topic Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                  Today's Topic
                </p>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {topic.subtopic}
                </h2>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">{topic.chapter}</span> • {topic.subject}
                </p>
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Key Concepts to Cover:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {topic.expectedConcepts.slice(0, 5).map((concept, i) => (
                      <span
                        key={i}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Explanation Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Explain what you learned (in your own words)
                </label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="I studied... and I learned that... because..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {explanation.length} characters • Minimum 10 characters
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isEvaluating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
              >
                {isEvaluating ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Evaluating...
                  </span>
                ) : (
                  'Evaluate My Understanding'
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Our AI will analyze your explanation and provide feedback
              </p>
            </form>
          )}

          {step === 'feedback' && evaluation && (
            <div>
              <EvaluationFeedback
                evaluation={evaluation}
                onNext={handleStartNew}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>💡 Tip: Be as detailed as possible in your explanation for better feedback</p>
        </div>
      </div>
    </div>
  );
};
