import { Router } from 'express';
import { PnrController } from '../controllers/pnrController.js';

const router = Router();

router.get('/:pnr', PnrController.getStatus);

export default router;
