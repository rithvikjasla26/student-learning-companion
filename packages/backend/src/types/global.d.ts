import 'express';

declare module 'express' {
  interface Request {
    rateLimit?: {
      limit?: number;
      current?: number;
      remaining?: number;
      resetTime?: number | Date;
      [key: string]: any;
    };

    user?: {
      userId: string;
      email?: string;
      role?: string;
      [key: string]: any;
    };
  }
}
