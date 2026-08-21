import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: 'STUDENT' | 'PARENT' | 'ADMIN';
      };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(`[Auth] Missing authorization header for ${req.method} ${req.path}`);
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      email: string;
      role: 'STUDENT' | 'PARENT' | 'ADMIN';
    };

    req.user = decoded;
    console.log(`[Auth] ✓ Token verified for ${decoded.email} - ${req.method} ${req.path}`);
    next();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[Auth] ✗ Token verification failed: ${errorMsg} - ${req.method} ${req.path}`);
    return res.status(401).json({ error: 'Invalid or expired token', details: errorMsg });
  }
};

/**
 * Middleware to check if user has specific role
 */
export const requireRole =
  (...roles: Array<'STUDENT' | 'PARENT' | 'ADMIN'>) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role as 'STUDENT' | 'PARENT' | 'ADMIN')) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }

    next();
  };

/**
 * Middleware to check if request is from student only
 */
export const requireStudent = requireRole('STUDENT');

/**
 * Middleware to check if request is from parent only
 */
export const requireParent = requireRole('PARENT');
