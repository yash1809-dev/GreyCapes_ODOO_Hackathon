import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../core/validation/validation.middleware';
import { LoginSchema, RefreshTokenSchema } from './auth.dto';
import { authenticate } from '../../core/security/auth.middleware';

const router = Router();
const authController = new AuthController();

/**
 * POST /api/auth/login
 * Public endpoint - authenticate user
 */
router.post(
  '/login',
  validateRequest(LoginSchema),
  authController.login
);

/**
 * POST /api/auth/refresh
 * Public endpoint - refresh access token
 */
router.post(
  '/refresh',
  validateRequest(RefreshTokenSchema),
  authController.refresh
);

/**
 * GET /api/auth/me
 * Protected endpoint - get current user profile
 */
router.get(
  '/me',
  authenticate,
  authController.getProfile
);

/**
 * POST /api/auth/logout
 * Protected endpoint - logout user
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

export default router;
