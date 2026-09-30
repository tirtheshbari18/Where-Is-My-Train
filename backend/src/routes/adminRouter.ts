import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AdminController } from '../controllers/adminController.js';

const router = Router();

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Middleware to verify admin key if set in production
router.use((req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'production') {
    // Admin endpoints are open in development/test — no key required
    return next();
  }

  const expectedKey = process.env.ADMIN_API_KEY;
  if (!expectedKey) {
    // Production without ADMIN_API_KEY configured — refuse access safely (no fallback secret)
    return res.status(503).json({
      success: false,
      error: { message: 'Admin access is not configured on this deployment.', code: 'ADMIN_NOT_CONFIGURED' },
    });
  }

  const adminKey = req.headers['x-admin-key'];
  if (typeof adminKey !== 'string' || !safeEqual(adminKey, expectedKey)) {
    return res.status(401).json({
      success: false,
      error: { message: 'Unauthorized admin access', code: 'UNAUTHORIZED' },
    });
  }
  next();
});

// Telemetry & Providers
router.get('/providers', AdminController.getProviders);
router.post('/primary-provider', AdminController.setPrimaryProvider);
router.get('/cache', AdminController.getCacheStats);
router.post('/cache/clear', AdminController.clearCache);

// Master Database Summary
router.get('/master-summary', AdminController.getMasterSummary);

// Master Stations Management
router.get('/stations', AdminController.getStations);
router.post('/stations', AdminController.addStation);
router.put('/stations/:code', AdminController.updateStation);
router.delete('/stations/:code', AdminController.deleteStation);
router.post('/stations/:code/verify', AdminController.verifyStation);

// Master Platforms Management
router.get('/platforms', AdminController.getPlatforms);
router.post('/platforms', AdminController.addPlatform);

// Dataset Import & Export
router.post('/import', AdminController.importDataset);
router.get('/export', AdminController.exportDataset);

export default router;
