import React from 'react';
import { progressService, TopicProgress, StudentStats } from '../services/progress.service';
import { MasteryBar } from './MasteryBar';

interface ProgressOverviewSectionProps {
  topicProgress: TopicProgress[];
  stats: StudentStats | null;
  isLoading: boolean;
}

export const ProgressOverviewSection: React.FC<ProgressOverviewSectionProps> = ({
  topicProgress,
  stats,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📈 Learning Progress</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Group topics by subject
  const topicsBySubject: Record<string, TopicProgress[]> = {};
  topicProgress.forEach((topic) => {
    if (!topicsBySubject[topic.subject]) {
      topicsBySubject[topic.subject] = [];
    }
    topicsBySubject[topic.subject].push(topic);
  });

  // Calculate subject statistics
  const subjectStats = Object.entries(topicsBySubject).map(([subject, topics]) => {
    const avgMastery = Math.round(
      topics.reduce((sum, t) => sum + t.masteryScore, 0) / topics.length
    );
    const totalXp = topics.reduce((sum, t) => sum + (t.xpEarned || 0), 0);
    const level = stats
      ? Math.floor(stats.totalXp / 500) + 1
      : Math.floor(totalXp / 500) + 1;

    return {
      subject,
      avgMastery,
      topicCount: topics.length,
      level,
      totalXp,
    };
  });

  const getSubjectEmoji = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'science':
        return '🔬';
      case 'biology':
        return '🧬';
      case 'chemistry':
        return '⚗️';
      case 'physics':
        return '⚛️';
      case 'mathematics':
        return '📐';
      case 'english':
        return '📚';
      case 'history':
        return '🏛️';
      default:
        return '📖';
    }
  };

  if (subjectStats.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📈 Learning Progress</h2>
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg mb-2">📚 No topics logged yet</p>
          <p className="text-sm">Start logging your teaching to see progress!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">📈 Learning Progress</h2>
        {stats && (
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Level</p>
            <p className="text-2xl font-bold text-blue-600">{Math.floor(stats.totalXp / 500) + 1}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {subjectStats
          .sort((a, b) => b.avgMastery - a.avgMastery)
          .map((subject) => (
            <div key={subject.subject} className="border border-gray-200 rounded-lg p-4">
              {/* Subject Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getSubjectEmoji(subject.subject)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">{subject.subject}</h3>
                    <p className="text-xs text-gray-500">{subject.topicCount} topics</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    {subject.avgMastery}%
                  </p>
                  <p className="text-xs text-gray-600">Mastery</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    subject.avgMastery >= 80
                      ? 'bg-green-500'
                      : subject.avgMastery >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${subject.avgMastery}%` }}
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-blue-50 rounded p-2">
                  <p className="text-gray-600">Level</p>
                  <p className="font-bold text-blue-600">{subject.level}</p>
                </div>
                <div className="bg-yellow-50 rounded p-2">
                  <p className="text-gray-600">XP</p>
                  <p className="font-bold text-yellow-600">{subject.totalXp}</p>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <p className="text-gray-600">Status</p>
                  <p className="font-bold text-green-600">
                    {subject.avgMastery >= 80 ? '✓ Master' : subject.avgMastery >= 60 ? '◐ Good' : '○ Learning'}
                  </p>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Overall Stats */}
      {stats && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-600">Total Topics</p>
              <p className="text-xl font-bold text-gray-800">
                {topicProgress.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Avg Mastery</p>
              <p className="text-xl font-bold text-blue-600">
                {Math.round(
                  topicProgress.reduce((sum, t) => sum + t.masteryScore, 0) /
                    topicProgress.length
                )}
                %
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Total XP</p>
              <p className="text-xl font-bold text-yellow-600">{stats.totalXp}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Streak</p>
              <p className="text-xl font-bold text-red-600">{stats.streakCount} 🔥</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
