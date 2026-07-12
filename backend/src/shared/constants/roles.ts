/**
 * Role constants
 * These are reference names - actual roles are stored in database
 */

export const ROLES = {
  ADMIN: 'Admin',
  FLEET_MANAGER: 'Fleet Manager',
  DISPATCHER: 'Dispatcher',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
  DRIVER: 'Driver',
} as const;

export type RoleName = typeof ROLES[keyof typeof ROLES];

/**
 * Role-Permission mapping
 * Used for seeding database
 */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    'vehicles:*',
    'drivers:*',
    'trips:*',
    'maintenance:*',
    'fuel:*',
    'expenses:*',
    'analytics:*',
    'audit:*',
    'users:*'
  ],
  
  [ROLES.FLEET_MANAGER]: [
    'vehicles:create',
    'vehicles:read',
    'vehicles:update',
    'vehicles:delete',
    'drivers:create',
    'drivers:read',
    'drivers:update',
    'drivers:delete',
    'maintenance:create',
    'maintenance:read',
    'maintenance:update',
    'maintenance:delete',
    'analytics:read',
    'fuel:read',
    'expenses:read',
    'trips:read'
  ],
  
  [ROLES.DISPATCHER]: [
    'trips:create',
    'trips:read',
    'trips:update',
    'trips:dispatch',
    'trips:complete',
    'trips:cancel',
    'vehicles:read',
    'drivers:read',
    'fuel:create',
    'fuel:read',
    'expenses:create',
    'expenses:read'
  ],
  
  [ROLES.SAFETY_OFFICER]: [
    'drivers:create',
    'drivers:read',
    'drivers:update',
    'drivers:delete',
    'trips:read',
    'vehicles:read',
    'analytics:read'
  ],
  
  [ROLES.FINANCIAL_ANALYST]: [
    'expenses:read',
    'fuel:read',
    'maintenance:read',
    'trips:read',
    'analytics:read',
    'analytics:export'
  ],
  
  [ROLES.DRIVER]: [
    'trips:read',
    'fuel:create',
    'fuel:read'
  ]
} as const;
