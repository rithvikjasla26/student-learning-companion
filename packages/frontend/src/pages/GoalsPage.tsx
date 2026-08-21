import React, { useEffect, useState } from 'react';
import { goalsService, GoalsOverview, LargerGoal, SmallerGoal } from '../services/goals.service';
import { Header } from '../components/Header';

export const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<GoalsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [newGoalForm, setNewGoalForm] = useState({
    type: 'larger', // 'larger' or 'smaller'
    title: '',
    subject: '',
    topicIds: [] as string[],
    targetDate: '',
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await goalsService.getGoalsOverview();
      setGoals(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    try {
      if (!newGoalForm.title || !newGoalForm.targetDate) {
        setError('Please fill in all required fields');
        return;
      }

      const targetDate = new Date(newGoalForm.targetDate);

      if (newGoalForm.type === 'larger') {
        await goalsService.createLargerGoal(
          newGoalForm.title,
          newGoalForm.subject || null,
          targetDate
        );
      } else {
        if (newGoalForm.topicIds.length === 0) {
          setError('Please select at least one topic');
          return;
        }
        await goalsService.createSmallerGoal(
          newGoalForm.title,
          newGoalForm.topicIds,
          targetDate
        );
      }

      // Reset form and reload
      setNewGoalForm({
        type: 'larger',
        title: '',
        subject: '',
        topicIds: [],
        targetDate: '',
      });
      setShowNewGoalForm(false);
      await loadGoals();
    } catch (err: any) {
      setError(err.message || 'Failed to create goal');
    }
  };

  const handleAutoSuggestGoal = async () => {
    try {
      await goalsService.autoSuggestWeeklyGoal();
      await loadGoals();
    } catch (err: any) {
      setError(err.message || 'Failed to create suggested goal');
    }
  };

  const handleUpdateGoalStatus = async (goalId: string, status: 'ACTIVE' | 'COMPLETED' | 'MISSED') => {
    try {
      await goalsService.updateGoalStatus(goalId, status);
      await loadGoals();
    } catch (err: any) {
      setError(err.message || 'Failed to update goal');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your goals...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-4xl font-bold text-gray-900">Your Goals</h1>
              <div className="flex gap-3">
                <button
                  onClick={handleAutoSuggestGoal}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105"
                >
                  ✨ Suggest Weekly Goal
                </button>
                <button
                  onClick={() => setShowNewGoalForm(!showNewGoalForm)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105"
                >
                  + New Goal
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 mb-6">
                {error}
              </div>
            )}

            {/* New Goal Form */}
            {showNewGoalForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Goal</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Goal Type</label>
                    <select
                      value={newGoalForm.type}
                      onChange={(e) => setNewGoalForm({ ...newGoalForm, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="larger">Larger Goal (Long-term)</option>
                      <option value="smaller">Smaller Goal (Weekly)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={newGoalForm.title}
                      onChange={(e) => setNewGoalForm({ ...newGoalForm, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Score 90% in Boards"
                    />
                  </div>

                  {newGoalForm.type === 'larger' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subject (Optional)</label>
                      <input
                        type="text"
                        value={newGoalForm.subject}
                        onChange={(e) => setNewGoalForm({ ...newGoalForm, subject: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Science"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
                    <input
                      type="date"
                      value={newGoalForm.targetDate}
                      onChange={(e) => setNewGoalForm({ ...newGoalForm, targetDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCreateGoal}
                    className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700"
                  >
                    Create Goal
                  </button>
                  <button
                    onClick={() => setShowNewGoalForm(false)}
                    className="bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Larger Goals Section */}
          {goals && goals.largerGoals.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Long-term Goals</h2>
              <div className="space-y-4">
                {goals.largerGoals.map((goal) => (
                  <div key={goal.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{goal.title}</h3>
                        {goal.subject && (
                          <p className="text-sm text-gray-600 mt-1">Subject: {goal.subject}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          Target: {new Date(goal.targetDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">{goal.progress}%</div>
                        <div className="text-sm text-gray-600">{goal.smallerGoalsCount} smaller goals</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Smaller Goals Section */}
          {goals && goals.smallerGoals.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Weekly Goals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.smallerGoals.map((goal) => (
                  <div key={goal.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          goal.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : goal.status === 'MISSED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {goal.status}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      {goal.topicCount} topics • Target: {new Date(goal.targetDate).toLocaleDateString()}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-4">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 font-semibold">{goal.progress}% mastered</span>
                      {goal.status === 'ACTIVE' && (
                        <select
                          value={goal.status}
                          onChange={(e) =>
                            handleUpdateGoalStatus(goal.id, e.target.value as 'ACTIVE' | 'COMPLETED' | 'MISSED')
                          }
                          className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="COMPLETED">Mark Complete</option>
                          <option value="MISSED">Mark Missed</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {goals && goals.largerGoals.length === 0 && goals.smallerGoals.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🎯</div>
              <p className="text-gray-600 mb-4">No goals set yet</p>
              <button
                onClick={() => setShowNewGoalForm(true)}
                className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700"
              >
                Create Your First Goal
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
