import { VehicleStatus } from '@prisma/client';
import { ConflictError } from '../../errors/app.errors';

const vehicleStateMachine: Record<VehicleStatus, VehicleStatus[]> = {
  [VehicleStatus.AVAILABLE]: [
    VehicleStatus.ON_TRIP,
    VehicleStatus.IN_MAINTENANCE,
    VehicleStatus.RETIRED
  ],
  [VehicleStatus.ON_TRIP]: [
    VehicleStatus.AVAILABLE
  ],
  [VehicleStatus.IN_MAINTENANCE]: [
    VehicleStatus.AVAILABLE,
    VehicleStatus.RETIRED
  ],
  [VehicleStatus.RETIRED]: [] // Terminal state
};

export class VehicleStateMachine {
  /**
   * Check if transition is valid
   */
  static canTransition(from: VehicleStatus, to: VehicleStatus): boolean {
    return vehicleStateMachine[from]?.includes(to) ?? false;
  }

  /**
   * Validate and enforce state transition
   * Throws error if transition is invalid
   */
  static validateTransition(from: VehicleStatus, to: VehicleStatus): void {
    if (!this.canTransition(from, to)) {
      throw new ConflictError(
        `Cannot transition vehicle from ${from} to ${to}. ` +
        `Valid transitions from ${from}: ${vehicleStateMachine[from].join(', ')}`
      );
    }
  }

  /**
   * Get all valid transitions from current state
   */
  static getValidTransitions(from: VehicleStatus): VehicleStatus[] {
    return vehicleStateMachine[from] || [];
  }
}
