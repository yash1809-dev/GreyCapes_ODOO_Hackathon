import { Request, Response, NextFunction } from 'express';
import { MaintenanceService } from './maintenance.service';
import { PrismaService } from '../../core/database/prisma.service';

const prisma = new PrismaService();
const maintenanceService = new MaintenanceService(prisma);

export const maintenanceController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await maintenanceService.getAll(req.query);
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const maintenance = await maintenanceService.create(req.body);
      res.status(201).json({ success: true, data: maintenance });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const maintenance = await maintenanceService.update(req.params.id, req.body);
      res.json({ success: true, data: maintenance });
    } catch (error) {
      next(error);
    }
  },
};
