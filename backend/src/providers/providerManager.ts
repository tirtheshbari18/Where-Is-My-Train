import { IRailwayDataProvider } from './RailwayDataProvider.interface.js';
import { MockRailwayProvider } from './mock/mockRailwayProvider.js';
import { NtesRailwayProvider } from './ntes/ntesRailwayProvider.js';
import { LicensedRailwayProvider } from './licensed/licensedRailwayProvider.js';
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
  ProviderHealthStatus,
} from '../types/railway.types.js';

interface ProviderStats {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  lastResponseTimeMs: number;
  lastChecked: string;
}

export class ProviderManager implements IRailwayDataProvider {
  readonly code = 'manager';
  readonly name = 'Railway Data Provider Orchestrator';

  private providers: Map<string, IRailwayDataProvider> = new Map();
  private primaryProviderCode: string = 'mock';
  private fallbackOrder: string[] = ['ntes', 'licensed', 'mock'];
  private providerStats: Map<string, ProviderStats> = new Map();

  constructor() {
    // Register standard providers
    const mock = new MockRailwayProvider();
    const ntes = new NtesRailwayProvider();
    const licensed = new LicensedRailwayProvider();

    this.providers.set('mock', mock);
    this.providers.set('ntes', ntes);
    this.providers.set('licensed', licensed);

    // Initialize stats
    for (const code of ['mock', 'ntes', 'licensed']) {
      this.providerStats.set(code, {
        totalRequests: 0,
        successCount: 0,
        failureCount: 0,
        lastResponseTimeMs: 12,
        lastChecked: new Date().toISOString(),
      });
    }

    const defaultProvider = process.env.DEFAULT_DATA_PROVIDER || 'mock';
    if (this.providers.has(defaultProvider)) {
      this.primaryProviderCode = defaultProvider;
    }
  }

  getPrimaryProviderCode(): string {
    return this.primaryProviderCode;
  }

  setPrimaryProvider(code: string): boolean {
    if (this.providers.has(code)) {
      this.primaryProviderCode = code;
      // Re-order fallback chain to place selected provider first
      this.fallbackOrder = [
        code,
        ...Array.from(this.providers.keys()).filter((c) => c !== code),
      ];
      return true;
    }
    return false;
  }

  async getHealthStatuses(): Promise<ProviderHealthStatus[]> {
    const statuses: ProviderHealthStatus[] = [];

    for (const [code, provider] of this.providers.entries()) {
      const stats = this.providerStats.get(code)!;
      let isUp = false;
      const startTime = performance.now();
      try {
        isUp = await provider.isAvailable();
      } catch {
        isUp = false;
      }
      const responseTime = Math.round(performance.now() - startTime);

      let status: 'HEALTHY' | 'DEGRADED' | 'DOWN' = 'DOWN';
      if (isUp) {
        status = responseTime < 500 ? 'HEALTHY' : 'DEGRADED';
      }

      statuses.push({
        providerCode: code,
        providerName: provider.name,
        isEnabled: true,
        isPrimary: code === this.primaryProviderCode,
        status,
        responseTimeMs: responseTime || stats.lastResponseTimeMs,
        successRate:
          stats.totalRequests > 0
            ? Math.round((stats.successCount / stats.totalRequests) * 100)
            : isUp ? 100 : 0,
        totalRequests: stats.totalRequests,
        lastChecked: new Date().toISOString(),
        endpointUrl:
          code === 'ntes'
            ? process.env.NTES_API_BASE_URL || 'https://api.indianrail.gov.in'
            : code === 'licensed'
            ? process.env.LICENSED_PROVIDER_BASE_URL || 'https://partner.railwayapi.example.com'
            : 'internal://in-memory-mock-engine',
      });
    }

    return statuses;
  }

  async isAvailable(): Promise<boolean> {
    for (const code of this.fallbackOrder) {
      const provider = this.providers.get(code);
      if (provider && (await provider.isAvailable())) {
        return true;
      }
    }
    return false;
  }

  // Generic executor that implements Provider 1 -> Provider 2 -> Mock Fallback
  private async executeWithFallback<T>(
    operationName: string,
    execute: (provider: IRailwayDataProvider) => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;

    for (const code of this.fallbackOrder) {
      const provider = this.providers.get(code);
      if (!provider) continue;

      const stats = this.providerStats.get(code)!;
      stats.totalRequests++;

      const startTime = performance.now();
      try {
        const isUp = await provider.isAvailable();
        if (!isUp) {
          stats.failureCount++;
          continue;
        }

        const result = await execute(provider);
        const elapsed = Math.round(performance.now() - startTime);
        stats.lastResponseTimeMs = elapsed;
        stats.successCount++;
        stats.lastChecked = new Date().toISOString();
        return result;
      } catch (err: any) {
        stats.failureCount++;
        stats.lastChecked = new Date().toISOString();
        lastError = err;
        console.warn(
          `[ProviderManager] ${provider.name} failed during ${operationName}: ${err.message}. Trying next provider in fallback chain...`
        );
      }
    }

    throw (
      lastError ||
      new Error(`All railway data providers failed for operation: ${operationName}`)
    );
  }

