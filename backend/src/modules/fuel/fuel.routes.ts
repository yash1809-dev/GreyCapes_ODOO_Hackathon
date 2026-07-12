import { Router } from 'express';
import { fuelController } from './fuel.controller';
import { authenticate } from '../../core/security/auth.middleware';
import { validateRequest } from '../../core/validation/validation.middleware';
import { CreateFuelSchema } from './fuel.dto';

const router = Router();

router.get('/', authenticate, fuelController.getAll);
router.post('/', authenticate, validateRequest(CreateFuelSchema), fuelController.create);

export default router;
