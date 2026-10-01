import { Router } from 'express';
import { TrainsController } from '../controllers/trainsController.js';
import { searchRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// List all trains or search
router.get('/', searchRateLimiter, TrainsController.search);

// Search trains (by number, name, or from/to stations)
router.get('/search', searchRateLimiter, TrainsController.search);

// Search trains between stations: GET /api/trains/between?from=BOR&to=DRD&date=...
router.get('/between', searchRateLimiter, TrainsController.getBetweenStations);

// Train route coordinates (for maps)
router.get('/:number/route', TrainsController.getRoute);

// Train schedule stops
router.get('/:number/schedule', TrainsController.getSchedule);

// Live running status (both /status and /live supported)
router.get('/:number/status', TrainsController.getStatus);
router.get('/:number/live', TrainsController.getStatus);

// Coach configuration
router.get('/:number/coaches', TrainsController.getCoaches);

// Intermediate stations along route
router.get('/:number/intermediate', TrainsController.getIntermediateStations);

// Segment timeline — stops between two stations for a train
// GET /api/trains/:number/segment?from=BOR&to=DRD
router.get('/:number/segment', TrainsController.getSegment);

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
