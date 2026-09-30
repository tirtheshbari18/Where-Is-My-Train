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
} from '../../types/railway.types.js';

export class NtesRailwayProvider implements IRailwayDataProvider {
  readonly code = 'ntes';
  readonly name = 'Official Indian Railways NTES / CRIS Gateway';

  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.NTES_API_BASE_URL || 'https://api.indianrail.gov.in';
    this.apiKey = process.env.NTES_API_KEY || '';
  }

  async isAvailable(): Promise<boolean> {
    // Only available when valid official credentials are provided
    if (!this.apiKey || this.apiKey.trim() === '') {
      return false;
    }
    try {
      const response = await fetch(`${this.baseUrl}/healthcheck`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async searchTrains(_query: string): Promise<TrainSummary[]> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }

  async getTrainByNumber(_trainNumber: string): Promise<TrainDetail | null> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }

  async getTrainSchedule(_trainNumber: string): Promise<TrainStop[]> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }

  async getRunningStatus(
    _trainNumber: string,
    _journeyDate?: string
  ): Promise<RunningStatus | null> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }

  async getStation(_code: string): Promise<StationLocation | null> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }

  async searchStations(_query: string): Promise<StationLocation[]> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }

  async getLiveStation(
    _code: string,
    _hours?: number
  ): Promise<LiveStationBoard | null> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }

  async getTrainsBetweenStations(
    _fromCode: string,
    _toCode: string,
    _date?: string
  ): Promise<TrainSummary[]> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }

  async getTrainExceptions(_type?: string): Promise<TrainException[]> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }

  async getCoachComposition(
    _trainNumber: string
  ): Promise<TrainCoachComposition | null> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }

  async getNearbyStations(
    _latitude: number,
    _longitude: number,
    _radiusKm?: number
  ): Promise<Array<StationLocation & { distanceKm: number }>> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }

  async getPnrStatus(_pnr: string): Promise<PnrStatus | null> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }

  async getIntermediateStations(
    _trainNumber: string,
    _fromCode?: string,
    _toCode?: string
  ): Promise<import('../../types/railway.types.js').RouteSegment[]> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }

  async getTrainOperations(
    _stationCode?: string,
    _trainNumber?: string
  ): Promise<import('../../types/railway.types.js').TrainOperation[]> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }

  async getRailwaySections(
    _zone?: string,
    _division?: string
  ): Promise<import('../../types/railway.types.js').RailwaySection[]> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }

  async getRailwayMapData(): Promise<{
    sections: import('../../types/railway.types.js').RailwaySection[];
    stations: StationLocation[];
    speedLimits: Array<{ label: string; min: number; max: number; color: string; count: number }>;
  }> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }

  async getPlatformUpdates(
    _trainNumber: string,
    _stationCode?: string
  ): Promise<import('../../types/railway.types.js').PlatformUpdate[]> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }

  async savePlatformUpdate(
    _update: Omit<import('../../types/railway.types.js').PlatformUpdate, 'id' | 'updatedAt'>
  ): Promise<import('../../types/railway.types.js').PlatformUpdate> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }

  async getDetailedTimetable(
    _trainNumber: string
  ): Promise<import('../../types/railway.types.js').DetailedTimetableRow[]> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }

  async getTrainSegment(
    _trainNumber: string,
    _fromCode: string,
    _toCode: string
  ): Promise<import('../../types/railway.types.js').TrainSegmentResult> {
    throw new Error('NTES live feed requires active authorized API credentials');
  }
}
