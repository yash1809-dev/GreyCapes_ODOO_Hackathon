import { prisma } from '../../core/database/prisma.service';
import { VehicleStatus, Prisma } from '@prisma/client';
import { VehicleFiltersDTO } from './vehicles.dto';

export class VehicleRepository {
  /**
   * Find all vehicles with filters and pagination
   */
  async findAll(filters: VehicleFiltersDTO, prismaClient = prisma) {
    const { status, vehicleTypeId, regionId, search, page = 1, limit = 20 } = filters;

    const where: Prisma.VehicleWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(vehicleTypeId && { vehicleTypeId }),
      ...(regionId && { regionId }),
      ...(search && {
        OR: [
          { registrationNumber: { contains: search, mode: 'insensitive' } },
          { vehicleType: { name: { contains: search, mode: 'insensitive' } } }
        ]
      })
    };

    const [vehicles, total] = await Promise.all([
      prismaClient.vehicle.findMany({
        where,
        include: {
          vehicleType: true,
          region: true
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prismaClient.vehicle.count({ where })
    ]);

    return { vehicles, total };
  }

  /**
   * Find vehicle by ID
   */
  async findById(id: string, prismaClient = prisma) {
    return prismaClient.vehicle.findFirst({
      where: { id, deletedAt: null },
      include: {
        vehicleType: true,
        region: true
      }
    });
  }

  /**
   * Find vehicle by ID with full details (trips, maintenance, fuel logs)
   */
  async findByIdWithDetails(id: string, prismaClient = prisma) {
    return prismaClient.vehicle.findFirst({
      where: { id, deletedAt: null },
      include: {
        vehicleType: true,
        region: true,
        trips: {
          take: 10,
          orderBy: { scheduledStart: 'desc' },
          select: {
            id: true,
            tripNumber: true,
            status: true,
            origin: true,
            destination: true,
            scheduledStart: true,
            actualStart: true,
            actualEnd: true
          }
        },
        maintenanceLogs: {
          take: 10,
          orderBy: { performedAt: 'desc' },
          select: {
            id: true,
            maintenanceType: true,
            description: true,
            cost: true,
            performedAt: true,
            completedAt: true
          }
        },
        fuelLogs: {
          take: 10,
          orderBy: { filledAt: 'desc' },
          select: {
            id: true,
            quantityLiters: true,
            totalCost: true,
            filledAt: true
          }
        }
      }
    });
  }

  /**
   * Find vehicle by registration number
   */
  async findByRegistrationNumber(
    registrationNumber: string,
    prismaClient = prisma
  ) {
    return prismaClient.vehicle.findFirst({
      where: {
        registrationNumber,
        deletedAt: null
      }
    });
  }

  /**
   * Create vehicle
   */
  async create(data: Prisma.VehicleCreateInput, prismaClient = prisma) {
    return prismaClient.vehicle.create({
      data,
      include: {
        vehicleType: true,
        region: true
      }
    });
  }

  /**
   * Update vehicle
   */
  async update(
    id: string,
    data: Prisma.VehicleUpdateInput,
    prismaClient = prisma
  ) {
    return prismaClient.vehicle.update({
      where: { id },
      data,
      include: {
        vehicleType: true,
        region: true
      }
    });
  }

  /**
   * Soft delete vehicle
   */
  async softDelete(id: string, prismaClient = prisma) {
    return prismaClient.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  /**
   * Update vehicle status
   */
  async updateStatus(
    id: string,
    status: VehicleStatus,
    prismaClient = prisma
  ) {
    return prismaClient.vehicle.update({
      where: { id },
      data: { status },
      include: {
        vehicleType: true,
        region: true
      }
    });
  }

  /**
   * Get all vehicle types
   */
  async findAllVehicleTypes(prismaClient = prisma) {
    return prismaClient.vehicleType.findMany({
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Get all regions
   */
  async findAllRegions(prismaClient = prisma) {
    return prismaClient.region.findMany({
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Get available vehicles for dispatch
   */
  async findAvailableVehicles(regionId?: string, prismaClient = prisma) {
    return prismaClient.vehicle.findMany({
      where: {
        status: VehicleStatus.AVAILABLE,
        deletedAt: null,
        ...(regionId && { regionId })
      },
      include: {
        vehicleType: true,
        region: true
      },
      orderBy: { registrationNumber: 'asc' }
    });
  }
}
