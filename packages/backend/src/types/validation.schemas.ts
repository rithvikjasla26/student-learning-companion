import Joi from 'joi';

/**
 * Centralized Joi validation schemas for all API endpoints
 * These schemas define the expected shape and constraints of request data
 */

// ============ AUTH SCHEMAS ============

export const authSchemas = {
  sendOTP: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Must be a valid email address',
        'any.required': 'Email is required',
      }),
  }),

  verifyOTP: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Must be a valid email address',
        'any.required': 'Email is required',
      }),
    otp: Joi.string()
      .length(6)
      .pattern(/^\d+$/)
      .required()
      .messages({
        'string.length': 'OTP must be exactly 6 digits',
        'string.pattern.base': 'OTP must contain only digits',
        'any.required': 'OTP is required',
      }),
    role: Joi.string()
      .valid('STUDENT', 'PARENT')
      .optional()
      .messages({
        'any.only': 'Role must be either STUDENT or PARENT',
      }),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'any.required': 'Refresh token is required',
      }),
  }),
};

// ============ CHECK-IN SCHEMAS ============

export const checkinSchemas = {
  evaluateExplanation: Joi.object({
    topicId: Joi.string()
      .required()
      .messages({
        'any.required': 'Topic ID is required',
      }),
    explanation: Joi.string()
      .min(10)
      .max(5000)
      .required()
      .trim()
      .messages({
        'string.min': 'Explanation must be at least 10 characters',
        'string.max': 'Explanation must not exceed 5000 characters',
        'any.required': 'Explanation is required',
      }),
  }),

  getHistory: Joi.object({
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .optional()
      .default(20)
      .messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100',
      }),
    offset: Joi.number()
      .integer()
      .min(0)
      .optional()
      .default(0)
      .messages({
        'number.base': 'Offset must be a number',
        'number.min': 'Offset cannot be negative',
      }),
  }),
};

// ============ WIDGET SCHEMAS ============

export const widgetSchemas = {
  getByGapType: Joi.object({
    topicId: Joi.string()
      .required()
      .messages({
        'any.required': 'Topic ID is required',
      }),
    gapType: Joi.string()
      .valid('recall', 'structural', 'sequence', 'application')
      .required()
      .messages({
        'any.required': 'Gap type is required',
        'any.only': 'Gap type must be one of: recall, structural, sequence, application',
      }),
  }),

  submitResponse: Joi.object({
    widgetId: Joi.string()
      .required()
      .messages({
        'any.required': 'Widget ID is required',
      }),
    studentAnswer: Joi.string()
      .max(5000)
      .required()
      .trim()
      .messages({
        'string.max': 'Answer must not exceed 5000 characters',
        'any.required': 'Student answer is required',
      }),
    timeSpentMs: Joi.number()
      .integer()
      .min(0)
      .optional()
      .default(0)
      .messages({
        'number.base': 'Time spent must be a number',
        'number.min': 'Time spent cannot be negative',
      }),
    sessionId: Joi.string()
      .optional()
      .messages({
        'string.base': 'Session ID must be a string',
      }),
  }),
};

// ============ PARENT SCHEMAS ============

export const parentSchemas = {
  getChildProgress: Joi.object({
    studentId: Joi.string()
      .required()
      .messages({
        'any.required': 'Student ID is required',
      }),
  }),

  getWeeklySummary: Joi.object({
    studentId: Joi.string()
      .required()
      .messages({
        'any.required': 'Student ID is required',
      }),
  }),

  linkChild: Joi.object({
    studentId: Joi.string()
      .required()
      .messages({
        'any.required': 'Student ID is required',
      }),
  }),

  linkChildByCode: Joi.object({
    inviteCode: Joi.string()
      .required()
      .messages({
        'any.required': 'Invite code is required',
      }),
  }),

  verifyInviteCode: Joi.object({
    code: Joi.string()
      .length(6)
      .uppercase()
      .required()
      .messages({
        'string.length': 'Invite code must be exactly 6 characters',
        'any.required': 'Invite code is required',
      }),
    studentId: Joi.string()
      .required()
      .messages({
        'any.required': 'Student ID is required',
      }),
  }),
};

// ============ RECONFIRM SCHEMAS ============

export const reconfirmSchemas = {
  evaluateReconfirmation: Joi.object({
    topicId: Joi.string()
      .required()
      .messages({
        'any.required': 'Topic ID is required',
      }),
    explanation: Joi.string()
      .min(10)
      .max(5000)
      .required()
      .trim()
      .messages({
        'string.min': 'Explanation must be at least 10 characters',
        'string.max': 'Explanation must not exceed 5000 characters',
        'any.required': 'Explanation is required',
      }),
    sessionId: Joi.string()
      .required()
      .messages({
        'any.required': 'Session ID is required',
      }),
  }),
};

// ============ PROGRESS SCHEMAS ============

export const progressSchemas = {
  getCheckIns: Joi.object({
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .optional()
      .default(20)
      .messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100',
      }),
    offset: Joi.number()
      .integer()
      .min(0)
      .optional()
      .default(0)
      .messages({
        'number.base': 'Offset must be a number',
        'number.min': 'Offset cannot be negative',
      }),
  }),
};

// ============ PAGINATION HELPERS ============

export const paginationSchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20),
  offset: Joi.number()
    .integer()
    .min(0)
    .optional()
    .default(0),
});
