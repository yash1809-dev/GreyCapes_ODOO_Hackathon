import { Request, Response, NextFunction } from 'express';
import { TripService } from './trips.service';
import { CreateTripDTO, DispatchTripDTO, StartTripDTO, CompleteTripDTO, CancelTripDTO, TripFiltersDTO } from './trips.dto';
import { ResponseBuilder } from '../../shared/dto/response.dto';
import { AuthRequest } from '../../core/security/auth.middleware';

export class TripController {
  private tripService: TripService;

  constructor() {
    this.tripService = new TripService();
  }

  getAllTrips = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters: TripFiltersDTO = {
        status: req.query.status as any,
        vehicleId: req.query.vehicleId as string,
        driverId: req.query.driverId as string,
        regionId: req.query.regionId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };
      const result = await this.tripService.getAllTrips(filters);
      res.json(ResponseBuilder.success(result.data, undefined, result.pagination));
    } catch (error) {
      next(error);
    }
  };

  getTripById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const trip = await this.tripService.getTripById(id);
      res.json(ResponseBuilder.success(trip));
    } catch (error) {
      next(error);
    }
  };

  getTripDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const trip = await this.tripService.getTripDetails(id);
      res.json(ResponseBuilder.success(trip));
    } catch (error) {
      next(error);
    }
  };

  createTrip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateTripDTO = req.body;
      const userId = req.user.userId;
      const trip = await this.tripService.createTrip(data, userId);
      res.status(201).json(ResponseBuilder.success(trip, 'Trip created successfully'));
    } catch (error) {
      next(error);
    }
  };

  dispatchTrip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data: DispatchTripDTO = req.body;
      const userId = req.user.userId;
      const trip = await this.tripService.dispatchTrip(id, data, userId);
      res.json(ResponseBuilder.success(trip, 'Trip dispatched successfully'));
    } catch (error) {
      next(error);
    }
  };

  startTrip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data: StartTripDTO = req.body;
      const userId = req.user.userId;
      const trip = await this.tripService.startTrip(id, data, userId);
      res.json(ResponseBuilder.success(trip, 'Trip started successfully'));
    } catch (error) {
      next(error);
    }
  };

  completeTrip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data: CompleteTripDTO = req.body;
      const userId = req.user.userId;
      const trip = await this.tripService.completeTrip(id, data, userId);
      res.json(ResponseBuilder.success(trip, 'Trip completed successfully'));
    } catch (error) {
      next(error);
    }
  };

  cancelTrip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data: CancelTripDTO = req.body;
      const userId = req.user.userId;
      const trip = await this.tripService.cancelTrip(id, data, userId);
      res.json(ResponseBuilder.success(trip, 'Trip cancelled successfully'));
    } catch (error) {
      next(error);
    }
  };
}
