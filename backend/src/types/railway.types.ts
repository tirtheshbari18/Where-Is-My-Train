// Normalized Domain Models for Indian Railway System

export type PositionType = 'gps' | 'station' | 'estimated';

export type TrainType =
  | 'Vande Bharat'
  | 'Rajdhani'
  | 'Shatabdi'
  | 'Superfast'
  | 'Express'
  | 'Duronto'
  | 'Tejas'
  | 'Garib Rath'
  | 'Jan Shatabdi'
  | 'Antyodaya'
  | 'Humsafar'
  | 'Passenger'
  | 'Special';

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
}

export interface CoachInfo {
  position: number;
  code: string; // e.g. "ENG", "PWR", "C1", "C2", "E1", "A1", "B1", "B2", "S1", "SL", "GEN", "GRD"
  type: 'Engine' | 'Executive Chair Car' | 'AC Chair Car' | 'AC 1 Tier' | 'AC 2 Tier' | 'AC 3 Tier' | 'AC 3 Economy' | 'Sleeper' | 'General' | 'Guard / Luggage';
  hasPantry?: boolean;
}

export interface TrainCoachComposition {
  trainNumber: string;
  trainName: string;
  source: string;
  confidence: 'High' | 'Medium' | 'Estimated';
  coaches: CoachInfo[];
}

export interface TrainStop {
  stopSequence: number;
  stationCode: string;
  stationName: string;
  state?: string;
  scheduledArrival: string; // "START" or "HH:mm"
  scheduledDeparture: string; // "END" or "HH:mm"
  actualArrival?: string;
  actualDeparture?: string;
  delayMinutesArrival?: number;
  delayMinutesDeparture?: number;
  haltMinutes: number;
  distanceFromSourceKm: number;
  dayCount: number;
  platform?: string;
  isCompleted?: boolean;
  isCurrent?: boolean;
  latitude: number;
  longitude: number;
}

export interface TrainSummary {
  trainNumber: string;
  trainName: string;
  sourceCode: string;
  sourceName: string;
  destinationCode: string;
  destinationName: string;
  trainType: TrainType;
  runningDays: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  distanceKm: number;
  zone?: string;
  hasPantry?: boolean;
}

export interface TrainDetail extends TrainSummary {
  schedule: TrainStop[];
  coaches?: TrainCoachComposition;
  locoType?: string;
}

export interface RunningStatus {
  trainNumber: string;
  trainName: string;
  journeyDate: string; // YYYY-MM-DD
  status: 'RUNNING' | 'SCHEDULED' | 'TERMINATED' | 'DELAYED' | 'CANCELLED' | 'DIVERTED' | 'RESCHEDULED';
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
  positionType: PositionType;
  speedKmH?: number;
  locoNumber?: string;
  source: string; // e.g. "Mock Railway Provider", "Official NTES Feed"
  dataSourceConfidence: 'Authoritative' | 'Licensed' | 'Simulated / Demo';
  updatedAt: string; // ISO 8601
  dataFreshnessText: string;
}

export interface LiveStationTrain {
  trainNumber: string;
  trainName: string;
  sourceCode: string;
  sourceName: string;
  destinationCode: string;
  destinationName: string;
  trainType: TrainType;
  scheduledTime: string;
  expectedTime: string;
  delayMinutes: number;
  platform: string;
  status: 'ON_TIME' | 'DELAYED' | 'ARRIVED' | 'DEPARTED' | 'CANCELLED';
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
  chartStatus: 'CHART PREPARED' | 'CHART NOT PREPARED';
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

export interface ProviderHealthStatus {
  providerCode: string;
  providerName: string;
  isEnabled: boolean;
  isPrimary: boolean;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  responseTimeMs: number;
  successRate: number;
  totalRequests: number;
  lastChecked: string;
  endpointUrl?: string;
}
