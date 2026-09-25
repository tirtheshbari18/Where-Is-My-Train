import { Router } from 'express';
import { BlocksController } from '../controllers/blocksController.js';

const router = Router();

router.get('/', BlocksController.getAll);

export default router;
