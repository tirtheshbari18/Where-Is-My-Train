import { Request, Response } from 'express';
import {
  MASTER_ZONES,
  MASTER_DIVISIONS,
  MASTER_RAILWAY_LINES,
  MASTER_ROUTES,
  DATA_VERSION,
  calculateRailwayDistance,
} from '../data/masterRailwayDb.js';
import { generateDataQualityReport } from '../services/dataQualityService.js';

export class MasterController {
  // GET /api/zones
  static getZones(_req: Request, res: Response) {
    res.json({
      success: true,
      total: MASTER_ZONES.length,
      data: MASTER_ZONES,
    });
  }

  // GET /api/divisions?zone=
  static getDivisions(req: Request, res: Response) {
    const zoneQuery = req.query.zone as string | undefined;
    let list = MASTER_DIVISIONS;
    if (zoneQuery) {
      list = list.filter((d) => d.zone_code.toUpperCase() === zoneQuery.toUpperCase());
    }

    res.json({
      success: true,
      total: list.length,
      data: list,
    });
  }

  // GET /api/railway-lines
  static getRailwayLines(_req: Request, res: Response) {
    res.json({
      success: true,
      total: MASTER_RAILWAY_LINES.length,
      data: MASTER_RAILWAY_LINES,
    });
  }

  // GET /api/routes
  static getRoutes(_req: Request, res: Response) {
    res.json({
      success: true,
      total: MASTER_ROUTES.length,
      data: MASTER_ROUTES.map((r) => ({
        route_code: r.route_code,
        route_name: r.route_name,
        origin_station_code: r.origin_station_code,
        dest_station_code: r.dest_station_code,
        total_distance_km: r.total_distance_km,
        direction: r.direction,
        station_count: r.stations.length,
      })),
    });
  }

  // GET /api/routes/:id
  static getRouteById(req: Request, res: Response) {
    const id = String(req.params.id || '').toUpperCase();
    const route = MASTER_ROUTES.find(
      (r) => r.route_code.toUpperCase() === id || r.route_name.toUpperCase().includes(id)
    );

    if (!route) {
      return res.status(404).json({
        success: false,
        error: `Route "${id}" not found in Indian Railways Master Route Database.`,
      });
    }

    res.json({
      success: true,
      data: route,
    });
  }

  // GET /api/routes/:id/stations
  static getRouteStations(req: Request, res: Response) {
    const id = String(req.params.id || '').toUpperCase();
    const route = MASTER_ROUTES.find(
      (r) => r.route_code.toUpperCase() === id || r.route_name.toUpperCase().includes(id)
    );

    if (!route) {
      return res.status(404).json({
        success: false,
        error: `Route "${id}" not found.`,
      });
    }

    res.json({
      success: true,
      route_code: route.route_code,
      route_name: route.route_name,
      total_stations: route.stations.length,
      data: route.stations,
    });
  }

  // GET /api/routes/search?from=&to=
  static searchRoutes(req: Request, res: Response) {
    const from = (req.query.from as string || '').toUpperCase().trim();
    const to = (req.query.to as string || '').toUpperCase().trim();

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Both "from" and "to" station codes are required.',
      });
    }

    const distance = calculateRailwayDistance(from, to);

    // Find all routes containing both stations
    const matchingRoutes = MASTER_ROUTES.filter((r) => {
      const hasFrom = r.stations.some((s) => s.station_code === from);
      const hasTo = r.stations.some((s) => s.station_code === to);
      return hasFrom && hasTo;
    }).map((r) => {
      const fStn = r.stations.find((s) => s.station_code === from)!;
      const tStn = r.stations.find((s) => s.station_code === to)!;
      const isForward = tStn.sequence_order >= fStn.sequence_order;
      const corridorDistance = Math.abs(tStn.km_from_origin - fStn.km_from_origin);

      const startIndex = Math.min(fStn.sequence_order - 1, tStn.sequence_order - 1);
      const endIndex = Math.max(fStn.sequence_order - 1, tStn.sequence_order - 1);
      const segmentStations = r.stations.slice(startIndex, endIndex + 1);

      return {
        route_code: r.route_code,
        route_name: r.route_name,
        direction: isForward ? 'DOWN' : 'UP',
        corridor_distance_km: corridorDistance,
        from_km: fStn.km_from_origin,
        to_km: tStn.km_from_origin,
        stations_between: isForward ? segmentStations : [...segmentStations].reverse(),
      };
    });

    res.json({
      success: true,
      from,
      to,
      authoritative_distance_km: distance,
      matching_routes: matchingRoutes,
    });
  }

  // GET /api/data-version
  static getDataVersion(_req: Request, res: Response) {
    res.json({
      success: true,
      data: DATA_VERSION,
    });
  }

  // GET /api/data-quality-report
  static getDataQualityReport(_req: Request, res: Response) {
    const report = generateDataQualityReport();
    res.json({
      success: true,
      data: report,
    });
  }
}
