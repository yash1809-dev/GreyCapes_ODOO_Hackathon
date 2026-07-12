/**
 * Permission constants
 * Format: resource:action
 */

export const PERMISSIONS = {
  // Vehicles
  VEHICLES_CREATE: 'vehicles:create',
  VEHICLES_READ: 'vehicles:read',
  VEHICLES_UPDATE: 'vehicles:update',
  VEHICLES_DELETE: 'vehicles:delete',

  // Drivers
  DRIVERS_CREATE: 'drivers:create',
  DRIVERS_READ: 'drivers:read',
  DRIVERS_UPDATE: 'drivers:update',
  DRIVERS_DELETE: 'drivers:delete',

  // Trips
  TRIPS_CREATE: 'trips:create',
  TRIPS_READ: 'trips:read',
  TRIPS_UPDATE: 'trips:update',
  TRIPS_DELETE: 'trips:delete',
  TRIPS_DISPATCH: 'trips:dispatch',
  TRIPS_COMPLETE: 'trips:complete',
  TRIPS_CANCEL: 'trips:cancel',

  // Maintenance
  MAINTENANCE_CREATE: 'maintenance:create',
  MAINTENANCE_READ: 'maintenance:read',
  MAINTENANCE_UPDATE: 'maintenance:update',
  MAINTENANCE_DELETE: 'maintenance:delete',

  // Fuel
  FUEL_CREATE: 'fuel:create',
  FUEL_READ: 'fuel:read',
  FUEL_UPDATE: 'fuel:update',
  FUEL_DELETE: 'fuel:delete',

  // Expenses
  EXPENSES_CREATE: 'expenses:create',
  EXPENSES_READ: 'expenses:read',
  EXPENSES_UPDATE: 'expenses:update',
  EXPENSES_DELETE: 'expenses:delete',

  // Analytics
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_EXPORT: 'analytics:export',

  // Audit
  AUDIT_READ: 'audit:read',

  // Users
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
