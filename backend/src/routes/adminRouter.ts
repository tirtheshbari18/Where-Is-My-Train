import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';

const router = Router();

// Middleware to verify admin key if set in production
router.use((req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_API_KEY || 'wimt_admin_secret_key_2026';

  // For development ease, if key is not passed, allow or check
  if (process.env.NODE_ENV === 'production' && adminKey !== expectedKey) {
    return res.status(401).json({
      success: false,
      error: { message: 'Unauthorized admin access', code: 'UNAUTHORIZED' },
    });
  }
  next();
});

router.get('/providers', AdminController.getProviders);
router.post('/primary-provider', AdminController.setPrimaryProvider);
router.get('/cache', AdminController.getCacheStats);
router.post('/cache/clear', AdminController.clearCache);

export default router;
