import { Router } from 'express';
import { expensesController } from './expenses.controller';
import { authenticate } from '../../core/security/auth.middleware';
import { validateRequest } from '../../core/validation/validation.middleware';
import { CreateExpenseSchema } from './expenses.dto';

const router = Router();

router.get('/', authenticate, expensesController.getAll);
router.post('/', authenticate, validateRequest(CreateExpenseSchema), expensesController.create);

export default router;
