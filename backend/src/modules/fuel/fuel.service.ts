import { PrismaService } from '../../core/database/prisma.service';
import { CreateFuelData } from './fuel.dto';

export class FuelService {
  constructor(private prisma: PrismaService) {}

  async getAll(filters?: any) {
    const { page = 1, limit = 20, vehicleId, tripId } = filters || {};
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (vehicleId) where.vehicleId = vehicleId;
    if (tripId) where.tripId = tripId;

    const [data, total] = await Promise.all([
      this.prisma.fuel.findMany({
        where,
        include: {
          vehicle: { include: { vehicleType: true } },
          trip: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fuel.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(data: CreateFuelData) {
    return this.prisma.fuel.create({
      data,
      include: {
        vehicle: { include: { vehicleType: true } },
        trip: true,
      },
    });
  }
}
