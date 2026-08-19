import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiting middleware for API endpoints
 * Implements tiered rate limiting based on endpoint sensitivity
 */

/**
 * Global rate limiter
 * Applied to all routes: 1000 requests per hour per IP
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  },
});

/**
 * Auth rate limiter
 * Stricter limits for authentication endpoints to prevent brute force attacks
 * OTP endpoints: 10 requests per 15 minutes per email/IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use email from request body as key for OTP endpoints
    const email = (req.body?.email as string) || ipKeyGenerator(req.ip ?? 'unknown');
    return email || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    const retryAfter = req.rateLimit?.resetTime
      ? new Date(req.rateLimit.resetTime).toISOString()
      : 'in 15 minutes';

    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again ' + retryAfter,
      retryAfter: req.rateLimit?.resetTime,
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for non-sensitive auth endpoints if needed
    return false;
  },
});

/**
 * Student API rate limiter
 * 100 requests per hour per authenticated student
 * Falls back to IP-based limiting if user not authenticated
 */
export const studentApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour
  message: 'Too many requests to the API, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use student ID if authenticated, otherwise use IP
    const userId = (req as any).user?.userId || ipKeyGenerator(req.ip ?? 'unknown');
    return userId;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'API rate limit exceeded. Please try again later.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

/**
 * Check-in endpoint limiter
 * Allow only 1 check-in per student per day
 * 5 requests per hour to allow retries and corrections
 */
export const checkinLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour (enough for retries)
  message: 'Too many check-in attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use student ID for per-student limiting
    const userId = (req as any).user?.userId || ipKeyGenerator(req.ip ?? 'unknown');
    return `checkin-${userId}`;
  },
  skip: (req: Request) => {
    // Skip for GET requests (history)
    return req.method === 'GET';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many check-in attempts. You can submit a check-in up to 5 times per hour.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

/**
 * LLM API rate limiter
 * Limit API calls to Claude to prevent excessive costs
 * 20 requests per hour per student
 */
export const llmLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 LLM API calls per hour
  message: 'LLM API rate limit exceeded.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.userId || ipKeyGenerator(req.ip ?? 'unknown');
    return `llm-${userId}`;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'AI evaluation limit exceeded. Please try again later.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

/**
 * Parent linking rate limiter
 * Prevent abuse of parent-student linking via invite codes
 * 10 attempts per hour per IP
 */
export const parentLinkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 linking attempts per hour
  message: 'Too many linking attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.userId || ipKeyGenerator(req.ip ?? 'unknown');
    return `link-${userId}`;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many linking attempts. Please try again later.',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

export default {
  globalLimiter,
  authLimiter,
  studentApiLimiter,
  checkinLimiter,
  llmLimiter,
  parentLinkLimiter,
};
