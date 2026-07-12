import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate } from '../../core/security/auth.middleware';

const router = Router();
const analyticsController = new AnalyticsController();

router.use(authenticate);

router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/fleet-utilization', analyticsController.getFleetUtilization);
router.get('/fuel-efficiency', analyticsController.getFuelEfficiency);
router.get('/operational-costs', analyticsController.getOperationalCosts);
router.get('/recent-activity', analyticsController.getRecentActivity);

export default router;
