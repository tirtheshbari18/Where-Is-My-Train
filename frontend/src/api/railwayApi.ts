// Railway API Client for WHERE IS MY TRAIN
import { extractStationCode } from '../utils/stationResolver.js';
import { normalizeDate } from '../utils/dateNormalizer.js';
import { getFallbackTrainsBetween } from './fallbackRailwayData.js';

/**
 * Base URL for every railway request.
 *
 * Defaults to the same-origin `/api` prefix, which is what both the local Vite
 * dev proxy and the Vercel rewrite (`/api/*` -> `api/index.js`) serve.
 * Override it with `VITE_API_BASE_URL` when the API is hosted elsewhere, e.g.
 *   VITE_API_BASE_URL=https://railway-api.example.com/api
 * A trailing slash is tolerated so `https://host/api/` and `https://host/api`
 * behave identically.
 */
const configuredBase = String(import.meta.env.VITE_API_BASE_URL || '/api').trim();
export const API_BASE = configuredBase.replace(/\/+$/, '') || '/api';

/** Hard ceiling for a single API round-trip so the UI never spins forever. */
const REQUEST_TIMEOUT_MS = 15000;
/** Total attempts (first try + one automatic retry on transient failures). */
const MAX_ATTEMPTS = 2;

export interface TrainSummary {
  trainNumber: string;
  trainName: string;
  sourceCode: string;
  sourceName: string;
  destinationCode: string;
  destinationName: string;
  trainType: string;
  runningDays: string[];
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  distanceKm: number;
  zone?: string;
  hasPantry?: boolean;
  platform?: string;
  currentStatus?: string;
  delayMinutes?: number;
  isLive?: boolean;
}

export interface TrainStop {
  stopSequence: number;
  stationCode: string;
  stationName: string;
  scheduledArrival: string;
  scheduledDeparture: string;
  haltMinutes: number;
  distanceFromSourceKm: number;
  dayCount: number;
  platform?: string;
  platform_number?: string;
  is_stop?: boolean;
  sequence_number?: number;
  actualArrival?: string;
  actualDeparture?: string;
  latitude: number;
  longitude: number;
}

export interface CoachInfo {
  position: number;
  code: string;
  type: string;
  hasPantry?: boolean;
}

export interface TrainCoachComposition {
  trainNumber: string;
  trainName: string;
  source: string;
  confidence: string;
  coaches: CoachInfo[];
}

export interface IntermediateStation {
  stopSequence: number;
  stationCode: string;
  stationName: string;
  scheduledArrival: string;
  scheduledDeparture: string;
  haltMinutes: number;
  actualArrival?: string;
  actualDeparture?: string;
  delayMinutes?: number;
  platform?: string;
  distanceFromSourceKm: number;
  dayCount: number;
  zone: string;
  division: string;
  address: string;
  speedKmH?: number;
  elevationMeters?: number;
  actionType?: 'STOP' | 'PASS' | 'CROSS' | 'OVERTAKE' | 'OVERTAKEN';
  notes?: string;
  latitude: number;
  longitude: number;
}

export interface RouteSegment {
  fromStationCode: string;
  fromStationName: string;
  toStationCode: string;
  toStationName: string;
  distanceKm: number;
  intermediateCount: number;
  intermediateStations: IntermediateStation[];
}

export interface TrainOperation {
  id: string;
  stationCode: string;
  stationName: string;
  trainNumber: string;
  trainName: string;
  otherTrainNumber: string;
  otherTrainName: string;
  otherTrainRoute: string;
  type: string;
  label?: string;
  scheduledTime: string;
  actualTime?: string;
  platform?: string;
  direction?: 'UP' | 'DOWN' | 'BOTH' | string;
  description: string;
  source?: string;
  sourceUrl?: string;
  retrievedAt?: string;
  lastUpdated?: string;
}

export interface RailwaySection {
  id: string;
  sectionName: string;
  fromCode: string;
  fromName: string;
  toCode: string;
  toName: string;
  distanceKm: number;
  speedLimitKmH: number;
  trackType: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUADRUPLE';
  electrification: 'NONE' | 'ELECTRIC_25KV' | 'DIESEL';
  zone: string;
  division: string;
  coordinates: [number, number][];
}

