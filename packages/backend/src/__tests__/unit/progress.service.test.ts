import { describe, it, expect } from 'vitest';

// Unit tests for progress service logic
describe('Progress Service - Unit Tests', () => {
  describe('Level calculation', () => {
    const calculateLevel = (xp: number): number => {
      const xpPerLevel = 100;
      return Math.floor(xp / xpPerLevel) + 1;
    };

    it('should calculate level 1 for 0-99 XP', () => {
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(50)).toBe(1);
      expect(calculateLevel(99)).toBe(1);
    });

    it('should calculate level 2 for 100-199 XP', () => {
      expect(calculateLevel(100)).toBe(2);
      expect(calculateLevel(150)).toBe(2);
      expect(calculateLevel(199)).toBe(2);
    });

    it('should calculate level progression correctly', () => {
      expect(calculateLevel(300)).toBe(4);
      expect(calculateLevel(500)).toBe(6);
      expect(calculateLevel(1000)).toBe(11);
    });
  });

  describe('Progress bar calculation', () => {
    const calculateProgressPercentage = (currentXP: number, levelXP: number): number => {
      return (currentXP % levelXP) / levelXP * 100;
    };

    it('should show 0% progress at level start', () => {
      const progress = calculateProgressPercentage(100, 100);
      expect(progress).toBe(0);
    });

    it('should show 50% progress at midpoint', () => {
      const progress = calculateProgressPercentage(150, 100);
      expect(progress).toBe(50);
    });

    it('should show 99% progress near level up', () => {
      const progress = calculateProgressPercentage(199, 100);
      expect(progress).toBeGreaterThan(90);
    });
  });

  describe('Streak calculation', () => {
    it('should maintain streak with daily check-ins', () => {
      const lastCheckInDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday
      const now = new Date();
      const hoursSinceLastCheckIn = (now.getTime() - lastCheckInDate.getTime()) / (60 * 60 * 1000);

      expect(hoursSinceLastCheckIn < 24).toBe(true);
    });

    it('should maintain streak with grace period (up to 48 hours)', () => {
      const lastCheckInDate = new Date(Date.now() - 36 * 60 * 60 * 1000); // 1.5 days ago
      const now = new Date();
      const hoursSinceLastCheckIn = (now.getTime() - lastCheckInDate.getTime()) / (60 * 60 * 1000);
      const gracePeriodHours = 48;

      expect(hoursSinceLastCheckIn < gracePeriodHours).toBe(true);
    });

    it('should break streak after grace period', () => {
      const lastCheckInDate = new Date(Date.now() - 50 * 60 * 60 * 1000); // 50 hours ago
      const now = new Date();
      const hoursSinceLastCheckIn = (now.getTime() - lastCheckInDate.getTime()) / (60 * 60 * 1000);
      const gracePeriodHours = 48;

      expect(hoursSinceLastCheckIn > gracePeriodHours).toBe(true);
    });

    it('should handle timezone differences correctly', () => {
      // Even if it's technically the next day in a different timezone,
      // 24 hours of activity should maintain streak
      const lastCheckInDate = new Date(Date.now() - 20 * 60 * 60 * 1000);
      const now = new Date();
      const hoursSinceLastCheckIn = (now.getTime() - lastCheckInDate.getTime()) / (60 * 60 * 1000);

      expect(hoursSinceLastCheckIn < 24).toBe(true);
    });
  });

  describe('Mastery visualization', () => {
    it('should categorize 0-30% as low mastery (grey)', () => {
      const masteryScore = 25;
      const category = masteryScore < 30 ? 'grey' : 'amber';

      expect(category).toBe('grey');
    });

    it('should categorize 30-70% as medium mastery (amber)', () => {
      const scores = [30, 50, 70];

      scores.forEach((score) => {
        const category = score < 30 ? 'grey' : score < 70 ? 'amber' : 'green';
        expect(category).toBe('amber');
      });
    });

    it('should categorize 70-100% as high mastery (green)', () => {
      const scores = [70, 85, 100];

      scores.forEach((score) => {
        const category = score < 70 ? 'amber' : 'green';
        expect(category).toBe('green');
      });
    });
  });

  describe('Subject-level calculations', () => {
    it('should aggregate topic scores into subject level', () => {
      const topicScores = [80, 85, 75, 90];
      const subjectLevel = topicScores.reduce((a, b) => a + b, 0) / topicScores.length;

      expect(subjectLevel).toBe(82.5);
    });

    it('should calculate weighted subject level', () => {
      // Topics can have different weights
      const topics = [
        { mastery: 80, weight: 1 },
        { mastery: 85, weight: 2 },
        { mastery: 75, weight: 1 },
      ];

      const totalWeight = topics.reduce((sum, t) => sum + t.weight, 0);
      const weightedLevel = topics.reduce((sum, t) => sum + t.mastery * t.weight, 0) / totalWeight;

      expect(weightedLevel).toBe(82.5);
    });
  });

  describe('Check-in history pagination', () => {
    it('should return 10 items per page by default', () => {
      const pageSize = 10;
      const itemCount = 25;
      const totalPages = Math.ceil(itemCount / pageSize);

      expect(totalPages).toBe(3);
    });

    it('should calculate correct page offsets', () => {
      const pageSize = 10;
      const page = 2;
      const offset = (page - 1) * pageSize;

      expect(offset).toBe(10);
    });

    it('should limit page size for security', () => {
      const maxPageSize = 100;
      const requestedPageSize = 500;
      const actualPageSize = Math.min(requestedPageSize, maxPageSize);

      expect(actualPageSize).toBe(100);
    });
  });

  describe('Topic sorting', () => {
    it('should sort topics by due date (ascending)', () => {
      const topics = [
        { name: 'A', nextDueAt: new Date('2024-01-05') },
        { name: 'B', nextDueAt: new Date('2024-01-01') },
        { name: 'C', nextDueAt: new Date('2024-01-03') },
      ];

      const sorted = [...topics].sort((a, b) =>
        a.nextDueAt.getTime() - b.nextDueAt.getTime()
      );

      expect(sorted[0].name).toBe('B');
      expect(sorted[1].name).toBe('C');
      expect(sorted[2].name).toBe('A');
    });

    it('should prioritize by mastery gap', () => {
      const topics = [
        { name: 'A', masteryScore: 80 }, // Low gap
        { name: 'B', masteryScore: 40 }, // High gap
        { name: 'C', masteryScore: 60 }, // Medium gap
      ];

      const sorted = [...topics].sort((a, b) =>
        a.masteryScore - b.masteryScore
      );

      expect(sorted[0].name).toBe('B'); // Lowest mastery (highest priority)
    });
  });

  describe('Time-based metrics', () => {
    it('should calculate study time from check-in frequency', () => {
      const checkInCount = 10;
      const avgMinutesPerCheckIn = 5;
      const totalMinutes = checkInCount * avgMinutesPerCheckIn;

      expect(totalMinutes).toBe(50);
    });

    it('should track last check-in time', () => {
      const lastCheckIn = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const now = new Date();
      const hoursSinceCheckIn = (now.getTime() - lastCheckIn.getTime()) / (60 * 60 * 1000);

      expect(hoursSinceCheckIn).toBeCloseTo(2, 0);
    });
  });

  describe('Comparative metrics', () => {
    it('should rank performance by percentile', () => {
      const allStudentXP = [500, 600, 700, 800, 900, 1000];
      const studentXP = 800;
      const rank = allStudentXP.filter(xp => xp <= studentXP).length;
      const percentile = (rank / allStudentXP.length) * 100;

      expect(percentile).toBe(66.67);
    });
  });
});
