import { Router } from 'express';
import { BusController } from '../controllers/busController.js';

const router = Router();

router.get('/search', BusController.search);
router.get('/:id/track', BusController.getLiveTracking);
router.get('/:id', BusController.getById);
router.get('/', BusController.search);

export default router;
