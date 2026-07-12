import { prisma } from '../../core/database/prisma.service';
import { DriverStatus, Prisma } from '@prisma/client';
import { DriverFiltersDTO } from './drivers.dto';

export class DriverRepository {
  /**
   * Find all drivers with filters and pagination
   */
  async findAll(filters: DriverFiltersDTO, prismaClient = prisma) {
    const { status, search, expiringLicenses, page = 1, limit = 20 } = filters;

    const where: Prisma.DriverWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { licenseNumber: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(expiringLicenses && {
        licenseExpiry: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
          gte: new Date() // Not yet expired
        }
      })
    };

    const [drivers, total] = await Promise.all([
      prismaClient.driver.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prismaClient.driver.count({ where })
    ]);

    return { drivers, total };
  }

  /**
   * Find driver by ID
   */
  async findById(id: string, prismaClient = prisma) {
    return prismaClient.driver.findFirst({
      where: { id, deletedAt: null }
    });
  }

  /**
   * Find driver by ID with trip details
   */
  async findByIdWithDetails(id: string, prismaClient = prisma) {
    return prismaClient.driver.findFirst({
      where: { id, deletedAt: null },
      include: {
        trips: {
          take: 20,
          orderBy: { scheduledStart: 'desc' },
          select: {
            id: true,
            tripNumber: true,
            status: true,
            origin: true,
            destination: true,
            scheduledStart: true,
            actualStart: true,
            actualEnd: true,
            vehicle: {
              select: {
                registrationNumber: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Find driver by license number
   */
  async findByLicenseNumber(licenseNumber: string, prismaClient = prisma) {
    return prismaClient.driver.findFirst({
      where: {
        licenseNumber,
        deletedAt: null
      }
    });
  }

  /**
   * Create driver
   */
  async create(data: Prisma.DriverCreateInput, prismaClient = prisma) {
    return prismaClient.driver.create({
      data
    });
  }

  /**
   * Update driver
   */
  async update(
    id: string,
    data: Prisma.DriverUpdateInput,
    prismaClient = prisma
  ) {
    return prismaClient.driver.update({
      where: { id },
      data
    });
  }

  /**
   * Soft delete driver
   */
  async softDelete(id: string, prismaClient = prisma) {
    return prismaClient.driver.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  /**
   * Update driver status
   */
  async updateStatus(
    id: string,
    status: DriverStatus,
    prismaClient = prisma
  ) {
    return prismaClient.driver.update({
      where: { id },
      data: { status }
    });
  }

  /**
   * Get available drivers for dispatch
   */
  async findAvailableDrivers(prismaClient = prisma) {
    return prismaClient.driver.findMany({
      where: {
        status: DriverStatus.AVAILABLE,
        deletedAt: null,
        licenseExpiry: {
          gte: new Date() // License not expired
        }
      },
      orderBy: { fullName: 'asc' }
    });
  }

  /**
   * Get driver trip stats
   */
  async getDriverStats(driverId: string, prismaClient = prisma) {
    const [totalTrips, completedTrips, activeTrips] = await Promise.all([
      prismaClient.trip.count({
        where: { driverId }
      }),
      prismaClient.trip.count({
        where: { driverId, status: 'COMPLETED' }
      }),
      prismaClient.trip.count({
        where: {
          driverId,
          status: {
            in: ['DISPATCHED', 'IN_PROGRESS']
          }
        }
      })
    ]);

    return { totalTrips, completedTrips, activeTrips };
  }
}
