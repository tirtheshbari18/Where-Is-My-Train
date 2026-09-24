import { Request, Response, NextFunction } from 'express';
import { railwayService } from '../services/railwayService.js';

export class StationsController {
  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || '';
      const stations = await railwayService.searchStations(query);

      res.json({
        success: true,
        data: stations,
        total: stations.length,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const code = req.params.code as string;
      if (!code) {
        return res.status(400).json({
          success: false,
          error: { message: 'Station code is required', code: 'INVALID_PARAM' },
        });
      }

      const station = await railwayService.getStation(code);
      if (!station) {
        return res.status(404).json({
          success: false,
          error: {
            message: `Station with code "${code.toUpperCase()}" not found.`,
            code: 'STATION_NOT_FOUND',
          },
        });
      }

      res.json({
        success: true,
        data: station,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getLive(req: Request, res: Response, next: NextFunction) {
    try {
      const code = req.params.code as string;
      const hours = parseInt((req.query.hours as string) || '4', 10);

      const liveBoard = await railwayService.getLiveStation(code, hours);
      if (!liveBoard) {
        return res.status(404).json({
          success: false,
          error: {
            message: `Live information for station "${code.toUpperCase()}" is currently unavailable.`,
            code: 'LIVE_STATION_UNAVAILABLE',
          },
        });
      }

      res.json({
        success: true,
        data: liveBoard,
        stationCode: code.toUpperCase(),
        lastRefreshedAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async getNearby(req: Request, res: Response, next: NextFunction) {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radius = parseFloat((req.query.radius as string) || '60');

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Valid "lat" and "lng" query parameters are required.',
            code: 'INVALID_COORDINATES',
          },
        });
      }

      const nearby = await railwayService.getNearbyStations(lat, lng, radius);

      res.json({
        success: true,
        data: nearby,
        total: nearby.length,
        userLocation: { latitude: lat, longitude: lng },
        radiusKm: radius,
      });
    } catch (err) {
      next(err);
    }
  }
}
