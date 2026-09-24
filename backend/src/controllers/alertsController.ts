import { Request, Response, NextFunction } from 'express';
import { railwayService } from '../services/railwayService.js';

export class AlertsController {
  static async getExceptions(req: Request, res: Response, next: NextFunction) {
    try {
      const type = req.query.type as string | undefined;
      const exceptions = await railwayService.getTrainExceptions(type);

      res.json({
        success: true,
        data: exceptions,
        total: exceptions.length,
        filter: type || 'ALL',
      });
    } catch (err) {
      next(err);
    }
  }

  static async getZones(_req: Request, res: Response, next: NextFunction) {
    try {
      const zones = railwayService.getRailwayZones();
      res.json({
        success: true,
        data: zones,
        total: zones.length,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getGeneralAlerts(_req: Request, res: Response, next: NextFunction) {
    try {
      const alerts = [
        {
          id: 'alert-1',
          type: 'MAINTENANCE',
          severity: 'INFO',
          title: 'Track Maintenance Block on Western Railway',
          description:
            'Mega block scheduled between Borivali and Bhayandar on slow lines from 01:00 AM to 04:30 AM.',
          postedAt: new Date().toISOString(),
        },
        {
          id: 'alert-2',
          type: 'WEATHER',
          severity: 'WARNING',
          title: 'Fog Precautionary Speed Restrictions in Northern Plains',
          description:
            'Trains traversing Delhi, Lucknow, and Kanpur divisions may experience speed regulation for passenger safety during low visibility hours.',
          postedAt: new Date().toISOString(),
        },
        {
          id: 'alert-3',
          type: 'SPECIAL_SERVICE',
          severity: 'INFO',
          title: 'Festival Special Trains Operational',
          description:
            'Indian Railways has notified 1,200+ trips of festival special trains to clear festive passenger rush across all zones.',
          postedAt: new Date().toISOString(),
        },
      ];

      res.json({
        success: true,
        data: alerts,
      });
    } catch (err) {
      next(err);
    }
  }
}
