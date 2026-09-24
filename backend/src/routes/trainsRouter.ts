import { Router } from 'express';
import { TrainsController } from '../controllers/trainsController.js';
import { searchRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Search trains (by number or name)
router.get('/search', searchRateLimiter, TrainsController.search);

// Train route coordinates (for maps)
router.get('/:number/route', TrainsController.getRoute);

// Train schedule stops
router.get('/:number/schedule', TrainsController.getSchedule);

// Live running status
router.get('/:number/status', TrainsController.getStatus);

// Coach configuration
router.get('/:number/coaches', TrainsController.getCoaches);

// Train summary details
router.get('/:number', TrainsController.getByNumber);

export default router;
