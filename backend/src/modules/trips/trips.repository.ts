import { prisma } from '../../core/database/prisma.service';
import { TripStatus, Prisma } from '@prisma/client';
import { TripFiltersDTO } from './trips.dto';

export class TripRepository {
  async findAll(filters: TripFiltersDTO, prismaClient = prisma) {
    const { status, vehicleId, driverId, regionId, startDate, endDate, search, page = 1, limit = 20 } = filters;

    const where: Prisma.TripWhereInput = {
      ...(status && { status }),
      ...(vehicleId && { vehicleId }),
      ...(driverId && { driverId }),
      ...(regionId && { regionId }),
      ...(startDate && { scheduledStart: { gte: new Date(startDate) } }),
      ...(endDate && { scheduledStart: { lte: new Date(endDate) } }),
      ...(search && {
        OR: [
          { tripNumber: { contains: search, mode: 'insensitive' } },
          { origin: { contains: search, mode: 'insensitive' } },
          { destination: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [trips, total] = await Promise.all([
      prismaClient.trip.findMany({
        where,
        include: {
          vehicle: { include: { vehicleType: true } },
          driver: true,
          region: true,
          creator: { select: { id: true, fullName: true } }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { scheduledStart: 'desc' }
      }),
      prismaClient.trip.count({ where })
    ]);

    return { trips, total };
  }

  async findById(id: string, prismaClient = prisma) {
    return prismaClient.trip.findUnique({
      where: { id },
      include: {
        vehicle: { include: { vehicleType: true } },
        driver: true,
        region: true,
        creator: { select: { id: true, fullName: true } }
      }
    });
  }

  async findByIdWithDetails(id: string, prismaClient = prisma) {
    return prismaClient.trip.findUnique({
      where: { id },
      include: {
        vehicle: { include: { vehicleType: true } },
        driver: true,
        region: true,
        creator: { select: { id: true, fullName: true } },
        history: { orderBy: { changedAt: 'desc' } },
        fuelLogs: { orderBy: { filledAt: 'desc' } },
        expenses: { orderBy: { expenseDate: 'desc' } }
      }
    });
  }

  async create(data: Prisma.TripCreateInput, prismaClient = prisma) {
    return prismaClient.trip.create({
      data,
      include: {
        vehicle: { include: { vehicleType: true } },
        driver: true,
        region: true,
        creator: { select: { id: true, fullName: true } }
      }
    });
  }

  async update(id: string, data: Prisma.TripUpdateInput, prismaClient = prisma) {
    return prismaClient.trip.update({
      where: { id },
      data,
      include: {
        vehicle: { include: { vehicleType: true } },
        driver: true,
        region: true,
        creator: { select: { id: true, fullName: true } }
      }
    });
  }

  async createHistory(data: Prisma.TripHistoryCreateInput, prismaClient = prisma) {
    return prismaClient.tripHistory.create({ data });
  }

  async generateTripNumber(prismaClient = prisma): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const prefix = `TRP-${year}${month}`;

    const lastTrip = await prismaClient.trip.findFirst({
      where: { tripNumber: { startsWith: prefix } },
      orderBy: { createdAt: 'desc' }
    });

    let sequence = 1;
    if (lastTrip) {
      const lastSequence = parseInt(lastTrip.tripNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }
}
