import { create } from 'zustand';

export interface RateLimitInfo {
  isLimited: boolean;
  retryAfter: number; // Unix timestamp in milliseconds
  limiterType?: string;
  message?: string;
}

interface RateLimitStore {
  // Map of endpoint keys to rate limit info
  limits: Map<string, RateLimitInfo>;

  // Actions
  setRateLimit: (endpoint: string, retryAfter: number, limiterType?: string, message?: string) => void;
  clearRateLimit: (endpoint: string) => void;
  isEndpointLimited: (endpoint: string) => boolean;
  getRetryAfterSeconds: (endpoint: string) => number;
  getRateLimitInfo: (endpoint: string) => RateLimitInfo | null;
  clearAllLimits: () => void;
  isGloballyLimited: () => boolean;
}

export const useRateLimitStore = create<RateLimitStore>((set, get) => ({
  limits: new Map(),

  setRateLimit: (endpoint: string, retryAfter: number, limiterType = 'unknown', message?: string) => {
    set((state) => {
      const newLimits = new Map(state.limits);
      newLimits.set(endpoint, {
        isLimited: true,
        retryAfter,
        limiterType,
        message,
      });
      return { limits: newLimits };
    });

    // Auto-clear rate limit after retryAfter expires
    const now = Date.now();
    const delayMs = Math.max(0, retryAfter - now);
    if (delayMs > 0 && delayMs < 3600000) { // Don't set timers longer than 1 hour
      setTimeout(() => {
        get().clearRateLimit(endpoint);
      }, delayMs + 100); // Add 100ms buffer
    }
  },

  clearRateLimit: (endpoint: string) => {
    set((state) => {
      const newLimits = new Map(state.limits);
      newLimits.delete(endpoint);
      return { limits: newLimits };
    });
  },

  isEndpointLimited: (endpoint: string) => {
    const info = get().limits.get(endpoint);
    if (!info) return false;

    const now = Date.now();
    if (now >= info.retryAfter) {
      get().clearRateLimit(endpoint);
      return false;
    }

    return info.isLimited;
  },

  getRetryAfterSeconds: (endpoint: string) => {
    const info = get().limits.get(endpoint);
    if (!info) return 0;

    const now = Date.now();
    const remaining = Math.ceil((info.retryAfter - now) / 1000);
    return Math.max(0, remaining);
  },

  getRateLimitInfo: (endpoint: string) => {
    const info = get().limits.get(endpoint);
    if (!info) return null;

    const now = Date.now();
    if (now >= info.retryAfter) {
      get().clearRateLimit(endpoint);
      return null;
    }

    return info;
  },

  clearAllLimits: () => {
    set({ limits: new Map() });
  },

  isGloballyLimited: () => {
    const state = get();
    for (const [, info] of state.limits) {
      const now = Date.now();
      if (now < info.retryAfter && info.limiterType === 'global') {
        return true;
      }
    }
    return false;
  },
}));
