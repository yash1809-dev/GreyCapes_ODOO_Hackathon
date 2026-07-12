import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { LoginDTO, RefreshTokenDTO } from './auth.dto';
import { ResponseBuilder } from '../../shared/dto/response.dto';
import { AuthRequest } from '../../core/security/auth.middleware';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * POST /api/auth/login
   * Authenticate user and return tokens
   */
  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body as LoginDTO;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      const result = await this.authService.login(
        email,
        password,
        ipAddress,
        userAgent
      );

      res.json(ResponseBuilder.success(result));
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/refresh
   * Refresh access token
   */
  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { refreshToken } = req.body as RefreshTokenDTO;

      const result = await this.authService.refreshToken(refreshToken);

      res.json(ResponseBuilder.success(result));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/auth/me
   * Get current user profile
   */
  getProfile = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user.userId;

      const profile = await this.authService.getProfile(userId);

      res.json(ResponseBuilder.success(profile));
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/logout
   * Logout user (client-side token removal, optional server-side blacklisting)
   */
  logout = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // In production, implement token blacklisting here
      // For now, just confirm logout
      res.json(ResponseBuilder.success({ message: 'Logged out successfully' }));
    } catch (error) {
      next(error);
    }
  };
}
