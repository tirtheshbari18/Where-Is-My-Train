import { Router } from 'express';
import { LocalsController } from '../controllers/localsController.js';

const router = Router();

router.get('/lines', LocalsController.getLines);
router.get('/search', LocalsController.search);
router.get('/indicator', LocalsController.getStationIndicator);
router.get('/', LocalsController.search);

export default router;
