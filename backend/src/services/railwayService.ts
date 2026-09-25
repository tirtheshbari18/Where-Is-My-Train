import { providerManager } from '../providers/providerManager.js';
import { cacheService } from './cacheService.js';
import {
  TrainSummary,
  TrainDetail,
  TrainStop,
  RunningStatus,
  StationLocation,
  LiveStationBoard,
  TrainException,
  TrainCoachComposition,
  PnrStatus,
  RouteSegment,
  TrainOperation,
  RailwaySection,
  PlatformUpdate,
  DetailedTimetableRow,
} from '../types/railway.types.js';
import { INDIAN_RAILWAY_ZONES } from '../providers/mock/mockRailwayData.js';

export class RailwayService {
  async searchTrains(query: string): Promise<{
    trains: TrainSummary[];
    source: string;
  }> {
    const cacheKey = `search:trains:${query.toLowerCase().trim()}`;
    const cached = cacheService.get<TrainSummary[]>(cacheKey);

    if (cached.data && !cached.isStale) {
      return { trains: cached.data, source: 'cache' };
    }

    const trains = await providerManager.searchTrains(query);
    cacheService.set(cacheKey, trains, 120); // 2 min cache
    return { trains, source: providerManager.getPrimaryProviderCode() };
  }

  async getTrainByNumber(trainNumber: string): Promise<TrainDetail | null> {
    const cleanNumber = trainNumber.trim();
    const cacheKey = `train:detail:${cleanNumber}`;
    const cached = cacheService.get<TrainDetail>(cacheKey);

    if (cached.data && !cached.isStale) {
      return cached.data;
    }

    const train = await providerManager.getTrainByNumber(cleanNumber);
    if (train) {
      cacheService.set(cacheKey, train, 300); // 5 min cache
    }
    return train;
  }

  async getTrainSchedule(trainNumber: string): Promise<TrainStop[]> {
    const cleanNumber = trainNumber.trim();
    const cacheKey = `train:schedule:${cleanNumber}`;
    const cached = cacheService.get<TrainStop[]>(cacheKey);

    if (cached.data && !cached.isStale) {
      return cached.data;
    }

    const schedule = await providerManager.getTrainSchedule(cleanNumber);
    if (schedule && schedule.length > 0) {
      cacheService.set(cacheKey, schedule, 3600); // 1 hour cache
    }
    return schedule;
  }

  async getRunningStatus(
    trainNumber: string,
    journeyDate?: string
  ): Promise<{
    status: RunningStatus | null;
    isStale: boolean;
    staleWarning?: string;
    cachedAgeSeconds?: number;
  }> {
    const cleanNumber = trainNumber.trim();
    const date = journeyDate || new Date().toISOString().split('T')[0];
    const cacheKey = `train:status:${cleanNumber}:${date}`;

    const cached = cacheService.get<RunningStatus>(cacheKey);

    // If cache is fresh (< 30s), return immediately
    if (cached.data && !cached.isStale && cached.ageSeconds < 30) {
      return {
        status: cached.data,
        isStale: false,
        cachedAgeSeconds: cached.ageSeconds,
      };
    }

    try {
      const liveStatus = await providerManager.getRunningStatus(cleanNumber, date);
      if (liveStatus) {
        cacheService.set(cacheKey, liveStatus, 45); // 45 seconds TTL
        return {
          status: liveStatus,
          isStale: false,
          cachedAgeSeconds: 0,
        };
      }
    } catch (err: any) {
      // If fetching fails but we have stale cache, return it with a clear warning
      if (cached.data) {
        return {
          status: cached.data,
          isStale: true,
          staleWarning: `Live railway data temporarily unreachable (${err.message}). Showing last known status from ${cached.ageSeconds}s ago.`,
          cachedAgeSeconds: cached.ageSeconds,
        };
      }
      throw err;
    }

    return {
      status: null,
      isStale: false,
    };
  }

  async getStation(code: string): Promise<StationLocation | null> {
    const cleanCode = code.toUpperCase().trim();
    const cacheKey = `station:${cleanCode}`;
    const cached = cacheService.get<StationLocation>(cacheKey);

    if (cached.data && !cached.isStale) {
      return cached.data;
    }

    const station = await providerManager.getStation(cleanCode);
    if (station) {
      cacheService.set(cacheKey, station, 3600);
    }
    return station;
  }

