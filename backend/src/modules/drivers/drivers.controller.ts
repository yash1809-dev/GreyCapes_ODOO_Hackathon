import { Request, Response, NextFunction } from 'express';
import { DriverService } from './drivers.service';
import { 
  CreateDriverDTO, 
  UpdateDriverDTO, 
  DriverFiltersDTO,
  UpdateDriverStatusDTO 
} from './drivers.dto';
import { ResponseBuilder } from '../../shared/dto/response.dto';
import { AuthRequest } from '../../core/security/auth.middleware';

export class DriverController {
  private driverService: DriverService;

  constructor() {
    this.driverService = new DriverService();
  }

  /**
   * GET /api/drivers
   */
  getAllDrivers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters: DriverFiltersDTO = {
        status: req.query.status as any,
        search: req.query.search as string,
        expiringLicenses: req.query.expiringLicenses === 'true',
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };

      const result = await this.driverService.getAllDrivers(filters);

      res.json(ResponseBuilder.success(result.data, undefined, result.pagination));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/drivers/:id
   */
  getDriverById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const driver = await this.driverService.getDriverById(id);
      res.json(ResponseBuilder.success(driver));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/drivers/:id/details
   */
  getDriverDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const driver = await this.driverService.getDriverDetails(id);
      res.json(ResponseBuilder.success(driver));
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/drivers
   */
  createDriver = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data: CreateDriverDTO = req.body;
      const userId = req.user.userId;
      const driver = await this.driverService.createDriver(data, userId);
      res.status(201).json(ResponseBuilder.success(driver, 'Driver created successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/drivers/:id
   */
  updateDriver = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateDriverDTO = req.body;
      const userId = req.user.userId;
      const driver = await this.driverService.updateDriver(id, data, userId);
      res.json(ResponseBuilder.success(driver, 'Driver updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/drivers/:id
   */
  deleteDriver = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      await this.driverService.deleteDriver(id, userId);
      res.json(ResponseBuilder.success(null, 'Driver deleted successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/drivers/:id/status
   */
  updateDriverStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateDriverStatusDTO = req.body;
      const userId = req.user.userId;
      const driver = await this.driverService.updateDriverStatus(id, data, userId);
      res.json(ResponseBuilder.success(driver, 'Driver status updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/drivers/available
   */
  getAvailableDrivers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const drivers = await this.driverService.getAvailableDrivers();
      res.json(ResponseBuilder.success(drivers));
    } catch (error) {
      next(error);
    }
  };
}
