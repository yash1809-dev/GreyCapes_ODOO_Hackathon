import { VehicleRepository } from './vehicles.repository';
import { 
  CreateVehicleDTO, 
  UpdateVehicleDTO, 
  VehicleFiltersDTO,
  UpdateVehicleStatusDTO,
  VehicleResponseDTO,
  VehicleDetailResponseDTO
} from './vehicles.dto';
import { 
  NotFoundError, 
  ConflictError, 
  ValidationError 
} from '../../core/errors/app.errors';
import { vehicleStateMachine } from '../../core/business-rules/state-machines/vehicle.state-machine';
import { domainEvents } from '../../core/events/event.emitter';
import { DomainEvent } from '../../core/events/event.types';
import { logger } from '../../core/logger/logger.service';
import { TransactionManager } from '../../core/database/transaction.manager';
import { VehicleStatus } from '@prisma/client';

export class VehicleService {
  private repository: VehicleRepository;
  private transactionManager: TransactionManager;

  constructor() {
    this.repository = new VehicleRepository();
    this.transactionManager = new TransactionManager();
  }

  /**
   * Get all vehicles with filters and pagination
   */
  async getAllVehicles(filters: VehicleFiltersDTO) {
    logger.info('Fetching vehicles', { filters });

    const { vehicles, total } = await this.repository.findAll(filters);

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    return {
      data: vehicles.map(this.mapToResponseDTO),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get vehicle by ID
   */
  async getVehicleById(id: string): Promise<VehicleResponseDTO> {
    logger.info('Fetching vehicle by ID', { vehicleId: id });

    const vehicle = await this.repository.findById(id);

    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    return this.mapToResponseDTO(vehicle);
  }

  /**
   * Get vehicle details with history
   */
  async getVehicleDetails(id: string): Promise<VehicleDetailResponseDTO> {
    logger.info('Fetching vehicle details', { vehicleId: id });

    const vehicle = await this.repository.findByIdWithDetails(id);

    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    return this.mapToDetailResponseDTO(vehicle);
  }

  /**
   * Create new vehicle
   */
  async createVehicle(
    data: CreateVehicleDTO,
    userId: string
  ): Promise<VehicleResponseDTO> {
    logger.info('Creating vehicle', { data, userId });

    // Check if registration number already exists
    const existingVehicle = await this.repository.findByRegistrationNumber(
      data.registrationNumber
    );

    if (existingVehicle) {
      throw new ConflictError('Registration number already exists');
    }

    const vehicle = await this.repository.create({
      registrationNumber: data.registrationNumber,
      currentOdometer: data.currentOdometer || 0,
      purchaseDate: new Date(data.purchaseDate),
      vehicleType: { connect: { id: data.vehicleTypeId } },
      region: { connect: { id: data.regionId } }
    });

    logger.info('Vehicle created successfully', { vehicleId: vehicle.id });

    // Emit event
    domainEvents.emitEvent(
      DomainEvent.VEHICLE_CREATED,
      { vehicleId: vehicle.id, registrationNumber: vehicle.registrationNumber },
      userId
    );

    return this.mapToResponseDTO(vehicle);
  }

  /**
   * Update vehicle
   */
  async updateVehicle(
    id: string,
    data: UpdateVehicleDTO,
    userId: string
  ): Promise<VehicleResponseDTO> {
    logger.info('Updating vehicle', { vehicleId: id, data, userId });

    const vehicle = await this.repository.findById(id);
    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    // If updating registration number, check uniqueness
    if (data.registrationNumber && data.registrationNumber !== vehicle.registrationNumber) {
      const existing = await this.repository.findByRegistrationNumber(
        data.registrationNumber
      );
      if (existing) {
        throw new ConflictError('Registration number already exists');
      }
    }

    // If updating status, validate state transition
    if (data.status && data.status !== vehicle.status) {
      if (!vehicleStateMachine.canTransition(vehicle.status, data.status)) {
        throw new ValidationError(
          `Cannot transition vehicle from ${vehicle.status} to ${data.status}`
        );
      }
    }

    const updateData: any = {};
    if (data.registrationNumber) updateData.registrationNumber = data.registrationNumber;
    if (data.currentOdometer !== undefined) updateData.currentOdometer = data.currentOdometer;
    if (data.status) updateData.status = data.status;
    if (data.lastMaintenanceDate) updateData.lastMaintenanceDate = new Date(data.lastMaintenanceDate);
    if (data.vehicleTypeId) updateData.vehicleType = { connect: { id: data.vehicleTypeId } };
    if (data.regionId) updateData.region = { connect: { id: data.regionId } };

    const updatedVehicle = await this.repository.update(id, updateData);

    logger.info('Vehicle updated successfully', { vehicleId: id });

    // Emit event
    domainEvents.emitEvent(
      DomainEvent.VEHICLE_UPDATED,
      { vehicleId: id, changes: data },
      userId
    );

    return this.mapToResponseDTO(updatedVehicle);
  }

  /**
   * Delete vehicle (soft delete)
   */
  async deleteVehicle(id: string, userId: string): Promise<void> {
    logger.info('Deleting vehicle', { vehicleId: id, userId });

    const vehicle = await this.repository.findById(id);
    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    // Cannot delete if vehicle is on trip or in maintenance
    if (vehicle.status === VehicleStatus.ON_TRIP) {
      throw new ConflictError('Cannot delete vehicle that is currently on a trip');
    }

    if (vehicle.status === VehicleStatus.IN_MAINTENANCE) {
      throw new ConflictError('Cannot delete vehicle that is in maintenance');
    }

    await this.repository.softDelete(id);

    logger.info('Vehicle deleted successfully', { vehicleId: id });

    // Emit event
    domainEvents.emitEvent(
      DomainEvent.VEHICLE_DELETED,
      { vehicleId: id },
      userId
    );
  }

  /**
   * Update vehicle status
   */
  async updateVehicleStatus(
    id: string,
    data: UpdateVehicleStatusDTO,
    userId: string
  ): Promise<VehicleResponseDTO> {
    logger.info('Updating vehicle status', { vehicleId: id, data, userId });

    const vehicle = await this.repository.findById(id);
    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    // Validate state transition
    if (!vehicleStateMachine.canTransition(vehicle.status, data.status)) {
      throw new ValidationError(
        `Cannot transition vehicle from ${vehicle.status} to ${data.status}`
      );
    }

    const updatedVehicle = await this.repository.updateStatus(id, data.status);

    logger.info('Vehicle status updated successfully', { 
      vehicleId: id, 
      oldStatus: vehicle.status,
      newStatus: data.status
    });

    // Emit event
    domainEvents.emitEvent(
      DomainEvent.VEHICLE_STATUS_CHANGED,
      { 
        vehicleId: id, 
        oldStatus: vehicle.status,
        newStatus: data.status,
        notes: data.notes
      },
      userId
    );

    return this.mapToResponseDTO(updatedVehicle);
  }

  /**
   * Get all vehicle types
   */
  async getVehicleTypes() {
    return this.repository.findAllVehicleTypes();
  }

  /**
   * Get all regions
   */
  async getRegions() {
    return this.repository.findAllRegions();
  }

  /**
   * Get available vehicles for dispatch
   */
  async getAvailableVehicles(regionId?: string) {
    logger.info('Fetching available vehicles', { regionId });

    const vehicles = await this.repository.findAvailableVehicles(regionId);

    return vehicles.map(this.mapToResponseDTO);
  }

  /**
   * Map vehicle to response DTO
   */
  private mapToResponseDTO(vehicle: any): VehicleResponseDTO {
    return {
      id: vehicle.id,
      registrationNumber: vehicle.registrationNumber,
      status: vehicle.status,
      currentOdometer: vehicle.currentOdometer,
      purchaseDate: vehicle.purchaseDate.toISOString(),
      lastMaintenanceDate: vehicle.lastMaintenanceDate?.toISOString() || null,
      vehicleType: {
        id: vehicle.vehicleType.id,
        name: vehicle.vehicleType.name,
        fuelType: vehicle.vehicleType.fuelType,
        defaultCapacity: vehicle.vehicleType.defaultCapacity
      },
      region: {
        id: vehicle.region.id,
        name: vehicle.region.name,
        code: vehicle.region.code
      },
      createdAt: vehicle.createdAt.toISOString(),
      updatedAt: vehicle.updatedAt.toISOString()
    };
  }

  /**
   * Map vehicle to detail response DTO
   */
  private mapToDetailResponseDTO(vehicle: any): VehicleDetailResponseDTO {
    return {
      ...this.mapToResponseDTO(vehicle),
      trips: vehicle.trips.map((trip: any) => ({
        id: trip.id,
        tripNumber: trip.tripNumber,
        status: trip.status,
        origin: trip.origin,
        destination: trip.destination,
        scheduledStart: trip.scheduledStart.toISOString(),
        actualStart: trip.actualStart?.toISOString() || null,
        actualEnd: trip.actualEnd?.toISOString() || null
      })),
      maintenanceLogs: vehicle.maintenanceLogs.map((log: any) => ({
        id: log.id,
        maintenanceType: log.maintenanceType,
        description: log.description,
        cost: log.cost,
        performedAt: log.performedAt.toISOString(),
        completedAt: log.completedAt?.toISOString() || null
      })),
      fuelLogs: vehicle.fuelLogs.map((log: any) => ({
        id: log.id,
        quantityLiters: log.quantityLiters,
        totalCost: log.totalCost,
        filledAt: log.filledAt.toISOString()
      }))
    };
  }
}