export interface PlatformUpdate {
  id: string;
  trainNumber: string;
  stationCode: string;
  stationName: string;
  oldPlatform: string;
  newPlatform: string;
  source: string;
  updatedAt: string;
  isOfficial?: boolean;
}

export interface DetailedTimetableRow {
  sequence: number;
  track: string;
  stationCode: string;
  stationName: string;
  xo: 'X' | 'O' | '-';
  note: string;
  arrival: string;
  averageArrival: string;
  departure: string;
  averageDeparture: string;
  haltMinutes: number;
  platform: string;
  dayCount: number;
  distanceKm: number;
  speedKmH: number;
  elevationMeters: number;
  zone: string;
  division: string;
  address: string;
  actionType: 'STOP' | 'PASS' | 'CROSS' | 'OVERTAKE' | 'OVERTAKEN';
  isIntermediate?: boolean;
}

export interface RunningStatus {
  trainNumber: string;
  trainName: string;
  journeyDate: string;
  status: string;
  statusMessage: string;
  lastReportedStation: {
    code: string;
    name: string;
    actualArrival?: string;
    actualDeparture?: string;
    delayMinutes: number;
    platform?: string;
  } | null;
  previousStation: {
    code: string;
    name: string;
    passedAt?: string;
    delayMinutes: number;
  } | null;
  nextStation: {
    code: string;
    name: string;
    expectedArrival: string;
    expectedDeparture: string;
    delayMinutes: number;
    platform?: string;
    distanceRemainingKm?: number;
  } | null;
  currentStationTimelineIndex: number;
  delayMinutes: number;
  expectedArrivalAtDestination: string;
  latitude?: number;
  longitude?: number;
  positionType: 'station' | 'gps' | 'estimated';
  speedKmH?: number;
  locoNumber?: string;
  source: string;
  dataSourceConfidence: string;
  updatedAt: string;
  dataFreshnessText: string;
}

export interface StationLocation {
  code: string;
  name: string;
  state?: string;
  zone?: string;
  division?: string;
  latitude: number;
  longitude: number;
  numberOfPlatforms: number;
  category?: string;
  wifiAvailable?: boolean;
  distanceKm?: number;
}

export interface StationDetailData extends StationLocation {
  officialName?: string;
  district?: string;
  city?: string;
  isJunction?: boolean;
  isTerminal?: boolean;
  platforms?: Array<{
    platformNumber: string;
    platformName?: string;
    platformType: string;
    verificationStatus: string;
  }>;
  previousStation?: { code: string; name: string; distanceKm: number };
  nextStation?: { code: string; name: string; distanceKm: number };
  routeKm?: string;
  railwayLines?: string[];
  source?: string;
  sourceType?: string;
  lastVerifiedAt?: string;
}

export interface RailwayRouteStationItem {
  sequence_order: number;
  station_code: string;
  station_name: string;
  km_from_origin: number;
  distance_from_previous_km: number;
  distance_to_next_km: number;
  is_junction: boolean;
}

export interface RailwayRouteDetail {
  route_code: string;
  route_name: string;
  origin_station_code: string;
  dest_station_code: string;
  total_distance_km: number;
  direction: 'DOWN' | 'UP';
  active: boolean;
  stations: RailwayRouteStationItem[];
}

export interface LiveStationTrain {
  trainNumber: string;
  trainName: string;
  sourceCode: string;
  sourceName: string;
  destinationCode: string;
  destinationName: string;
  trainType: string;
  scheduledTime: string;
  expectedTime: string;
  delayMinutes: number;
  platform: string;
  status: string;
  type: 'ARRIVAL' | 'DEPARTURE';
}

export interface LiveStationBoard {
  stationCode: string;
  stationName: string;
  zone: string;
  division?: string;
  lastUpdated: string;
  arrivals: LiveStationTrain[];
  departures: LiveStationTrain[];
  delayedTrains: LiveStationTrain[];
  cancelledTrains: LiveStationTrain[];
}

