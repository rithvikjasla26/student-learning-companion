import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { taughtlogService, TaughtLog } from '../services/taughtlog.service';
import { progressService, TopicProgress } from '../services/progress.service';

export const TaughtLogPage: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    chapter: '',
    topicId: '',
    source: 'SCHOOL' as 'SCHOOL' | 'COACHING' | 'SELF_STUDY',
    coverageType: 'INTRODUCED' as 'INTRODUCED' | 'PRACTICE' | 'REVISION',
    homeworkAssigned: false,
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [topics, setTopics] = useState<TopicProgress[]>([]);
  const [recentLogs, setRecentLogs] = useState<TaughtLog[]>([]);

  // Get unique subjects from topics
  const subjects = Array.from(new Set(topics.map((t) => t.subject)));

  // Filter chapters by subject
  const chapters = formData.subject
    ? Array.from(new Set(topics.filter((t) => t.subject === formData.subject).map((t) => t.chapter)))
    : [];

  // Filter topics by subject and chapter
  const filteredTopics = topics.filter(
    (t) => t.subject === formData.subject && t.chapter === formData.chapter
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const topicsData = await progressService.getTopicProgress();
      setTopics(topicsData);

      const logsData = await taughtlogService.getTaughtLogHistory(10);
      setRecentLogs(logsData.logs);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.topicId) {
      setError('Please select a topic');
      return;
    }

    try {
      setIsLoading(true);
      await taughtlogService.createTaughtLog(
        formData.subject,
        formData.chapter,
        formData.topicId,
        formData.source,
        formData.coverageType,
        formData.homeworkAssigned
      );

      setSuccess('✓ Logged successfully! Ready to learn?');
      setFormData({
        subject: '',
        chapter: '',
        topicId: '',
        source: 'SCHOOL',
        coverageType: 'INTRODUCED',
        homeworkAssigned: false,
      });

      // Reload recent logs
      setTimeout(() => loadData(), 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to log');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900">What Did You Learn?</h1>
            <button
              onClick={() => navigate('/progress')}
              className="text-gray-600 hover:text-gray-900 font-semibold"
            >
              ← Back
            </button>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <p className="text-gray-600 mb-6">
              Quick-tap form • No typing required • Choose what you studied today
            </p>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-600">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📚 Subject
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select subject...</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chapter */}
              {formData.subject && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📖 Chapter
                  </label>
                  <select
                    name="chapter"
                    value={formData.chapter}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select chapter...</option>
                    {chapters.map((chapter) => (
                      <option key={chapter} value={chapter}>
                        {chapter}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Topic */}
              {formData.chapter && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🎯 Topic
                  </label>
                  <select
                    name="topicId"
                    value={formData.topicId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select topic...</option>
                    {filteredTopics.map((topic) => (
                      <option key={topic.topicId} value={topic.topicId}>
                        {topic.subtopic}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Source */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  🏫 Where did you learn this?
                </label>
                <div className="space-y-2">
                  {['SCHOOL', 'COACHING', 'SELF_STUDY'].map((source) => (
                    <label key={source} className="flex items-center">
                      <input
                        type="radio"
                        name="source"
                        value={source}
                        checked={formData.source === source}
                        onChange={handleInputChange}
                        className="mr-3 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-gray-700">
                        {source === 'SCHOOL' && 'School'}
                        {source === 'COACHING' && 'Coaching Class'}
                        {source === 'SELF_STUDY' && 'Self Study'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Coverage Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📊 Type of coverage
                </label>
                <div className="space-y-2">
                  {['INTRODUCED', 'PRACTICE', 'REVISION'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="radio"
                        name="coverageType"
                        value={type}
                        checked={formData.coverageType === type}
                        onChange={handleInputChange}
                        className="mr-3 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-gray-700">
                        {type === 'INTRODUCED' && 'Introduced (new)'}
                        {type === 'PRACTICE' && 'Practice (solving)'}
                        {type === 'REVISION' && 'Revision (reviewing)'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Homework */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="homeworkAssigned"
                  checked={formData.homeworkAssigned}
                  onChange={handleInputChange}
                  className="w-4 h-4 cursor-pointer"
                />
                <label className="ml-3 text-gray-700 font-semibold">
                  📝 Homework was assigned
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !formData.topicId}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105"
              >
                {isLoading ? '⏳ Logging...' : '✓ Log & Continue'}
              </button>
            </form>
          </div>

          {/* Recent Logs */}
          {recentLogs.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Recently Logged</h3>
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex justify-between items-start bg-gray-50 p-4 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-900">{log.chapter}</div>
                      <div className="text-sm text-gray-600">
                        {log.subject} • {log.coverageType} • {log.source}
                        {log.homeworkAssigned && ' • 📝 HW'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
