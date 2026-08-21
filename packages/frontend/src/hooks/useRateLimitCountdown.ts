import { useState, useEffect } from 'react';

/**
 * Hook to manage countdown timer for rate limit retry
 * @param retryAfter - Unix timestamp in milliseconds when retry is allowed
 * @param onComplete - Callback when countdown reaches 0
 * @returns Current countdown seconds remaining
 */
export function useRateLimitCountdown(retryAfter: number | null, onComplete?: () => void) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    if (!retryAfter) {
      setSecondsRemaining(0);
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.ceil((retryAfter - now) / 1000);

      if (remaining <= 0) {
        setSecondsRemaining(0);
        onComplete?.();
      } else {
        setSecondsRemaining(remaining);
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [retryAfter, onComplete]);

  return secondsRemaining;
}
