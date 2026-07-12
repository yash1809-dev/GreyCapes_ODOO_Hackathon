import { PrismaService } from '../../core/database/prisma.service';
import { CreateMaintenanceData, UpdateMaintenanceData } from './maintenance.dto';
import { logger } from '../../core/logger/logger.service';

export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  async getAll(filters?: any) {
    const { page = 1, limit = 20, vehicleId, status } = filters || {};
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (vehicleId) where.vehicleId = vehicleId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.maintenance.findMany({
        where,
        include: { vehicle: { include: { vehicleType: true } } },
        skip,
        take: limit,
        orderBy: { scheduledDate: 'desc' },
      }),
      this.prisma.maintenance.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: CreateMaintenanceData) {
    logger.info('Creating maintenance record', { data });
    return this.prisma.maintenance.create({
      data,
      include: { vehicle: { include: { vehicleType: true } } },
    });
  }

  async update(id: string, data: UpdateMaintenanceData) {
    return this.prisma.maintenance.update({
      where: { id },
      data,
      include: { vehicle: { include: { vehicleType: true } } },
    });
  }
}
