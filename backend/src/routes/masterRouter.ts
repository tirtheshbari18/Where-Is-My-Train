import { Router } from 'express';
import { MasterController } from '../controllers/masterController.js';

const router = Router();

// Routes Master Endpoints
router.get('/routes/search', MasterController.searchRoutes);
router.get('/routes/:id/stations', MasterController.getRouteStations);
router.get('/routes/:id', MasterController.getRouteById);
router.get('/routes', MasterController.getRoutes);

// Railway Lines
router.get('/railway-lines', MasterController.getRailwayLines);

// Divisions
router.get('/divisions', MasterController.getDivisions);

// Zones
router.get('/zones', MasterController.getZones);

// Data Version & Quality Report
router.get('/data-version', MasterController.getDataVersion);
router.get('/data-quality-report', MasterController.getDataQualityReport);

export default router;