  async searchTrains(query: string): Promise<TrainSummary[]> {
    return this.executeWithFallback('searchTrains', (p) => p.searchTrains(query));
  }

  async getTrainByNumber(trainNumber: string): Promise<TrainDetail | null> {
    return this.executeWithFallback('getTrainByNumber', (p) =>
      p.getTrainByNumber(trainNumber)
    );
  }

  async getTrainSchedule(trainNumber: string): Promise<TrainStop[]> {
    return this.executeWithFallback('getTrainSchedule', (p) =>
      p.getTrainSchedule(trainNumber)
    );
  }

  async getRunningStatus(
    trainNumber: string,
    date?: string
  ): Promise<RunningStatus | null> {
    return this.executeWithFallback('getRunningStatus', (p) =>
      p.getRunningStatus(trainNumber, date)
    );
  }

  async getStation(code: string): Promise<StationLocation | null> {
    return this.executeWithFallback('getStation', (p) => p.getStation(code));
  }

  async searchStations(query: string): Promise<StationLocation[]> {
    return this.executeWithFallback('searchStations', (p) =>
      p.searchStations(query)
    );
  }

  async getLiveStation(
    code: string,
    hours?: number
  ): Promise<LiveStationBoard | null> {
    return this.executeWithFallback('getLiveStation', (p) =>
      p.getLiveStation(code, hours)
    );
  }

  async getTrainsBetweenStations(
    fromCode: string,
    toCode: string,
    date?: string
  ): Promise<TrainSummary[]> {
    return this.executeWithFallback('getTrainsBetweenStations', (p) =>
      p.getTrainsBetweenStations(fromCode, toCode, date)
    );
  }

  async getTrainExceptions(type?: string): Promise<TrainException[]> {
    return this.executeWithFallback('getTrainExceptions', (p) =>
      p.getTrainExceptions(type)
    );
  }

  async getCoachComposition(
    trainNumber: string
  ): Promise<TrainCoachComposition | null> {
    return this.executeWithFallback('getCoachComposition', (p) =>
      p.getCoachComposition(trainNumber)
    );
  }

  async getNearbyStations(
    latitude: number,
    longitude: number,
    radiusKm?: number
  ): Promise<Array<StationLocation & { distanceKm: number }>> {
    return this.executeWithFallback('getNearbyStations', (p) =>
      p.getNearbyStations(latitude, longitude, radiusKm)
    );
  }

  async getPnrStatus(pnr: string): Promise<PnrStatus | null> {
    return this.executeWithFallback('getPnrStatus', (p) => p.getPnrStatus(pnr));
  }

  async getIntermediateStations(
    trainNumber: string,
    fromCode?: string,
    toCode?: string
  ): Promise<import('../types/railway.types.js').RouteSegment[]> {
    return this.executeWithFallback('getIntermediateStations', (p) =>
      p.getIntermediateStations(trainNumber, fromCode, toCode)
    );
  }

  async getTrainOperations(
    stationCode?: string,
    trainNumber?: string
  ): Promise<import('../types/railway.types.js').TrainOperation[]> {
    return this.executeWithFallback('getTrainOperations', (p) =>
      p.getTrainOperations(stationCode, trainNumber)
    );
  }

  async getRailwaySections(
    zone?: string,
    division?: string
  ): Promise<import('../types/railway.types.js').RailwaySection[]> {
    return this.executeWithFallback('getRailwaySections', (p) =>
      p.getRailwaySections(zone, division)
    );
  }

  async getRailwayMapData(): Promise<{
    sections: import('../types/railway.types.js').RailwaySection[];
    stations: StationLocation[];
    speedLimits: Array<{ label: string; min: number; max: number; color: string; count: number }>;
  }> {
    return this.executeWithFallback('getRailwayMapData', (p) =>
      p.getRailwayMapData()
    );
  }

  async getPlatformUpdates(
    trainNumber: string,
    stationCode?: string
  ): Promise<import('../types/railway.types.js').PlatformUpdate[]> {
    return this.executeWithFallback('getPlatformUpdates', (p) =>
      p.getPlatformUpdates(trainNumber, stationCode)
    );
  }

  async savePlatformUpdate(
    update: Omit<import('../types/railway.types.js').PlatformUpdate, 'id' | 'updatedAt'>
  ): Promise<import('../types/railway.types.js').PlatformUpdate> {
    const primary = this.providers.get(this.primaryProviderCode) || this.providers.get('mock')!;
    return primary.savePlatformUpdate(update);
  }

  async getDetailedTimetable(
    trainNumber: string
  ): Promise<import('../types/railway.types.js').DetailedTimetableRow[]> {
    return this.executeWithFallback('getDetailedTimetable', (p) =>
      p.getDetailedTimetable(trainNumber)
    );
  }

  async getTrainSegment(
    trainNumber: string,
    fromCode: string,
    toCode: string
  ): Promise<import('../types/railway.types.js').TrainSegmentResult> {
    return this.executeWithFallback('getTrainSegment', (p) =>
      p.getTrainSegment(trainNumber, fromCode, toCode)
    );
  }
}

// Export singleton instance
export const providerManager = new ProviderManager();
