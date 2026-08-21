import axios, { AxiosError } from 'axios';

export interface RateLimitError {
  status: 429;
  message: string;
  retryAfter: number; // Unix timestamp in milliseconds
  limiterType?: string;
  isRateLimited: true;
}

export interface NormalizedError {
  status: number;
  message: string;
  retryAfter?: number;
  limiterType?: string;
  isRateLimited: boolean;
}

/**
 * Check if an error is a rate limit error (429)
 */
export function isRateLimitError(error: any): error is AxiosError & { data?: { retryAfter?: string | number } } {
  return error?.response?.status === 429;
}

/**
 * Get rate limit information from error
 */
export function getRateLimitInfo(error: any): { retryAfter: number; limiterType?: string } | null {
  if (!isRateLimitError(error)) return null;

  const retryAfterValue = error.response?.data?.retryAfter || error.response?.headers?.['retry-after'];
  const limiterType = error.response?.data?.limiterType;

  let retryAfter: number;

  if (!retryAfterValue) {
    // Default to 60 seconds if no retry-after provided
    retryAfter = Date.now() + 60000;
  } else if (typeof retryAfterValue === 'string' && retryAfterValue.includes('T')) {
    // ISO timestamp string
    retryAfter = new Date(retryAfterValue).getTime();
  } else if (typeof retryAfterValue === 'string') {
    // Seconds as string
    retryAfter = Date.now() + parseInt(retryAfterValue, 10) * 1000;
  } else if (typeof retryAfterValue === 'number') {
    if (retryAfterValue > Date.now()) {
      // Already a timestamp
      retryAfter = retryAfterValue;
    } else {
      // Seconds as number
      retryAfter = Date.now() + retryAfterValue * 1000;
    }
  } else {
    retryAfter = Date.now() + 60000;
  }

  return { retryAfter, limiterType };
}

/**
 * Get user-friendly message based on limiter type
 */
export function getRateLimitMessage(limiterType?: string): string {
  const messages: Record<string, string> = {
    global: 'Too many requests across the platform. Please wait and try again.',
    auth: 'Too many authentication attempts. Check your email for OTP or try again in a few minutes.',
    checkin: 'You have submitted too many check-ins. You can submit up to 10 per hour.',
    llm: 'AI evaluation limit reached. You can evaluate explanations up to 20 times per hour.',
    parentLink: 'Too many linking attempts. Please try again later.',
    student: 'API rate limit reached. Please reduce request frequency and try again.',
  };

  return messages[limiterType || 'unknown'] || messages.student;
}

/**
 * Get retry-after time in seconds
 */
export function getRetryAfterSeconds(error: any): number {
  const info = getRateLimitInfo(error);
  if (!info) return 0;

  const remaining = Math.ceil((info.retryAfter - Date.now()) / 1000);
  return Math.max(0, remaining);
}

/**
 * Format countdown time as "MM:SS" or "X seconds"
 */
export function formatCountdownTime(seconds: number): string {
  if (seconds <= 0) return '0 seconds';
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Normalize error object to consistent format
 */
export function normalizeError(error: any): NormalizedError {
  if (!axios.isAxiosError(error)) {
    return {
      status: 500,
      message: error?.message || 'An unexpected error occurred',
      isRateLimited: false,
    };
  }

  if (error.response?.status === 429) {
    const info = getRateLimitInfo(error);
    return {
      status: 429,
      message: error.response?.data?.message || getRateLimitMessage(info?.limiterType),
      retryAfter: info?.retryAfter,
      limiterType: info?.limiterType,
      isRateLimited: true,
    };
  }

  return {
    status: error.response?.status || 500,
    message: error.response?.data?.message || error.message || 'An error occurred',
    isRateLimited: false,
  };
}

/**
 * Extract endpoint path from request config or error
 */
export function getEndpointFromError(error: any): string {
  if (axios.isAxiosError(error) && error.config?.url) {
    return error.config.url;
  }
  return 'unknown';
}
