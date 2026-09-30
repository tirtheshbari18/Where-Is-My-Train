// Normalized Domain Models for Indian Railway System

export type PositionType = 'gps' | 'station' | 'estimated';

export type TrainType =
  | 'Vande Bharat'
  | 'Rajdhani'
  | 'Shatabdi'
  | 'Jan Shatabdi'
  | 'Superfast'
  | 'Weekly Superfast'
  | 'Express'
  | 'Mail Express'
  | 'Weekly Express'
  | 'Daily Express'
  | 'Intercity Express'
  | 'Sampark Kranti'
  | 'Double Decker'
  | 'Duronto'
  | 'Tejas'
  | 'Garib Rath'
  | 'Humsafar'
  | 'Antyodaya'
  | 'Passenger'
  | 'Special'
  | 'Fast Local'
  | 'Slow Local'
  | 'AC Local'
  | 'Local'
  | 'MEMU'
  | 'DEMU'
  | 'EMU'
  | 'Metro'
  | 'Bus';

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
  type:
    | 'Engine'
    | 'Executive Chair Car'
    | 'AC Chair Car'
    | 'AC 1 Tier'
    | 'AC 1st Class'
    | 'AC 2 Tier'
    | 'AC 3 Tier'
    | 'AC 3 Economy'
    | 'Sleeper'
    | 'General'
    | 'Guard / Luggage'
    | 'Pantry Car'
    | 'Luggage & Generator Car'
    | 'Driving Trailer Coach (General)'
    | 'Motor Coach'
    | 'Trailer Coach'
    | 'Trailer Coach (Ladies)'
    | 'Trailer Coach (First Class)';
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
  platform_number?: string;
  is_stop?: boolean;
  sequence_number?: number;
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
  platform?: string;
  currentStatus?: string;
  delayMinutes?: number;
  isLive?: boolean;
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

// ---------------------------------------------------------
// Comprehensive Railway Information Architecture Types
// ---------------------------------------------------------

export type IntermediateActionType = 'STOP' | 'PASS' | 'CROSS' | 'OVERTAKE' | 'OPERATIONAL';

export interface IntermediateStation {
  stopSequence: number;
  stationCode: string;
  stationName: string;
  state?: string;
  scheduledArrival: string;
  scheduledDeparture: string;
  actualArrival?: string;
  actualDeparture?: string;
  haltMinutes: number;
  distanceFromSourceKm: number;
  dayCount: number;
  platform?: string;
  // Optional metadata: only populated when the provider genuinely supplies it.
  // Never fabricate these — the UI shows "Not available" when absent.
  speedKmH?: number;
  elevationMeters?: number;
  zone?: string;
  division?: string;
  address?: string;
  actionType: IntermediateActionType;
  latitude: number;
  longitude: number;
  isCompleted?: boolean;
  isCurrent?: boolean;
  notes?: string;
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

export type TrainOperationType =
  | 'CROSSING'
  | 'OVERTAKING'
  | 'OVERTAKEN'
  | 'PRECEDENCE'
  | 'PASSING'
  | 'PLATFORM_SHARING'
  | 'CREW_CHANGE'
  | 'LOCO_REVERSAL'
  | 'WATERING'
  | 'TECHNICAL_HALT'
  | 'PARALLEL_RUN'
  | 'ATTACH_DETACH'
  | 'MEETING'
  | string;

export interface TrainOperation {
  id: string;
  type: TrainOperationType;
  label?: string;
  stationCode: string;
  stationName: string;
  trainNumber: string;
  trainName: string;
  otherTrainNumber: string;
  otherTrainName: string;
  otherTrainRoute: string;
  scheduledTime: string;
  actualTime?: string;
  platform?: string;
  direction?: 'UP' | 'DOWN' | 'BOTH' | string;
  description: string;
  source: string;
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
  electrification: 'ELECTRIC_25KV' | 'DIESEL' | 'UNDER_ELECTRIFICATION';
  zone: string;
  division: string;
  coordinates: [number, number][];
}

export interface PlatformUpdate {
  id: string;
  trainNumber: string;
  stationCode: string;
  stationName: string;
  oldPlatform?: string;
  newPlatform: string;
  source: string; // e.g. "Station PA Announcement", "User Confirmed", "Station Master"
  updatedAt: string; // ISO 8601
  isOfficial: boolean;
}

export interface DetailedTimetableRow {
  index: number;
  track: string;
  stationCode: string;
  stationName: string;
  xoType: 'X' | 'O'; // X = Stops, O = Passes through
  note?: string;
  arrival: string;
  avgArrival: string;
  departure: string;
  avgDeparture: string;
  haltMinutes: number;
  platform?: string;
  day: number;
  distanceKm: number;
  speedKmH: number;
  elevationMeters: number;
  zone: string;
  division: string;
  address: string;
  isIntermediate?: boolean;
  isCompleted?: boolean;
  isCurrent?: boolean;
}

/**
 * Result returned by GET /api/trains/:number/segment?from=&to=
 * Contains stops only between the two selected stations (exclusive of from/to boundaries).
 */
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
