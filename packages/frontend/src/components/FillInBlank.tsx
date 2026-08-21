import { useState } from 'react';

interface FillInBlankProps {
  sentence: string;
  blankWord: string;
  hints?: string[];
  onAnswer: (answer: string, isCorrect: boolean) => void;
  onNext: () => void;
}

/**
 * Simple fuzzy match for answer checking
 */
function fuzzyMatch(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '');

  const userNorm = normalize(userAnswer);
  const correctNorm = normalize(correctAnswer);

  // Exact match
  if (userNorm === correctNorm) return true;

  // Check if normalized answer contains majority of correct answer
  if (correctNorm.length === 0) return false;

  const matches = [...userNorm].filter((char) => correctNorm.includes(char)).length;
  return matches / correctNorm.length >= 0.7; // 70% match
}

export const FillInBlank: React.FC<FillInBlankProps> = ({
  sentence,
  blankWord,
  hints = [],
  onAnswer,
  onNext,
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const handleSubmit = () => {
    if (!userAnswer.trim()) {
      setFeedback('incorrect');
      return;
    }

    const isCorrect = fuzzyMatch(userAnswer, blankWord);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setAttemptCount(attemptCount + 1);
    onAnswer(userAnswer, isCorrect);
  };

  return (
    <div className="space-y-6">
      {/* Sentence with Blank */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
        <p className="text-lg text-gray-800 leading-relaxed">
          {sentence.split('_____').map((part, i) => (
            <span key={i}>
              {part}
              {i < sentence.split('_____').length - 1 && (
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="_____"
                  disabled={feedback === 'correct'}
                  className="inline-block mx-2 px-3 py-1 border-b-2 border-blue-400 focus:border-blue-600 outline-none text-center font-semibold disabled:bg-green-100 disabled:border-green-500 w-32"
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                />
              )}
            </span>
          ))}
        </p>
      </div>

      {/* Feedback */}
      {feedback === 'correct' && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 text-green-700">
          <p className="font-semibold">✓ Correct!</p>
          <p className="text-sm">The answer is: <strong>{blankWord}</strong></p>
        </div>
      )}

      {feedback === 'incorrect' && attemptCount < 2 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          <p className="font-semibold">✗ Not quite right</p>
          <p className="text-sm">Try again or click "Show Hint" for help</p>
        </div>
      )}

      {feedback === 'incorrect' && attemptCount >= 2 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 text-yellow-700">
          <p className="font-semibold">The answer was: <strong>{blankWord}</strong></p>
          <p className="text-sm">Keep practicing to improve!</p>
        </div>
      )}

      {/* Hints */}
      {hints.length > 0 && !showHint && feedback !== 'correct' && (
        <button
          onClick={() => setShowHint(true)}
          className="w-full text-blue-600 hover:text-blue-700 font-semibold py-2 rounded-lg border border-blue-300 hover:bg-blue-50 transition"
        >
          💡 Show Hint
        </button>
      )}

      {showHint && hints.length > 0 && (
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-900 mb-2">Hint:</p>
          <p className="text-blue-800">{hints[0]}</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {feedback !== 'correct' && (
          <button
            onClick={handleSubmit}
            disabled={!userAnswer.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
          >
            Check Answer
          </button>
        )}
        {feedback === 'correct' && (
          <button
            onClick={onNext}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Continue
          </button>
        )}
        {feedback === 'incorrect' && attemptCount >= 2 && (
          <button
            onClick={onNext}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};
