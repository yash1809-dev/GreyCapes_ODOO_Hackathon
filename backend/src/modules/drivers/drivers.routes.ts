import { Router } from 'express';
import { DriverController } from './drivers.controller';
import { authenticate } from '../../core/security/auth.middleware';
import { requirePermission } from '../../core/security/rbac.middleware';

const router = Router();
const driverController = new DriverController();

// All routes require authentication
router.use(authenticate);

// GET /api/drivers/available - Get available drivers
router.get('/available', driverController.getAvailableDrivers);

// GET /api/drivers - List drivers
router.get(
  '/',
  requirePermission('drivers', 'read'),
  driverController.getAllDrivers
);

// GET /api/drivers/:id - Get driver by ID
router.get(
  '/:id',
  requirePermission('drivers', 'read'),
  driverController.getDriverById
);

// GET /api/drivers/:id/details - Get driver details
router.get(
  '/:id/details',
  requirePermission('drivers', 'read'),
  driverController.getDriverDetails
);

// POST /api/drivers - Create driver
router.post(
  '/',
  requirePermission('drivers', 'create'),
  driverController.createDriver
);

// PATCH /api/drivers/:id - Update driver
router.patch(
  '/:id',
  requirePermission('drivers', 'update'),
  driverController.updateDriver
);

// DELETE /api/drivers/:id - Delete driver
router.delete(
  '/:id',
  requirePermission('drivers', 'delete'),
  driverController.deleteDriver
);

// PATCH /api/drivers/:id/status - Update driver status
router.patch(
  '/:id/status',
  requirePermission('drivers', 'update'),
  driverController.updateDriverStatus
);

export default router;
