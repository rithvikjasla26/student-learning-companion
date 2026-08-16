/**
 * Custom error classes for consistent error handling across the app
 */

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error - 400 Bad Request
 * Thrown when request data fails validation
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
  }
}

/**
 * Authentication error - 401 Unauthorized
 * Thrown when user is not authenticated or token is invalid
 */
export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * Authorization error - 403 Forbidden
 * Thrown when user is authenticated but lacks permissions
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Forbidden: insufficient permissions') {
    super(message, 403);
  }
}

/**
 * Not found error - 404 Not Found
 * Thrown when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

/**
 * Conflict error - 409 Conflict
 * Thrown when a resource already exists or operation conflicts
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

/**
 * Rate limit error - 429 Too Many Requests
 * Thrown when rate limit is exceeded
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests, please try again later') {
    super(message, 429);
  }
}

/**
 * Internal server error - 500 Internal Server Error
 * Thrown for unexpected server errors
 */
export class InternalError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, 500, details);
  }
}
