import { Request, Response, NextFunction } from 'express';
import { FuelService } from './fuel.service';
import { PrismaService } from '../../core/database/prisma.service';

const prisma = new PrismaService();
const fuelService = new FuelService(prisma);

export const fuelController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await fuelService.getAll(req.query);
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const fuel = await fuelService.create(req.body);
      res.status(201).json({ success: true, data: fuel });
    } catch (error) {
      next(error);
    }
  },
};
