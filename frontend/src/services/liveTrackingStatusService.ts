// Live Tracking Status & Error Semantics Service for WHERE IS MY TRAIN
// Strictly implements Section 10, 11, 12, 28, 34 of the Railway Specification.

export type LocationAccuracyStatus = 'HIGH_ACCURACY' | 'LOW_ACCURACY' | 'STALE' | 'UNAVAILABLE';

export type TrackingOperationalState =
  | 'SUCCESS'          // CASE G: Fresh accurate location (< 2-5 min, high accuracy)
  | 'LOW_ACCURACY'     // CASE A: Valid location but accuracy is poor, estimated, or confidence low
  | 'API_ERROR'        // CASE B: Server returns HTTP 500 / API error
  | 'OFFLINE'          // CASE C: Network disconnected
  | 'TIMEOUT'          // CASE D: API timeout
  | 'NO_DATA'          // CASE E: No location exists yet
  | 'STALE_DATA'       // CASE F: Location is old (> 10 min)
  | 'NETWORK_ERROR';

export interface TrackingStateConfig {
  /** Freshness thresholds in milliseconds */
  liveThresholdMs?: number;      // default 2 min (120,000 ms)
  recentThresholdMs?: number;    // default 5 min (300,000 ms)
  staleThresholdMs?: number;     // default 10 min (600,000 ms)
  /** GPS accuracy radius threshold in meters */
  accuracyThresholdMeters?: number; // default 500m
}

export interface TrackingEvaluationInput {
  status?: {
    status?: string;
    positionType?: 'station' | 'gps' | 'estimated';
    dataSourceConfidence?: string;
    source?: string;
    updatedAt?: string;
    accuracyMeters?: number;
    speedKmH?: number;
    lastReportedStation?: {
      name: string;
      code: string;
    } | null;
    nextStation?: {
      name: string;
      code: string;
      distanceRemainingKm?: number;
    } | null;
  } | null;
  error?: Error | string | null;
  isOffline?: boolean;
  isTimeout?: boolean;
  httpStatusCode?: number;
  config?: TrackingStateConfig;
}

export interface TrackingStateEvaluation {
  state: TrackingOperationalState;
  locationStatus: LocationAccuracyStatus;
  headline: string;
  subtext: string;
  canRetry: boolean;
  canViewLastKnown: boolean;
  isLive: boolean;
  isLowAccuracy: boolean;
  badgeLabel: string;
  badgeClass: string;
  bannerClass: string;
}

const DEFAULT_CONFIG: Required<TrackingStateConfig> = {
  liveThresholdMs: 2 * 60 * 1000,
  recentThresholdMs: 5 * 60 * 1000,
  staleThresholdMs: 10 * 60 * 1000,
  accuracyThresholdMeters: 500,
};

function formatMinutesAgo(diffMs: number): string {
  const mins = Math.max(1, Math.round(diffMs / 60000));
  return mins === 1 ? '1 minute ago' : `${mins} minutes ago`;
}

