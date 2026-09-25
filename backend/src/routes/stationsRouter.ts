import { Router } from 'express';
import { StationsController } from '../controllers/stationsController.js';
import { searchRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// 1. GET /api/stations (All master stations)
router.get('/', StationsController.getAll);

// 2. GET /api/stations/search?q=
router.get('/search', searchRateLimiter, StationsController.search);

// 3. GET /api/stations/:code/platforms
router.get('/:code/platforms', StationsController.getPlatforms);

// 4. GET /api/stations/:code/departures
router.get('/:code/departures', StationsController.getDepartures);

// 5. GET /api/stations/:code/live
router.get('/:code/live', StationsController.getLive);

// 6. GET /api/stations/:code
router.get('/:code', StationsController.getByCode);

export default router;
