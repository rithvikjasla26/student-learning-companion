import React from 'react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  earnedAt: string;
}

interface BadgeGridProps {
  badges: Badge[];
  allBadgesCount?: number;
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({ badges, allBadgesCount: _allBadgesCount = 10 }) => {
  // Default badge icons by name pattern
  const getBadgeEmoji = (name: string): string => {
    if (name.includes('First') || name.includes('Check')) return '🎯';
    if (name.includes('Streak')) return '🔥';
    if (name.includes('XP') || name.includes('Hundred')) return '⭐';
    if (name.includes('Expert') || name.includes('Mastery')) return '🏆';
    if (name.includes('Consistent') || name.includes('Learner')) return '📚';
    return '✨';
  };

  // Show badges and some placeholder for unlocking
  const displayBadges = badges.slice(0, 8);
  const remainingSlots = Math.min(8, Math.max(0, 8 - badges.length));

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Badges</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {displayBadges.map((badge) => (
          <div
            key={badge.id}
            className="bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-lg p-4 text-center border-2 border-yellow-300 hover:shadow-lg transition-shadow"
            title={badge.description}
          >
            <div className="text-4xl mb-2">{getBadgeEmoji(badge.name)}</div>
            <p className="text-xs font-semibold text-gray-800 line-clamp-2">{badge.name}</p>
            <p className="text-xs text-gray-600 mt-1">
              {new Date(badge.earnedAt).toLocaleDateString()}
            </p>
          </div>
        ))}

        {/* Placeholder for locked badges */}
        {Array.from({ length: remainingSlots }).map((_, i) => (
          <div
            key={`locked-${i}`}
            className="bg-gray-100 rounded-lg p-4 text-center border-2 border-gray-300 opacity-50"
          >
            <div className="text-4xl mb-2">🔒</div>
            <p className="text-xs font-semibold text-gray-500">Locked</p>
          </div>
        ))}
      </div>
    </div>
  );
};
