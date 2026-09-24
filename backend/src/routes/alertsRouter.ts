import { Router } from 'express';
import { AlertsController } from '../controllers/alertsController.js';

const router = Router();

router.get('/', AlertsController.getGeneralAlerts);
router.get('/exceptions', AlertsController.getExceptions);
router.get('/zones', AlertsController.getZones);

export default router;
