import { TripRepository } from './trips.repository';
import { VehicleRepository } from '../vehicles/vehicles.repository';
import { DriverRepository } from '../drivers/drivers.repository';
import { CreateTripDTO, DispatchTripDTO, StartTripDTO, CompleteTripDTO, CancelTripDTO, TripFiltersDTO, TripResponseDTO, TripDetailResponseDTO } from './trips.dto';
import { NotFoundError, ConflictError, ValidationError } from '../../core/errors/app.errors';
import { tripStateMachine } from '../../core/business-rules/state-machines/trip.state-machine';
import { vehicleStateMachine } from '../../core/business-rules/state-machines/vehicle.state-machine';
import { driverStateMachine } from '../../core/business-rules/state-machines/driver.state-machine';
import { domainEvents } from '../../core/events/event.emitter';
import { DomainEvent } from '../../core/events/event.types';
import { logger } from '../../core/logger/logger.service';
import { TransactionManager } from '../../core/database/transaction.manager';
import { TripStatus, VehicleStatus, DriverStatus } from '@prisma/client';

export class TripService {
  private repository: TripRepository;
  private vehicleRepository: VehicleRepository;
  private driverRepository: DriverRepository;
  private transactionManager: TransactionManager;

  constructor() {
    this.repository = new TripRepository();
    this.vehicleRepository = new VehicleRepository();
    this.driverRepository = new DriverRepository();
    this.transactionManager = new TransactionManager();
  }

