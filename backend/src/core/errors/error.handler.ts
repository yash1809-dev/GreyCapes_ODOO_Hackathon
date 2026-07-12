import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from './app.errors';
import { logger } from '../logger/logger.service';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error details
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.userId,
    body: req.body
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      }
    });
  }

  // Handle operational errors
  if ('isOperational' in error && (error as AppError).isOperational) {
    const appError = error as AppError;
    return res.status(appError.statusCode).json({
      success: false,
      error: {
        message: appError.message,
        code: appError.name,
        details: (appError as any).details
      }
    });
  }

  // Handle unknown/unexpected errors
  res.status(500).json({
    success: false,
    error: {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR'
    }
  });
}
