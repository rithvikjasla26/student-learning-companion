import { Flashcard } from '../components/Flashcard';
import { FillInBlank } from '../components/FillInBlank';
import { DragDropLabel } from '../components/DragDropLabel';
import { pickWidgetByGapType, generateSampleWidgetContent } from '../services/widgetRouter';

interface WidgetPageProps {
  gapType: string;
  topicName: string;
  onNext: () => void;
}

export const WidgetPage: React.FC<WidgetPageProps> = ({ gapType, topicName, onNext }) => {
  const widgetType = pickWidgetByGapType(gapType);
  const widgetContent = generateSampleWidgetContent(gapType, topicName);

  const renderWidget = () => {
    const content = widgetContent.content;

    switch (widgetType) {
      case 'flashcard':
        return (
          <Flashcard
            front={content.front}
            back={content.back}
            onNext={onNext}
          />
        );

      case 'fill_in_blank':
        return (
          <FillInBlank
            sentence={content.sentence}
            blankWord={content.blankWord}
            hints={content.hints || []}
            onAnswer={() => {}} // Will implement in Phase 5
            onNext={onNext}
          />
        );

      case 'drag_drop_label':
        return (
          <DragDropLabel
            imageUrl={content.imageUrl}
            labels={content.labels || []}
            zones={content.zones || []}
            onComplete={() => {}} // Will implement in Phase 5
            onNext={onNext}
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