  async getAllTrips(filters: TripFiltersDTO) {
    const { trips, total } = await this.repository.findAll(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    return {
      data: trips.map(this.mapToResponseDTO),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async getTripById(id: string): Promise<TripResponseDTO> {
    const trip = await this.repository.findById(id);
    if (!trip) throw new NotFoundError('Trip');
    return this.mapToResponseDTO(trip);
  }

  async getTripDetails(id: string): Promise<TripDetailResponseDTO> {
    const trip = await this.repository.findByIdWithDetails(id);
    if (!trip) throw new NotFoundError('Trip');
    return this.mapToDetailResponseDTO(trip);
  }

  async createTrip(data: CreateTripDTO, userId: string): Promise<TripResponseDTO> {
    logger.info('Creating trip', { data, userId });

    return this.transactionManager.executeInTransaction(async (tx) => {
      // Validate vehicle exists
      const vehicle = await this.vehicleRepository.findById(data.vehicleId, tx);
      if (!vehicle) throw new NotFoundError('Vehicle');

      // Validate driver exists
      const driver = await this.driverRepository.findById(data.driverId, tx);
      if (!driver) throw new NotFoundError('Driver');

      // Generate trip number
      const tripNumber = await this.repository.generateTripNumber(tx);

      const trip = await this.repository.create({
        tripNumber,
        origin: data.origin,
        destination: data.destination,
        scheduledStart: new Date(data.scheduledStart),
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
        cargoWeight: data.cargoWeight,
        notes: data.notes,
        vehicle: { connect: { id: data.vehicleId } },
        driver: { connect: { id: data.driverId } },
        region: data.regionId ? { connect: { id: data.regionId } } : undefined,
        creator: { connect: { id: userId } }
      }, tx);

      // Create history entry
      await this.repository.createHistory({
        status: TripStatus.DRAFT,
        changedBy: userId,
        notes: 'Trip created',
        trip: { connect: { id: trip.id } }
      }, tx);

      logger.info('Trip created successfully', { tripId: trip.id });
      domainEvents.emitEvent(DomainEvent.TRIP_CREATED, { tripId: trip.id, tripNumber: trip.tripNumber }, userId);

      return this.mapToResponseDTO(trip);
    });
  }

  async dispatchTrip(id: string, data: DispatchTripDTO, userId: string): Promise<TripResponseDTO> {
    logger.info('Dispatching trip', { tripId: id, userId });

    return this.transactionManager.executeInTransaction(async (tx) => {
      const trip = await this.repository.findById(id, tx);
      if (!trip) throw new NotFoundError('Trip');

      // Validate state transition
      if (!tripStateMachine.canTransition(trip.status, TripStatus.DISPATCHED)) {
        throw new ValidationError(`Cannot dispatch trip from ${trip.status} state`);
      }

      // Business rules validation
      const vehicle = await this.vehicleRepository.findById(trip.vehicleId, tx);
      if (vehicle.status !== VehicleStatus.AVAILABLE) {
        throw new ConflictError(`Vehicle ${vehicle.registrationNumber} is not available`);
      }

      const driver = await this.driverRepository.findById(trip.driverId, tx);
      if (driver.status !== DriverStatus.AVAILABLE) {
        throw new ConflictError(`Driver ${driver.fullName} is not available`);
      }

      const licenseExpiry = new Date(driver.licenseExpiry);
      if (licenseExpiry < new Date()) {
        throw new ValidationError(`Driver ${driver.fullName}'s license has expired`);
      }

      // Update trip status
      const updatedTrip = await this.repository.update(id, {
        status: TripStatus.DISPATCHED,
        actualStart: new Date()
      }, tx);

      // Update vehicle status
      await this.vehicleRepository.updateStatus(trip.vehicleId, VehicleStatus.ON_TRIP, tx);

      // Update driver status
      await this.driverRepository.updateStatus(trip.driverId, DriverStatus.ON_TRIP, tx);

      // Create history entry
      await this.repository.createHistory({
        status: TripStatus.DISPATCHED,
        changedBy: userId,
        notes: data.notes || 'Trip dispatched',
        trip: { connect: { id } }
      }, tx);

      logger.info('Trip dispatched successfully', { tripId: id });
      domainEvents.emitEvent(DomainEvent.TRIP_DISPATCHED, { 
        tripId: id, 
        vehicleId: trip.vehicleId, 
        driverId: trip.driverId 
      }, userId);

      return this.mapToResponseDTO(updatedTrip);
    });
  }

  async startTrip(id: string, data: StartTripDTO, userId: string): Promise<TripResponseDTO> {
    return this.transactionManager.executeInTransaction(async (tx) => {
      const trip = await this.repository.findById(id, tx);
      if (!trip) throw new NotFoundError('Trip');

      if (!tripStateMachine.canTransition(trip.status, TripStatus.IN_PROGRESS)) {
        throw new ValidationError(`Cannot start trip from ${trip.status} state`);
      }

      const updatedTrip = await this.repository.update(id, {
        status: TripStatus.IN_PROGRESS
      }, tx);

      await this.repository.createHistory({
        status: TripStatus.IN_PROGRESS,
        changedBy: userId,
        notes: data.notes || 'Trip started',
        trip: { connect: { id } }
      }, tx);

      domainEvents.emitEvent(DomainEvent.TRIP_STARTED, { tripId: id }, userId);
      return this.mapToResponseDTO(updatedTrip);
    });
  }

  async completeTrip(id: string, data: CompleteTripDTO, userId: string): Promise<TripResponseDTO> {
    logger.info('Completing trip', { tripId: id, userId });

    return this.transactionManager.executeInTransaction(async (tx) => {
      const trip = await this.repository.findById(id, tx);
      if (!trip) throw new NotFoundError('Trip');

      if (!tripStateMachine.canTransition(trip.status, TripStatus.COMPLETED)) {
        throw new ValidationError(`Cannot complete trip from ${trip.status} state`);
      }

      // Update trip
      const updatedTrip = await this.repository.update(id, {
        status: TripStatus.COMPLETED,
        actualEnd: new Date(data.actualEnd),
        distanceKm: data.distanceKm
      }, tx);

      // Update vehicle - set to AVAILABLE and update odometer
      await this.vehicleRepository.update(trip.vehicleId, {
        status: VehicleStatus.AVAILABLE,
        currentOdometer: data.finalOdometer
      }, tx);

      // Update driver status
      await this.driverRepository.updateStatus(trip.driverId, DriverStatus.AVAILABLE, tx);

      // Create history
      await this.repository.createHistory({
        status: TripStatus.COMPLETED,
        changedBy: userId,
        notes: data.notes || 'Trip completed',
        trip: { connect: { id } }
      }, tx);

      logger.info('Trip completed successfully', { tripId: id });
      domainEvents.emitEvent(DomainEvent.TRIP_COMPLETED, { 
        tripId: id, 
        vehicleId: trip.vehicleId, 
        driverId: trip.driverId,
        distanceKm: data.distanceKm
      }, userId);

      return this.mapToResponseDTO(updatedTrip);
    });
  }

  async cancelTrip(id: string, data: CancelTripDTO, userId: string): Promise<TripResponseDTO> {
    return this.transactionManager.executeInTransaction(async (tx) => {
      const trip = await this.repository.findById(id, tx);
      if (!trip) throw new NotFoundError('Trip');

      if (!tripStateMachine.canTransition(trip.status, TripStatus.CANCELLED)) {
        throw new ValidationError(`Cannot cancel trip from ${trip.status} state`);
      }

      const updatedTrip = await this.repository.update(id, {
        status: TripStatus.CANCELLED
      }, tx);

      // Free up resources if they were allocated
      if (trip.status === TripStatus.DISPATCHED || trip.status === TripStatus.IN_PROGRESS) {
        await this.vehicleRepository.updateStatus(trip.vehicleId, VehicleStatus.AVAILABLE, tx);
        await this.driverRepository.updateStatus(trip.driverId, DriverStatus.AVAILABLE, tx);
      }

      await this.repository.createHistory({
        status: TripStatus.CANCELLED,
        changedBy: userId,
        notes: data.reason,
        trip: { connect: { id } }
      }, tx);

      domainEvents.emitEvent(DomainEvent.TRIP_CANCELLED, { tripId: id }, userId);
      return this.mapToResponseDTO(updatedTrip);
    });
  }

  private mapToResponseDTO(trip: any): TripResponseDTO {
    return {
      id: trip.id,
      tripNumber: trip.tripNumber,
      status: trip.status,
      origin: trip.origin,
      destination: trip.destination,
      scheduledStart: trip.scheduledStart.toISOString(),
      actualStart: trip.actualStart?.toISOString() || null,
      scheduledEnd: trip.scheduledEnd?.toISOString() || null,
      actualEnd: trip.actualEnd?.toISOString() || null,
      distanceKm: trip.distanceKm,
      cargoWeight: trip.cargoWeight,
      notes: trip.notes,
      vehicle: {
        id: trip.vehicle.id,
        registrationNumber: trip.vehicle.registrationNumber,
        vehicleType: { name: trip.vehicle.vehicleType.name }
      },
      driver: {
        id: trip.driver.id,
        fullName: trip.driver.fullName,
        licenseNumber: trip.driver.licenseNumber
      },
      region: trip.region ? {
        id: trip.region.id,
        name: trip.region.name,
        code: trip.region.code
      } : null,
      createdBy: {
        id: trip.creator.id,
        fullName: trip.creator.fullName
      },
      createdAt: trip.createdAt.toISOString(),
      updatedAt: trip.updatedAt.toISOString()
    };
  }

  private mapToDetailResponseDTO(trip: any): TripDetailResponseDTO {
    return {
      ...this.mapToResponseDTO(trip),
      history: trip.history.map((h: any) => ({
        id: h.id,
        status: h.status,
        changedBy: h.changedBy,
        changedAt: h.changedAt.toISOString(),
        notes: h.notes
      })),
      fuelLogs: trip.fuelLogs.map((f: any) => ({
        id: f.id,
        quantityLiters: f.quantityLiters,
        totalCost: f.totalCost,
        filledAt: f.filledAt.toISOString()
      })),
      expenses: trip.expenses.map((e: any) => ({
        id: e.id,
        category: e.category,
        amount: e.amount,
        description: e.description,
        expenseDate: e.expenseDate.toISOString()
      }))
    };
  }
}
