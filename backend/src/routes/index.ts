import { Router } from 'express';
import trainsRouter from './trainsRouter.js';
import stationsRouter from './stationsRouter.js';
import alertsRouter from './alertsRouter.js';
import pnrRouter from './pnrRouter.js';
import adminRouter from './adminRouter.js';
import { TrainsController } from '../controllers/trainsController.js';
import { StationsController } from '../controllers/stationsController.js';
import { AlertsController } from '../controllers/alertsController.js';

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

// Domain subrouters
apiRouter.use('/trains', trainsRouter);
apiRouter.use('/stations', stationsRouter);
apiRouter.use('/alerts', alertsRouter);
apiRouter.use('/pnr', pnrRouter);
apiRouter.use('/admin', adminRouter);

// Flat aliases matching specific prompt routes:
// GET /api/trains-between
apiRouter.get('/trains-between', TrainsController.getBetweenStations);

// GET /api/nearby-stations
apiRouter.get('/nearby-stations', StationsController.getNearby);

// GET /api/exceptions
apiRouter.get('/exceptions', AlertsController.getExceptions);

// GET /api/zones
apiRouter.get('/zones', AlertsController.getZones);

export default apiRouter;
