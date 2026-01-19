import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, Result, ValidationError } from 'express-validator';
import { logger } from '../utils/logger';
import { ApiError } from './errorHandler';

interface FormattedError {
  field: string;
  message: string;
  value?: any;
}

export const validateRequest = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors in a type-safe way
    const formattedErrors = errors.array().map((error: ValidationError) => {
      // Handle different types of validation errors
      if ('path' in error) {
        // For field validation errors
        return {
          field: error.path,
          message: error.msg,
          value: (error as any).value,
        };
      } else if ('nestedErrors' in error) {
        // For nested validation errors
        return {
          field: 'nested',
          message: 'Nested validation error',
          errors: (error as any).nestedErrors,
        };
      }
      // Fallback for other error types
      return {
        field: 'unknown',
        message: error.msg || 'Validation error',
      };
    });

    // Log validation errors
    logger.warn('Request validation failed', {
      path: req.path,
      method: req.method,
      errors: formattedErrors,
      body: req.body,
      params: req.params,
      query: req.query,
    });

    next(new ApiError(400, 'Validation failed', true, JSON.stringify(formattedErrors)));
  };
};
