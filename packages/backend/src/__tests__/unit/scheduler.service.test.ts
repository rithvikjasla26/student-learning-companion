import { describe, it, expect } from 'vitest';
import { calculatePriority } from '../../utils/sm2.js';

// Unit tests for scheduler service logic
// These test priority calculation without database dependencies

describe('Scheduler Service - Priority Calculation', () => {
  describe('calculatePriority', () => {
    it('should calculate higher priority for overdue topics', () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const overduePriority = calculatePriority(oneDayAgo, 50, 50, 50);
      const dueTomorrowPriority = calculatePriority(tomorrow, 50, 50, 50);

      expect(overduePriority).toBeLessThan(dueTomorrowPriority);
    });

    it('should calculate higher priority for lower mastery scores', () => {
      const now = new Date();

      const lowMasteryPriority = calculatePriority(now, 20, 50, 50);
      const highMasteryPriority = calculatePriority(now, 80, 50, 50);

      expect(lowMasteryPriority).toBeLessThan(highMasteryPriority);
    });

    it('should calculate higher priority for high confidence mismatch', () => {
      const now = new Date();

      // Student confident (90) but low mastery (30) = high mismatch
      const highMismatchPriority = calculatePriority(now, 30, 90, 50);

      // Student confident (50) and mastery matches (50) = low mismatch
      const lowMismatchPriority = calculatePriority(now, 50, 50, 50);

      expect(highMismatchPriority).toBeLessThan(lowMismatchPriority);
    });

    it('should calculate higher priority for high exam weight topics', () => {
      const now = new Date();

      const highExamWeightPriority = calculatePriority(now, 50, 50, 100);
      const lowExamWeightPriority = calculatePriority(now, 50, 50, 10);

      expect(highExamWeightPriority).toBeLessThan(lowExamWeightPriority);
    });

    it('should combine all factors correctly', () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // High priority: overdue, low mastery, high exam weight
      const highPriority = calculatePriority(oneDayAgo, 20, 50, 90);

      // Low priority: not due, high mastery, low exam weight
      const lowPriority = calculatePriority(now, 90, 50, 10);

      expect(highPriority).toBeLessThan(lowPriority);
    });

    it('should always return a number', () => {
      const now = new Date();
      const priority = calculatePriority(now, 50, 50, 50);

      expect(typeof priority).toBe('number');
      expect(priority).toBeGreaterThan(0);
      expect(!isNaN(priority)).toBe(true);
    });
  });
});
