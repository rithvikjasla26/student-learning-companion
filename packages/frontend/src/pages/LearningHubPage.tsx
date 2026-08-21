import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { QuickStatBar } from '../components/QuickStatBar';
import { LogTeachingSection } from '../components/LogTeachingSection';
import { ReviewQueueSection } from '../components/ReviewQueueSection';
import { ProgressOverviewSection } from '../components/ProgressOverviewSection';
import { learningHubService, QuickStats } from '../services/learningHub.service';
import { progressService, TopicProgress, StudentStats } from '../services/progress.service';

export const LearningHubPage: React.FC = () => {
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewQueueKey, setReviewQueueKey] = useState(0);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoadingStats(true);
      setError(null);

      const [quickStats, topicsData, studentStatsData] = await Promise.all([
        learningHubService.getQuickStats(),
        progressService.getTopicProgress(),
        progressService.getProgressOverview(),
      ]);

      setStats(quickStats);
      setTopicProgress(topicsData);
      setStudentStats(studentStatsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard load error:', err);
    } finally {
      setIsLoadingStats(false);
      setIsLoadingProgress(false);
    }
  };

  const handleTeachingLogged = () => {
    // Reload stats and progress after teaching is logged
    loadAllData();
    // Trigger refresh of review queue component
    setReviewQueueKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎓 Learning Hub Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your learning, track progress, and stay on top of your studies
          </p>
        </div>

        {/* Quick Stats Bar */}
        <QuickStatBar stats={stats} isLoading={isLoadingStats} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Log Teaching & Review Queue */}
          <div className="lg:col-span-2">
            {/* Error Banner */}
            {error && !isLoadingStats && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 flex justify-between items-center">
                <span>{error}</span>
                <button
                  onClick={loadAllData}
                  className="text-red-600 hover:text-red-800 font-medium text-sm underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Log Teaching Section */}
            <LogTeachingSection onTeachingLogged={handleTeachingLogged} />

            {/* Topics Due for Review */}
            <ReviewQueueSection key={reviewQueueKey} onRefresh={handleTeachingLogged} />
          </div>

          {/* Right Column: Progress Overview */}
          <div className="lg:col-span-1">
            <ProgressOverviewSection
              topicProgress={topicProgress}
              stats={studentStats}
              isLoading={isLoadingProgress}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-300 text-center text-gray-500 text-sm">
          <p>
            💡 Tip: Review topics marked "OVERDUE" first to maintain your learning momentum!
          </p>
        </div>
      </div>
    </div>
  );
};
