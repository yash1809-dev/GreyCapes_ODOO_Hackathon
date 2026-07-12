import { Request, Response, NextFunction } from 'express';
import { VehicleService } from './vehicles.service';
import { 
  CreateVehicleDTO, 
  UpdateVehicleDTO, 
  VehicleFiltersDTO,
  UpdateVehicleStatusDTO 
} from './vehicles.dto';
import { ResponseBuilder } from '../../shared/dto/response.dto';
import { AuthRequest } from '../../core/security/auth.middleware';

export class VehicleController {
  private vehicleService: VehicleService;

  constructor() {
    this.vehicleService = new VehicleService();
  }

  /**
   * GET /api/vehicles
   * Get all vehicles with filters and pagination
   */
  getAllVehicles = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters: VehicleFiltersDTO = {
        status: req.query.status as any,
        vehicleTypeId: req.query.vehicleTypeId as string,
        regionId: req.query.regionId as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };

      const result = await this.vehicleService.getAllVehicles(filters);

      res.json(ResponseBuilder.success(result.data, undefined, result.pagination));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/vehicles/:id
   * Get vehicle by ID
   */
  getVehicleById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const vehicle = await this.vehicleService.getVehicleById(id);

      res.json(ResponseBuilder.success(vehicle));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/vehicles/:id/details
   * Get vehicle with full history
   */
  getVehicleDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const vehicle = await this.vehicleService.getVehicleDetails(id);

      res.json(ResponseBuilder.success(vehicle));
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/vehicles
   * Create new vehicle
   */
  createVehicle = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data: CreateVehicleDTO = req.body;
      const userId = req.user.userId;

      const vehicle = await this.vehicleService.createVehicle(data, userId);

      res.status(201).json(ResponseBuilder.success(vehicle, 'Vehicle created successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/vehicles/:id
   * Update vehicle
   */
  updateVehicle = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateVehicleDTO = req.body;
      const userId = req.user.userId;

      const vehicle = await this.vehicleService.updateVehicle(id, data, userId);

      res.json(ResponseBuilder.success(vehicle, 'Vehicle updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/vehicles/:id
   * Delete vehicle (soft delete)
   */
  deleteVehicle = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      await this.vehicleService.deleteVehicle(id, userId);

      res.json(ResponseBuilder.success(null, 'Vehicle deleted successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/vehicles/:id/status
   * Update vehicle status
   */
  updateVehicleStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateVehicleStatusDTO = req.body;
      const userId = req.user.userId;

      const vehicle = await this.vehicleService.updateVehicleStatus(id, data, userId);

      res.json(ResponseBuilder.success(vehicle, 'Vehicle status updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/vehicles/types
   * Get all vehicle types
   */
  getVehicleTypes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const types = await this.vehicleService.getVehicleTypes();

      res.json(ResponseBuilder.success(types));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/vehicles/regions
   * Get all regions
   */
  getRegions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const regions = await this.vehicleService.getRegions();

      res.json(ResponseBuilder.success(regions));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/vehicles/available
   * Get available vehicles for dispatch
   */
  getAvailableVehicles = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const regionId = req.query.regionId as string;

      const vehicles = await this.vehicleService.getAvailableVehicles(regionId);

      res.json(ResponseBuilder.success(vehicles));
    } catch (error) {
      next(error);
    }
  };
}
