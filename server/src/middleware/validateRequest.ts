import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';
import { ApiError } from './errorHandler';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  // Format errors
  const formattedErrors = errors.array().map((error) => ({
    field: error.type === 'field' ? (error as any).path : 'unknown',
    message: error.msg,
    value: (error as any).value,
  }));

  // Log validation errors
  logger.warn('Request validation failed', {
    path: req.path,
    method: req.method,
    errors: formattedErrors,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  const errorMessage = formattedErrors.map(err => `${err.field}: ${err.message}`).join(', ');
  next(new ApiError(400, `Validation failed: ${errorMessage}`));
};
