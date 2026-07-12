import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ForbiddenError } from '../errors/app.errors';
import { prisma } from '../database/prisma.service';
import { logger } from '../logger/logger.service';

// Cache for user permissions (in production, use Redis)
const permissionCache = new Map<string, Set<string>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedPermissions {
  permissions: Set<string>;
  timestamp: number;
}

/**
 * Load user permissions from database
 */
async function getUserPermissions(userId: string): Promise<Set<string>> {
  // Check cache first
  const cached = permissionCache.get(userId) as CachedPermissions | undefined;
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.permissions;
  }

  // Load from database
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
    return new Set();
  }

  const permissions = new Set<string>(
    user.role.rolePermissions.map(rp => 
      `${rp.permission.resource}:${rp.permission.action}`
    )
  );

  // Cache permissions
  permissionCache.set(userId, {
    permissions,
    timestamp: Date.now()
  } as CachedPermissions);

  return permissions;
}

/**
 * Clear user permissions from cache
 */
export function clearPermissionCache(userId: string): void {
  permissionCache.delete(userId);
}

/**
 * RBAC middleware factory
 * Creates middleware that checks if user has required permission
 */
export function requirePermission(resource: string, action: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.userId;
      const requiredPermission = `${resource}:${action}`;

      // Load user permissions
      const permissions = await getUserPermissions(userId);

      // Check if user has required permission
      if (!permissions.has(requiredPermission)) {
        logger.warn('Permission denied', {
          userId,
          requiredPermission,
          userPermissions: Array.from(permissions),
          path: req.path
        });

        throw new ForbiddenError(
          `You don't have permission to ${action} ${resource}`
        );
      }

      logger.debug('Permission granted', {
        userId,
        permission: requiredPermission,
        path: req.path
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Require any of the specified permissions
 */
export function requireAnyPermission(
  permissions: Array<{ resource: string; action: string }>
) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.userId;
      const userPermissions = await getUserPermissions(userId);

      const hasAnyPermission = permissions.some(({ resource, action }) =>
        userPermissions.has(`${resource}:${action}`)
      );

      if (!hasAnyPermission) {
        throw new ForbiddenError(
          'You don\'t have permission to perform this action'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
