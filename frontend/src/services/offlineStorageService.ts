// Offline Storage & PWA Caching Service for WHERE IS MY TRAIN
// Enables viewing timetables, routes, and station directories without internet

const TIMETABLE_CACHE_KEY = 'wimt_timetable_cache_v1';
const STATIONS_CACHE_KEY = 'wimt_stations_cache_v1';
const LAST_SYNC_KEY = 'wimt_last_sync_v1';

export interface CachedTrainData {
  trainNumber: string;
  trainName: string;
  sourceCode: string;
  sourceName: string;
  destinationCode: string;
  destinationName: string;
  trainType: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  distanceKm: number;
  schedule: any[];
  fares?: Record<string, number>;
  cachedAt: string;
  lastKnownStatus?: any;
}

export class OfflineStorageService {
  private simulatedOffline: boolean = false;
  private onlineListeners: Array<(isOnline: boolean) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.notifyListeners());
      window.addEventListener('offline', () => this.notifyListeners());
    }
  }

  isOnline(): boolean {
    if (this.simulatedOffline) return false;
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  }

  setSimulatedOffline(offline: boolean): void {
    this.simulatedOffline = offline;
    this.notifyListeners();
  }

  isSimulated(): boolean {
    return this.simulatedOffline;
  }

  subscribe(listener: (isOnline: boolean) => void): () => void {
    this.onlineListeners.push(listener);
    return () => {
      this.onlineListeners = this.onlineListeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    const online = this.isOnline();
    this.onlineListeners.forEach((fn) => fn(online));
  }

  // Train caching
  cacheTrain(train: any): void {
    try {
      const cache = this.getAllCachedTrains();
      cache[train.trainNumber] = {
        ...train,
        cachedAt: new Date().toISOString(),
      };
      localStorage.setItem(TIMETABLE_CACHE_KEY, JSON.stringify(cache));
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (e) {
      console.warn('Failed to cache train offline:', e);
    }
  }

  getCachedTrain(trainNumber: string): CachedTrainData | null {
    const cache = this.getAllCachedTrains();
    return cache[trainNumber] || null;
  }

  getAllCachedTrains(): Record<string, CachedTrainData> {
    try {
      const raw = localStorage.getItem(TIMETABLE_CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  searchOfflineTrains(query: string): CachedTrainData[] {
    const q = query.toLowerCase().trim();
    const cache = this.getAllCachedTrains();
    const all = Object.values(cache);

    if (!q) return all;

    return all.filter(
      (t) =>
        t.trainNumber.includes(q) ||
        t.trainName.toLowerCase().includes(q) ||
        t.sourceName.toLowerCase().includes(q) ||
        t.destinationName.toLowerCase().includes(q) ||
        t.sourceCode.toLowerCase() === q ||
        t.destinationCode.toLowerCase() === q
    );
  }

  searchOfflineBetween(from: string, to: string): CachedTrainData[] {
    const fCode = from.toUpperCase().trim();
    const tCode = to.toUpperCase().trim();
    const cache = Object.values(this.getAllCachedTrains());

    return cache.filter((train) => {
      const stops = train.schedule || [];
      const fromIdx = stops.findIndex((s: any) => s.stationCode.toUpperCase() === fCode);
      const toIdx = stops.findIndex((s: any) => s.stationCode.toUpperCase() === tCode);
      return fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx;
    });
  }

  // Stations caching
  cacheStations(stations: any[]): void {
    try {
      localStorage.setItem(STATIONS_CACHE_KEY, JSON.stringify(stations));
    } catch (e) {
      console.warn('Failed to cache stations:', e);
    }
  }

  getCachedStations(): any[] {
    try {
      const raw = localStorage.getItem(STATIONS_CACHE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  getLastSyncTimestamp(): string | null {
    try {
      return localStorage.getItem(LAST_SYNC_KEY);
    } catch {
      return null;
    }
  }
}

export const offlineStorageService = new OfflineStorageService();
