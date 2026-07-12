import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/app.errors';
import { CryptoUtils, JWTPayload } from '../../shared/utils/crypto.utils';
import { logger } from '../logger/logger.service';

export interface AuthRequest extends Request {
  user: JWTPayload;
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    // Verify token
    const payload = CryptoUtils.verifyAccessToken(token);

    // Attach user info to request
    (req as AuthRequest).user = payload;

    logger.debug('User authenticated', { 
      userId: payload.userId,
      roleId: payload.roleId,
      path: req.path
    });

    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('Invalid token'));
    } else if (error instanceof Error && error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
}

/**
 * Optional authentication
 * Attaches user if token is valid, but doesn't fail if no token
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = CryptoUtils.verifyAccessToken(token);
      (req as AuthRequest).user = payload;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}
