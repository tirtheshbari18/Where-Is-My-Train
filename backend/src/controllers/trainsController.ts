import { Request, Response, NextFunction } from 'express';
import { railwayService } from '../services/railwayService.js';
import { resolveStationCode } from '../utils/stationResolver.js';
import { normalizeDate } from '../utils/dateNormalizer.js';

export class TrainsController {
  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const from = (req.query.from as string || '').trim();
      const to = (req.query.to as string || '').trim();
      if (from && to) {
        return TrainsController.getBetweenStations(req, res, next);
      }

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
      const rawFrom = (req.query.from as string || '').trim();
      const rawTo = (req.query.to as string || '').trim();
      const rawDate = req.query.date as string | undefined;

      if (!rawFrom || !rawTo) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Both "from" and "to" station codes or names are required.',
            code: 'MISSING_STATION_CODES',
          },
        });
      }

      const from = resolveStationCode(rawFrom);
      const to = resolveStationCode(rawTo);
      const { isoDate } = normalizeDate(rawDate);

      const trains = await railwayService.getTrainsBetweenStations(from, to, isoDate);

      res.json({
        success: true,
        data: trains,
        total: trains.length,
        from,
        to,
        date: isoDate,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getIntermediateStations(req: Request, res: Response, next: NextFunction) {
    try {
      const number = req.params.number as string;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      const segments = await railwayService.getIntermediateStations(number, from, to);
      res.json({
        success: true,
        data: segments,
        trainNumber: number,
        from,
        to,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getTrainOperations(req: Request, res: Response, next: NextFunction) {
    try {
      const number = req.params.number as string | undefined;
      const station = (req.query.station as string) || undefined;

      const operations = await railwayService.getTrainOperations(station, number);
      res.json({
        success: true,
        data: operations,
        trainNumber: number,
        stationCode: station,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPlatformUpdates(req: Request, res: Response, next: NextFunction) {
    try {
      const number = req.params.number as string;
      const station = req.query.station as string | undefined;

      const updates = await railwayService.getPlatformUpdates(number, station);
      res.json({
        success: true,
        data: updates,
        trainNumber: number,
      });
    } catch (err) {
      next(err);
    }
  }

  static async savePlatformUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const number = req.params.number as string;
      const { stationCode, stationName, oldPlatform, newPlatform, source } = req.body;

      if (!stationCode || !newPlatform) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Station code and new platform number are required.',
            code: 'INVALID_PLATFORM_DATA',
          },
        });
      }

      const saved = await railwayService.savePlatformUpdate({
        trainNumber: number,
        stationCode,
        stationName: stationName || stationCode,
        oldPlatform: oldPlatform ? String(oldPlatform).trim() : '',
        newPlatform: String(newPlatform).trim(),
        source: source || 'User Announcement',
        isOfficial: false,
      });

      res.json({
        success: true,
        data: saved,
        message: `Platform updated successfully to Platform ${newPlatform}`,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getDetailedTimetable(req: Request, res: Response, next: NextFunction) {
    try {
      const number = req.params.number as string;
      const rows = await railwayService.getDetailedTimetable(number);

      res.json({
        success: true,
        data: rows,
        trainNumber: number,
        total: rows.length,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSections(req: Request, res: Response, next: NextFunction) {
    try {
      const zone = req.query.zone as string | undefined;
      const division = req.query.division as string | undefined;

      const sections = await railwayService.getRailwaySections(zone, division);
      res.json({
        success: true,
        data: sections,
        total: sections.length,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMapData(_req: Request, res: Response, next: NextFunction) {
    try {
      const mapData = await railwayService.getRailwayMapData();
      res.json({
        success: true,
        data: mapData,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/trains/:number/segment?from=BOR&to=DRD
   * Returns all stops between from and to for the given train.
   * Implements the interactive segment timeline feature.
   */
  static async getSegment(req: Request, res: Response, next: NextFunction) {
    try {
      const number = req.params.number as string;
      const rawFrom = (req.query.from as string || '').trim();
      const rawTo = (req.query.to as string || '').trim();

      if (!rawFrom || !rawTo) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Both "from" and "to" station codes or names are required for segment query.',
            code: 'MISSING_SEGMENT_PARAMS',
          },
        });
      }

      const from = resolveStationCode(rawFrom);
      const to = resolveStationCode(rawTo);

      if (from === to) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Source and destination stations cannot be the same.',
            code: 'SAME_STATION',
          },
        });
      }

      const result = await railwayService.getTrainSegment(number, from, to);

      res.json({
        success: true,
        data: result,
        trainNumber: number,
        from,
        to,
      });
    } catch (err) {
      next(err);
    }
  }
}
