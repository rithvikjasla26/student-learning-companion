import React from 'react';
import { QuickStats } from '../services/learningHub.service';

interface QuickStatBarProps {
  stats: QuickStats | null;
  isLoading: boolean;
}

export const QuickStatBar: React.FC<QuickStatBarProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white mb-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-blue-500 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white mb-6 shadow-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Check-ins Today */}
        <div className="bg-blue-700/30 rounded-lg p-4">
          <p className="text-blue-100 text-sm font-medium">Check-ins Today</p>
          <p className="text-3xl font-bold mt-1">{stats.checkInsToday}</p>
          <p className="text-blue-200 text-xs mt-1">Keep it up!</p>
        </div>

        {/* Streak */}
        <div className="bg-blue-700/30 rounded-lg p-4">
          <p className="text-blue-100 text-sm font-medium">Streak</p>
          <div className="flex items-center mt-1">
            <p className="text-3xl font-bold">{stats.streak}</p>
            <p className="text-2xl ml-2">🔥</p>
          </div>
          <p className="text-blue-200 text-xs mt-1">Days in a row</p>
        </div>

        {/* Total Mastery */}
        <div className="bg-blue-700/30 rounded-lg p-4">
          <p className="text-blue-100 text-sm font-medium">Total Mastery</p>
          <p className="text-3xl font-bold mt-1">{stats.totalMastery}%</p>
          <div className="w-full bg-blue-600 rounded-full h-1 mt-2">
            <div
              className="bg-green-400 h-1 rounded-full"
              style={{ width: `${stats.totalMastery}%` }}
            />
          </div>
        </div>

        {/* Topics Due */}
        <div className="bg-blue-700/30 rounded-lg p-4">
          <p className="text-blue-100 text-sm font-medium">Due for Review</p>
          <p className="text-3xl font-bold mt-1">{stats.topicsDue}</p>
          {stats.topicsDueOverdue > 0 && (
            <p className="text-red-300 text-xs mt-1">
              {stats.topicsDueOverdue} overdue
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
