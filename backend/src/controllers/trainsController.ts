import { Request, Response, NextFunction } from 'express';
import { railwayService } from '../services/railwayService.js';

export class TrainsController {
  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || '';
      const result = await railwayService.searchTrains(query);
      res.json({
        success: true,
        data: result.trains,
        total: result.trains.length,
        source: result.source,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getByNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const number = req.params.number as string;
      if (!number) {
        return res.status(400).json({
          success: false,
          error: { message: 'Train number is required', code: 'INVALID_PARAM' },
        });
      }

      const train = await railwayService.getTrainByNumber(number);
      if (!train) {
        return res.status(404).json({
          success: false,
          error: {
            message: `Train ${number} not found. Please verify the train number.`,
            code: 'TRAIN_NOT_FOUND',
          },
        });
      }

      res.json({
        success: true,
        data: train,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const number = req.params.number as string;
      const schedule = await railwayService.getTrainSchedule(number);

      if (!schedule || schedule.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            message: `Schedule for train ${number} not found.`,
            code: 'SCHEDULE_NOT_FOUND',
          },
        });
      }

      res.json({
        success: true,
        data: schedule,
        totalStops: schedule.length,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const number = req.params.number as string;
      const date = req.query.date as string | undefined;

      const result = await railwayService.getRunningStatus(number, date);

      if (!result.status) {
        return res.status(404).json({
          success: false,
          error: {
            message: `Running status for train ${number} is currently unavailable.`,
            code: 'STATUS_UNAVAILABLE',
          },
        });
      }

      res.json({
        success: true,
        data: result.status,
        isStale: result.isStale,
        staleWarning: result.staleWarning,
        cachedAgeSeconds: result.cachedAgeSeconds,
      });
    } catch (err: any) {
      res.status(503).json({
        success: false,
        error: {
          message: 'Live train status temporarily unavailable from upstream data provider.',
          code: 'PROVIDER_ERROR',
          details: err.message,
        },
      });
    }
  }

  static async getRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const number = req.params.number as string;
      const schedule = await railwayService.getTrainSchedule(number);

      if (!schedule || schedule.length === 0) {
        return res.status(404).json({
          success: false,
          error: { message: `Route for train ${number} not found`, code: 'ROUTE_NOT_FOUND' },
        });
      }

      const coordinates = schedule.map((stop) => ({
        sequence: stop.stopSequence,
        stationCode: stop.stationCode,
        stationName: stop.stationName,
        lat: stop.latitude,
        lng: stop.longitude,
        day: stop.dayCount,
        scheduledArrival: stop.scheduledArrival,
        scheduledDeparture: stop.scheduledDeparture,
      }));

      res.json({
        success: true,
        data: {
          trainNumber: number,
          totalStations: coordinates.length,
          coordinates,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCoaches(req: Request, res: Response, next: NextFunction) {
    try {
      const number = req.params.number as string;
      const composition = await railwayService.getCoachComposition(number);

      if (!composition) {
        return res.status(404).json({
          success: false,
          error: {
            message: `Coach composition for train ${number} not available.`,
            code: 'COACH_INFO_UNAVAILABLE',
          },
        });
      }

      res.json({
        success: true,
        data: composition,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getBetweenStations(req: Request, res: Response, next: NextFunction) {
    try {
      const from = req.query.from as string;
      const to = req.query.to as string;
      const date = req.query.date as string | undefined;

      if (!from || !to) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Both "from" and "to" station codes are required.',
            code: 'MISSING_STATION_CODES',
          },
        });
      }

      const trains = await railwayService.getTrainsBetweenStations(from, to, date);

      res.json({
        success: true,
        data: trains,
        total: trains.length,
        from,
        to,
        date: date || new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      next(err);
    }
  }
}
