import { TripStatus } from '@prisma/client';
import { ConflictError } from '../../errors/app.errors';

const tripStateMachine: Record<TripStatus, TripStatus[]> = {
  [TripStatus.DRAFT]: [
    TripStatus.DISPATCHED,
    TripStatus.CANCELLED
  ],
  [TripStatus.DISPATCHED]: [
    TripStatus.IN_PROGRESS,
    TripStatus.CANCELLED
  ],
  [TripStatus.IN_PROGRESS]: [
    TripStatus.COMPLETED,
    TripStatus.CANCELLED
  ],
  [TripStatus.COMPLETED]: [], // Terminal state
  [TripStatus.CANCELLED]: []  // Terminal state
};

export class TripStateMachine {
  /**
   * Check if transition is valid
   */
  static canTransition(from: TripStatus, to: TripStatus): boolean {
    return tripStateMachine[from]?.includes(to) ?? false;
  }

  /**
   * Validate and enforce state transition
   */
  static validateTransition(from: TripStatus, to: TripStatus): void {
    if (!this.canTransition(from, to)) {
      throw new ConflictError(
        `Cannot transition trip from ${from} to ${to}. ` +
        `Valid transitions from ${from}: ${tripStateMachine[from].join(', ')}`
      );
    }
  }

  /**
   * Get all valid transitions from current state
   */
  static getValidTransitions(from: TripStatus): TripStatus[] {
    return tripStateMachine[from] || [];
  }

  /**
   * Check if status is terminal
   */
  static isTerminalStatus(status: TripStatus): boolean {
    return status === TripStatus.COMPLETED || status === TripStatus.CANCELLED;
  }
}
