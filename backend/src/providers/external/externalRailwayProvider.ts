import { z } from 'zod';
import { IRailwayDataProvider } from '../RailwayDataProvider.interface.js';
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
  TrainSegmentResult,
  LiveTrainStatusType,
  NormalizedLiveStatus,
  TrainType,
} from '../../types/railway.types.js';
import { calculateDurationMinutes } from '../../utils/dateNormalizer.js';

// Structured Zod validation for external provider train responses
const ExternalStationSchema = z.object({
  code: z.string(),
  name: z.string(),
  state: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  platform: z.string().optional(),
});

const ExternalTrainSummarySchema = z.object({
  train_number: z.union([z.string(), z.number()]).transform((v) => String(v)),
  train_name: z.string(),
  train_type: z.string().optional(),
  from_station_code: z.string().optional(),
  from_station_name: z.string().optional(),
  to_station_code: z.string().optional(),
  to_station_name: z.string().optional(),
  departure_time: z.string().optional(),
  arrival_time: z.string().optional(),
  duration_minutes: z.number().optional(),
  distance_km: z.number().optional(),
  running_days: z.array(z.string()).optional(),
  has_pantry: z.boolean().optional(),
  platform: z.string().optional(),
  delay_minutes: z.number().optional(),
  status: z.string().optional(),
});

export class ExternalRailwayProvider implements IRailwayDataProvider {
  readonly code = 'external';
  readonly name = 'Configured Railway API Partner (Live Gateway)';

  private baseUrl: string;
  private apiKey: string;
  private apiHost: string;
  private timeoutMs: number;