export interface TrainException {
  trainNumber: string;
  trainName: string;
  sourceCode: string;
  sourceName: string;
  destCode: string;
  destName: string;
  exceptionType: 'CANCELLED' | 'DIVERTED' | 'RESCHEDULED' | 'SPECIAL';
  reason: string;
  effectiveDate: string;
  divertedRoute?: string;
  rescheduledTime?: string;
}

export interface RailwayZoneInfo {
  code: string;
  name: string;
  headquarters: string;
  divisions: string[];
}

export interface PnrStatus {
  pnr: string;
  trainNumber: string;
  trainName: string;
  dateOfJourney: string;
  fromStation: string;
  toStation: string;
  boardingPoint: string;
  reservationClass: string;
  chartStatus: string;
  passengers: Array<{
    passengerNumber: number;
    bookingStatus: string;
    currentStatus: string;
    coach?: string;
    berth?: number;
    berthType?: string;
  }>;
  isAuthorizedProvider: boolean;
  notice: string;
}

/** Result of GET /api/trains/:number/segment?from=&to= */
export interface TrainSegmentResult {
  trainNumber: string;
  trainName: string;
  fromStation: {
    code: string;
    name: string;
    scheduledDeparture: string;
    distanceFromSourceKm: number;
    platform?: string;
  };
  toStation: {
    code: string;
    name: string;
    scheduledArrival: string;
    distanceFromSourceKm: number;
    platform?: string;
  };
  journeyDistanceKm: number;
  journeyDurationMinutes: number;
  intermediateStops: TrainStop[];
  hasIntermediateStops: boolean;
  message?: string;
}

/**
 * Admin credentials are NEVER bundled into the frontend.
 * The key is only sent when the operator has entered it at runtime (Admin page),
 * and production refuses admin access entirely when the server has no ADMIN_API_KEY.
 */
const ADMIN_KEY_STORAGE_KEY = 'wimt_admin_api_key';

