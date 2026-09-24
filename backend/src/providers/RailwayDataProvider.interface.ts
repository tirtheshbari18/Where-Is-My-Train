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
} from '../types/railway.types.js';

export interface IRailwayDataProvider {
  /**
   * Unique code of this data provider (e.g., 'mock', 'ntes', 'licensed')
   */
  readonly code: string;

  /**
   * Human-readable name of the provider
   */
  readonly name: string;

  /**
   * Check if this provider is reachable and responsive
   */
  isAvailable(): Promise<boolean>;

  /**
   * Search for trains by number or name (supports typo tolerance)
   */
  searchTrains(query: string): Promise<TrainSummary[]>;

  /**
   * Get train summary details by number
   */
  getTrainByNumber(trainNumber: string): Promise<TrainDetail | null>;

  /**
   * Get schedule stops for a train
   */
  getTrainSchedule(trainNumber: string): Promise<TrainStop[]>;

  /**
   * Get current live running status of a train
   */
  getRunningStatus(trainNumber: string, date?: string): Promise<RunningStatus | null>;

  /**
   * Get station details by station code
   */
  getStation(code: string): Promise<StationLocation | null>;

  /**
   * Search stations by code, name or city
   */
  searchStations(query: string): Promise<StationLocation[]>;

  /**
   * Get live arrivals and departures for a station
   */
  getLiveStation(code: string, hours?: number): Promise<LiveStationBoard | null>;

  /**
   * Get trains running between two stations on a given date
   */
  getTrainsBetweenStations(
    fromCode: string,
    toCode: string,
    date?: string
  ): Promise<TrainSummary[]>;

  /**
   * Get active railway exceptions (cancelled, diverted, rescheduled, special trains)
   */
  getTrainExceptions(type?: string): Promise<TrainException[]>;

  /**
   * Get coach composition for a train
   */
  getCoachComposition(trainNumber: string): Promise<TrainCoachComposition | null>;

  /**
   * Get nearby railway stations using geo coordinates
   */
  getNearbyStations(
    latitude: number,
    longitude: number,
    radiusKm?: number
  ): Promise<Array<StationLocation & { distanceKm: number }>>;

  /**
   * PNR Status inquiry (only via authorized integrations)
   */
  getPnrStatus(pnr: string): Promise<PnrStatus | null>;
}
