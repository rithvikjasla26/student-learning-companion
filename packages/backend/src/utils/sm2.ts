/**
 * SM-2 Algorithm for spaced repetition
 * Reference: https://en.wikipedia.org/wiki/SuperMemo
 */

export interface SM2State {
  easeFactor: number;
  interval: number;
  nextDueAt: Date;
}

/**
 * Calculate SM-2 schedule
 * @param easeFactor Current ease factor (default 2.5)
 * @param quality Quality of response (0-5, where 0=no recall, 5=perfect)
 * @param interval Current interval in days (default 1)
 * @returns New state with updated ease factor and interval
 */
export function calculateSM2(
  easeFactor: number = 2.5,
  quality: number,
  interval: number = 1
): SM2State {
  // Validate quality score
  const q = Math.max(0, Math.min(5, quality));

  // Calculate new ease factor
  let newEase = easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  newEase = Math.max(1.3, newEase); // Ensure ease factor never goes below 1.3

  // Calculate new interval
  let newInterval: number;
  if (q < 3) {
    // Failed to remember
    newInterval = 1;
  } else if (interval === 1) {
    newInterval = 3;
  } else {
    newInterval = Math.round(interval * newEase);
  }

  // Ensure interval is at least 1 day
  newInterval = Math.max(1, newInterval);

  // Calculate next due date
  const nextDueAt = new Date();
  nextDueAt.setDate(nextDueAt.getDate() + newInterval);

  return {
    easeFactor: newEase,
    interval: newInterval,
    nextDueAt,
  };
}

/**
 * Convert mastery score (0-100) to SM-2 quality score (0-5)
 */
export function masteryToQuality(masteryScore: number): number {
  // 0-20 = 0 (no recall)
  // 20-40 = 1 (poor recall)
  // 40-60 = 2 (fair recall)
  // 60-80 = 3 (good recall, but some gaps)
  // 80-100 = 4-5 (excellent recall)
  if (masteryScore < 20) return 0;
  if (masteryScore < 40) return 1;
  if (masteryScore < 60) return 2;
  if (masteryScore < 80) return 3;
  return masteryScore >= 90 ? 5 : 4;
}

/**
 * Calculate priority score for scheduling next review
 * Lower score = higher priority (review sooner)
 */
export function calculatePriority(
  nextDueAt: Date,
  masteryScore: number,
  confidenceScore: number,
  examWeight: number = 50
): number {
  const now = new Date();
  const daysSinceDue = Math.max(0, (now.getTime() - nextDueAt.getTime()) / (1000 * 60 * 60 * 24));

  // Overdue weight (inverted: lower score for more urgent)
  const overdueWeight = 1 / (1 + daysSinceDue);

  // Mastery gap weight (inverted: lower score for lower mastery)
  const masteryGap = 100 - masteryScore;
  const masteryWeight = 1 / (1 + masteryGap / 100);

  // Confidence mismatch weight (inverted: lower score for higher mismatch)
  const confidenceMismatch = Math.abs(confidenceScore - masteryScore);
  const confidenceWeight = 1 / (1 + confidenceMismatch / 100);

  // Exam weight (inverted: lower score for higher exam weight)
  const examWeightNorm = 1 / (1 + examWeight / 100);

  // Combined priority score (lower = higher priority)
  return (overdueWeight * 0.5 + masteryWeight * 0.25 + confidenceWeight * 0.1 + examWeightNorm * 0.15);
}
