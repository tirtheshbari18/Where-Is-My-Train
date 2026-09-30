// frontend/src/components/trains/TrainRouteStatusModal.tsx
// Comprehensive Train Route & Live Status view for "Where Is My Train".
// Fulfills the complete specification for the expanded detail view,
// vertical railway timeline, live telemetry indicator vs. scheduled fallback,
// progress bar, and station details.

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Clock,
  MapPin,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { railwayApi, TrainSummary, TrainStop, RunningStatus } from '../../api/railwayApi.js';
import { formatTimeWithAmPm } from '../../utils/timeFormat.js';

interface Props {
  train: TrainSummary;
  fromCode: string;
  toCode: string;
  travelDate?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TrainRouteStatusModal: React.FC<Props> = ({
  train,
  fromCode,
  toCode,
  travelDate,
  isOpen,
  onClose,
}) => {
  const [schedule, setSchedule] = useState<TrainStop[]>([]);
  const [status, setStatus] = useState<RunningStatus | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoadingSchedule(true);
    setStatusError(null);
    try {
      // 1. Fetch complete schedule
      const sched = await railwayApi.getTrainSchedule(train.trainNumber);
      setSchedule(sched);
    } catch (err: any) {
      console.warn('Failed to load train schedule:', err);
    } finally {
      setLoadingSchedule(false);
    }

    // 2. Fetch live running status
    await fetchLiveStatus();
  }, [train.trainNumber, travelDate]);

  const fetchLiveStatus = async () => {
    setLoadingStatus(true);
    setStatusError(null);
    try {
      const res = await railwayApi.getRunningStatus(train.trainNumber, travelDate);
      setStatus(res.status);
      setLastRefreshed(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      console.warn('Live tracking telemetry unavailable:', err);
      setStatus(null);
      setStatusError('Live running information is currently unavailable. Showing scheduled railway timings.');
      setLastRefreshed(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  // Handle escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter schedule between searched FROM and TO stations
  const fCode = fromCode.toUpperCase().trim();
  const tCode = toCode.toUpperCase().trim();

  const fromIndex = schedule.findIndex((s) => s.stationCode.toUpperCase() === fCode);
  const toIndex = schedule.findIndex((s) => s.stationCode.toUpperCase() === tCode);

  const displayedStops =
    fromIndex !== -1 && toIndex !== -1 && fromIndex <= toIndex
      ? schedule.slice(fromIndex, toIndex + 1)
      : schedule.length > 0
      ? schedule
      : [];

  // Determine current station / location index in displayedStops
  const lastReportedCode = status?.lastReportedStation?.code?.toUpperCase();
  const currentStopsIndex = displayedStops.findIndex(
    (s) => s.stationCode.toUpperCase() === lastReportedCode
  );

  const isLive = Boolean(status && (status.positionType === 'station' || status.positionType === 'gps'));
  const delayMins = status?.delayMinutes ?? 0;

  // Calculate segment progress percentage
  let progressPercent = 0;
  if (displayedStops.length > 1 && currentStopsIndex >= 0) {
    progressPercent = Math.min(100, Math.round((currentStopsIndex / (displayedStops.length - 1)) * 100));
  } else if (isLive) {
    progressPercent = 50;
  }

  const fromStop = displayedStops[0];
  const toStop = displayedStops[displayedStops.length - 1];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-blue-600 dark:bg-blue-700 px-5 py-4 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-black text-lg sm:text-xl tracking-tight">
                🚆 {train.trainNumber}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-bold backdrop-blur-sm">
                {train.trainType}
              </span>
              {train.zone && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-900/40 font-medium">
                  {train.zone}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-blue-50 mt-1 line-clamp-1">
              {train.trainName}
            </h2>
            <div className="text-xs text-blue-100 flex items-center gap-1.5 mt-0.5 font-medium">
              <span>{train.sourceName} ({train.sourceCode})</span>
              <ArrowRight className="w-3 h-3 text-blue-200" />
              <span>{train.destinationName} ({train.destinationCode})</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Segment Timing Summary Box */}
          <div className="grid grid-cols-3 items-center text-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-left">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Departure</div>
              <div className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                {formatTimeWithAmPm(fromStop?.scheduledDeparture || train.departureTime)}
              </div>
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {fromStop?.stationCode || fromCode}
              </div>
              <div className="text-[11px] text-slate-500 truncate max-w-[120px]">
                {fromStop?.stationName || train.sourceName}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {train.durationMinutes} min
              </span>
              <div className="w-16 h-0.5 bg-blue-300 dark:bg-blue-600 my-1 rounded-full"></div>
              <span className="text-[10px] text-slate-400 font-mono">
                {train.distanceKm} km
              </span>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Expected Arrival</div>
              <div className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                {formatTimeWithAmPm(toStop?.scheduledArrival || train.arrivalTime)}
              </div>
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {toStop?.stationCode || toCode}
              </div>
              <div className="text-[11px] text-slate-500 truncate max-w-[120px] ml-auto">
                {toStop?.stationName || train.destinationName}
              </div>
            </div>
          </div>

          {/* LIVE STATUS VS SCHEDULED DATA CARD */}
          {isLive ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="font-black text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    LIVE RUNNING STATUS
                  </span>
                </div>
                <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                  Last updated: {lastRefreshed || 'Just now'}
                </div>
              </div>

              <div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Train is currently near: <span className="text-emerald-700 dark:text-emerald-300">{status?.lastReportedStation?.name || 'In Transit'}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Delay: <span className={`font-bold ${delayMins > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'}`}>{delayMins > 0 ? `${delayMins} min late` : 'On Time'}</span>
                  {status?.statusMessage && <span className="text-slate-500 dark:text-slate-400"> &bull; {status.statusMessage}</span>}
                </div>
              </div>

              {/* Progress Bar with animated Train icon */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                  <span>{fromStop?.stationName || fromCode}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                    🚆 Current Location ({status?.lastReportedStation?.name})
                  </span>
                  <span>{toStop?.stationName || toCode}</span>
                </div>
                <div className="relative w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Radio className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>○ SCHEDULED TIMETABLE</span>
                </div>
                <button
                  onClick={fetchLiveStatus}
                  disabled={loadingStatus}
                  className="px-2.5 py-1 rounded-lg bg-amber-200 dark:bg-amber-900/60 hover:bg-amber-300 text-amber-900 dark:text-amber-200 text-xs font-bold transition flex items-center gap-1 active:scale-95"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingStatus ? 'animate-spin' : ''}`} />
                  <span>{loadingStatus ? 'Checking...' : 'Retry Live Status'}</span>
                </button>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                {statusError || 'Live running telemetry is currently unavailable from upstream GPS sensors. Showing official scheduled Indian Railways timings.'}
              </p>
            </div>
          )}

          {/* VERTICAL RAILWAY TIMELINE */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Station-by-Station Route Timeline</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {displayedStops.length} Stations in Segment
              </span>
            </div>

            {loadingSchedule ? (
              <div className="py-8 text-center text-xs text-blue-600 animate-pulse flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 animate-spin" />
                <span>Loading station schedule...</span>
              </div>
            ) : displayedStops.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-500">
                Timetable details not available for this segment.
              </div>
            ) : (
              <div className="relative pl-3 pr-2 py-1 space-y-4">
                {/* Vertical track connecting line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-1 bg-slate-200 dark:bg-slate-700 rounded-full z-0"></div>

                {displayedStops.map((stop, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === displayedStops.length - 1;
                  const isCurrent = isLive && (idx === currentStopsIndex || stop.stationCode.toUpperCase() === lastReportedCode);
                  const isCompleted = isLive && currentStopsIndex >= 0 && idx < currentStopsIndex;

                  return (
                    <div key={`${stop.stationCode}-${idx}`} className="relative flex items-start gap-3.5 z-10">
                      {/* Station Node Badge on the track */}
                      <div className="mt-1 shrink-0">
                        {isCurrent ? (
                          <div className="w-7 h-7 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center text-white text-xs animate-bounce">
                            🚆
                          </div>
                        ) : isCompleted ? (
                          <div className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        ) : isFirst ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[10px] font-bold">
                            ●
                          </div>
                        ) : isLast ? (
                          <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[10px] font-bold">
                            ●
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-slate-900"></div>
                        )}
                      </div>

                      {/* Station Details Card */}
                      <div
                        className={`flex-1 p-3 rounded-2xl border transition ${
                          isCurrent
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-sm'
                            : isCompleted
                            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                {stop.stationName}
                              </span>
                              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-1.5 py-0.2 rounded">
                                {stop.stationCode}
                              </span>
                              {stop.platform && (
                                <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded">
                                  PF {stop.platform}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              {isFirst ? (
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  ● Origin (Dep: {formatTimeWithAmPm(stop.scheduledDeparture)})
                                </span>
                              ) : isLast ? (
                                <span className="font-bold text-red-600 dark:text-red-400">
                                  ● Destination (Arr: {formatTimeWithAmPm(stop.scheduledArrival)})
                                </span>
                              ) : (
                                <span>
                                  Arr: <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatTimeWithAmPm(stop.scheduledArrival)}</strong> &bull; Dep: <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatTimeWithAmPm(stop.scheduledDeparture)}</strong>
                                </span>
                              )}
                              {stop.haltMinutes > 0 && (
                                <span className="text-[10px] text-slate-400">
                                  ({stop.haltMinutes}m halt)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {isCurrent ? (
                              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                                CURRENT LOCATION
                              </span>
                            ) : isCompleted ? (
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                Departed
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                {stop.distanceFromSourceKm} km
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <Link
            to={`/train/${train.trainNumber}`}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <span>Full Train Schedule & Route Map</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-extrabold shadow-sm transition active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
