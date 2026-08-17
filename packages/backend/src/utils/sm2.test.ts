import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateSM2,
  masteryToQuality,
  calculatePriority,
} from './sm2.js';

describe('SM2 Algorithm', () => {
  describe('calculateSM2', () => {
    it('should initialize SM2 state correctly with default values', () => {
      const result = calculateSM2(2.5, 4, 1);
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
      expect(result.interval).toBeGreaterThan(0);
      expect(result.nextDueAt).toBeInstanceOf(Date);
    });

    it('should reset interval to 1 when quality < 3', () => {
      const result = calculateSM2(2.5, 2, 10); // quality = 2 (failed)
      expect(result.interval).toBe(1);
    });

    it('should set interval to 3 when initial interval is 1 and quality >= 3', () => {
      const result = calculateSM2(2.5, 3, 1); // quality = 3 (passing)
      expect(result.interval).toBe(3);
    });

    it('should multiply interval by ease factor for subsequent reviews', () => {
      const result = calculateSM2(2.5, 4, 3); // quality = 4, interval = 3
      // interval = round(3 * 2.5) = 8
      expect(result.interval).toBe(8);
    });

    it('should enforce minimum ease factor of 1.3', () => {
      const result = calculateSM2(1.3, 0, 1); // Lowest quality
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('should increase ease factor for good quality scores', () => {
      const result = calculateSM2(2.5, 5, 1); // Perfect quality
      expect(result.easeFactor).toBeGreaterThan(2.5);
    });

    it('should decrease ease factor for poor quality scores', () => {
      const result = calculateSM2(2.5, 1, 1); // Poor quality
      expect(result.easeFactor).toBeLessThan(2.5);
    });

    it('should calculate nextDueAt correctly', () => {
      const beforeCalc = new Date();
      const result = calculateSM2(2.5, 4, 1);
      const afterCalc = new Date();

      const expectedDue = new Date(beforeCalc);
      expectedDue.setDate(expectedDue.getDate() + result.interval);

      // Allow 1 second difference for test execution time
      const timeDiff = Math.abs(
        result.nextDueAt.getTime() - expectedDue.getTime()
      );
      expect(timeDiff).toBeLessThan(1000);
    });

    it('should handle edge cases with quality boundaries', () => {
      // Test all quality thresholds
      const qualities = [0, 1, 2, 3, 4, 5];
      qualities.forEach((q) => {
        const result = calculateSM2(2.5, q, 1);
        expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
        expect(result.interval).toBeGreaterThanOrEqual(1);
      });
    });

    it('should clamp quality scores to 0-5 range', () => {
      const resultLow = calculateSM2(2.5, -10, 1);
      const resultHigh = calculateSM2(2.5, 100, 1);

      // Should work with clamped values
      expect(resultLow.interval).toBeGreaterThanOrEqual(1);
      expect(resultHigh.easeFactor).toBeGreaterThan(0);
    });
  });

  describe('masteryToQuality', () => {
    it('should convert mastery score 0-20 to quality 0', () => {
      expect(masteryToQuality(0)).toBe(0);
      expect(masteryToQuality(10)).toBe(0);
      expect(masteryToQuality(19)).toBe(0);
    });

    it('should convert mastery score 20-40 to quality 1', () => {
      expect(masteryToQuality(20)).toBe(1);
      expect(masteryToQuality(30)).toBe(1);
      expect(masteryToQuality(39)).toBe(1);
    });

    it('should convert mastery score 40-60 to quality 2', () => {
      expect(masteryToQuality(40)).toBe(2);
      expect(masteryToQuality(50)).toBe(2);
      expect(masteryToQuality(59)).toBe(2);
    });

    it('should convert mastery score 60-80 to quality 3', () => {
      expect(masteryToQuality(60)).toBe(3);
      expect(masteryToQuality(70)).toBe(3);
      expect(masteryToQuality(79)).toBe(3);
    });

    it('should convert mastery score 80-90 to quality 4', () => {
      expect(masteryToQuality(80)).toBe(4);
      expect(masteryToQuality(85)).toBe(4);
      expect(masteryToQuality(89)).toBe(4);
    });

    it('should convert mastery score 90-100 to quality 5', () => {
      expect(masteryToQuality(90)).toBe(5);
      expect(masteryToQuality(95)).toBe(5);
      expect(masteryToQuality(100)).toBe(5);
    });

    it('should handle boundary values correctly', () => {
      expect(masteryToQuality(20)).toBe(1); // Lower boundary of 20-40
      expect(masteryToQuality(40)).toBe(2); // Lower boundary of 40-60
      expect(masteryToQuality(60)).toBe(3); // Lower boundary of 60-80
      expect(masteryToQuality(80)).toBe(4); // Lower boundary of 80-90
      expect(masteryToQuality(90)).toBe(5); // Lower boundary of 90-100
    });
  });

  describe('calculatePriority', () => {
    let now: Date;

    beforeEach(() => {
      now = new Date();
    });

    it('should return higher priority for overdue topics', () => {
      // Topic due 2 days ago
      const dueDateOld = new Date(now);
      dueDateOld.setDate(dueDateOld.getDate() - 2);

      const priorityOld = calculatePriority(
        dueDateOld,
        50,
        50,
        50
      );

      // Topic due tomorrow
      const dueDateNew = new Date(now);
      dueDateNew.setDate(dueDateNew.getDate() + 1);

      const priorityNew = calculatePriority(
        dueDateNew,
        50,
        50,
        50
      );

      expect(priorityOld).toBeGreaterThan(priorityNew);
    });

    it('should return higher priority for topics with low mastery', () => {
      const dueDate = new Date(now);

      const priorityLowMastery = calculatePriority(
        dueDate,
        20,
        50,
        50
      );

      const priorityHighMastery = calculatePriority(
        dueDate,
        90,
        50,
        50
      );

      expect(priorityLowMastery).toBeGreaterThan(priorityHighMastery);
    });

    it('should return higher priority for topics with confidence-mastery mismatch', () => {
      const dueDate = new Date(now);

      // Student is confident but hasn't mastered (overconfident)
      const priorityMismatch = calculatePriority(
        dueDate,
        30,
        90,
        50
      );

      // Student's confidence matches mastery
      const priorityMatch = calculatePriority(
        dueDate,
        50,
        50,
        50
      );

      expect(priorityMismatch).toBeGreaterThan(priorityMatch);
    });

    it('should return higher priority for high exam weight topics', () => {
      const dueDate = new Date(now);

      const priorityLowWeight = calculatePriority(
        dueDate,
        50,
        50,
        10
      );

      const priorityHighWeight = calculatePriority(
        dueDate,
        50,
        50,
        90
      );

      expect(priorityHighWeight).toBeGreaterThan(priorityLowWeight);
    });

    it('should always return a positive priority score', () => {
      const dueDate = new Date(now);
      const priority = calculatePriority(dueDate, 50, 50, 50);
      expect(priority).toBeGreaterThan(0);
    });

    it('should handle future due dates correctly', () => {
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + 10);

      const priority = calculatePriority(
        futureDate,
        50,
        50,
        50
      );

      expect(priority).toBeGreaterThan(0);
    });

    it('should weigh combined factors correctly', () => {
      const dueDate = new Date(now);

      // All factors negative
      const badPriority = calculatePriority(dueDate, 90, 10, 10);

      // All factors positive
      const goodPriority = calculatePriority(dueDate, 10, 90, 90);

      expect(goodPriority).toBeGreaterThan(badPriority);
    });

    it('should use exam weight as percentage correctly', () => {
      const dueDate = new Date(now);

      // Exam weight 0% should have lower impact
      const priority0 = calculatePriority(dueDate, 50, 50, 0);

      // Exam weight 100% should have higher impact
      const priority100 = calculatePriority(dueDate, 50, 50, 100);

      expect(priority100).toBeGreaterThan(priority0);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete learning cycle', () => {
      // Initial learning
      let state = calculateSM2(2.5, 0, 1); // Student fails first time
      expect(state.interval).toBe(1); // Reset to 1 day
      const easeAfterFail = state.easeFactor;
      expect(easeAfterFail).toBeLessThan(2.5); // Ease decreases after failure

      // Second attempt after 1 day - quality 3 (good but not excellent)
      state = calculateSM2(
        state.easeFactor,
        3,
        state.interval
      );
      expect(state.interval).toBe(3); // Jump to 3 days
      const easeAfterGood = state.easeFactor;

      // Quality 3 still results in ease decrease (not perfect performance)
      expect(easeAfterGood).toBeLessThan(easeAfterFail);

      // Third attempt after 3 days - quality 5 (excellent)
      state = calculateSM2(
        state.easeFactor,
        5,
        state.interval
      ); // Perfect recall
      expect(state.interval).toBeGreaterThan(3); // Longer interval

      // Excellent performance (quality 5) increases ease factor
      expect(state.easeFactor).toBeGreaterThan(easeAfterGood);
    });

    it('should handle performance degradation', () => {
      // Good performance initially
      let state = calculateSM2(2.5, 5, 1);
      const easeAfterGood = state.easeFactor;

      // Poor performance later
      state = calculateSM2(easeAfterGood, 1, state.interval);
      expect(state.easeFactor).toBeLessThan(easeAfterGood); // Ease decreases
      expect(state.interval).toBe(1); // Reset interval
    });

    it('should maintain learning progress over time', () => {
      let state = calculateSM2(2.5, 3, 1);
      const intervals: number[] = [state.interval];

      // Simulate repeated good performance
      for (let i = 0; i < 5; i++) {
        state = calculateSM2(state.easeFactor, 4, state.interval);
        intervals.push(state.interval);
      }

      // Intervals should generally increase
      for (let i = 1; i < intervals.length; i++) {
        expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1]);
      }
    });
  });
});
