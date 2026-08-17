import { EvaluationResult } from '../services/checkin.service';
import { pickWidgetByGapType } from '../services/widgetRouter';

interface EvaluationFeedbackProps {
  evaluation: EvaluationResult;
  gapType: string;
  onContinue: () => void;
  onSkip: () => void;
}

const gapTypeColors = {
  recall: 'bg-blue-100 text-blue-800',
  structural: 'bg-yellow-100 text-yellow-800',
  sequence: 'bg-orange-100 text-orange-800',
  application: 'bg-red-100 text-red-800',
  none: 'bg-green-100 text-green-800',
};

const gapTypeLabels = {
  recall: 'Recall Gap',
  structural: 'Structural Understanding',
  sequence: 'Sequence/Process',
  application: 'Application Skills',
  none: 'No Gaps Detected',
};

const widgetTypeNames = {
  flashcard: 'Flashcard',
  fill_in_blank: 'Fill in the Blank',
  drag_drop_label: 'Diagram Labeling',
};

export const EvaluationFeedback: React.FC<EvaluationFeedbackProps> = ({
  evaluation,
  gapType,
  onContinue,
  onSkip,
}) => {
  const masteryPercentage = evaluation.mastery_score;
  const masteryColor =
    masteryPercentage >= 80
      ? 'text-green-600'
      : masteryPercentage >= 50
        ? 'text-yellow-600'
        : 'text-red-600';

  const widgetType = pickWidgetByGapType(gapType);
  const widgetName = widgetTypeNames[widgetType as keyof typeof widgetTypeNames] || 'Practice';

  return (
    <div className="space-y-6">
      {/* XP Earned */}
      <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600 mb-1">XP Earned</p>
        <p className="text-3xl font-bold text-yellow-600">+{evaluation.xpEarned} XP</p>
      </div>

      {/* Mastery Score */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-gray-700">Mastery Score</p>
          <p className={`text-2xl font-bold ${masteryColor}`}>{masteryPercentage}%</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              masteryPercentage >= 80
                ? 'bg-green-500'
                : masteryPercentage >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${masteryPercentage}%` }}
          />
        </div>
      </div>

      {/* Gap Type Badge */}
      <div>
        <p className="text-sm font-semibold text-gray-600 mb-2">Type of Gap Detected:</p>
        <span
          className={`inline-block px-4 py-2 rounded-full font-semibold text-sm ${
            gapTypeColors[evaluation.gap_type as keyof typeof gapTypeColors] ||
            gapTypeColors.none
          }`}
        >
          {gapTypeLabels[evaluation.gap_type as keyof typeof gapTypeLabels] ||
            'Unknown'}
        </span>
      </div>

      {/* Gap Description */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <p className="text-sm font-semibold text-gray-700 mb-1">Feedback:</p>
        <p className="text-gray-700">{evaluation.gap_description}</p>
      </div>

      {/* Follow-up Question */}
      {evaluation.follow_up_question && (
        <div className="bg-purple-50 border-l-4 border-purple-400 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-1">
            Question to Think About:
          </p>
          <p className="text-gray-700 italic">{evaluation.follow_up_question}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={onContinue}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
        >
          Practice with {widgetName}
        </button>
        <button
          onClick={onSkip}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
        >
          Skip Practice
        </button>
      </div>
    </div>
  );
};
