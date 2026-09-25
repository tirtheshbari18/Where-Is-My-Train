import { Router } from 'express';
import { TrainsController } from '../controllers/trainsController.js';
import { searchRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// List all trains or search
router.get('/', searchRateLimiter, TrainsController.search);

// Search trains (by number, name, or from/to stations)
router.get('/search', searchRateLimiter, TrainsController.search);

// Train route coordinates (for maps)
router.get('/:number/route', TrainsController.getRoute);

// Train schedule stops
router.get('/:number/schedule', TrainsController.getSchedule);

// Live running status
router.get('/:number/status', TrainsController.getStatus);

// Coach configuration
router.get('/:number/coaches', TrainsController.getCoaches);

// Intermediate stations along route
router.get('/:number/intermediate', TrainsController.getIntermediateStations);

// Train operational interactions (crossings, overtakings)
router.get('/:number/operations', TrainsController.getTrainOperations);

// Platform updates & user submissions
router.get('/:number/platforms', TrainsController.getPlatformUpdates);
router.post('/:number/platforms', TrainsController.savePlatformUpdate);

// Detailed 19-column timetable
router.get('/:number/detailed-timetable', TrainsController.getDetailedTimetable);

// Train summary details
router.get('/:number', TrainsController.getByNumber);

export default router;
