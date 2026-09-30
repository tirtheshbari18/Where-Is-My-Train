// Train Tracking Service for WHERE IS MY TRAIN
// Provides live running telemetry, speed indicators, journey progress, and station-based tracking

import { RunningStatus, TrainStop } from '../api/railwayApi.js';

export interface TelemetryProgress {
  currentStationIndex: number;
  lastDepartedStation: TrainStop | null;
  currentStation: TrainStop | null;
  nextStation: TrainStop | null;
  upcomingStation: TrainStop | null;
  statusText: string;
  /** Real delay from the provider; 0 when the provider did not report a delay. */
  delayMinutes: number;
  /** Real speed from the provider; null when no speed telemetry exists. */
  speedKmH: number | null;
  distanceCoveredKm: number;
  distanceRemainingKm: number;
  totalDistanceKm: number;
  /** Seconds since the provider's own updatedAt timestamp; null when unknown. */
  lastUpdatedSecondsAgo: number | null;
  /** true when the backing provider is a demo/mock feed rather than a live railway source. */
  isSimulated: boolean;
  positionType: 'station' | 'gps' | 'estimated';
  /** ISO timestamp reported by the provider, or null when not supplied. */
  updatedAt: string | null;
}

/**
 * Detects whether a live-status payload comes from a demo/mock provider rather than a real
 * railway data source, so the UI can label it instead of presenting it as live information.
 */
export function isDemoSource(source?: string | null): boolean {
  if (!source) return false;
  return /\b(mock|demo|sandbox|simulat)/i.test(source);
}

export class TrainTrackingService {
  /**
   * Compute comprehensive journey progress and station-based tracking telemetry
   */
  calculateProgress(
    schedule: TrainStop[],
    liveStatus?: RunningStatus | null
  ): TelemetryProgress {
    if (!schedule || schedule.length === 0) {
      return {
        currentStationIndex: 0,
        lastDepartedStation: null,
        currentStation: null,
        nextStation: null,
        upcomingStation: null,
        statusText: 'No schedule available',
        delayMinutes: 0,
        speedKmH: null,
        distanceCoveredKm: 0,
        distanceRemainingKm: 0,
        totalDistanceKm: 0,
        lastUpdatedSecondsAgo: null,
        isSimulated: false,
        positionType: 'station',
        updatedAt: null,
      };
    }

    const totalDistance = schedule[schedule.length - 1].distanceFromSourceKm;

    // Use the provider's reported timeline index when available; otherwise fall back to the
    // first stop (never fabricate a "current" position for a train with no live report).
    const reportedIndex = liveStatus?.currentStationTimelineIndex;
    let activeIndex =
      typeof reportedIndex === 'number' && reportedIndex >= 0 ? reportedIndex : 0;
    if (activeIndex >= schedule.length) activeIndex = schedule.length - 1;

    const currentStop = schedule[activeIndex];
    const prevStop = activeIndex > 0 ? schedule[activeIndex - 1] : null;
    const nextStop = activeIndex < schedule.length - 1 ? schedule[activeIndex + 1] : null;
    const upcomingStop = activeIndex + 2 < schedule.length ? schedule[activeIndex + 2] : null;

    // Only real provider values — no invented delay or speed.
    const delay = liveStatus?.delayMinutes ?? 0;
    const speed = typeof liveStatus?.speedKmH === 'number' ? liveStatus.speedKmH : null;
    const distanceCovered = currentStop.distanceFromSourceKm;
    const distanceRemaining = Math.max(0, totalDistance - distanceCovered);

    const updatedAt = liveStatus?.updatedAt || null;
    let lastUpdatedSecondsAgo: number | null = null;
    if (updatedAt) {
      const parsed = Date.parse(updatedAt);
      if (!Number.isNaN(parsed)) {
        lastUpdatedSecondsAgo = Math.max(0, Math.round((Date.now() - parsed) / 1000));
      }
    }

    const statusText = liveStatus?.lastReportedStation
      ? `At ${currentStop.stationName} (${currentStop.stationCode})`
      : `Scheduled stop ${activeIndex + 1} of ${schedule.length} — ${currentStop.stationName}`;

    return {
      currentStationIndex: activeIndex,
      lastDepartedStation: prevStop,
      currentStation: currentStop,
      nextStation: nextStop,
      upcomingStation: upcomingStop,
      statusText,
      delayMinutes: delay,
      speedKmH: speed,
      distanceCoveredKm: distanceCovered,
      distanceRemainingKm: distanceRemaining,
      totalDistanceKm: totalDistance,
      lastUpdatedSecondsAgo,
      isSimulated: isDemoSource(liveStatus?.source),
      positionType: liveStatus?.positionType ?? 'station',
      updatedAt,
    };
  }

  /**
   * Format delay text with color cue
   */
  formatDelay(delayMinutes: number): { text: string; isDelayed: boolean } {
    if (delayMinutes <= 5) {
      return { text: 'On Time', isDelayed: false };
    }
    return { text: `+${delayMinutes} min`, isDelayed: true };
  }
}

export const trackingService = new TrainTrackingService();
