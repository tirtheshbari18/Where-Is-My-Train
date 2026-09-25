import { Router } from 'express';
import { MetroController } from '../controllers/metroController.js';

const router = Router();

router.get('/lines', MetroController.getLines);
router.get('/map-data', MetroController.getMapData);
router.get('/search', MetroController.searchRoute);
router.get('/indicator', MetroController.getStationIndicator);
router.get('/', MetroController.getLines);

export default router;
