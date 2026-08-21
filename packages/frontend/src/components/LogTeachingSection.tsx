import React, { useState } from 'react';
import { TopicHierarchySelect } from './TopicHierarchySelect';
import { learningHubService } from '../services/learningHub.service';

interface LogTeachingSectionProps {
  onTeachingLogged: () => void;
}

type Source = 'SCHOOL' | 'COACHING' | 'SELF_STUDY';
type Coverage = 'INTRODUCED' | 'PRACTICE' | 'REVISION';

export const LogTeachingSection: React.FC<LogTeachingSectionProps> = ({
  onTeachingLogged,
}) => {
  const [topicId, setTopicId] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [source, setSource] = useState<Source>('SCHOOL');
  const [coverage, setCoverage] = useState<Coverage>('INTRODUCED');
  const [homeworkAssigned, setHomeworkAssigned] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleTopicSelect = (selectedTopicId: string, sel: string, chap: string) => {
    setTopicId(selectedTopicId);
    setSubject(sel);
    setChapter(chap);
  };

  const handleLogTeaching = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topicId || !subject || !chapter) {
      setError('Please select a complete subject, chapter, and topic');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      await learningHubService.logTeaching(
        subject,
        chapter,
        topicId,
        source,
        coverage,
        homeworkAssigned
      );

      setSuccess('✅ Teaching logged successfully!');
      handleClearForm();
      onTeachingLogged();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to log teaching');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearForm = () => {
    setTopicId('');
    setSubject('');
    setChapter('');
    setSource('SCHOOL');
    setCoverage('INTRODUCED');
    setHomeworkAssigned(false);
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">📝 Log Today's Teaching</h2>

      <form onSubmit={handleLogTeaching} className="space-y-4">
        {/* Topic Selection */}
        <TopicHierarchySelect
          onTopicSelect={handleTopicSelect}
          selectedTopic={topicId}
          selectedSubject={subject}
          selectedChapter={chapter}
        />

        {/* Source Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source
          </label>
          <div className="space-y-2">
            {(['SCHOOL', 'COACHING', 'SELF_STUDY'] as const).map((src) => (
              <label key={src} className="flex items-center">
                <input
                  type="radio"
                  name="source"
                  value={src}
                  checked={source === src}
                  onChange={(e) => setSource(e.target.value as Source)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {src === 'SCHOOL'
                    ? '🏫 School'
                    : src === 'COACHING'
                    ? '👨‍🏫 Coaching'
                    : '📚 Self-study'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Coverage Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Coverage Level
          </label>
          <div className="space-y-2">
            {(['INTRODUCED', 'PRACTICE', 'REVISION'] as const).map((cov) => (
              <label key={cov} className="flex items-center">
                <input
                  type="radio"
                  name="coverage"
                  value={cov}
                  checked={coverage === cov}
                  onChange={(e) => setCoverage(e.target.value as Coverage)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {cov === 'INTRODUCED'
                    ? '🆕 Introduction'
                    : cov === 'PRACTICE'
                    ? '✏️ Practice'
                    : '🔄 Revision'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Homework Checkbox */}
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={homeworkAssigned}
            onChange={(e) => setHomeworkAssigned(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">📄 Homework Assigned</span>
        </label>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded p-3 text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={isLoading || !topicId}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '⏳ Logging...' : '✓ Log Teaching'}
          </button>
          <button
            type="button"
            onClick={handleClearForm}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};
