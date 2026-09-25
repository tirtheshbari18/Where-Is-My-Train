import { Router } from 'express';
import trainsRouter from './trainsRouter.js';
import stationsRouter from './stationsRouter.js';
import alertsRouter from './alertsRouter.js';
import pnrRouter from './pnrRouter.js';
import adminRouter from './adminRouter.js';
import { TrainsController } from '../controllers/trainsController.js';
import { StationsController } from '../controllers/stationsController.js';
import { AlertsController } from '../controllers/alertsController.js';

import localsRouter from './localsRouter.js';
import metroRouter from './metroRouter.js';
import busRouter from './busRouter.js';
import platformVotesRouter from './platformVotesRouter.js';
import blocksRouter from './blocksRouter.js';
import feedbackRouter from './feedbackRouter.js';
import masterRouter from './masterRouter.js';

const apiRouter = Router();

// Healthcheck
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'WHERE IS MY TRAIN Indian Railway API Gateway',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

// Master Indian Railways database routes (/zones, /divisions, /routes, /railway-lines, /data-version)
apiRouter.use('/', masterRouter);

// Domain subrouters
apiRouter.use('/trains', trainsRouter);
apiRouter.use('/stations', stationsRouter);
apiRouter.use('/alerts', alertsRouter);
apiRouter.use('/pnr', pnrRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/locals', localsRouter);
apiRouter.use('/metro', metroRouter);
apiRouter.use('/buses', busRouter);
apiRouter.use('/platform-votes', platformVotesRouter);
apiRouter.use('/blocks', blocksRouter);
apiRouter.use('/feedback', feedbackRouter);

// Flat aliases matching specific prompt routes:
// GET /api/trains-between
apiRouter.get('/trains-between', TrainsController.getBetweenStations);

// GET /api/nearby-stations
apiRouter.get('/nearby-stations', StationsController.getNearby);

// GET /api/exceptions
apiRouter.get('/exceptions', AlertsController.getExceptions);

// GET /api/zones
apiRouter.get('/zones', AlertsController.getZones);

// Railway Network & Section Map endpoints
apiRouter.get('/railway/sections', TrainsController.getSections);
apiRouter.get('/railway/map-data', TrainsController.getMapData);
apiRouter.get('/train-operations', TrainsController.getTrainOperations);

export default apiRouter;
