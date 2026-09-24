import { Request, Response, NextFunction } from 'express';
import { providerManager } from '../providers/providerManager.js';
import { cacheService } from '../services/cacheService.js';

export class AdminController {
  static async getProviders(_req: Request, res: Response, next: NextFunction) {
    try {
      const health = await providerManager.getHealthStatuses();
      const currentPrimary = providerManager.getPrimaryProviderCode();

      res.json({
        success: true,
        data: {
          currentPrimary,
          providers: health,
          cache: cacheService.getStats(),
          systemTime: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async setPrimaryProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerCode } = req.body;
      if (!providerCode) {
        return res.status(400).json({
          success: false,
          error: { message: 'providerCode is required', code: 'MISSING_FIELD' },
        });
      }

      const success = providerManager.setPrimaryProvider(providerCode);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: {
            message: `Unknown provider code: "${providerCode}". Valid codes are: mock, ntes, licensed`,
            code: 'INVALID_PROVIDER',
          },
        });
      }

      res.json({
        success: true,
        message: `Primary data provider successfully switched to: ${providerCode}`,
        currentPrimary: providerCode,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCacheStats(_req: Request, res: Response) {
    const stats = cacheService.getStats();
    res.json({
      success: true,
      data: stats,
    });
  }

  static async clearCache(_req: Request, res: Response) {
    cacheService.clear();
    res.json({
      success: true,
      message: 'System in-memory railway cache cleared successfully.',
    });
  }
}