export class LiveTrackingStatusService {
  /**
   * Deterministically evaluate the live tracking state per specification rules (Cases A-G).
   */
  evaluate(input: TrackingEvaluationInput): TrackingStateEvaluation {
    const cfg = { ...DEFAULT_CONFIG, ...(input.config || {}) };
    const { status, error, isOffline, isTimeout, httpStatusCode } = input;

    // CASE C: Network disconnected
    if (isOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return {
        state: 'OFFLINE',
        locationStatus: status ? 'STALE' : 'UNAVAILABLE',
        headline: "You're offline",
        subtext: 'Showing the last known train position.',
        canRetry: true,
        canViewLastKnown: Boolean(status),
        isLive: false,
        isLowAccuracy: false,
        badgeLabel: 'OFFLINE',
        badgeClass: 'bg-slate-700 text-slate-100',
        bannerClass: 'bg-slate-900 border-slate-700 text-slate-200',
      };
    }

    // CASE D: API timeout
    if (isTimeout || (typeof error === 'string' && /timeout/i.test(error))) {
      return {
        state: 'TIMEOUT',
        locationStatus: status ? 'STALE' : 'UNAVAILABLE',
        headline: 'Live update timed out',
        subtext: 'Live update timed out. Try again.',
        canRetry: true,
        canViewLastKnown: Boolean(status),
        isLive: false,
        isLowAccuracy: false,
        badgeLabel: 'TIMEOUT',
        badgeClass: 'bg-amber-600 text-white',
        bannerClass: 'bg-amber-950/80 border-amber-600 text-amber-200',
      };
    }

    // CASE B: Server returns HTTP 500 or generic API failure
    if (httpStatusCode === 500 || (error && !status)) {
      return {
        state: 'API_ERROR',
        locationStatus: 'UNAVAILABLE',
        headline: 'Live train data unavailable',
        subtext: 'Unable to get the latest train position.',
        canRetry: true,
        canViewLastKnown: Boolean(status),
        isLive: false,
        isLowAccuracy: false,
        badgeLabel: 'UNAVAILABLE',
        badgeClass: 'bg-rose-700 text-white',
        bannerClass: 'bg-rose-950/80 border-rose-600 text-rose-200',
      };
    }

    // CASE E: No location exists
    if (!status || (!status.lastReportedStation && !status.nextStation)) {
      return {
        state: 'NO_DATA',
        locationStatus: 'UNAVAILABLE',
        headline: 'Train location unavailable',
        subtext: 'Live train tracking telemetry is not yet active for this trip.',
        canRetry: true,
        canViewLastKnown: false,
        isLive: false,
        isLowAccuracy: false,
        badgeLabel: 'NO TELEMETRY',
        badgeClass: 'bg-slate-800 text-slate-300',
        bannerClass: 'bg-slate-900 border-slate-800 text-slate-300',
      };
    }

    // Calculate data freshness
    const now = Date.now();
    const updatedTime = status.updatedAt ? Date.parse(status.updatedAt) : NaN;
    const ageMs = !isNaN(updatedTime) ? Math.max(0, now - updatedTime) : 0;
    const timeAgoStr = !isNaN(updatedTime) ? formatMinutesAgo(ageMs) : 'a few moments ago';

    const lastStationName = status.lastReportedStation?.name || status.lastReportedStation?.code || 'Last Known Station';
    const nextStationName = status.nextStation?.name || status.nextStation?.code || 'Next Station';
    const nextDistance = status.nextStation?.distanceRemainingKm ?? 3;

    // Check low-accuracy criteria:
    // 1. GPS accuracy exceeds configured threshold (> 500m)
    // 2. train location is stale between recent & stale threshold (5 - 10 min)
    // 3. backend reports low-confidence location
    // 4. location is estimated rather than confirmed
    const isEstimated = status.positionType === 'estimated';
    const isConfidenceLow = /low|unconfirmed|approx/i.test(status.dataSourceConfidence || '');
    const isGpsPoor = (status.accuracyMeters ?? 0) > cfg.accuracyThresholdMeters;
    const isModerateStale = ageMs >= cfg.recentThresholdMs && ageMs < cfg.staleThresholdMs;

    // CASE F: Location is old (10+ minutes)
    if (ageMs >= cfg.staleThresholdMs) {
      return {
        state: 'STALE_DATA',
        locationStatus: 'STALE',
        headline: 'Location may be outdated',
        subtext: `Last updated ${timeAgoStr}`,
        canRetry: true,
        canViewLastKnown: true,
        isLive: false,
        isLowAccuracy: false,
        badgeLabel: 'OUTDATED',
        badgeClass: 'bg-amber-600 text-white',
        bannerClass: 'bg-amber-950/60 border-amber-600/70 text-amber-200',
      };
    }

    // CASE A: Location = valid but accuracy is poor
    if (isEstimated || isConfidenceLow || isGpsPoor || isModerateStale) {
      return {
        state: 'LOW_ACCURACY',
        locationStatus: 'LOW_ACCURACY',
        headline: `Low accuracy - ${nextDistance} km to ${nextStationName}`,
        subtext: `Last seen at ${lastStationName} - ${timeAgoStr}`,
        canRetry: true,
        canViewLastKnown: true,
        isLive: false,
        isLowAccuracy: true,
        badgeLabel: 'LOW ACCURACY',
        badgeClass: 'bg-amber-500 text-slate-950 font-black',
        bannerClass: 'bg-amber-950/70 border-amber-500/80 text-amber-100',
      };
    }

    // CASE G: Fresh accurate location
    return {
      state: 'SUCCESS',
      locationStatus: 'HIGH_ACCURACY',
      headline: 'Live',
      subtext: status.speedKmH ? `${status.speedKmH} km/h • On Track` : 'On Track • Authoritative Signal',
      canRetry: false,
      canViewLastKnown: true,
      isLive: true,
      isLowAccuracy: false,
      badgeLabel: 'LIVE',
      badgeClass: 'bg-emerald-600 text-white font-black',
      bannerClass: 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200',
    };
  }
}

export const liveTrackingStatusService = new LiveTrackingStatusService();
