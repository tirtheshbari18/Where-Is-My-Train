// Railway API Client for WHERE IS MY TRAIN

const API_BASE = '/api';

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

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error?.message || `Request failed with status ${res.status}`);
  }
  return json;
}

export const railwayApi = {
  async searchTrains(q: string): Promise<TrainSummary[]> {
    const res = await fetchJson<{ success: boolean; data: TrainSummary[] }>(
      `${API_BASE}/trains/search?q=${encodeURIComponent(q)}`
    );
    return res.data;
  },

  async getTrain(number: string): Promise<TrainSummary & { schedule: TrainStop[]; coaches?: TrainCoachComposition; locoType?: string }> {
    const res = await fetchJson<{ success: boolean; data: any }>(
      `${API_BASE}/trains/${encodeURIComponent(number)}`
    );
    return res.data;
  },

  async getTrainSchedule(number: string): Promise<TrainStop[]> {
    const res = await fetchJson<{ success: boolean; data: TrainStop[] }>(
      `${API_BASE}/trains/${encodeURIComponent(number)}/schedule`
    );
    return res.data;
  },

  async getRunningStatus(
    number: string,
    date?: string
  ): Promise<{ status: RunningStatus; isStale: boolean; staleWarning?: string }> {
    const url = `${API_BASE}/trains/${encodeURIComponent(number)}/status${date ? `?date=${date}` : ''}`;
    const res = await fetchJson<{
      success: boolean;
      data: RunningStatus;
      isStale: boolean;
      staleWarning?: string;
    }>(url);
    return { status: res.data, isStale: res.isStale, staleWarning: res.staleWarning };
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
    const url = `${API_BASE}/trains-between?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${date ? `&date=${date}` : ''}`;
    const res = await fetchJson<{ success: boolean; data: TrainSummary[] }>(url);
    return res.data;
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
};
