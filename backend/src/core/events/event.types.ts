/**
 * Domain Events
 * Events emitted when significant business actions occur
 */

export enum DomainEvent {
  // Trip Events
  TRIP_CREATED = 'trip.created',
  TRIP_DISPATCHED = 'trip.dispatched',
  TRIP_STARTED = 'trip.started',
  TRIP_COMPLETED = 'trip.completed',
  TRIP_CANCELLED = 'trip.cancelled',

  // Vehicle Events
  VEHICLE_CREATED = 'vehicle.created',
  VEHICLE_UPDATED = 'vehicle.updated',
  VEHICLE_DELETED = 'vehicle.deleted',
  VEHICLE_STATUS_CHANGED = 'vehicle.status_changed',
  VEHICLE_RETIRED = 'vehicle.retired',

  // Driver Events
  DRIVER_CREATED = 'driver.created',
  DRIVER_UPDATED = 'driver.updated',
  DRIVER_DELETED = 'driver.deleted',
  DRIVER_STATUS_CHANGED = 'driver.status_changed',
  DRIVER_LICENSE_EXPIRING = 'driver.license_expiring',

  // Maintenance Events
  MAINTENANCE_STARTED = 'maintenance.started',
  MAINTENANCE_COMPLETED = 'maintenance.completed',

  // Fuel Events
  FUEL_LOGGED = 'fuel.logged',

  // Expense Events
  EXPENSE_CREATED = 'expense.created',

  // User Events
  USER_LOGGED_IN = 'user.logged_in',
  USER_LOGGED_OUT = 'user.logged_out',
}

export interface EventPayload {
  [key: string]: any;
}

export interface DomainEventData<T = EventPayload> {
  event: DomainEvent;
  data: T;
  timestamp: Date;
  userId?: string;
}
