import React from 'react';

interface MasteryBarProps {
  subject: string;
  masteryScore: number;
  showLabel?: boolean;
}

export const MasteryBar: React.FC<MasteryBarProps> = ({ subject, masteryScore, showLabel: _showLabel = true }) => {
  // Color based on mastery score
  let barColor = 'bg-gray-300'; // 0-39%: gray
  let textColor = 'text-gray-600';

  if (masteryScore >= 80) {
    barColor = 'bg-green-500'; // 80-100%: green
    textColor = 'text-green-600';
  } else if (masteryScore >= 60) {
    barColor = 'bg-yellow-500'; // 60-79%: amber
    textColor = 'text-yellow-600';
  } else if (masteryScore > 0) {
    barColor = 'bg-orange-400'; // 1-59%: orange
    textColor = 'text-orange-600';
  }

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{subject}</span>
        <span className={`text-sm font-semibold ${textColor}`}>{masteryScore}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${masteryScore}%` }}></div>
      </div>
    </div>
  );
};