export function getAdminKey(): string {
  try {
    return window.localStorage.getItem(ADMIN_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setAdminKey(key: string): void {
  try {
    if (key) window.localStorage.setItem(ADMIN_KEY_STORAGE_KEY, key);
    else window.localStorage.removeItem(ADMIN_KEY_STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Turn any failed response into a short, human-readable message (never a stack trace). */
function toFriendlyError(status: number, json: any): string {
  // Gateway/upstream failures are always "we could not reach the service" — never
  // surface the raw server text, and make sure the caller recognises it as a
  // connectivity problem so it can fall back to cached/offline data.
  if (status >= 500) return 'Unable to connect to railway data service.';

  const serverMsg =
    typeof json?.error === 'string'
      ? json.error
      : typeof json?.error?.message === 'string'
      ? json.error.message
      : typeof json?.message === 'string'
      ? json.message
      : null;
  if (serverMsg && serverMsg.length <= 200 && !/[A-Za-z]:\\|node_modules/.test(serverMsg)) {
    return serverMsg;
  }
  if (status === 400) return 'Invalid railway query parameters. Please check station codes and date.';
  if (status === 401 || status === 403) return 'You are not authorised to perform this action.';
  if (status === 404) return 'The requested railway data was not found.';
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  return `Request failed (status ${status}).`;
}

/**
 * True when the failure means "the railway service could not be reached"
 * (offline, CORS, DNS, timeout, gateway error) rather than a bad query.
 * Callers use this to decide whether it is safe to fall back to cached/demo data.
 */
export function isConnectionError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase();
  return (
    !msg ||
    msg.includes('railway data service') ||
    msg.includes('internal railway service error') ||
    msg.includes('connect') ||
    msg.includes('reach') ||
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('load failed') ||
    msg.includes('timed out') ||
    msg.includes('abort') ||
    msg.includes('socket') ||
    // gateway status codes, but never a bare "500" inside e.g. a train number
    /\b(500|502|503|504)\b/.test(msg)
  );
}

/** `fetch` with an abort timer, so a hung upstream can never wedge the UI. */
async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...((options?.headers as Record<string, string>) || {}),
  };
  const adminKey = getAdminKey();
  if (adminKey) headers['x-admin-key'] = adminKey;

  const method = (options?.method || 'GET').toUpperCase();
  const canRetry = method === 'GET' || method === 'HEAD';

  let lastError: Error = new Error('Unable to connect to railway data service.');

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response;
    try {
      res = await fetchWithTimeout(url, { ...options, headers });
    } catch (err: any) {
      const reason = err?.name === 'AbortError' ? 'request timed out' : err?.message || err;
      console.error(`[RailwayAPI Network Error] ${url} (attempt ${attempt}/${MAX_ATTEMPTS}):`, reason);
      lastError = new Error('Unable to connect to railway data service.');
      if (attempt < MAX_ATTEMPTS && canRetry) {
        await sleep(400);
        continue;
      }
      throw lastError;
    }

    // Transient upstream failures are worth one retry before we give up.
    const transient = res.status >= 500 || res.status === 429;
    if (transient && attempt < MAX_ATTEMPTS && canRetry) {
      console.warn(`[RailwayAPI Retryable] ${url} -> Status ${res.status}, retrying...`);
      await sleep(400);
      continue;
    }

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    console.log(`[RailwayAPI] ${method} ${url} -> Status ${res.status}`);

    if (!res.ok) {
      console.error(`[RailwayAPI Error] Status: ${res.status} ${res.statusText}`, json);
      throw new Error(toFriendlyError(res.status, json));
    }
    if (json === null) {
      console.error(`[RailwayAPI Error] Invalid JSON from ${url}`);
      throw new Error('Received an invalid response from the server.');
    }
    return json;
  }

  throw lastError;
}

export const railwayApi = {
  async searchTrains(q: string): Promise<TrainSummary[]> {
    try {
      const res = await fetchJson<{ success: boolean; data: TrainSummary[] }>(
        `${API_BASE}/trains/search?q=${encodeURIComponent(q)}`
      );
      if (res && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
      // If live returns empty, attempt fallback match
      const pool = getFallbackTrainsBetween('BOR', 'DRD');
      const term = q.toLowerCase().trim();
      const matches = pool.filter(
        (t) =>
          t.trainNumber.toLowerCase().includes(term) ||
          t.trainName.toLowerCase().includes(term) ||
          t.sourceName.toLowerCase().includes(term) ||
          t.destinationName.toLowerCase().includes(term)
      );
      return matches.length > 0 ? matches : (res?.data || []);
    } catch (err) {
      if (isConnectionError(err)) {
        console.warn(`[RailwayAPI] Network connection error during search for "${q}". Serving fallback dataset.`);
        const pool = getFallbackTrainsBetween('BOR', 'DRD');
        const term = q.toLowerCase().trim();
        const matches = pool.filter(
          (t) =>
            t.trainNumber.toLowerCase().includes(term) ||
            t.trainName.toLowerCase().includes(term) ||
            t.sourceName.toLowerCase().includes(term) ||
            t.destinationName.toLowerCase().includes(term)
        );
        if (matches.length > 0) return matches;
      }
      throw err;
    }
  },

  async getTrain(number: string): Promise<TrainSummary & { schedule: TrainStop[]; coaches?: TrainCoachComposition; locoType?: string }> {
    try {
      const res = await fetchJson<{ success: boolean; data: any }>(
        `${API_BASE}/trains/${encodeURIComponent(number)}`
      );
      return res.data;
    } catch (err) {
      if (isConnectionError(err)) {
        console.warn(`[RailwayAPI] Network connection error fetching train ${number}. Serving fallback data.`);
        const pool = getFallbackTrainsBetween('BOR', 'DRD');
        const found = pool.find((t) => t.trainNumber === number);
        if (found) {
          return {
            ...found,
            schedule: [
              {
                stopSequence: 1,
                stationCode: found.sourceCode,
                stationName: found.sourceName,
                scheduledArrival: 'START',
                scheduledDeparture: found.departureTime,
                haltMinutes: 0,
                distanceFromSourceKm: 0,
                dayCount: 1,
                platform: '1',
                latitude: 19.8,
                longitude: 72.75,
              },
              {
                stopSequence: 2,
                stationCode: found.destinationCode,
                stationName: found.destinationName,
                scheduledArrival: found.arrivalTime,
                scheduledDeparture: 'END',
                haltMinutes: 0,
                distanceFromSourceKm: found.distanceKm,
                dayCount: 1,
                platform: '2',
                latitude: 19.97,
                longitude: 72.73,
              },
            ],
          };
        }
      }
      throw err;
    }
  },

  async getTrainSchedule(number: string): Promise<TrainStop[]> {
    try {
      const res = await fetchJson<{ success: boolean; data: TrainStop[] }>(
        `${API_BASE}/trains/${encodeURIComponent(number)}/schedule`
      );
      return res.data;
    } catch (err) {
      if (isConnectionError(err)) {
        const pool = getFallbackTrainsBetween('BOR', 'DRD');
        const found = pool.find((t) => t.trainNumber === number);
        if (found) {
          return [
            {
              stopSequence: 1,
              stationCode: found.sourceCode,
              stationName: found.sourceName,
              scheduledArrival: 'START',
              scheduledDeparture: found.departureTime,
              haltMinutes: 0,
              distanceFromSourceKm: 0,
              dayCount: 1,
              platform: '1',
              latitude: 19.8,
              longitude: 72.75,
            },
            {
              stopSequence: 2,
              stationCode: found.destinationCode,
              stationName: found.destinationName,
              scheduledArrival: found.arrivalTime,
              scheduledDeparture: 'END',
              haltMinutes: 0,
              distanceFromSourceKm: found.distanceKm,
              dayCount: 1,
              platform: '2',
              latitude: 19.97,
              longitude: 72.73,
            },
          ];
        }
      }
      throw err;
    }
  },

  async getRunningStatus(
    number: string,
    date?: string
  ): Promise<{ status: RunningStatus; isStale: boolean; staleWarning?: string }> {
    const url = `${API_BASE}/trains/${encodeURIComponent(number)}/status${date ? `?date=${date}` : ''}`;
    try {
      const res = await fetchJson<{
        success: boolean;
        data: RunningStatus;
        isStale: boolean;
        staleWarning?: string;
      }>(url);
      return { status: res.data, isStale: res.isStale, staleWarning: res.staleWarning };
    } catch (err) {
      if (isConnectionError(err)) {
        const pool = getFallbackTrainsBetween('BOR', 'DRD');
        const found = pool.find((t) => t.trainNumber === number);
        const tName = found ? found.trainName : `Train ${number}`;
        const sCode = found ? found.sourceCode : 'BOR';
        const sName = found ? found.sourceName : 'Boisar';
        const dCode = found ? found.destinationCode : 'DRD';
        const dName = found ? found.destinationName : 'Dahanu Road';

        return {
          status: {
            trainNumber: number,
            trainName: tName,
            journeyDate: date || new Date().toISOString().slice(0, 10),
            status: 'RUNNING',
            statusMessage: 'Operating on expected schedule (offline estimate)',
            lastReportedStation: {
              code: sCode,
              name: sName,
              actualDeparture: found?.departureTime || '10:00 AM',
              delayMinutes: 0,
              platform: '1',
            },
            previousStation: null,
            nextStation: {
              code: dCode,
              name: dName,
              expectedArrival: found?.arrivalTime || '10:25 AM',
              expectedDeparture: 'END',
              delayMinutes: 0,
              platform: '2',
            },
            currentStationTimelineIndex: 0,
            delayMinutes: 0,
            expectedArrivalAtDestination: found?.arrivalTime || '10:25 AM',
            positionType: 'estimated',
            source: 'Fallback Timetable',
            dataSourceConfidence: 'ESTIMATED',
            updatedAt: new Date().toISOString(),
            dataFreshnessText: 'Offline Schedule',
          },
          isStale: true,
          staleWarning: 'Live GPS feed unreachable. Showing scheduled timetable estimate.',
        };
      }
      throw err;
    }
  },

  async getTrainRoute(number: string): Promise<{ coordinates: Array<{ lat: number; lng: number; stationCode: string; stationName: string; sequence: number }> }> {
    const res = await fetchJson<{ success: boolean; data: any }>(
      `${API_BASE}/trains/${encodeURIComponent(number)}/route`
    );
    return res.data;
  },

  async getCoachComposition(number: string): Promise<TrainCoachComposition> {
    const res = await fetchJson<{ success: boolean; data: TrainCoachComposition }>(
      `${API_BASE}/trains/${encodeURIComponent(number)}/coaches`
    );
    return res.data;
  },

  async getTrainsBetween(from: string, to: string, date?: string): Promise<TrainSummary[]> {
    const cleanFrom = extractStationCode(from) || from.trim().toUpperCase();
    const cleanTo = extractStationCode(to) || to.trim().toUpperCase();
    const cleanDate = date ? normalizeDate(date).isoDate : undefined;

    const queryParts = [
      `from=${encodeURIComponent(cleanFrom)}`,
      `to=${encodeURIComponent(cleanTo)}`,
    ];
    if (cleanDate) queryParts.push(`date=${encodeURIComponent(cleanDate)}`);

    const url = `${API_BASE}/trains-between?${queryParts.join('&')}`;
    try {
      const res = await fetchJson<{ success: boolean; data: TrainSummary[] }>(url);
      if (res && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
      // If live returned empty, check if we have fallback data
      const fallback = getFallbackTrainsBetween(cleanFrom, cleanTo);
      return fallback.length > 0 ? fallback : (res?.data || []);
    } catch (err: any) {
      if (isConnectionError(err)) {
        console.warn(`[RailwayAPI] Network/connection error fetching trains between ${cleanFrom} and ${cleanTo}. Serving fallback timetable.`);
        const fallback = getFallbackTrainsBetween(cleanFrom, cleanTo);
        if (fallback.length > 0) {
          return fallback;
        }
      }
      throw err;
    }
  },

  async searchStations(q: string): Promise<StationLocation[]> {
    const res = await fetchJson<{ success: boolean; data: StationLocation[] }>(
      `${API_BASE}/stations/search?q=${encodeURIComponent(q)}`
    );
    return res.data;
  },

  async getStation(code: string): Promise<StationLocation> {
    const res = await fetchJson<{ success: boolean; data: StationLocation }>(
      `${API_BASE}/stations/${encodeURIComponent(code)}`
    );
    return res.data;
  },

  async getLiveStation(code: string, hours: number = 4): Promise<LiveStationBoard> {
    const res = await fetchJson<{ success: boolean; data: LiveStationBoard }>(
      `${API_BASE}/stations/${encodeURIComponent(code)}/live?hours=${hours}`
    );
    return res.data;
  },

  async getNearbyStations(lat: number, lng: number, radiusKm: number = 60): Promise<StationLocation[]> {
    const res = await fetchJson<{ success: boolean; data: StationLocation[] }>(
      `${API_BASE}/nearby-stations?lat=${lat}&lng=${lng}&radius=${radiusKm}`
    );
    return res.data;
  },

  async getExceptions(type?: string): Promise<TrainException[]> {
    const url = `${API_BASE}/exceptions${type ? `?type=${type}` : ''}`;
    const res = await fetchJson<{ success: boolean; data: TrainException[] }>(url);
    return res.data;
  },

  async getZones(): Promise<RailwayZoneInfo[]> {
    const res = await fetchJson<{ success: boolean; data: RailwayZoneInfo[] }>(
      `${API_BASE}/zones`
    );
    return res.data;
  },

  async getGeneralAlerts(): Promise<any[]> {
    const res = await fetchJson<{ success: boolean; data: any[] }>(
      `${API_BASE}/alerts`
    );
    return res.data;
  },

  async getPnrStatus(pnr: string): Promise<{ data: PnrStatus; officialPortalUrl: string; complianceNotice: string }> {
    const res = await fetchJson<any>(`${API_BASE}/pnr/${encodeURIComponent(pnr)}`);
    return res;
  },

  async getAdminProviders(): Promise<any> {
    const res = await fetchJson<any>(`${API_BASE}/admin/providers`);
    return res.data;
  },

  async setPrimaryProvider(providerCode: string): Promise<any> {
    const res = await fetchJson<any>(`${API_BASE}/admin/primary-provider`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerCode }),
    });
    return res;
  },

  async clearCache(): Promise<any> {
    const res = await fetchJson<any>(`${API_BASE}/admin/cache/clear`, {
      method: 'POST',
    });
    return res;
  },

  async getIntermediateStations(trainNumber: string, from?: string, to?: string): Promise<RouteSegment[]> {
    let url = `${API_BASE}/trains/${encodeURIComponent(trainNumber)}/intermediate`;
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (params.toString()) url += `?${params.toString()}`;
    const res = await fetchJson<{ success: boolean; data: RouteSegment[] }>(url);
    return res.data;
  },

  async getTrainOperations(trainNumber?: string, station?: string): Promise<TrainOperation[]> {
    let url = trainNumber
      ? `${API_BASE}/trains/${encodeURIComponent(trainNumber)}/operations`
      : `${API_BASE}/train-operations`;
    if (station) {
      url += `?station=${encodeURIComponent(station)}`;
    }
    const res = await fetchJson<{ success: boolean; data: TrainOperation[] }>(url);
    return res.data;
  },

  async getPlatformUpdates(trainNumber: string, station?: string): Promise<PlatformUpdate[]> {
    let url = `${API_BASE}/trains/${encodeURIComponent(trainNumber)}/platforms`;
    if (station) {
      url += `?station=${encodeURIComponent(station)}`;
    }
    const res = await fetchJson<{ success: boolean; data: PlatformUpdate[] }>(url);
    return res.data;
  },

  async savePlatformUpdate(
    trainNumber: string,
    update: {
      stationCode: string;
      stationName?: string;
      oldPlatform?: string;
      newPlatform: string;
      source?: string;
    }
  ): Promise<PlatformUpdate> {
    const res = await fetchJson<{ success: boolean; data: PlatformUpdate; message: string }>(
      `${API_BASE}/trains/${encodeURIComponent(trainNumber)}/platforms`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      }
    );
    return res.data;
  },

  async getDetailedTimetable(trainNumber: string): Promise<DetailedTimetableRow[]> {
    const res = await fetchJson<{ success: boolean; data: DetailedTimetableRow[] }>(
      `${API_BASE}/trains/${encodeURIComponent(trainNumber)}/detailed-timetable`
    );
    return res.data;
  },

  async getRailwaySections(zone?: string, division?: string): Promise<RailwaySection[]> {
    const params = new URLSearchParams();
    if (zone && zone !== 'ALL') params.set('zone', zone);
    if (division && division !== 'ALL') params.set('division', division);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchJson<{ success: boolean; data: RailwaySection[] }>(
      `${API_BASE}/railway/sections${query}`
    );
    return res.data;
  },

  async getRailwayMapData(): Promise<{
    sections: RailwaySection[];
    stations: StationLocation[];
    speedLimits: Array<{ label: string; min: number; max: number; color: string; count: number }>;
  }> {
    const res = await fetchJson<{
      success: boolean;
      data: {
        sections: RailwaySection[];
        stations: StationLocation[];
        speedLimits: Array<{ label: string; min: number; max: number; color: string; count: number }>;
      };
    }>(`${API_BASE}/railway/map-data`);
    return res.data;
  },

  async getStationDetail(code: string): Promise<StationDetailData> {
    const res = await fetchJson<{ success: boolean; data: StationDetailData }>(
      `${API_BASE}/stations/${encodeURIComponent(code)}`
    );
    return res.data;
  },

  async getStationPlatforms(code: string): Promise<any[]> {
    const res = await fetchJson<{ success: boolean; data: any[] }>(
      `${API_BASE}/stations/${encodeURIComponent(code)}/platforms`
    );
    return res.data;
  },

  async getStationDepartures(code: string): Promise<{
    stationCode: string;
    stationName: string;
    total: number;
    data: Array<{
      trainNumber: string;
      trainName: string;
      destination: string;
      departureTime: string;
      platform: string;
      delay: string;
      status: string;
    }>;
  }> {
    const res = await fetchJson<any>(
      `${API_BASE}/stations/${encodeURIComponent(code)}/departures`
    );
    return res;
  },

  async getDivisions(zone?: string): Promise<any[]> {
    const q = zone ? `?zone=${encodeURIComponent(zone)}` : '';
    const res = await fetchJson<{ success: boolean; data: any[] }>(`${API_BASE}/divisions${q}`);
    return res.data;
  },

  async getRailwayLines(): Promise<any[]> {
    const res = await fetchJson<{ success: boolean; data: any[] }>(`${API_BASE}/railway-lines`);
    return res.data;
  },

  async getRoutes(): Promise<any[]> {
    const res = await fetchJson<{ success: boolean; data: any[] }>(`${API_BASE}/routes`);
    return res.data;
  },

  async getRoute(id: string): Promise<RailwayRouteDetail> {
    const res = await fetchJson<{ success: boolean; data: RailwayRouteDetail }>(
      `${API_BASE}/routes/${encodeURIComponent(id)}`
    );
    return res.data;
  },

  async searchRoutes(from: string, to: string): Promise<{
    success: boolean;
    from: string;
    to: string;
    authoritative_distance_km: number | null;
    matching_routes: any[];
  }> {
    const res = await fetchJson<any>(
      `${API_BASE}/routes/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    return res;
  },

  async getDataVersion(): Promise<any> {
    const res = await fetchJson<{ success: boolean; data: any }>(`${API_BASE}/data-version`);
    return res.data;
  },

  async getAdminMasterSummary(): Promise<any> {
    const res = await fetchJson<{ success: boolean; data: any }>(`${API_BASE}/admin/master-summary`);
    return res.data;
  },

  async getAdminStations(params: {
    page?: number;
    limit?: number;
    search?: string;
    zone?: string;
  }): Promise<{
    success: boolean;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    data: any[];
  }> {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.search) q.set('search', params.search);
    if (params.zone && params.zone !== 'ALL') q.set('zone', params.zone);
    const res = await fetchJson<any>(`${API_BASE}/admin/stations?${q.toString()}`);
    return res;
  },

  async addAdminStation(station: any): Promise<any> {
    const res = await fetchJson<any>(`${API_BASE}/admin/stations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(station),
    });
    return res;
  },

  async updateAdminStation(code: string, updates: any): Promise<any> {
    const res = await fetchJson<any>(`${API_BASE}/admin/stations/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res;
  },

  async deleteAdminStation(code: string): Promise<any> {
    const res = await fetchJson<any>(`${API_BASE}/admin/stations/${encodeURIComponent(code)}`, {
      method: 'DELETE',
    });
    return res;
  },

  async verifyAdminStation(code: string, verified_by?: string): Promise<any> {
    const res = await fetchJson<any>(
      `${API_BASE}/admin/stations/${encodeURIComponent(code)}/verify`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified_by }),
      }
    );
    return res;
  },

  async getAdminPlatforms(station_code?: string): Promise<any[]> {
    const q = station_code ? `?station_code=${encodeURIComponent(station_code)}` : '';
    const res = await fetchJson<{ success: boolean; data: any[] }>(`${API_BASE}/admin/platforms${q}`);
    return res.data;
  },

  async addAdminPlatform(platform: any): Promise<any> {
    const res = await fetchJson<any>(`${API_BASE}/admin/platforms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(platform),
    });
    return res;
  },

  async importAdminDataset(type: string, payload: any): Promise<any> {
    const res = await fetchJson<any>(`${API_BASE}/admin/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    });
    return res;
  },

  async exportAdminDataset(): Promise<any> {
    const res = await fetchJson<any>(`${API_BASE}/admin/export`);
    return res;
  },

  async getDataQualityReport(): Promise<any> {
    const res = await fetchJson<{ success: boolean; data: any }>(`${API_BASE}/data-quality-report`);
    return res.data;
  },

  /**
   * Get intermediate stops for a train between two stations.
   * Corresponds to GET /api/trains/:number/segment?from=&to=
   */
  async getTrainSegment(
    trainNumber: string,
    from: string,
    to: string
  ): Promise<TrainSegmentResult> {
    const res = await fetchJson<{ success: boolean; data: TrainSegmentResult }>(
      `${API_BASE}/trains/${encodeURIComponent(trainNumber)}/segment?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    return res.data;
  },
};
