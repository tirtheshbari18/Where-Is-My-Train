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

export class LicensedRailwayProvider implements IRailwayDataProvider {
  readonly code = 'licensed';
  readonly name = 'Authorized Commercial Railway Data Partner (Licensed API)';

  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl =
      process.env.LICENSED_PROVIDER_BASE_URL ||
      'https://partner.railwayapi.example.com';
    this.apiKey = process.env.LICENSED_PROVIDER_API_KEY || '';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey || this.apiKey.trim() === '') {
      return false;
    }
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        headers: {
          'X-API-KEY': this.apiKey,
        },
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async searchTrains(_query: string): Promise<TrainSummary[]> {
    throw new Error('Licensed provider requires active API key');
  }

  async getTrainByNumber(_trainNumber: string): Promise<TrainDetail | null> {
    throw new Error('Licensed provider requires active API key');
  }

  async getTrainSchedule(_trainNumber: string): Promise<TrainStop[]> {
    throw new Error('Licensed provider requires active API key');
  }

  async getRunningStatus(
    _trainNumber: string,
    _journeyDate?: string
  ): Promise<RunningStatus | null> {
    throw new Error('Licensed provider requires active API key');
  }

  async getStation(_code: string): Promise<StationLocation | null> {
    throw new Error('Licensed provider requires active API key');
  }

  async searchStations(_query: string): Promise<StationLocation[]> {
    throw new Error('Licensed provider requires active API key');
  }

  async getLiveStation(
    _code: string,
    _hours?: number
  ): Promise<LiveStationBoard | null> {
    throw new Error('Licensed provider requires active API key');
  }

  async getTrainsBetweenStations(
    _fromCode: string,
    _toCode: string,
    _date?: string
  ): Promise<TrainSummary[]> {
    throw new Error('Licensed provider requires active API key');
  }

  async getTrainExceptions(_type?: string): Promise<TrainException[]> {
    throw new Error('Licensed provider requires active API key');
  }

  async getCoachComposition(
    _trainNumber: string
  ): Promise<TrainCoachComposition | null> {
    throw new Error('Licensed provider requires active API key');
  }

  async getNearbyStations(
    _latitude: number,
    _longitude: number,
    _radiusKm?: number
  ): Promise<Array<StationLocation & { distanceKm: number }>> {
    throw new Error('Licensed provider requires active API key');
  }

  async getPnrStatus(_pnr: string): Promise<PnrStatus | null> {
    throw new Error('Licensed provider requires active API key');
  }
}