  async searchStations(query: string): Promise<StationLocation[]> {
    const cacheKey = `search:stations:${query.toLowerCase().trim()}`;
    const cached = cacheService.get<StationLocation[]>(cacheKey);

    if (cached.data && !cached.isStale) {
      return cached.data;
    }

    const stations = await providerManager.searchStations(query);
    cacheService.set(cacheKey, stations, 300);
    return stations;
  }

  async getLiveStation(code: string, hours: number = 4): Promise<LiveStationBoard | null> {
    const cleanCode = code.toUpperCase().trim();
    const cacheKey = `station:live:${cleanCode}:${hours}`;
    const cached = cacheService.get<LiveStationBoard>(cacheKey);

    if (cached.data && !cached.isStale && cached.ageSeconds < 30) {
      return cached.data;
    }

    const liveBoard = await providerManager.getLiveStation(cleanCode, hours);
    if (liveBoard) {
      cacheService.set(cacheKey, liveBoard, 30); // 30s TTL
    }
    return liveBoard;
  }

  async getTrainsBetweenStations(
    fromCode: string,
    toCode: string,
    date?: string
  ): Promise<TrainSummary[]> {
    const cleanFrom = fromCode.toUpperCase().trim();
    const cleanTo = toCode.toUpperCase().trim();
    const cacheKey = `trains:between:${cleanFrom}:${cleanTo}:${date || 'today'}`;

    const cached = cacheService.get<TrainSummary[]>(cacheKey);
    if (cached.data && !cached.isStale) {
      return cached.data;
    }

    const trains = await providerManager.getTrainsBetweenStations(
      cleanFrom,
      cleanTo,
      date
    );
    cacheService.set(cacheKey, trains, 120);
    return trains;
  }

  async getTrainExceptions(type?: string): Promise<TrainException[]> {
    const cacheKey = `trains:exceptions:${type || 'all'}`;
    const cached = cacheService.get<TrainException[]>(cacheKey);

    if (cached.data && !cached.isStale) {
      return cached.data;
    }

    const exceptions = await providerManager.getTrainExceptions(type);
    cacheService.set(cacheKey, exceptions, 300);
    return exceptions;
  }

  async getCoachComposition(
    trainNumber: string
  ): Promise<TrainCoachComposition | null> {
    const cleanNumber = trainNumber.trim();
    const cacheKey = `train:coaches:${cleanNumber}`;
    const cached = cacheService.get<TrainCoachComposition>(cacheKey);

    if (cached.data && !cached.isStale) {
      return cached.data;
    }

    const coaches = await providerManager.getCoachComposition(cleanNumber);
    if (coaches) {
      cacheService.set(cacheKey, coaches, 3600);
    }
    return coaches;
  }

  async getNearbyStations(
    latitude: number,
    longitude: number,
    radiusKm: number = 60
  ): Promise<Array<StationLocation & { distanceKm: number }>> {
    return providerManager.getNearbyStations(latitude, longitude, radiusKm);
  }

  async getPnrStatus(pnr: string): Promise<PnrStatus | null> {
    return providerManager.getPnrStatus(pnr);
  }

  async getIntermediateStations(
    trainNumber: string,
    fromCode?: string,
    toCode?: string
  ): Promise<RouteSegment[]> {
    return providerManager.getIntermediateStations(trainNumber, fromCode, toCode);
  }

  async getTrainOperations(
    stationCode?: string,
    trainNumber?: string
  ): Promise<TrainOperation[]> {
    return providerManager.getTrainOperations(stationCode, trainNumber);
  }

  async getRailwaySections(
    zone?: string,
    division?: string
  ): Promise<RailwaySection[]> {
    return providerManager.getRailwaySections(zone, division);
  }

  async getRailwayMapData(): Promise<{
    sections: RailwaySection[];
    stations: StationLocation[];
    speedLimits: Array<{ label: string; min: number; max: number; color: string; count: number }>;
  }> {
    return providerManager.getRailwayMapData();
  }

  async getPlatformUpdates(
    trainNumber: string,
    stationCode?: string
  ): Promise<PlatformUpdate[]> {
    return providerManager.getPlatformUpdates(trainNumber, stationCode);
  }

  async savePlatformUpdate(
    update: Omit<PlatformUpdate, 'id' | 'updatedAt'>
  ): Promise<PlatformUpdate> {
    return providerManager.savePlatformUpdate(update);
  }

  async getDetailedTimetable(trainNumber: string): Promise<DetailedTimetableRow[]> {
    return providerManager.getDetailedTimetable(trainNumber);
  }

  getRailwayZones() {
    return INDIAN_RAILWAY_ZONES;
  }
}

export const railwayService = new RailwayService();
