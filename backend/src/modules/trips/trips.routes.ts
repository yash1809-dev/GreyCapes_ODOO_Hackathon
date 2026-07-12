import { Router } from 'express';
import { TripController } from './trips.controller';
import { authenticate } from '../../core/security/auth.middleware';
import { requirePermission } from '../../core/security/rbac.middleware';

const router = Router();
const tripController = new TripController();

router.use(authenticate);

router.get('/', requirePermission('trips', 'read'), tripController.getAllTrips);
router.get('/:id', requirePermission('trips', 'read'), tripController.getTripById);
router.get('/:id/details', requirePermission('trips', 'read'), tripController.getTripDetails);
router.post('/', requirePermission('trips', 'create'), tripController.createTrip);
router.post('/:id/dispatch', requirePermission('trips', 'dispatch'), tripController.dispatchTrip);
router.post('/:id/start', requirePermission('trips', 'dispatch'), tripController.startTrip);
router.post('/:id/complete', requirePermission('trips', 'dispatch'), tripController.completeTrip);
router.post('/:id/cancel', requirePermission('trips', 'dispatch'), tripController.cancelTrip);

export default router;
