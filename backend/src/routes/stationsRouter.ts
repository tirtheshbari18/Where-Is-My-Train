import { Router } from 'express';
import { StationsController } from '../controllers/stationsController.js';
import { searchRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Search stations
router.get('/search', searchRateLimiter, StationsController.search);

// Live station board (arrivals / departures)
router.get('/:code/live', StationsController.getLive);

// Station details
router.get('/:code', StationsController.getByCode);

export default router;
