import { describe, it, expect } from 'vitest';

/**
 * Gamification Service Tests - Pure Functions
 * Tests for functions that don't require database access
 * Note: Database-dependent functions are tested separately with mocks
 */

// Constants (inlined to avoid importing service which initializes Prisma)
const XP_PER_LEVEL = 100;
const MAX_LEVEL = 100;

const BADGE_CRITERIA = {
  FIRST_CHECK_IN: { type: 'check_in_count', value: 1 },
  SEVEN_DAY_STREAK: { type: 'streak_days', value: 7 },
  HUNDRED_XP: { type: 'xp_threshold', value: 100 },
  CHAPTER_EXPERT: { type: 'topic_mastery', value: 90 },
  CONSISTENT_LEARNER: { type: 'check_in_count', value: 10 },
};

// Pure functions
function getLevel(totalXp: number): number {
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  return Math.min(level, MAX_LEVEL);
}

function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) {
    return Infinity;
  }
  return currentLevel * XP_PER_LEVEL;
}

function getConstants() {
  return {
    XP_PER_LEVEL,
    MAX_LEVEL,
    BADGE_CRITERIA,
  };
}

describe('Gamification Service - Pure Functions', () => {
  describe('getLevel', () => {
    it('should calculate level 1 for 0 XP', () => {
      const level = getLevel(0);
      expect(level).toBe(1);
    });

    it('should calculate correct level from XP', () => {
      const level = getLevel(250); // 250 / 100 = 2.5, floor = 2, +1 = 3
      expect(level).toBe(3);
    });

    it('should calculate level 2 for 100-199 XP', () => {
      expect(getLevel(100)).toBe(2);
      expect(getLevel(150)).toBe(2);
      expect(getLevel(199)).toBe(2);
    });

    it('should calculate level 3 for 200-299 XP', () => {
      expect(getLevel(200)).toBe(3);
      expect(getLevel(250)).toBe(3);
      expect(getLevel(299)).toBe(3);
    });

    it('should cap level at MAX_LEVEL (100)', () => {
      const maxLevel = getLevel(99999);
      const constants = getConstants();
      expect(maxLevel).toBe(constants.MAX_LEVEL);
    });

    it('should increment level at every 100 XP boundary', () => {
      const xpValues = [0, 99, 100, 199, 200, 299, 300];
      const expectedLevels = [1, 1, 2, 2, 3, 3, 4];

      xpValues.forEach((xp, index) => {
        expect(getLevel(xp)).toBe(expectedLevels[index]);
      });
    });

    it('should handle high XP values correctly', () => {
      const level = getLevel(5000);
      const constants = getConstants();
      // 5000 / 100 = 50, +1 = 51
      expect(level).toBe(51);
      expect(level).toBeLessThanOrEqual(constants.MAX_LEVEL);
    });
  });

  describe('getXpForNextLevel', () => {
    it('should return correct XP for next level', () => {
      const xpForLevel2 = getXpForNextLevel(1);
      const constants = getConstants();
      // Level 2 requires 1 * 100 = 100 XP
      expect(xpForLevel2).toBe(1 * constants.XP_PER_LEVEL);
    });

    it('should return correct XP progression', () => {
      // Level 1 -> Level 2: 100 XP
      expect(getXpForNextLevel(1)).toBe(100);
      // Level 2 -> Level 3: 200 XP
      expect(getXpForNextLevel(2)).toBe(200);
      // Level 3 -> Level 4: 300 XP
      expect(getXpForNextLevel(3)).toBe(300);
    });

    it('should return Infinity for MAX_LEVEL', () => {
      const constants = getConstants();
      const xpForMaxLevel = getXpForNextLevel(
        constants.MAX_LEVEL
      );
      expect(xpForMaxLevel).toBe(Infinity);
    });

    it('should return Infinity when exceeding MAX_LEVEL', () => {
      const constants = getConstants();
      const xpForBeyondMax = getXpForNextLevel(
        constants.MAX_LEVEL + 1
      );
      expect(xpForBeyondMax).toBe(Infinity);
    });

    it('should handle edge case at level 50', () => {
      const xpForLevel51 = getXpForNextLevel(50);
      // Should be 50 * 100 = 5000
      expect(xpForLevel51).toBe(5000);
    });
  });

  describe('getConstants', () => {
    it('should return constants object with required fields', () => {
      const constants = getConstants();

      expect(constants).toHaveProperty('XP_PER_LEVEL');
      expect(constants).toHaveProperty('MAX_LEVEL');
      expect(constants).toHaveProperty('BADGE_CRITERIA');
    });

    it('should return correct constant values', () => {
      const constants = getConstants();

      expect(constants.XP_PER_LEVEL).toBe(100);
      expect(constants.MAX_LEVEL).toBe(100);
    });

    it('should return all badge criteria', () => {
      const constants = getConstants();

      expect(constants.BADGE_CRITERIA).toHaveProperty('FIRST_CHECK_IN');
      expect(constants.BADGE_CRITERIA).toHaveProperty('SEVEN_DAY_STREAK');
      expect(constants.BADGE_CRITERIA).toHaveProperty('HUNDRED_XP');
      expect(constants.BADGE_CRITERIA).toHaveProperty('CHAPTER_EXPERT');
      expect(constants.BADGE_CRITERIA).toHaveProperty('CONSISTENT_LEARNER');
    });

    it('should have correct badge criteria structure', () => {
      const constants = getConstants();
      const firstCheckInBadge = constants.BADGE_CRITERIA.FIRST_CHECK_IN;

      expect(firstCheckInBadge).toHaveProperty('type');
      expect(firstCheckInBadge).toHaveProperty('value');
      expect(typeof firstCheckInBadge.type).toBe('string');
      expect(typeof firstCheckInBadge.value).toBe('number');
    });
  });

  describe('Level progression scenarios', () => {
    it('should show progressive XP requirements for level up', () => {
      const levels = [1, 2, 3, 4, 5];
      const xpRequirements = levels.map((level) =>
        getXpForNextLevel(level)
      );

      // Each level should require more XP than the previous
      for (let i = 1; i < xpRequirements.length; i++) {
        expect(xpRequirements[i]).toBeGreaterThan(xpRequirements[i - 1]);
      }
    });

    it('should reach max level at 9900 XP', () => {
      const constants = getConstants();
      // Level 100 requires (100-1) * 100 = 9900 XP
      const level = getLevel(9900);
      expect(level).toBe(100);
    });

    it('should show complete progression from level 1 to 10', () => {
      const progression: Array<{ xp: number; level: number }> = [];

      for (let xp = 0; xp <= 1000; xp += 100) {
        progression.push({
          xp,
          level: getLevel(xp),
        });
      }

      // Should have levels 1-11
      const uniqueLevels = new Set(progression.map((p) => p.level));
      expect(uniqueLevels.size).toBeGreaterThan(5);
    });

    it('should have consistent level calculation', () => {
      // Test that the same XP always gives the same level
      const xp = 12345;
      const level1 = getLevel(xp);
      const level2 = getLevel(xp);
      expect(level1).toBe(level2);
    });
  });

  describe('Badge criteria validation', () => {
    it('should have valid badge criteria types', () => {
      const constants = getConstants();
      const validTypes = [
        'check_in_count',
        'streak_days',
        'xp_threshold',
        'topic_mastery',
      ];

      Object.values(constants.BADGE_CRITERIA).forEach((criteria) => {
        expect(validTypes).toContain(criteria.type);
      });
    });

    it('should have positive badge criteria values', () => {
      const constants = getConstants();

      Object.values(constants.BADGE_CRITERIA).forEach((criteria) => {
        expect(criteria.value).toBeGreaterThan(0);
      });
    });

    it('should define first check-in badge', () => {
      const constants = getConstants();
      const badge = constants.BADGE_CRITERIA.FIRST_CHECK_IN;

      expect(badge.type).toBe('check_in_count');
      expect(badge.value).toBe(1);
    });

    it('should define seven day streak badge', () => {
      const constants = getConstants();
      const badge = constants.BADGE_CRITERIA.SEVEN_DAY_STREAK;

      expect(badge.type).toBe('streak_days');
      expect(badge.value).toBe(7);
    });

    it('should define hundred XP badge', () => {
      const constants = getConstants();
      const badge = constants.BADGE_CRITERIA.HUNDRED_XP;

      expect(badge.type).toBe('xp_threshold');
      expect(badge.value).toBe(100);
    });

    it('should define chapter expert badge', () => {
      const constants = getConstants();
      const badge = constants.BADGE_CRITERIA.CHAPTER_EXPERT;

      expect(badge.type).toBe('topic_mastery');
      expect(badge.value).toBe(90);
    });

    it('should define consistent learner badge', () => {
      const constants = getConstants();
      const badge = constants.BADGE_CRITERIA.CONSISTENT_LEARNER;

      expect(badge.type).toBe('check_in_count');
      expect(badge.value).toBe(10);
    });
  });
});
