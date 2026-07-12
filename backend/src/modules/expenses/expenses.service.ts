import { PrismaService } from '../../core/database/prisma.service';
import { CreateExpenseData } from './expenses.dto';

export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async getAll(filters?: any) {
    const { page = 1, limit = 20, tripId, category } = filters || {};
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (tripId) where.tripId = tripId;
    if (category) where.category = category;

    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: {
          trip: {
            include: {
              vehicle: { include: { vehicleType: true } },
              driver: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(data: CreateExpenseData) {
    return this.prisma.expense.create({
      data,
      include: {
        trip: {
          include: {
            vehicle: { include: { vehicleType: true } },
            driver: true,
          },
        },
      },
    });
  }
}
