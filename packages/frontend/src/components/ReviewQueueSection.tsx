import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { learningHubService, ReviewQueueResponse } from '../services/learningHub.service';

interface ReviewQueueSectionProps {
  onRefresh?: () => void;
}

type FilterType = 'all' | 'today' | 'this-week' | 'overdue';

export const ReviewQueueSection: React.FC<ReviewQueueSectionProps> = ({ onRefresh }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');
  const [queue, setQueue] = useState<ReviewQueueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  useEffect(() => {
    loadReviewQueue();
  }, [filter]);

  const loadReviewQueue = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await learningHubService.getReviewQueue(filter);
      setQueue(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load review queue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartReview = (topicId: string) => {
    navigate(`/checkin?topicId=${topicId}`);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'TODAY':
        return 'bg-orange-100 text-orange-800';
      case 'SOON':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMasteryColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading && !queue) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Topics Due for Review</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Topics Due for Review</h2>
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
          {error}
          <button
            onClick={loadReviewQueue}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasTopics = queue && queue.dueTopics.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">📋 Topics Due for Review</h2>
        {queue?.overdueCount ? (
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            {queue.overdueCount} overdue
          </span>
        ) : null}
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'today', 'this-week', 'overdue'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'all'
              ? 'All'
              : f === 'today'
              ? 'Today'
              : f === 'this-week'
              ? 'This Week'
              : 'Overdue'}
          </button>
        ))}
      </div>

      {/* Topics List */}
      {!hasTopics ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg mb-2">🎉 All caught up!</p>
          <p className="text-sm">No topics due for review. Great job staying on top!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue!.dueTopics.map((topic) => (
            <div
              key={topic.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Topic Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">
                    {topic.subject} • {topic.chapter}
                  </h3>
                  <p className="text-sm text-gray-600">{topic.subtopic}</p>
                </div>
                <div className="flex gap-2 ml-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${getStatusBadgeColor(
                      topic.statusLabel
                    )}`}
                  >
                    {topic.statusLabel === 'OVERDUE'
                      ? '⚠️ OVERDUE'
                      : topic.statusLabel === 'TODAY'
                      ? '🔴 TODAY'
                      : topic.statusLabel === 'SOON'
                      ? `📅 In ${topic.daysUntilDue}d`
                      : `📅 In ${topic.daysUntilDue}d`}
                  </span>
                </div>
              </div>

              {/* Mastery & Confidence */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">Mastery</span>
                    <span className="text-xs font-semibold">{topic.masteryScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getMasteryColor(topic.masteryScore)}`}
                      style={{ width: `${topic.masteryScore}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">Confidence</span>
                    <span className="text-xs font-semibold">{topic.confidenceScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${topic.confidenceScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* SM-2 Details (Expandable) */}
              <div className="border-t pt-2">
                <button
                  onClick={() =>
                    setExpandedTopic(expandedTopic === topic.id ? null : topic.id)
                  }
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  {expandedTopic === topic.id ? '▼' : '▶'}
                  SM-2 Details
                </button>

                {expandedTopic === topic.id && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-gray-700 space-y-1">
                    <div className="flex justify-between">
                      <span>Ease Factor:</span>
                      <span className="font-semibold">{topic.sm2State.easeFactor.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Interval:</span>
                      <span className="font-semibold">{topic.sm2State.intervalDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Times Reviewed:</span>
                      <span className="font-semibold">{topic.sm2State.repetitions}</span>
                    </div>
                    <p className="text-gray-600 mt-2 text-xs italic">
                      Higher ease factor = easier to remember. Interval grows with each successful review.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleStartReview(topic.topicId)}
                  className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  ▶ Start Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total Count */}
      {hasTopics && (
        <p className="text-xs text-gray-500 mt-4">
          Showing {queue!.dueTopics.length} of {queue!.totalDue} topics
        </p>
      )}
    </div>
  );
};
