import { Request, Response, NextFunction } from 'express';
import { providerManager } from '../providers/providerManager.js';
import { cacheService } from '../services/cacheService.js';
import {
  MASTER_STATIONS,
  MASTER_ZONES,
  MASTER_DIVISIONS,
  MASTER_PLATFORMS,
  MASTER_RAILWAY_LINES,
  MASTER_ROUTES,
  MASTER_STATION_ALIASES,
  DATA_VERSION,
  MasterStation,
  StationPlatformMaster,
} from '../data/masterRailwayDb.js';
import {
  generateDataQualityReport,
  importStations as validateStations,
  importPlatforms as validatePlatforms,
  importRoutes as validateRoutes,
} from '../services/dataQualityService.js';

export class AdminController {
  // Provider Health & Telemetry
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

  // --- MASTER DATABASE SUMMARY & TELEMETRY ---
  static async getMasterSummary(_req: Request, res: Response) {
    const audit = generateDataQualityReport();
    res.json({
      success: true,
      data: {
        data_version: DATA_VERSION.version,
        release_date: DATA_VERSION.release_date,
        quality_score: audit.quality_score,
        overall_status: audit.overall_status,
        zones: MASTER_ZONES.length,
        divisions: MASTER_DIVISIONS.length,
        stations: MASTER_STATIONS.length,
        verifiedStations: MASTER_STATIONS.filter((s) => s.verification_status === 'VERIFIED').length,
        aliases: MASTER_STATION_ALIASES.length,
        platforms: MASTER_PLATFORMS.length,
        railwayLines: MASTER_RAILWAY_LINES.length,
        routes: MASTER_ROUTES.length,
        dataVersion: DATA_VERSION,
        qualityScore: audit.quality_score,
        overallStatus: audit.overall_status,
        metrics: {
          zones: MASTER_ZONES.length,
          divisions: MASTER_DIVISIONS.length,
          stations: MASTER_STATIONS.length,
          aliases: MASTER_STATION_ALIASES.length,
          platforms: MASTER_PLATFORMS.length,
          railway_lines: MASTER_RAILWAY_LINES.length,
          routes: MASTER_ROUTES.length,
        },
      },
    });
  }

