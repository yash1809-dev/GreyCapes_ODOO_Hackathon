import { Router } from 'express';
import { maintenanceController } from './maintenance.controller';
import { authenticate } from '../../core/security/auth.middleware';
import { validateRequest } from '../../core/validation/validation.middleware';
import { CreateMaintenanceSchema, UpdateMaintenanceSchema } from './maintenance.dto';

const router = Router();

router.get('/', authenticate, maintenanceController.getAll);
router.post('/', authenticate, validateRequest(CreateMaintenanceSchema), maintenanceController.create);
router.patch('/:id', authenticate, validateRequest(UpdateMaintenanceSchema), maintenanceController.update);

export default router;
