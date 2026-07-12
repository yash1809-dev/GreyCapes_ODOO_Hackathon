import { Request, Response, NextFunction } from 'express';
import { ExpensesService } from './expenses.service';
import { prisma } from '../../core/database/prisma.service';

const expensesService = new ExpensesService(prisma);

export const expensesController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await expensesService.getAll(req.query);
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const expense = await expensesService.create(req.body);
      res.status(201).json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  },
};
