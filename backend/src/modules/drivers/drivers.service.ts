import { DriverRepository } from './drivers.repository';
import { 
  CreateDriverDTO, 
  UpdateDriverDTO, 
  DriverFiltersDTO,
  UpdateDriverStatusDTO,
  DriverResponseDTO,
  DriverDetailResponseDTO
} from './drivers.dto';
import { 
  NotFoundError, 
  ConflictError, 
  ValidationError 
} from '../../core/errors/app.errors';
import { driverStateMachine } from '../../core/business-rules/state-machines/driver.state-machine';
import { domainEvents } from '../../core/events/event.emitter';
import { DomainEvent } from '../../core/events/event.types';
import { logger } from '../../core/logger/logger.service';
import { DriverStatus } from '@prisma/client';

export class DriverService {
  private repository: DriverRepository;

  constructor() {
    this.repository = new DriverRepository();
  }

  /**
   * Get all drivers with filters and pagination
   */
  async getAllDrivers(filters: DriverFiltersDTO) {
    logger.info('Fetching drivers', { filters });

    const { drivers, total } = await this.repository.findAll(filters);

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    return {
      data: drivers.map(this.mapToResponseDTO),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get driver by ID
   */
  async getDriverById(id: string): Promise<DriverResponseDTO> {
    logger.info('Fetching driver by ID', { driverId: id });

    const driver = await this.repository.findById(id);

    if (!driver) {
      throw new NotFoundError('Driver');
    }

    return this.mapToResponseDTO(driver);
  }

  /**
   * Get driver details with history
   */
  async getDriverDetails(id: string): Promise<DriverDetailResponseDTO> {
    logger.info('Fetching driver details', { driverId: id });

    const driver = await this.repository.findByIdWithDetails(id);

    if (!driver) {
      throw new NotFoundError('Driver');
    }

    const stats = await this.repository.getDriverStats(id);

    return this.mapToDetailResponseDTO(driver, stats);
  }

  /**
   * Create new driver
   */
  async createDriver(
    data: CreateDriverDTO,
    userId: string
  ): Promise<DriverResponseDTO> {
    logger.info('Creating driver', { data, userId });

    // Check if license number already exists
    const existingDriver = await this.repository.findByLicenseNumber(
      data.licenseNumber
    );

    if (existingDriver) {
      throw new ConflictError('License number already exists');
    }

    // Validate license expiry is in the future
    const licenseExpiry = new Date(data.licenseExpiry);
    if (licenseExpiry < new Date()) {
      throw new ValidationError('License expiry date must be in the future');
    }

    const driver = await this.repository.create({
      fullName: data.fullName,
      licenseNumber: data.licenseNumber,
      licenseExpiry,
      phone: data.phone,
      hireDate: new Date(data.hireDate),
      ...(data.userId && { userId: data.userId })
    });

    logger.info('Driver created successfully', { driverId: driver.id });

    // Emit event
    domainEvents.emitEvent(
      DomainEvent.DRIVER_CREATED,
      { driverId: driver.id, fullName: driver.fullName },
      userId
    );

    return this.mapToResponseDTO(driver);
  }

  /**
   * Update driver
   */
  async updateDriver(
    id: string,
    data: UpdateDriverDTO,
    userId: string
  ): Promise<DriverResponseDTO> {
    logger.info('Updating driver', { driverId: id, data, userId });

    const driver = await this.repository.findById(id);
    if (!driver) {
      throw new NotFoundError('Driver');
    }

    // If updating license number, check uniqueness
    if (data.licenseNumber && data.licenseNumber !== driver.licenseNumber) {
      const existing = await this.repository.findByLicenseNumber(
        data.licenseNumber
      );
      if (existing) {
        throw new ConflictError('License number already exists');
      }
    }

    // If updating license expiry, validate it's in the future
    if (data.licenseExpiry) {
      const licenseExpiry = new Date(data.licenseExpiry);
      if (licenseExpiry < new Date()) {
        throw new ValidationError('License expiry date must be in the future');
      }
    }

    // If updating status, validate state transition
    if (data.status && data.status !== driver.status) {
      if (!driverStateMachine.canTransition(driver.status, data.status)) {
        throw new ValidationError(
          `Cannot transition driver from ${driver.status} to ${data.status}`
        );
      }
    }

    const updateData: any = {};
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.licenseNumber) updateData.licenseNumber = data.licenseNumber;
    if (data.licenseExpiry) updateData.licenseExpiry = new Date(data.licenseExpiry);
    if (data.phone) updateData.phone = data.phone;
    if (data.status) updateData.status = data.status;

    const updatedDriver = await this.repository.update(id, updateData);

    logger.info('Driver updated successfully', { driverId: id });

    // Emit event
    domainEvents.emitEvent(
      DomainEvent.DRIVER_UPDATED,
      { driverId: id, changes: data },
      userId
    );

    return this.mapToResponseDTO(updatedDriver);
  }

  /**
   * Delete driver (soft delete)
   */
  async deleteDriver(id: string, userId: string): Promise<void> {
    logger.info('Deleting driver', { driverId: id, userId });

    const driver = await this.repository.findById(id);
    if (!driver) {
      throw new NotFoundError('Driver');
    }

    // Cannot delete if driver is on trip
    if (driver.status === DriverStatus.ON_TRIP) {
      throw new ConflictError('Cannot delete driver that is currently on a trip');
    }

    await this.repository.softDelete(id);

    logger.info('Driver deleted successfully', { driverId: id });

    // Emit event
    domainEvents.emitEvent(
      DomainEvent.DRIVER_DELETED,
      { driverId: id },
      userId
    );
  }

  /**
   * Update driver status
   */
  async updateDriverStatus(
    id: string,
    data: UpdateDriverStatusDTO,
    userId: string
  ): Promise<DriverResponseDTO> {
    logger.info('Updating driver status', { driverId: id, data, userId });

    const driver = await this.repository.findById(id);
    if (!driver) {
      throw new NotFoundError('Driver');
    }

    // Validate state transition
    if (!driverStateMachine.canTransition(driver.status, data.status)) {
      throw new ValidationError(
        `Cannot transition driver from ${driver.status} to ${data.status}`
      );
    }

    const updatedDriver = await this.repository.updateStatus(id, data.status);

    logger.info('Driver status updated successfully', { 
      driverId: id, 
      oldStatus: driver.status,
      newStatus: data.status
    });

    // Emit event
    domainEvents.emitEvent(
      DomainEvent.DRIVER_STATUS_CHANGED,
      { 
        driverId: id, 
        oldStatus: driver.status,
        newStatus: data.status,
        notes: data.notes
      },
      userId
    );

    return this.mapToResponseDTO(updatedDriver);
  }

  /**
   * Get available drivers for dispatch
   */
  async getAvailableDrivers() {
    logger.info('Fetching available drivers');

    const drivers = await this.repository.findAvailableDrivers();

    return drivers.map(this.mapToResponseDTO);
  }

  /**
   * Map driver to response DTO
   */
  private mapToResponseDTO(driver: any): DriverResponseDTO {
    const licenseExpiry = new Date(driver.licenseExpiry);
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    let licenseStatus: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
    if (licenseExpiry < now) {
      licenseStatus = 'EXPIRED';
    } else if (licenseExpiry <= thirtyDaysFromNow) {
      licenseStatus = 'EXPIRING_SOON';
    } else {
      licenseStatus = 'VALID';
    }

    return {
      id: driver.id,
      fullName: driver.fullName,
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry.toISOString(),
      phone: driver.phone,
      status: driver.status,
      hireDate: driver.hireDate.toISOString(),
      userId: driver.userId,
      createdAt: driver.createdAt.toISOString(),
      updatedAt: driver.updatedAt.toISOString(),
      licenseStatus
    };
  }

  /**
   * Map driver to detail response DTO
   */
  private mapToDetailResponseDTO(driver: any, stats: any): DriverDetailResponseDTO {
    return {
      ...this.mapToResponseDTO(driver),
      trips: driver.trips.map((trip: any) => ({
        id: trip.id,
        tripNumber: trip.tripNumber,
        status: trip.status,
        origin: trip.origin,
        destination: trip.destination,
        scheduledStart: trip.scheduledStart.toISOString(),
        actualStart: trip.actualStart?.toISOString() || null,
        actualEnd: trip.actualEnd?.toISOString() || null,
        vehicle: {
          registrationNumber: trip.vehicle.registrationNumber
        }
      })),
      stats
    };
  }
}
