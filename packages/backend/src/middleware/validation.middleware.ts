import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../types/errors.js';

/**
 * Factory function to create validation middleware
 * Usage: router.post('/endpoint', validate(schema), controller)
 */
export const validate =
  (schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = source === 'body' ? req.body : source === 'query' ? req.query : req.params;

      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false, // Collect all validation errors
        stripUnknown: true, // Remove unknown properties
        convert: true, // Convert types if possible
      });

      if (error) {
        const validationErrors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type,
        }));

        throw new ValidationError('Request validation failed', {
          errors: validationErrors,
        });
      }

      // Replace original data with validated/converted data
      if (source === 'body') {
        req.body = value;
      } else if (source === 'query') {
        req.query = value;
      } else if (source === 'params') {
        req.params = value;
      }

      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(error.statusCode).json({
          error: error.message,
          details: error.details,
        });
      }

      // Handle unexpected validation errors
      return res.status(500).json({
        error: 'Validation middleware error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

/**
 * Middleware to validate request body
 */
export const validateBody = (schema: Joi.ObjectSchema) => validate(schema, 'body');

/**
 * Middleware to validate query parameters
 */
export const validateQuery = (schema: Joi.ObjectSchema) => validate(schema, 'query');

/**
 * Middleware to validate URL parameters
 */
export const validateParams = (schema: Joi.ObjectSchema) => validate(schema, 'params');
