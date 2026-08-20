import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { progressService, StudentStats, TopicProgress, TrendData } from '../services/progress.service';
import { MasteryBar } from '../components/MasteryBar';
import { BadgeGrid } from '../components/BadgeGrid';
import { Header } from '../components/Header';

export const ProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsData, topicsData, trendData] = await Promise.all([
        progressService.getProgressOverview(),
        progressService.getTopicProgress(),
        progressService.getWeeklyTrend(),
      ]);

      setStats(statsData);
      setTopicProgress(topicsData);
      setTrendData(trendData);
    } catch (err: any) {
      setError(err.message || 'Failed to load progress');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-semibold">{error || 'Failed to load progress'}</p>
            <button onClick={loadProgressData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Try Again
            </button>
          </div>
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

  // Calculate subject mastery averages
  const subjectMastery: Record<string, number> = {};
  Object.entries(topicsBySubject).forEach(([subject, topics]) => {
    const avgMastery = Math.round(topics.reduce((sum, t) => sum + t.masteryScore, 0) / topics.length);
    subjectMastery[subject] = avgMastery;
  });

  const xpProgress = (stats.totalXp % 100) || 0;
  const xpToNextLevel = 100 - xpProgress;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
        <div className="max-w-6xl mx-auto">
        {/* Header: Stats Overview */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900">Your Progress</h1>
            <button
              onClick={() => navigate('/checkin')}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105"
            >
              📝 Daily Check-in
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Level Card */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
              <div className="text-sm font-semibold opacity-90">Level</div>
              <div className="text-4xl font-bold mt-2">{stats.level}</div>
              <div className="text-xs opacity-75 mt-2">{stats.totalXp} total XP</div>
            </div>

            {/* XP Progress Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
              <div className="text-sm font-semibold opacity-90">Next Level</div>
              <div className="text-3xl font-bold mt-2">{xpToNextLevel} XP</div>
              <div className="w-full bg-blue-400 rounded-full h-2 mt-3 overflow-hidden">
                <div className="bg-blue-300 h-full" style={{ width: `${xpProgress}%` }}></div>
              </div>
            </div>

            {/* Streak Card */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-lg">
              <div className="text-sm font-semibold opacity-90">Current Streak</div>
              <div className="text-4xl font-bold mt-2">
                {stats.streakCount}
                <span className="text-2xl ml-2">🔥</span>
              </div>
              <div className="text-xs opacity-75 mt-2">days</div>
            </div>

            {/* Last Check-in Card */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
              <div className="text-sm font-semibold opacity-90">Last Check-in</div>
              <div className="text-lg font-bold mt-2">
                {stats.lastCheckInDate
                  ? new Date(stats.lastCheckInDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Never'}
              </div>
              <div className="text-xs opacity-75 mt-2">
                {stats.lastCheckInDate
                  ? `${Math.floor(
                      (Date.now() - new Date(stats.lastCheckInDate).getTime()) / (1000 * 60 * 60 * 24)
                    )} days ago`
                  : 'Start your first check-in'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content: 2/3 width on large screens */}
          <div className="lg:col-span-2 space-y-6">
            {/* Badges Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <BadgeGrid badges={stats.badges} />
            </div>

            {/* Weekly Trend Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">XP Earned This Week</h3>
              <div className="flex items-end justify-around h-48 border-l-2 border-b-2 border-gray-300 pl-4 pb-4">
                {trendData.map((day) => (
                  <div key={day.date} className="flex flex-col items-center flex-1">
                    <div className="text-xs text-gray-600 mb-2 font-semibold">{day.xpEarned}</div>
                    <div
                      className="w-8 bg-gradient-to-t from-blue-400 to-blue-500 rounded-t transition-all hover:from-blue-500 hover:to-blue-600"
                      style={{ height: `${Math.max(10, (day.xpEarned / 50) * 100)}px` }}
                      title={`${day.date}: ${day.xpEarned} XP`}
                    ></div>
                    <div className="text-xs text-gray-500 mt-2">{day.date.split('-')[2]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject Mastery Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Mastery</h3>
              <div className="space-y-4">
                {Object.entries(subjectMastery).map(([subject, mastery]) => (
                  <MasteryBar key={subject} subject={subject} masteryScore={mastery} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: 1/3 width on large screens */}
          <div className="space-y-6">
            {/* Syllabus Map / Topics Grid */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Topics ({topicProgress.length})</h3>
              <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                {topicProgress.map((topic) => {
                  let bgColor = 'bg-gray-200';
                  if (topic.masteryScore >= 80) bgColor = 'bg-green-400';
                  else if (topic.masteryScore >= 60) bgColor = 'bg-yellow-400';
                  else if (topic.masteryScore > 0) bgColor = 'bg-orange-400';

                  return (
                    <div
                      key={topic.topicId}
                      className={`${bgColor} rounded p-2 text-center transition-all hover:shadow-md cursor-pointer`}
                      title={`${topic.chapter}: ${topic.masteryScore}%`}
                    >
                      <div className="text-xs font-semibold text-white truncate">{topic.chapter.substring(0, 8)}</div>
                      <div className="text-xs text-white opacity-80">{topic.masteryScore}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Total Check-ins</span>
                  <span className="font-semibold text-gray-900">
                    {topicProgress.length > 0 ? topicProgress.length * 2 : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-t pt-3">
                  <span className="text-gray-600">Badges Earned</span>
                  <span className="font-semibold text-gray-900">{stats.badges.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t pt-3">
                  <span className="text-gray-600">Avg Mastery</span>
                  <span className="font-semibold text-gray-900">
                    {topicProgress.length > 0
                      ? Math.round(topicProgress.reduce((sum, t) => sum + t.masteryScore, 0) / topicProgress.length)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
