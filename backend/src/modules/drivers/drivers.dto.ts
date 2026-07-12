import { DriverStatus } from '@prisma/client';

// ============================================
// REQUEST DTOs
// ============================================

export interface CreateDriverDTO {
  fullName: string;
  licenseNumber: string;
  licenseExpiry: Date | string;
  phone: string;
  hireDate: Date | string;
  userId?: string;
}

export interface UpdateDriverDTO {
  fullName?: string;
  licenseNumber?: string;
  licenseExpiry?: Date | string;
  phone?: string;
  status?: DriverStatus;
}

export interface DriverFiltersDTO {
  status?: DriverStatus;
  search?: string;
  expiringLicenses?: boolean; // Show drivers with licenses expiring in next 30 days
  page?: number;
  limit?: number;
}

export interface UpdateDriverStatusDTO {
  status: DriverStatus;
  notes?: string;
}

// ============================================
// RESPONSE DTOs
// ============================================

export interface DriverResponseDTO {
  id: string;
  fullName: string;
  licenseNumber: string;
  licenseExpiry: string;
  phone: string;
  status: DriverStatus;
  hireDate: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  licenseStatus: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
}

export interface DriverDetailResponseDTO extends DriverResponseDTO {
  trips: {
    id: string;
    tripNumber: string;
    status: string;
    origin: string;
    destination: string;
    scheduledStart: string;
    actualStart: string | null;
    actualEnd: string | null;
    vehicle: {
      registrationNumber: string;
    };
  }[];
  stats: {
    totalTrips: number;
    completedTrips: number;
    activeTrips: number;
  };
}
