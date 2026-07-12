import { Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';
import { ResponseBuilder } from '../../shared/dto/response.dto';
import { AuthRequest } from '../../core/security/auth.middleware';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.userId;
      const roleId = req.user.roleId;
      const stats = await this.analyticsService.getDashboardStats(userId, roleId);
      res.json(ResponseBuilder.success(stats));
    } catch (error) {
      next(error);
    }
  };

  getFleetUtilization = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const data = await this.analyticsService.getFleetUtilization(days);
      res.json(ResponseBuilder.success(data));
    } catch (error) {
      next(error);
    }
  };

  getFuelEfficiency = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicleId = req.query.vehicleId as string;
      const data = await this.analyticsService.getFuelEfficiency(vehicleId);
      res.json(ResponseBuilder.success(data));
    } catch (error) {
      next(error);
    }
  };

  getOperationalCosts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string)
        : new Date(new Date().setDate(new Date().getDate() - 30));
      const endDate = req.query.endDate 
        ? new Date(req.query.endDate as string)
        : new Date();
      
      const costs = await this.analyticsService.getOperationalCosts(startDate, endDate);
      res.json(ResponseBuilder.success(costs));
    } catch (error) {
      next(error);
    }
  };

  getRecentActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activity = await this.analyticsService.getRecentActivity(limit);
      res.json(ResponseBuilder.success(activity));
    } catch (error) {
      next(error);
    }
  };
}
