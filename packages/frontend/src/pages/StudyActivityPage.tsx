import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { studyactivityService, StudyActivityPrompt } from '../services/studyactivity.service';
import { progressService, TopicProgress } from '../services/progress.service';

type ActivityStep = 'select' | 'read' | 'write' | 'solve' | 'feedback';

export const StudyActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTopicId = searchParams.get('topicId');

  // State
  const [step, setStep] = useState<ActivityStep>(initialTopicId ? 'read' : 'select');
  const [topicId, setTopicId] = useState(initialTopicId || '');
  const [topic, setTopic] = useState<TopicProgress | null>(null);
  const [prompt, setPrompt] = useState<StudyActivityPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<TopicProgress[]>([]);

  // Form state
  const [writeSummary, setWriteSummary] = useState('');
  const [solveAnswers, setSolveAnswers] = useState<Record<string, string>>({});

  // Feedback state
  const [feedback, setFeedback] = useState<{
    feedback?: string;
    score?: number;
    conceptsCovered?: string[];
  } | null>(null);

  useEffect(() => {
    loadTopics();
    if (initialTopicId) {
      loadPrompt(initialTopicId);
    }
  }, []);

  const loadTopics = async () => {
    try {
      const topicsData = await progressService.getTopicProgress();
      setTopics(topicsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load topics');
    }
  };

  const loadPrompt = async (tid: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Find topic
      const foundTopic = topics.find((t) => t.topicId === tid) ||
                         (topics.length > 0 ? topics[0] : null);
      if (!foundTopic && topics.length === 0) {
        await loadTopics();
      }

      const promptData = await studyactivityService.getPrompt(tid);
      setPrompt(promptData);
      setTopicId(tid);
      setStep('read');
    } catch (err: any) {
      setError(err.message || 'Failed to load prompt');
      setStep('select');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitWrite = async () => {
    if (!writeSummary.trim()) {
      setError('Please write a summary');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await studyactivityService.submitActivity(
        topicId,
        'WRITE',
        writeSummary
      );
      setFeedback(result);
      setStep('feedback');
    } catch (err: any) {
      setError(err.message || 'Failed to submit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitSolve = async () => {
    if (!solveAnswers || Object.keys(solveAnswers).length === 0) {
      setError('Please answer at least one question');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Submit all answers as a concatenated string
      const answersText = prompt!.solveQuestions
        .map((q) => `Q: ${q.question}\nA: ${solveAnswers[q.id] || '(not answered)'}`)
        .join('\n\n');

      const result = await studyactivityService.submitActivity(
        topicId,
        'SOLVE',
        answersText
      );
      setFeedback(result);
      setStep('feedback');
    } catch (err: any) {
      setError(err.message || 'Failed to submit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToCheckIn = () => {
    navigate('/checkin');
  };

  if (step === 'select') {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center mb-6">
              <button onClick={() => navigate('/progress')} className="text-gray-600 hover:text-gray-900 mr-4">
                ← Back
              </button>
              <h1 className="text-4xl font-bold text-gray-900">Study Activities</h1>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <p className="text-gray-600 mb-6">Choose a topic to study:</p>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {topics.map((t) => (
                  <button
                    key={t.topicId}
                    onClick={() => loadPrompt(t.topicId)}
                    disabled={isLoading}
                    className="w-full text-left bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-lg p-4 transition"
                  >
                    <div className="font-semibold text-gray-900">{t.chapter}</div>
                    <div className="text-sm text-gray-600">{t.subtopic}</div>
                    <div className="text-xs text-gray-500 mt-1">Mastery: {t.masteryScore}%</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!prompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading activity...</p>
        </div>
      </div>
    );
  }

  const selectedTopic = topics.find((t) => t.topicId === topicId);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <button onClick={() => setStep('select')} className="text-gray-600 hover:text-gray-900 mb-2">
                ← Change Topic
              </button>
              <h1 className="text-3xl font-bold text-gray-900">{selectedTopic?.chapter}</h1>
              <p className="text-gray-600">{selectedTopic?.subtopic}</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
              {error}
            </div>
          )}

          {/* READ Step */}
          {step === 'read' && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mr-4 font-bold">
                  1
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Learn the Concept</h2>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 mb-6 whitespace-pre-wrap text-gray-700 leading-relaxed">
                {prompt.readContent}
              </div>

              <button
                onClick={() => setStep('write')}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Next: Summarize →
              </button>
            </div>
          )}

          {/* WRITE Step */}
          {step === 'write' && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center mr-4 font-bold">
                  2
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Write a Summary</h2>
              </div>

              <p className="text-gray-600 mb-4">
                Summarize what you learned in your own words. Focus on the key concepts.
              </p>

              <textarea
                value={writeSummary}
                onChange={(e) => setWriteSummary(e.target.value)}
                placeholder="Write your summary here..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('read')}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 px-6 rounded-lg transition"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmitWrite}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-lg transition"
                >
                  {isLoading ? '⏳ Evaluating...' : 'Submit Summary →'}
                </button>
              </div>
            </div>
          )}

          {/* SOLVE Step */}
          {step === 'solve' && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center mr-4 font-bold">
                  3
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Practice Questions</h2>
              </div>

              <div className="space-y-6 mb-6">
                {prompt.solveQuestions.map((q) => (
                  <div key={q.id} className="bg-gray-50 rounded-lg p-6">
                    <div className="font-semibold text-gray-900 mb-2">{q.question}</div>
                    {q.hint && <div className="text-sm text-gray-600 mb-3">💡 Hint: {q.hint}</div>}
                    <textarea
                      value={solveAnswers[q.id] || ''}
                      onChange={(e) => setSolveAnswers({ ...solveAnswers, [q.id]: e.target.value })}
                      placeholder="Your answer..."
                      className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('read')}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 px-6 rounded-lg transition"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmitSolve}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-lg transition"
                >
                  {isLoading ? '⏳ Checking...' : 'Submit Answers →'}
                </button>
              </div>
            </div>
          )}

          {/* FEEDBACK Step */}
          {step === 'feedback' && feedback && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center mr-4 font-bold">
                  ✓
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Your Feedback</h2>
              </div>

              {feedback.score !== undefined && (
                <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-6 mb-6">
                  <div className="text-sm text-amber-700 font-semibold">Score</div>
                  <div className="text-4xl font-bold text-amber-900">{feedback.score}%</div>
                </div>
              )}

              {feedback.feedback && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Feedback:</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{feedback.feedback}</p>
                </div>
              )}

              {feedback.conceptsCovered && feedback.conceptsCovered.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Concepts Covered:</h3>
                  <div className="flex flex-wrap gap-2">
                    {feedback.conceptsCovered.map((concept) => (
                      <span key={concept} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        ✓ {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleContinueToCheckIn}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Continue to Check-in →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