  // --- MASTER STATIONS MANAGEMENT (CRUD + Search + Pagination) ---
  static async getStations(req: Request, res: Response) {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string || '20')));
    const search = String(req.query.search || '').toUpperCase().trim();
    const zone = String(req.query.zone || '').toUpperCase().trim();

    let list = MASTER_STATIONS;

    if (zone) {
      list = list.filter((s) => s.zone_code.toUpperCase() === zone);
    }

    if (search) {
      list = list.filter(
        (s) =>
          s.station_code.toUpperCase().includes(search) ||
          s.station_name.toUpperCase().includes(search) ||
          s.city.toUpperCase().includes(search) ||
          s.state.toUpperCase().includes(search)
      );
    }

    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: paginated,
    });
  }

  static async addStation(req: Request, res: Response) {
    const {
      station_code,
      station_name,
      zone_code,
      division_code,
      state,
      district,
      city,
      latitude,
      longitude,
      station_category,
      numberOfPlatforms,
      is_junction,
      is_terminal,
    } = req.body;

    if (!station_code || !station_name || !zone_code) {
      return res.status(400).json({
        success: false,
        error: 'Station code, station name, and zone code are required.',
      });
    }

    const code = String(station_code).toUpperCase().trim();
    if (MASTER_STATIONS.some((s) => s.station_code === code)) {
      return res.status(400).json({
        success: false,
        error: `Station with code ${code} already exists in master database.`,
      });
    }

    const newStation: MasterStation = {
      id: `stn-${code.toLowerCase()}`,
      station_code: code,
      station_name: String(station_name).trim(),
      official_name: `${String(station_name).trim()} Railway Station`,
      short_name: String(station_name).trim(),
      zone_code: String(zone_code).toUpperCase().trim(),
      division_code: String(division_code || '').toUpperCase().trim(),
      state: String(state || 'Maharashtra').trim(),
      district: String(district || '').trim(),
      city: String(city || String(station_name)).trim(),
      latitude: parseFloat(latitude) || 19.0,
      longitude: parseFloat(longitude) || 73.0,
      station_category: (station_category || 'NSG-2') as any,
      numberOfPlatforms: parseInt(numberOfPlatforms) || 2,
      is_junction: Boolean(is_junction),
      is_terminal: Boolean(is_terminal),
      is_interchange: false,
      active: true,
      source: 'Admin Verified Entry',
      source_type: 'OFFICIAL',
      last_verified_at: new Date().toISOString(),
      confidence: 'HIGH',
    };

    MASTER_STATIONS.push(newStation);

    res.json({
      success: true,
      message: `Station ${code} (${newStation.station_name}) created successfully.`,
      data: newStation,
    });
  }

  static async updateStation(req: Request, res: Response) {
    const code = String(req.params.code || '').toUpperCase().trim();
    const stn = MASTER_STATIONS.find((s) => s.station_code === code);

    if (!stn) {
      return res.status(404).json({ success: false, error: `Station ${code} not found.` });
    }

    const {
      station_name,
      zone_code,
      division_code,
      state,
      city,
      station_category,
      numberOfPlatforms,
      is_junction,
      active,
    } = req.body;

    if (station_name !== undefined) stn.station_name = String(station_name).trim();
    if (zone_code !== undefined) stn.zone_code = String(zone_code).toUpperCase().trim();
    if (division_code !== undefined) stn.division_code = String(division_code).toUpperCase().trim();
    if (state !== undefined) stn.state = String(state).trim();
    if (city !== undefined) stn.city = String(city).trim();
    if (station_category !== undefined) stn.station_category = station_category;
    if (numberOfPlatforms !== undefined) stn.numberOfPlatforms = parseInt(numberOfPlatforms) || stn.numberOfPlatforms;
    if (is_junction !== undefined) stn.is_junction = Boolean(is_junction);
    if (active !== undefined) stn.active = Boolean(active);
    stn.last_verified_at = new Date().toISOString();

    res.json({
      success: true,
      message: `Station ${code} updated successfully.`,
      data: stn,
    });
  }

  static async deleteStation(req: Request, res: Response) {
    const code = String(req.params.code || '').toUpperCase().trim();
    const index = MASTER_STATIONS.findIndex((s) => s.station_code === code);

    if (index === -1) {
      return res.status(404).json({ success: false, error: `Station ${code} not found.` });
    }

    MASTER_STATIONS.splice(index, 1);
    res.json({
      success: true,
      message: `Station ${code} removed from master database.`,
    });
  }

  static async verifyStation(req: Request, res: Response) {
    const code = String(req.params.code || '').toUpperCase().trim();
    const stn = MASTER_STATIONS.find((s) => s.station_code === code);

    if (!stn) {
      return res.status(404).json({ success: false, error: `Station ${code} not found.` });
    }

    stn.last_verified_at = new Date().toISOString();
    stn.confidence = 'HIGH';
    stn.source_type = 'OFFICIAL';
    stn.verification_status = 'VERIFIED';

    res.json({
      success: true,
      message: `Station ${code} marked officially verified as of ${stn.last_verified_at}.`,
      data: stn,
    });
  }

  // --- MASTER PLATFORMS MANAGEMENT ---
  static async getPlatforms(req: Request, res: Response) {
    const stationCode = req.query.stationCode ? String(req.query.stationCode).toUpperCase().trim() : '';
    let list = MASTER_PLATFORMS;
    if (stationCode) {
      list = list.filter((p) => p.station_code === stationCode);
    }
    res.json({
      success: true,
      total: list.length,
      data: list,
    });
  }

  static async addPlatform(req: Request, res: Response) {
    const { station_code, platform_number, platform_name, platform_type } = req.body;

    if (!station_code || !platform_number) {
      return res.status(400).json({ success: false, error: 'station_code and platform_number are required.' });
    }

    const code = String(station_code).toUpperCase().trim();
    const pfNum = String(platform_number).trim();

    const existing = MASTER_PLATFORMS.find(
      (p) => p.station_code === code && p.platform_number === pfNum
    );
    if (existing) {
      return res.status(400).json({ success: false, error: `Platform ${pfNum} already exists for ${code}.` });
    }

    const newPf: StationPlatformMaster = {
      id: `pf-${code.toLowerCase()}-${pfNum.toLowerCase()}`,
      station_code: code,
      platform_number: pfNum,
      platform_name: platform_name || `Platform ${pfNum}`,
      platform_type: platform_type || 'ISLAND',
      is_active: true,
      last_verified_at: new Date().toISOString(),
      source: 'Admin Verified Entry',
      verification_status: 'VERIFIED',
    };

    MASTER_PLATFORMS.push(newPf);
    res.json({ success: true, message: `Platform ${pfNum} added to station ${code}.`, data: newPf });
  }

  // --- DATASET IMPORT & EXPORT PIPELINE ---
  static async importDataset(req: Request, res: Response) {
    try {
      const { type, payload } = req.body; // type: 'stations' | 'platforms' | 'routes'
      if (!type || !payload) {
        return res.status(400).json({ success: false, error: 'Both "type" and "payload" are required.' });
      }

      let report: any;
      if (type === 'stations') {
        report = validateStations(payload);
        if (report.valid > 0) {
          for (const rec of report.records) {
            const idx = MASTER_STATIONS.findIndex((s) => s.station_code === rec.station_code);
            if (idx >= 0) MASTER_STATIONS[idx] = rec;
            else MASTER_STATIONS.push(rec);
          }
        }
      } else if (type === 'platforms') {
        report = validatePlatforms(payload);
        if (report.valid > 0) {
          for (const rec of report.records) {
            const idx = MASTER_PLATFORMS.findIndex(
              (p) => p.station_code === rec.station_code && p.platform_number === rec.platform_number
            );
            if (idx >= 0) MASTER_PLATFORMS[idx] = rec;
            else MASTER_PLATFORMS.push(rec);
          }
        }
      } else if (type === 'routes') {
        report = validateRoutes(payload);
        if (report.validRoutes > 0) {
          for (const rec of report.records) {
            const idx = MASTER_ROUTES.findIndex((r) => r.route_code === rec.route_code);
            if (idx >= 0) MASTER_ROUTES[idx] = rec;
            else MASTER_ROUTES.push(rec);
          }
        }
      } else {
        return res.status(400).json({ success: false, error: `Invalid import type: ${type}` });
      }

      res.json({
        success: true,
        message: `Import processed for type: ${type}`,
        report,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async exportDataset(_req: Request, res: Response) {
    res.json({
      success: true,
      exported_at: new Date().toISOString(),
      data_version: DATA_VERSION,
      data: {
        zones: MASTER_ZONES,
        divisions: MASTER_DIVISIONS,
        stations: MASTER_STATIONS,
        aliases: MASTER_STATION_ALIASES,
        platforms: MASTER_PLATFORMS,
        railway_lines: MASTER_RAILWAY_LINES,
        routes: MASTER_ROUTES,
      },
    });
  }
}
