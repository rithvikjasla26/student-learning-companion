import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parentService, Child, ChildProgress, WeeklySummary } from '../services/parent.service';
import { MasteryBar } from '../components/MasteryBar';
import { Header } from '../components/Header';

export const ParentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [childProgress, setChildProgress] = useState<ChildProgress | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const childrenList = await parentService.getLinkedChildren();
      setChildren(childrenList);

      if (childrenList.length > 0) {
        // Load first child by default
        await loadChildProgress(childrenList[0]);
        setSelectedChild(childrenList[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load children');
    } finally {
      setIsLoading(false);
    }
  };

  const loadChildProgress = async (child: Child) => {
    try {
      setIsLoading(true);
      setError(null);

      const [progress, summary] = await Promise.all([
        parentService.getChildProgress(child.id),
        parentService.getWeeklySummary(child.id),
      ]);

      setChildProgress(progress);
      setWeeklySummary(summary);
      setSelectedChild(child);
    } catch (err: any) {
      setError(err.message || 'Failed to load child progress');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChild = (child: Child) => {
    loadChildProgress(child);
  };

  if (children.length === 0 && !isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
          <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Children</h1>
            <div className="bg-white rounded-lg shadow-lg p-12">
              <div className="text-6xl mb-4">👨‍👩‍👧</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No children linked yet</h2>
              <p className="text-gray-600 mb-8">Link your child's account to start monitoring their learning progress.</p>
              <button
                onClick={() => navigate('/parent/link')}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                Link a Child
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading child's progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
          <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-semibold">{error}</p>
            <button
              onClick={loadChildren}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!childProgress || !selectedChild || !weeklySummary) {
    return null;
  }

  // Calculate subject mastery
  const subjectMastery: Record<string, number[]> = {};
  childProgress.topicsProgress.forEach((topic) => {
    if (!subjectMastery[topic.subject]) {
      subjectMastery[topic.subject] = [];
    }
    subjectMastery[topic.subject].push(topic.masteryScore);
  });

  const subjectAverageMastery: Record<string, number> = {};
  Object.entries(subjectMastery).forEach(([subject, scores]) => {
    subjectAverageMastery[subject] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  });

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Parent Dashboard</h1>
            <p className="text-gray-600">Monitor your child's learning progress</p>
          </div>
          <button
            onClick={() => navigate('/parent/link')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            + Link Another Child
          </button>
        </div>

        {/* Child Selector */}
        {children.length > 1 && (
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Select Child:</label>
            <div className="flex gap-2 flex-wrap">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleSelectChild(child)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedChild.id === child.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-600'
                  }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Child Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="text-2xl font-bold text-gray-900">{childProgress.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Grade</p>
              <p className="text-2xl font-bold text-gray-900">
                {childProgress.gradeLevel}
                {childProgress.gradeLevel === 10 ? 'th' : childProgress.gradeLevel === 11 ? '11th' : childProgress.gradeLevel === 12 ? '12th' : 'th'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Subjects</p>
              <p className="text-lg font-semibold text-gray-900">{childProgress.subjects.join(', ')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Check-in</p>
              <p className="text-lg font-semibold text-gray-900">
                {childProgress.stats.lastCheckInDate
                  ? new Date(childProgress.stats.lastCheckInDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
                <div className="text-sm font-semibold opacity-90">Level</div>
                <div className="text-4xl font-bold mt-2">{childProgress.stats.level}</div>
                <div className="text-xs opacity-75 mt-2">{childProgress.stats.totalXp} XP</div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-lg">
                <div className="text-sm font-semibold opacity-90">Current Streak</div>
                <div className="text-3xl font-bold mt-2">{childProgress.stats.streakCount} 🔥</div>
                <div className="text-xs opacity-75 mt-2">days</div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
                <div className="text-sm font-semibold opacity-90">This Week</div>
                <div className="text-3xl font-bold mt-2">{weeklySummary.xpThisWeek} XP</div>
                <div className="text-xs opacity-75 mt-2">{weeklySummary.totalCheckIns} check-ins</div>
              </div>
            </div>

            {/* Subject Mastery */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Mastery</h3>
              <div className="space-y-4">
                {Object.entries(subjectAverageMastery).map(([subject, mastery]) => (
                  <MasteryBar key={subject} subject={subject} masteryScore={mastery} />
                ))}
              </div>
            </div>

            {/* Topics Covered This Week */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Topics Covered This Week</h3>
              {weeklySummary.topicsCovered.length > 0 ? (
                <div className="space-y-3">
                  {weeklySummary.topicsCovered.map((topic, idx) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{topic.chapter}</p>
                          <p className="text-sm text-gray-600">{topic.subject}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{topic.averageMastery}%</p>
                          <p className="text-xs text-gray-600">{topic.checkInCount} check-ins</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No check-ins this week yet</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weak Topics Alert */}
            {childProgress.weakTopics.length > 0 && (
              <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-3">⚠️ Weak Topics</h3>
                <div className="space-y-2">
                  {childProgress.weakTopics.slice(0, 5).map((topic, idx) => (
                    <div key={idx} className="text-sm">
                      <p className="font-medium text-orange-900">{topic.chapter}</p>
                      <p className="text-orange-700">Mastery: {topic.masteryScore}%</p>
                    </div>
                  ))}
                </div>
                {childProgress.weakTopics.length > 5 && (
                  <p className="text-xs text-orange-600 mt-2">+{childProgress.weakTopics.length - 5} more</p>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Topics Tracked</span>
                  <span className="font-semibold text-gray-900">{childProgress.topicsProgress.length}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-3">
                  <span className="text-gray-600">Avg Mastery</span>
                  <span className="font-semibold text-gray-900">
                    {childProgress.topicsProgress.length > 0
                      ? Math.round(
                          childProgress.topicsProgress.reduce((sum, t) => sum + t.masteryScore, 0) /
                            childProgress.topicsProgress.length
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-3">
                  <span className="text-gray-600">Avg Daily XP</span>
                  <span className="font-semibold text-gray-900">{weeklySummary.averageXpPerDay}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
