import { VehicleStatus, FuelType } from '@prisma/client';

// ============================================
// REQUEST DTOs
// ============================================

export interface CreateVehicleDTO {
  registrationNumber: string;
  vehicleTypeId: string;
  regionId: string;
  purchaseDate: Date | string;
  currentOdometer?: number;
}

export interface UpdateVehicleDTO {
  registrationNumber?: string;
  vehicleTypeId?: string;
  regionId?: string;
  status?: VehicleStatus;
  currentOdometer?: number;
  lastMaintenanceDate?: Date | string;
}

export interface VehicleFiltersDTO {
  status?: VehicleStatus;
  vehicleTypeId?: string;
  regionId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UpdateVehicleStatusDTO {
  status: VehicleStatus;
  notes?: string;
}

// ============================================
// RESPONSE DTOs
// ============================================

export interface VehicleResponseDTO {
  id: string;
  registrationNumber: string;
  status: VehicleStatus;
  currentOdometer: number;
  purchaseDate: string;
  lastMaintenanceDate: string | null;
  vehicleType: {
    id: string;
    name: string;
    fuelType: FuelType;
    defaultCapacity: number;
  };
  region: {
    id: string;
    name: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VehicleDetailResponseDTO extends VehicleResponseDTO {
  trips: {
    id: string;
    tripNumber: string;
    status: string;
    origin: string;
    destination: string;
    scheduledStart: string;
    actualStart: string | null;
    actualEnd: string | null;
  }[];
  maintenanceLogs: {
    id: string;
    maintenanceType: string;
    description: string;
    cost: number;
    performedAt: string;
    completedAt: string | null;
  }[];
  fuelLogs: {
    id: string;
    quantityLiters: number;
    totalCost: number;
    filledAt: string;
  }[];
}

export interface VehicleTypeResponseDTO {
  id: string;
  name: string;
  description: string | null;
  defaultCapacity: number;
  fuelType: FuelType;
}

export interface RegionResponseDTO {
  id: string;
  name: string;
  code: string;
}
