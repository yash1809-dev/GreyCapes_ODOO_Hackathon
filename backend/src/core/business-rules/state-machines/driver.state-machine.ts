import { DriverStatus } from '@prisma/client';
import { ConflictError } from '../../errors/app.errors';

const driverStateTransitions: Record<DriverStatus, DriverStatus[]> = {
  [DriverStatus.AVAILABLE]: [
    DriverStatus.ON_TRIP,
    DriverStatus.ON_LEAVE,
    DriverStatus.SUSPENDED,
    DriverStatus.INACTIVE
  ],
  [DriverStatus.ON_TRIP]: [
    DriverStatus.AVAILABLE
  ],
  [DriverStatus.ON_LEAVE]: [
    DriverStatus.AVAILABLE,
    DriverStatus.INACTIVE
  ],
  [DriverStatus.SUSPENDED]: [
    DriverStatus.AVAILABLE,
    DriverStatus.INACTIVE
  ],
  [DriverStatus.INACTIVE]: [] // Terminal state
};

export class DriverStateMachine {
  /**
   * Check if transition is valid
   */
  static canTransition(from: DriverStatus, to: DriverStatus): boolean {
    return driverStateTransitions[from]?.includes(to) ?? false;
  }

  /**
   * Validate and enforce state transition
   */
  static validateTransition(from: DriverStatus, to: DriverStatus): void {
    if (!this.canTransition(from, to)) {
      throw new ConflictError(
        `Cannot transition driver from ${from} to ${to}. ` +
        `Valid transitions from ${from}: ${driverStateTransitions[from].join(', ')}`
      );
    }
  }

  /**
   * Get all valid transitions from current state
   */
  static getValidTransitions(from: DriverStatus): DriverStatus[] {
    return driverStateTransitions[from] || [];
  }
}

export const driverStateMachine = DriverStateMachine;
