import React, { useEffect, useState } from 'react';
import { learningHubService, TopicHierarchy } from '../services/learningHub.service';

interface TopicHierarchySelectProps {
  onTopicSelect: (topicId: string, subject: string, chapter: string) => void;
  selectedTopic?: string;
  selectedSubject?: string;
  selectedChapter?: string;
}

export const TopicHierarchySelect: React.FC<TopicHierarchySelectProps> = ({
  onTopicSelect,
  selectedTopic = '',
  selectedSubject = '',
  selectedChapter = '',
}) => {
  const [hierarchy, setHierarchy] = useState<TopicHierarchy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState(selectedSubject);
  const [chapter, setChapter] = useState(selectedChapter);
  const [topic, setTopic] = useState(selectedTopic);

  useEffect(() => {
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await learningHubService.getTopicsHierarchy();
      setHierarchy(response.subjects);
    } catch (err: any) {
      setError(err.message || 'Failed to load topics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSubject = e.target.value;
    setSubject(newSubject);
    setChapter('');
    setTopic('');
  };

  const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newChapter = e.target.value;
    setChapter(newChapter);
    setTopic('');
  };

  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTopic = e.target.value;
    setTopic(newTopic);
    if (newTopic && subject && chapter) {
      onTopicSelect(newTopic, subject, chapter);
    }
  };

  const currentSubjectData = hierarchy.find((s) => s.name === subject);
  const chapters = currentSubjectData?.chapters || [];

  const currentChapterData = chapters.find((c) => c.name === chapter);
  const topics = currentChapterData?.topics || [];

  const handleClear = () => {
    setSubject('');
    setChapter('');
    setTopic('');
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse space-y-2">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* Subject Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subject
        </label>
        <select
          value={subject}
          onChange={handleSubjectChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a subject</option>
          {hierarchy.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name} ({s.count} topics)
            </option>
          ))}
        </select>
      </div>

      {/* Chapter Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Chapter
        </label>
        <select
          value={chapter}
          onChange={handleChapterChange}
          disabled={!subject}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Select a chapter</option>
          {chapters.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} ({c.count} topics)
            </option>
          ))}
        </select>
      </div>

      {/* Topic Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Topic
        </label>
        <select
          value={topic}
          onChange={handleTopicChange}
          disabled={!chapter}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Select a topic</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.subtopic}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Button */}
      {(subject || chapter || topic) && (
        <button
          onClick={handleClear}
          className="w-full px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium"
        >
          Clear Selection
        </button>
      )}
    </div>
  );
};
