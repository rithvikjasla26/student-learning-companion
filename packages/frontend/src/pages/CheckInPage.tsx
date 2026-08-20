import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkinService, Topic, EvaluationResult } from '../services/checkin.service';
import { EvaluationFeedback } from '../components/EvaluationFeedback';
import { AudioRecorder } from '../components/AudioRecorder';
import { Header } from '../components/Header';
import { WidgetPage } from './WidgetPage';
import { ReconfirmPage } from './ReconfirmPage';

type CheckInStep = 'loading' | 'input' | 'feedback' | 'widget' | 'reconfirm' | 'results';

export const CheckInPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<CheckInStep>('loading');
  const [topic, setTopic] = useState<Topic | null>(null);
  const [explanation, setExplanation] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [useVoiceInput, setUseVoiceInput] = useState(false);

  // Multi-step flow state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [checkInXp, setCheckInXp] = useState(0);
  const [widgetXp, setWidgetXp] = useState(0);
  const [reconfirmXp, setReconfirmXp] = useState(0);
  const [initialMastery, setInitialMastery] = useState(0);
  const [finalMastery, setFinalMastery] = useState(0);

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
      setCheckInXp(result.xpEarned);
      setInitialMastery(result.mastery_score);
      setFinalMastery(result.mastery_score);
      // Extract sessionId from result if available, otherwise generate a placeholder
      setSessionId(result.sessionId || `session_${Date.now()}`);
      setStep('feedback');
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate explanation');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleContinueToWidget = () => {
    setStep('widget');
  };

  const handleWidgetComplete = (xpEarned: number) => {
    setWidgetXp(xpEarned);
    setStep('reconfirm');
  };

  const handleReconfirmComplete = (data: { xpEarned: number; improved: boolean; masteryScoreChange: number }) => {
    setReconfirmXp(data.xpEarned);
    setFinalMastery((prev) => prev + data.masteryScoreChange);
    setStep('results');
  };

  const handleBackToProgress = () => {
    navigate('/progress');
  };

  const handleStartNew = () => {
    setExplanation('');
    setEvaluation(null);
    setAudioBlob(null);
    setAudioDuration(0);
    setUseVoiceInput(false);
    setSessionId(null);
    setCheckInXp(0);
    setWidgetXp(0);
    setReconfirmXp(0);
    setInitialMastery(0);
    setFinalMastery(0);
    loadTopic();
  };

  const handleAudioRecorded = (blob: Blob, duration: number) => {
    setAudioBlob(blob);
    setAudioDuration(duration);
  };

  const handleUploadAudio = async () => {
    if (!audioBlob) return;

    setIsUploadingAudio(true);
    setError(null);

    try {
      const result = await checkinService.uploadAudio(audioBlob, audioDuration);
      if (result.transcription && result.transcription.text) {
        setExplanation(result.transcription.text);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload audio');
    } finally {
      setIsUploadingAudio(false);
    }
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
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
        <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Check-in</h1>
          <p className="text-gray-600">Tell us what you studied today</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {step === 'input' && !topic && (
            <div className="text-center space-y-4">
              <div className="text-red-600 text-lg mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900">Unable to Load Today's Topic</h2>
              <p className="text-gray-600">{error || 'Please try again'}</p>
              <button
                onClick={loadTopic}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Try Again
              </button>
            </div>
          )}

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

              {/* Input Method Selection */}
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setUseVoiceInput(false)}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                    !useVoiceInput
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📝 Text Input
                </button>
                <button
                  type="button"
                  onClick={() => setUseVoiceInput(true)}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                    useVoiceInput
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🎤 Voice Input
                </button>
              </div>

              {/* Explanation Input - Text */}
              {!useVoiceInput && (
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
              )}

              {/* Voice Input */}
              {useVoiceInput && (
                <div className="space-y-4">
                  <AudioRecorder
                    onAudioRecorded={handleAudioRecorded}
                    isUploading={isUploadingAudio}
                  />
                  {audioBlob && (
                    <button
                      type="button"
                      onClick={handleUploadAudio}
                      disabled={isUploadingAudio}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
                    >
                      {isUploadingAudio ? (
                        <span className="flex items-center justify-center">
                          <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                          Transcribing...
                        </span>
                      ) : (
                        '✓ Use This Recording'
                      )}
                    </button>
                  )}
                  {explanation && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-semibold text-green-800 mb-2">✓ Transcription:</p>
                      <p className="text-gray-700 text-sm">{explanation}</p>
                    </div>
                  )}
                </div>
              )}

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
                gapType={evaluation.gap_type}
                onContinue={handleContinueToWidget}
                onSkip={handleStartNew}
              />
            </div>
          )}

          {step === 'widget' && evaluation && topic && sessionId && (
            <WidgetPage
              gapType={evaluation.gap_type}
              topicName={topic.subtopic}
              sessionId={sessionId}
              onComplete={handleWidgetComplete}
            />
          )}

          {step === 'reconfirm' && evaluation && topic && sessionId && (
            <ReconfirmPage
              sessionId={sessionId}
              topicName={topic.subtopic}
              gapDescription={evaluation.gap_description}
              initialMastery={initialMastery}
              onComplete={handleReconfirmComplete}
            />
          )}

          {step === 'results' && evaluation && topic && (
            <div className="space-y-6">
              {/* Results Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Learning Session Complete!</h2>
                <p className="text-gray-600">Great job completing your check-in flow</p>
              </div>

              {/* Total XP Earned */}
              <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-600 mb-2">Total XP Earned</p>
                <p className="text-4xl font-bold text-yellow-600">+{checkInXp + widgetXp + reconfirmXp} XP</p>
                <div className="flex justify-around mt-4 text-sm">
                  <div>
                    <p className="text-gray-600">Check-in</p>
                    <p className="font-bold text-blue-600">+{checkInXp}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Widget</p>
                    <p className="font-bold text-green-600">+{widgetXp}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Reconfirm</p>
                    <p className="font-bold text-purple-600">+{reconfirmXp}</p>
                  </div>
                </div>
              </div>

              {/* Mastery Improvement */}
              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">Mastery Score Progress</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600">Initial</p>
                    <p className="text-2xl font-bold text-gray-900">{initialMastery}%</p>
                  </div>
                  <div className="text-2xl text-indigo-500">→</div>
                  <div>
                    <p className="text-gray-600">Final</p>
                    <p className="text-2xl font-bold text-indigo-600">{finalMastery}%</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleBackToProgress}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Back to Progress
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>💡 Tip: Be as detailed as possible in your explanation for better feedback</p>
        </div>
      </div>
      </div>
    </>
  );
};
