import { prisma } from '../../core/database/prisma.service';
import { logger } from '../../core/logger/logger.service';

export class AnalyticsService {
  async getDashboardStats(userId: string, roleId: string) {
    logger.info('Fetching dashboard stats', { userId, roleId });

    const [
      totalVehicles,
      availableVehicles,
      vehiclesOnTrip,
      vehiclesInMaintenance,
      totalDrivers,
      availableDrivers,
      driversOnTrip,
      totalTrips,
      activeTrips,
      completedTrips,
      todayTrips
    ] = await Promise.all([
      prisma.vehicle.count({ where: { deletedAt: null } }),
      prisma.vehicle.count({ where: { status: 'AVAILABLE', deletedAt: null } }),
      prisma.vehicle.count({ where: { status: 'ON_TRIP', deletedAt: null } }),
      prisma.vehicle.count({ where: { status: 'IN_MAINTENANCE', deletedAt: null } }),
      prisma.driver.count({ where: { deletedAt: null } }),
      prisma.driver.count({ where: { status: 'AVAILABLE', deletedAt: null } }),
      prisma.driver.count({ where: { status: 'ON_TRIP', deletedAt: null } }),
      prisma.trip.count(),
      prisma.trip.count({ where: { status: { in: ['DISPATCHED', 'IN_PROGRESS'] } } }),
      prisma.trip.count({ where: { status: 'COMPLETED' } }),
      prisma.trip.count({
        where: {
          scheduledStart: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      })
    ]);

    const fleetUtilization = totalVehicles > 0 
      ? ((vehiclesOnTrip / totalVehicles) * 100).toFixed(1)
      : '0.0';

    const driverUtilization = totalDrivers > 0
      ? ((driversOnTrip / totalDrivers) * 100).toFixed(1)
      : '0.0';

    return {
      fleet: {
        total: totalVehicles,
        available: availableVehicles,
        onTrip: vehiclesOnTrip,
        inMaintenance: vehiclesInMaintenance,
        utilization: parseFloat(fleetUtilization)
      },
      drivers: {
        total: totalDrivers,
        available: availableDrivers,
        onTrip: driversOnTrip,
        utilization: parseFloat(driverUtilization)
      },
      trips: {
        total: totalTrips,
        active: activeTrips,
        completed: completedTrips,
        today: todayTrips
      }
    };
  }

  async getFleetUtilization(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trips = await prisma.trip.findMany({
      where: {
        scheduledStart: { gte: startDate },
        status: { in: ['COMPLETED', 'IN_PROGRESS', 'DISPATCHED'] }
      },
      select: {
        scheduledStart: true,
        actualEnd: true,
        vehicle: { select: { registrationNumber: true } }
      }
    });

    const totalVehicles = await prisma.vehicle.count({ where: { deletedAt: null } });

    // Group by date
    const utilizationByDate: Record<string, number> = {};
    
    trips.forEach(trip => {
      const date = trip.scheduledStart.toISOString().split('T')[0];
      utilizationByDate[date] = (utilizationByDate[date] || 0) + 1;
    });

    const result = Object.entries(utilizationByDate).map(([date, count]) => ({
      date,
      utilization: totalVehicles > 0 ? (count / totalVehicles) * 100 : 0
    }));

    return result;
  }

  async getFuelEfficiency(vehicleId?: string) {
    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;

    const fuelLogs = await prisma.fuelLog.findMany({
      where,
      include: {
        vehicle: {
          select: {
            registrationNumber: true,
            currentOdometer: true
          }
        }
      },
      orderBy: { filledAt: 'desc' },
      take: 100
    });

    // Calculate efficiency (km per liter)
    const efficiencyData = fuelLogs.map(log => ({
      date: log.filledAt.toISOString().split('T')[0],
      vehicle: log.vehicle.registrationNumber,
      liters: log.quantityLiters,
      cost: log.totalCost
    }));

    return efficiencyData;
  }

  async getOperationalCosts(startDate: Date, endDate: Date) {
    const [fuelCosts, maintenanceCosts, otherExpenses] = await Promise.all([
      prisma.fuelLog.aggregate({
        where: { filledAt: { gte: startDate, lte: endDate } },
        _sum: { totalCost: true }
      }),
      prisma.maintenanceLog.aggregate({
        where: { performedAt: { gte: startDate, lte: endDate } },
        _sum: { cost: true }
      }),
      prisma.expense.aggregate({
        where: { 
          expenseDate: { gte: startDate, lte: endDate },
          category: { notIn: ['FUEL', 'MAINTENANCE'] }
        },
        _sum: { amount: true }
      })
    ]);

    return {
      fuel: fuelCosts._sum.totalCost || 0,
      maintenance: maintenanceCosts._sum.cost || 0,
      other: otherExpenses._sum.amount || 0,
      total: (fuelCosts._sum.totalCost || 0) + 
             (maintenanceCosts._sum.cost || 0) + 
             (otherExpenses._sum.amount || 0)
    };
  }

  async getRecentActivity(limit: number = 10) {
    const recentTrips = await prisma.trip.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tripNumber: true,
        status: true,
        origin: true,
        destination: true,
        scheduledStart: true,
        vehicle: { select: { registrationNumber: true } },
        driver: { select: { fullName: true } }
      }
    });

    return recentTrips.map(trip => ({
      id: trip.id,
      type: 'trip',
      title: `${trip.tripNumber}: ${trip.origin} → ${trip.destination}`,
      status: trip.status,
      timestamp: trip.scheduledStart.toISOString(),
      details: {
        vehicle: trip.vehicle.registrationNumber,
        driver: trip.driver.fullName
      }
    }));
  }
}
