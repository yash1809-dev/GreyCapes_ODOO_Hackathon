import { Router } from 'express';
import { VehicleController } from './vehicles.controller';
import { authenticate } from '../../core/security/auth.middleware';
import { requirePermission } from '../../core/security/rbac.middleware';

const router = Router();
const vehicleController = new VehicleController();

// All routes require authentication
router.use(authenticate);

// GET /api/vehicles/types - Get vehicle types (all authenticated users)
router.get('/types', vehicleController.getVehicleTypes);

// GET /api/vehicles/regions - Get regions (all authenticated users)
router.get('/regions', vehicleController.getRegions);

// GET /api/vehicles/available - Get available vehicles
router.get('/available', vehicleController.getAvailableVehicles);

// GET /api/vehicles - List vehicles
router.get(
  '/',
  requirePermission('vehicles', 'read'),
  vehicleController.getAllVehicles
);

// GET /api/vehicles/:id - Get vehicle by ID
router.get(
  '/:id',
  requirePermission('vehicles', 'read'),
  vehicleController.getVehicleById
);

// GET /api/vehicles/:id/details - Get vehicle details
router.get(
  '/:id/details',
  requirePermission('vehicles', 'read'),
  vehicleController.getVehicleDetails
);

// POST /api/vehicles - Create vehicle
router.post(
  '/',
  requirePermission('vehicles', 'create'),
  vehicleController.createVehicle
);

// PATCH /api/vehicles/:id - Update vehicle
router.patch(
  '/:id',
  requirePermission('vehicles', 'update'),
  vehicleController.updateVehicle
);

// DELETE /api/vehicles/:id - Delete vehicle
router.delete(
  '/:id',
  requirePermission('vehicles', 'delete'),
  vehicleController.deleteVehicle
);

// PATCH /api/vehicles/:id/status - Update vehicle status
router.patch(
  '/:id/status',
  requirePermission('vehicles', 'update'),
  vehicleController.updateVehicleStatus
);

export default router;