  constructor() {
    this.baseUrl = (
      process.env.RAILWAY_API_BASE_URL ||
      process.env.LICENSED_PROVIDER_BASE_URL ||
      ''
    ).replace(/\/+$/, '');
    this.apiKey = (
      process.env.RAILWAY_API_KEY ||
      process.env.LICENSED_PROVIDER_API_KEY ||
      ''
    ).trim();
    this.apiHost = (process.env.RAILWAY_API_HOST || '').trim();
    this.timeoutMs = parseInt(process.env.RAILWAY_API_TIMEOUT_MS || '10000', 10);
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey || !this.baseUrl) {
      return false;
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(3000, this.timeoutMs));
      const res = await fetch(`${this.baseUrl}/healthcheck`, {
        headers: this.buildHeaders(),
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));
      return res.ok;
    } catch {
      return false;
    }
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'WhereIsMyTrain-Backend/1.0',
    };
    if (this.apiKey) {
      headers['X-API-KEY'] = this.apiKey;
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    if (this.apiHost) {
      headers['x-rapidapi-host'] = this.apiHost;
      headers['x-rapidapi-key'] = this.apiKey;
    }
    return headers;
  }

  /**
   * Executes HTTP request with controlled retries (attempt 1 immediate, attempt 2 after 1s, attempt 3 after 3s),
   * timeout handling via AbortController, and precise error classification.
   */
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    if (!this.apiKey) {
      const err: any = new Error(
        'RAILWAY_API_KEY is missing. Please configure RAILWAY_API_KEY in your server environment.'
      );
      err.code = 'MISSING_API_KEY';
      err.statusCode = 401;
      err.retryable = false;
      throw err;
    }

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const retryDelays = [0, 1000, 3000];

    for (let attempt = 0; attempt < retryDelays.length; attempt++) {
      if (attempt > 0) {
        await new Promise((res) => setTimeout(res, retryDelays[attempt]));
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      const startTime = performance.now();

      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...this.buildHeaders(),
            ...(options?.headers as Record<string, string> || {}),
          },
          signal: controller.signal,
        });

        const duration = Math.round(performance.now() - startTime);

        if (!response.ok) {
          const status = response.status;
          let bodyText = '';
          try {
            bodyText = await response.text();
          } catch {
            bodyText = '';
          }

          let errCode = 'PROVIDER_ERROR';
          let errMsg = `Railway provider returned HTTP ${status}.`;
          let retryable = false;

          if (status === 400) {
            errCode = 'INVALID_QUERY';
            errMsg = 'Invalid parameters sent to railway provider.';
          } else if (status === 401) {
            errCode = 'PROVIDER_UNAUTHORIZED';
            errMsg = 'Railway provider returned HTTP 401 Unauthorized. Check RAILWAY_API_KEY.';
          } else if (status === 403) {
            errCode = 'PROVIDER_FORBIDDEN';
            errMsg = 'Railway provider returned HTTP 403 Forbidden. Access is restricted.';
          } else if (status === 404) {
            errCode = 'NOT_FOUND';
            errMsg = 'Requested railway resource was not found.';
          } else if (status === 408) {
            errCode = 'TIMEOUT';
            errMsg = `Railway provider timed out after ${this.timeoutMs}ms.`;
            retryable = true;
          } else if (status === 429) {
            errCode = 'RATE_LIMITED';
            errMsg = 'Railway provider rate limit exceeded. Please wait a moment.';
            retryable = true;
          } else if (status >= 500) {
            errCode = 'PROVIDER_UNAVAILABLE';
            errMsg = 'Live railway data service is temporarily unavailable from upstream provider.';
            retryable = true;
          }

          if (attempt < retryDelays.length - 1 && retryable) {
            console.warn(
              `[ExternalRailwayProvider] Attempt ${attempt + 1} failed (${status} ${errMsg}). Retrying in ${retryDelays[attempt + 1]}ms...`
            );
            continue;
          }

          const error: any = new Error(errMsg);
          error.code = errCode;
          error.statusCode = status;
          error.retryable = retryable;
          error.details = { url, status, duration, responseSnippet: bodyText.slice(0, 150) };
          throw error;
        }

        const json = await response.json();
        return json as T;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          const timeoutErr: any = new Error(`Railway provider timed out after ${this.timeoutMs}ms.`);
          timeoutErr.code = 'TIMEOUT';
          timeoutErr.statusCode = 408;
          timeoutErr.retryable = true;
          if (attempt < retryDelays.length - 1) {
            continue;
          }
          throw timeoutErr;
        }

        if (attempt < retryDelays.length - 1 && err.retryable !== false) {
          continue;
        }
        throw err;
      } finally {
        clearTimeout(timer);
      }
    }

    throw new Error('All external railway provider retry attempts failed.');
  }

  async searchStations(query: string): Promise<StationLocation[]> {
    const raw = await this.request<any>(`/stations/search?q=${encodeURIComponent(query)}`);
    const list = Array.isArray(raw) ? raw : raw?.data || [];
    return list.map((item: any) => ({
      code: String(item.code || item.station_code || '').toUpperCase(),
      name: String(item.name || item.station_name || ''),
      state: item.state,
      zone: item.zone,
      division: item.division,
      latitude: Number(item.latitude || item.lat || 0),
      longitude: Number(item.longitude || item.lng || 0),
      numberOfPlatforms: Number(item.numberOfPlatforms || item.platforms || 1),
    }));
  }

  async getStation(code: string): Promise<StationLocation | null> {
    try {
      const raw = await this.request<any>(`/stations/${encodeURIComponent(code)}`);
      const item = raw?.data || raw;
      if (!item || !item.code) return null;
      return {
        code: String(item.code || code).toUpperCase(),
        name: String(item.name || ''),
        state: item.state,
        zone: item.zone,
        division: item.division,
        latitude: Number(item.latitude || 0),
        longitude: Number(item.longitude || 0),
        numberOfPlatforms: Number(item.numberOfPlatforms || 1),
      };
    } catch {
      return null;
    }
  }

  async getTrainsBetweenStations(
    fromCode: string,
    toCode: string,
    date?: string
  ): Promise<TrainSummary[]> {
    const cleanFrom = fromCode.toUpperCase().trim();
    const cleanTo = toCode.toUpperCase().trim();
    const queryDate = date || new Date().toISOString().split('T')[0];

    const raw = await this.request<any>(
      `/trains/between?from=${encodeURIComponent(cleanFrom)}&to=${encodeURIComponent(cleanTo)}&date=${encodeURIComponent(queryDate)}`
    );

    const rawList: any[] = Array.isArray(raw) ? raw : raw?.data || raw?.trains || [];
    const trains: TrainSummary[] = [];
    const seen = new Set<string>();

    for (const item of rawList) {
      const trainNumber = String(item.trainNumber || item.train_number || item.number || '').trim();
      const dedupKey = `${trainNumber}_${queryDate}`;
      if (!trainNumber || seen.has(dedupKey)) continue;
      seen.add(dedupKey);

      const trainName = String(item.trainName || item.train_name || item.name || `Train ${trainNumber}`);
      const depTime = item.departureTime || item.departure_time || item.from_departure_time || '00:00';
      const arrTime = item.arrivalTime || item.arrival_time || item.to_arrival_time || '00:00';
      const durationMins =
        item.durationMinutes ||
        item.duration_minutes ||
        calculateDurationMinutes(depTime, arrTime);

      const hours = Math.floor(durationMins / 60);
      const mins = durationMins % 60;
      const durationFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;

      const trainType = (item.trainType || item.train_type || 'Express') as TrainType;
      const distance = Number(item.distanceKm || item.distance_km || item.distance || 0);

      const normalized: TrainSummary = {
        trainNumber,
        trainName,
        sourceCode: String(item.sourceCode || item.from_station_code || cleanFrom).toUpperCase(),
        sourceName: String(item.sourceName || item.from_station_name || cleanFrom),
        destinationCode: String(item.destinationCode || item.to_station_code || cleanTo).toUpperCase(),
        destinationName: String(item.destinationName || item.to_station_name || cleanTo),
        fromStation: {
          code: String(item.sourceCode || item.from_station_code || cleanFrom).toUpperCase(),
          name: String(item.sourceName || item.from_station_name || cleanFrom),
        },
        toStation: {
          code: String(item.destinationCode || item.to_station_code || cleanTo).toUpperCase(),
          name: String(item.destinationName || item.to_station_name || cleanTo),
        },
        journeyDate: queryDate,
        trainType,
        runningDays: Array.isArray(item.runningDays || item.running_days)
          ? (item.runningDays || item.running_days)
          : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        departureTime: depTime,
        arrivalTime: arrTime,
        duration: durationFormatted,
        durationMinutes: durationMins,
        stops: item.stops || item.stopCount || undefined,
        distance,
        distanceKm: distance,
        zone: item.zone,
        hasPantry: Boolean(item.hasPantry ?? item.has_pantry),
        platform: item.platform ? String(item.platform) : undefined,
        currentStatus: item.currentStatus || item.status,
        delayMinutes: typeof item.delayMinutes === 'number' ? item.delayMinutes : undefined,
        isLive: Boolean(item.isLive),
      };

      trains.push(normalized);
    }

    return trains;
  }

  async getTrainByNumber(trainNumber: string): Promise<TrainDetail | null> {
    try {
      const raw = await this.request<any>(`/trains/${encodeURIComponent(trainNumber)}`);
      const item = raw?.data || raw;
      if (!item || !item.trainNumber) return null;
      return item as TrainDetail;
    } catch {
      return null;
    }
  }

  async getTrainSchedule(trainNumber: string): Promise<TrainStop[]> {
    const raw = await this.request<any>(`/trains/${encodeURIComponent(trainNumber)}/schedule`);
    const stops = Array.isArray(raw) ? raw : raw?.data || raw?.stops || [];
    return stops.map((s: any, idx: number) => ({
      stopSequence: s.stopSequence || s.sequence || idx + 1,
      stationCode: String(s.stationCode || s.station_code || '').toUpperCase(),
      stationName: String(s.stationName || s.station_name || ''),
      scheduledArrival: s.scheduledArrival || s.arrival_time || 'START',
      scheduledDeparture: s.scheduledDeparture || s.departure_time || 'END',
      haltMinutes: Number(s.haltMinutes || s.halt || 0),
      distanceFromSourceKm: Number(s.distanceFromSourceKm || s.distance || 0),
      dayCount: Number(s.dayCount || s.day || 1),
      platform: s.platform ? String(s.platform) : undefined,
      latitude: Number(s.latitude || 0),
      longitude: Number(s.longitude || 0),
    }));
  }

  async getRunningStatus(trainNumber: string, date?: string): Promise<RunningStatus | null> {
    const queryDate = date || new Date().toISOString().split('T')[0];
    const raw = await this.request<any>(
      `/trains/${encodeURIComponent(trainNumber)}/live?date=${encodeURIComponent(queryDate)}`
    );
    const data = raw?.data || raw;
    if (!data || !data.trainNumber) return null;

    const delay = typeof data.delayMinutes === 'number' ? data.delayMinutes : 0;
    const rawStatus = String(data.status || 'RUNNING').toUpperCase();

    let statusType: RunningStatus['status'] = 'RUNNING';
    if (rawStatus.includes('NOT_STARTED') || rawStatus.includes('SCHEDULED')) statusType = 'SCHEDULED';
    else if (rawStatus.includes('CANCEL')) statusType = 'CANCELLED';
    else if (rawStatus.includes('DIVERT')) statusType = 'DIVERTED';
    else if (rawStatus.includes('TERMINAT')) statusType = 'TERMINATED';
    else if (rawStatus.includes('RESCHED')) statusType = 'RESCHEDULED';
    else if (delay > 15) statusType = 'DELAYED';

    return {
      trainNumber: String(data.trainNumber),
      trainName: String(data.trainName || `Train ${trainNumber}`),
      journeyDate: queryDate,
      status: statusType,
      statusMessage: data.statusMessage || `Running ${delay > 0 ? `${delay} min late` : 'on time'}`,
      lastReportedStation: data.lastReportedStation
        ? {
            code: String(data.lastReportedStation.code || '').toUpperCase(),
            name: String(data.lastReportedStation.name || ''),
            actualArrival: data.lastReportedStation.actualArrival,
            actualDeparture: data.lastReportedStation.actualDeparture,
            delayMinutes: Number(data.lastReportedStation.delayMinutes || delay),
            platform: data.lastReportedStation.platform ? String(data.lastReportedStation.platform) : undefined,
          }
        : null,
      previousStation: data.previousStation
        ? {
            code: String(data.previousStation.code || '').toUpperCase(),
            name: String(data.previousStation.name || ''),
            passedAt: data.previousStation.passedAt,
            delayMinutes: Number(data.previousStation.delayMinutes || 0),
          }
        : null,
      nextStation: data.nextStation
        ? {
            code: String(data.nextStation.code || '').toUpperCase(),
            name: String(data.nextStation.name || ''),
            expectedArrival: data.nextStation.expectedArrival || 'On Time',
            expectedDeparture: data.nextStation.expectedDeparture || 'On Time',
            delayMinutes: Number(data.nextStation.delayMinutes || delay),
            platform: data.nextStation.platform ? String(data.nextStation.platform) : undefined,
            distanceRemainingKm: data.nextStation.distanceRemainingKm,
          }
        : null,
      currentStationTimelineIndex: Number(data.currentStationTimelineIndex || 0),
      delayMinutes: delay,
      expectedArrivalAtDestination: data.expectedArrivalAtDestination || 'On Time',
      latitude: data.latitude ? Number(data.latitude) : undefined,
      longitude: data.longitude ? Number(data.longitude) : undefined,
      positionType: data.latitude && data.longitude ? 'gps' : 'station',
      speedKmH: data.speedKmH ? Number(data.speedKmH) : undefined,
      source: 'External Licensed Railway Telemetry',
      dataSourceConfidence: 'Authoritative',
      updatedAt: data.updatedAt || new Date().toISOString(),
      dataFreshnessText: data.dataFreshnessText || 'Live Telemetry',
    };
  }

  async getLiveStation(code: string, hours: number = 4): Promise<LiveStationBoard | null> {
    try {
      const raw = await this.request<any>(`/stations/${encodeURIComponent(code)}/live?hours=${hours}`);
      return (raw?.data || raw) as LiveStationBoard;
    } catch {
      return null;
    }
  }

  async searchTrains(query: string): Promise<TrainSummary[]> {
    const raw = await this.request<any>(`/trains/search?q=${encodeURIComponent(query)}`);
    const list = Array.isArray(raw) ? raw : raw?.data || [];
    return list.map((item: any) => ({
      trainNumber: String(item.trainNumber || item.train_number),
      trainName: String(item.trainName || item.train_name),
      sourceCode: String(item.sourceCode || item.from_station_code || '').toUpperCase(),
      sourceName: String(item.sourceName || item.from_station_name || ''),
      destinationCode: String(item.destinationCode || item.to_station_code || '').toUpperCase(),
      destinationName: String(item.destinationName || item.to_station_name || ''),
      trainType: (item.trainType || item.train_type || 'Express') as TrainType,
      runningDays: item.runningDays || item.running_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      departureTime: item.departureTime || item.departure_time || '00:00',
      arrivalTime: item.arrivalTime || item.arrival_time || '00:00',
      durationMinutes: item.durationMinutes || item.duration_minutes || 60,
      distanceKm: item.distanceKm || item.distance_km || 0,
      hasPantry: item.hasPantry,
      platform: item.platform,
    }));
  }

  async getTrainExceptions(type?: string): Promise<TrainException[]> {
    try {
      const raw = await this.request<any>(`/exceptions${type ? `?type=${type}` : ''}`);
      return Array.isArray(raw) ? raw : raw?.data || [];
    } catch {
      return [];
    }
  }

  async getCoachComposition(trainNumber: string): Promise<TrainCoachComposition | null> {
    try {
      const raw = await this.request<any>(`/trains/${encodeURIComponent(trainNumber)}/coaches`);
      return (raw?.data || raw) as TrainCoachComposition;
    } catch {
      return null;
    }
  }

  async getNearbyStations(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ): Promise<Array<StationLocation & { distanceKm: number }>> {
    try {
      const raw = await this.request<any>(
        `/nearby-stations?lat=${latitude}&lng=${longitude}&radius=${radiusKm}`
      );
      return Array.isArray(raw) ? raw : raw?.data || [];
    } catch {
      return [];
    }
  }

  async getPnrStatus(pnr: string): Promise<PnrStatus | null> {
    try {
      const raw = await this.request<any>(`/pnr/${encodeURIComponent(pnr)}`);
      return (raw?.data || raw) as PnrStatus;
    } catch {
      return null;
    }
  }

  async getIntermediateStations(
    trainNumber: string,
    fromCode?: string,
    toCode?: string
  ): Promise<RouteSegment[]> {
    try {
      const raw = await this.request<any>(
        `/trains/${encodeURIComponent(trainNumber)}/intermediate?from=${fromCode || ''}&to=${toCode || ''}`
      );
      return Array.isArray(raw) ? raw : raw?.data || [];
    } catch {
      return [];
    }
  }

  async getTrainOperations(stationCode?: string, trainNumber?: string): Promise<TrainOperation[]> {
    try {
      const raw = await this.request<any>(
        `/train-operations?station=${stationCode || ''}&train=${trainNumber || ''}`
      );
      return Array.isArray(raw) ? raw : raw?.data || [];
    } catch {
      return [];
    }
  }

  async getRailwaySections(zone?: string, division?: string): Promise<RailwaySection[]> {
    try {
      const raw = await this.request<any>(
        `/railway/sections?zone=${zone || ''}&division=${division || ''}`
      );
      return Array.isArray(raw) ? raw : raw?.data || [];
    } catch {
      return [];
    }
  }

  async getRailwayMapData(): Promise<{
    sections: RailwaySection[];
    stations: StationLocation[];
    speedLimits: Array<{ label: string; min: number; max: number; color: string; count: number }>;
  }> {
    try {
      const raw = await this.request<any>(`/railway/map-data`);
      return raw?.data || raw;
    } catch {
      return { sections: [], stations: [], speedLimits: [] };
    }
  }

  async getPlatformUpdates(trainNumber: string, stationCode?: string): Promise<PlatformUpdate[]> {
    try {
      const raw = await this.request<any>(
        `/trains/${encodeURIComponent(trainNumber)}/platforms?station=${stationCode || ''}`
      );
      return Array.isArray(raw) ? raw : raw?.data || [];
    } catch {
      return [];
    }
  }

  async savePlatformUpdate(
    update: Omit<PlatformUpdate, 'id' | 'updatedAt'>
  ): Promise<PlatformUpdate> {
    const raw = await this.request<any>(`/trains/${encodeURIComponent(update.trainNumber)}/platforms`, {
      method: 'POST',
      body: JSON.stringify(update),
      headers: { 'Content-Type': 'application/json' },
    });
    return raw?.data || raw;
  }

  async getDetailedTimetable(trainNumber: string): Promise<DetailedTimetableRow[]> {
    try {
      const raw = await this.request<any>(
        `/trains/${encodeURIComponent(trainNumber)}/detailed-timetable`
      );
      return Array.isArray(raw) ? raw : raw?.data || [];
    } catch {
      return [];
    }
  }

  async getTrainSegment(
    trainNumber: string,
    fromCode: string,
    toCode: string
  ): Promise<TrainSegmentResult> {
    const raw = await this.request<any>(
      `/trains/${encodeURIComponent(trainNumber)}/segment?from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(toCode)}`
    );
    return raw?.data || raw;
  }
}
