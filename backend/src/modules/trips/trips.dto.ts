import { TripStatus } from '@prisma/client';

// ============================================
// REQUEST DTOs
// ============================================

export interface CreateTripDTO {
  vehicleId: string;
  driverId: string;
  regionId?: string;
  origin: string;
  destination: string;
  scheduledStart: Date | string;
  scheduledEnd?: Date | string;
  cargoWeight?: number;
  notes?: string;
}

export interface DispatchTripDTO {
  notes?: string;
}

export interface StartTripDTO {
  notes?: string;
}

export interface CompleteTripDTO {
  actualEnd: Date | string;
  distanceKm: number;
  finalOdometer: number;
  notes?: string;
}

export interface CancelTripDTO {
  reason: string;
}

export interface TripFiltersDTO {
  status?: TripStatus;
  vehicleId?: string;
  driverId?: string;
  regionId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================
// RESPONSE DTOs
// ============================================

export interface TripResponseDTO {
  id: string;
  tripNumber: string;
  status: TripStatus;
  origin: string;
  destination: string;
  scheduledStart: string;
  actualStart: string | null;
  scheduledEnd: string | null;
  actualEnd: string | null;
  distanceKm: number | null;
  cargoWeight: number | null;
  notes: string | null;
  vehicle: {
    id: string;
    registrationNumber: string;
    vehicleType: {
      name: string;
    };
  };
  driver: {
    id: string;
    fullName: string;
    licenseNumber: string;
  };
  region: {
    id: string;
    name: string;
    code: string;
  } | null;
  createdBy: {
    id: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TripDetailResponseDTO extends TripResponseDTO {
  history: {
    id: string;
    status: TripStatus;
    changedBy: string;
    changedAt: string;
    notes: string | null;
  }[];
  fuelLogs: {
    id: string;
    quantityLiters: number;
    totalCost: number;
    filledAt: string;
  }[];
  expenses: {
    id: string;
    category: string;
    amount: number;
    description: string;
    expenseDate: string;
  }[];
}
