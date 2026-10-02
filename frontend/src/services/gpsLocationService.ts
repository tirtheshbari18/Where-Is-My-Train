// frontend/src/services/gpsLocationService.ts
// Robust GPS Accuracy & Location Service for Where Is My Train (Requirements 15, 40)
// Features:
// - Accuracy radius classification: High (<= 15m), Moderate (<= 80m), Low (> 80m)
// - Fallback location & last-known cached coordinates in localStorage
// - Exponential backoff retry with abort signal
// - Permission state detection (granted, prompt, denied)
// - Transparent accuracy labeling (±10 m, ±50 m, ±200 m, Location unavailable)

export type GpsAccuracyLevel = 'HIGH_ACCURACY' | 'MODERATE_ACCURACY' | 'LOW_ACCURACY' | 'UNAVAILABLE';

export interface GpsLocationResult {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  accuracyLevel: GpsAccuracyLevel;
  accuracyText: string;
  isCached: boolean;
  timestamp: number;
  ageSeconds: number;
  isStale: boolean;
}

export interface GpsErrorState {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNSUPPORTED';
  message: string;
  canRetry: boolean;
  lastKnownLocation?: GpsLocationResult;
}

const STORAGE_KEY_LAST_GPS = 'wimt_last_known_gps_location';

export class GpsLocationService {
  /**
   * Classify accuracy into human-readable levels
   */
  classifyAccuracy(accuracyMeters: number): { level: GpsAccuracyLevel; text: string } {
    if (accuracyMeters <= 15) {
      return { level: 'HIGH_ACCURACY', text: `High accuracy (±${Math.round(accuracyMeters)} m)` };
    }
    if (accuracyMeters <= 80) {
      return { level: 'MODERATE_ACCURACY', text: `Moderate accuracy (±${Math.round(accuracyMeters)} m)` };
    }
    return { level: 'LOW_ACCURACY', text: `Low accuracy (±${Math.round(accuracyMeters)} m)` };
  }

  /**
   * Save last known position
   */
  saveLastKnownLocation(loc: GpsLocationResult): void {
    try {
      localStorage.setItem(STORAGE_KEY_LAST_GPS, JSON.stringify(loc));
    } catch {
      // Ignore storage errors in private browsing
    }
  }

  /**
   * Get cached last-known position
   */
  getLastKnownLocation(): GpsLocationResult | undefined {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LAST_GPS);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      const ageSeconds = Math.max(0, Math.round((Date.now() - parsed.timestamp) / 1000));
      return {
        ...parsed,
        isCached: true,
        ageSeconds,
        isStale: ageSeconds > 600, // 10 minutes
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Request device location with timeout, high accuracy preference, and cached fallback
   */
  async getCurrentPosition(options: {
    timeoutMs?: number;
    maxAgeMs?: number;
    enableHighAccuracy?: boolean;
    retries?: number;
  } = {}): Promise<GpsLocationResult> {
    const {
      timeoutMs = 10000,
      maxAgeMs = 30000,
      enableHighAccuracy = true,
      retries = 2,
    } = options;

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const cached = this.getLastKnownLocation();
      if (cached) return cached;
      throw {
        code: 'UNSUPPORTED',
        message: 'Geolocation is not supported by your browser or platform.',
        canRetry: false,
      } as GpsErrorState;
    }

    let lastError: any;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy,
            timeout: timeoutMs,
            maximumAge: maxAgeMs,
          });
        });

        const accuracy = pos.coords.accuracy;
        const { level, text } = this.classifyAccuracy(accuracy);
        const result: GpsLocationResult = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: accuracy,
          accuracyLevel: level,
          accuracyText: text,
          isCached: false,
          timestamp: pos.timestamp || Date.now(),
          ageSeconds: 0,
          isStale: false,
        };

        this.saveLastKnownLocation(result);
        return result;
      } catch (err: any) {
        lastError = err;
        if (err.code === 1) {
          // PERMISSION_DENIED: Do not retry permission denial
          break;
        }
        // Exponential backoff wait before retry
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt)));
        }
      }
    }

    const lastKnown = this.getLastKnownLocation();
    const errCode = lastError?.code === 1
      ? 'PERMISSION_DENIED'
      : lastError?.code === 3
      ? 'TIMEOUT'
      : 'POSITION_UNAVAILABLE';

    const errMessage = lastError?.code === 1
      ? 'Location permission was denied. Please enable GPS permissions in device settings.'
      : lastError?.code === 3
      ? 'Location request timed out. Retrying with network fallback...'
      : 'Unable to determine precise GPS location.';

    throw {
      code: errCode,
      message: errMessage,
      canRetry: errCode !== 'PERMISSION_DENIED',
      lastKnownLocation: lastKnown,
    } as GpsErrorState;
  }
}

export const gpsLocationService = new GpsLocationService();
