import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, AuthError, AuthorizationError, NotFoundError } from '../types/errors.js';

/**
 * Global error handler middleware
 * Must be registered LAST in the middleware stack
 * Usage: app.use(errorHandler)
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Default to 500 if no status code
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any = undefined;

  // Log the error for debugging
  console.error('[ERROR]', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Handle custom AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  }
  // Handle Joi validation errors (if not caught by middleware)
  else if (err.isJoi) {
    statusCode = 400;
    message = 'Request validation failed';
    details = {
      errors: err.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      })),
    };
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid or malformed token';
  }
  // Handle token expiry
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }
  // Handle Prisma errors
  else if (err.code && err.code.startsWith('P')) {
    statusCode = 400;
    message = 'Database error';
    // Don't expose Prisma error details in production
    if (process.env.NODE_ENV === 'development') {
      details = {
        code: err.code,
        message: err.message,
      };
    }
  }
  // Handle generic Error instances
  else if (err instanceof Error) {
    message = err.message || 'An unexpected error occurred';
    // Preserve original status code if it exists
    if ('status' in err && typeof err.status === 'number') {
      statusCode = err.status;
    }
  }

  // Send error response
  res.status(statusCode).json({
    error: message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 * Should be registered before the error handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  next(error);
};

/**
 * Async error wrapper for Express route handlers
 * Wraps async functions to catch errors and pass to error handler
 * Usage: router.post('/endpoint', asyncHandler(controller.method))
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
