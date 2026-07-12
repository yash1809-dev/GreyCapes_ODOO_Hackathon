import { prisma } from '../../core/database/prisma.service';
import { CryptoUtils } from '../../shared/utils/crypto.utils';
import { UnauthorizedError, NotFoundError } from '../../core/errors/app.errors';
import { domainEvents } from '../../core/events/event.emitter';
import { DomainEvent } from '../../core/events/event.types';
import { AuthResponse, UserProfile } from './auth.dto';
import { logger } from '../../core/logger/logger.service';

export class AuthService {
  /**
   * Authenticate user with email and password
   */
  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    // Find user with role and permissions
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      logger.warn('Login attempt with non-existent email', { email, ipAddress });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn('Login attempt with inactive account', { userId: user.id, email });
      throw new UnauthorizedError('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await CryptoUtils.verifyPassword(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      logger.warn('Login attempt with invalid password', { 
        userId: user.id, 
        email,
        ipAddress 
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = CryptoUtils.generateAccessToken(user.id, user.roleId);
    const refreshToken = CryptoUtils.generateRefreshToken(user.id);

    logger.info('User logged in successfully', { 
      userId: user.id, 
      email,
      role: user.role.name 
    });

    // Emit login event
    domainEvents.emitEvent(
      DomainEvent.USER_LOGGED_IN,
      { userId: user.id, email, ipAddress, userAgent },
      user.id
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: {
          id: user.role.id,
          name: user.role.name
        }
      }
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const payload = CryptoUtils.verifyRefreshToken(refreshToken);

      // Load user to get role
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, roleId: true, isActive: true }
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Generate new access token
      const accessToken = CryptoUtils.generateAccessToken(user.id, user.roleId);

      return { accessToken };
    } catch (error) {
      logger.warn('Invalid refresh token attempt');
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  /**
   * Get current user profile with permissions
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const permissions = user.role.rolePermissions.map(
      rp => `${rp.permission.resource}:${rp.permission.action}`
    );

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description
      },
      permissions
    };
  }
}
