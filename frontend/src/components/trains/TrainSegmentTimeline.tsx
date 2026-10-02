// frontend/src/components/trains/TrainSegmentTimeline.tsx
// Interactive timeline for TrainsBetweenPage result cards.
// Shows only the searched FROM → TO segment (compact by default: Source ● ── Destination ●).
// Clicking the track segment expands ONLY the scheduled intermediate passenger stops.
// Shows "No Intermediate Station" banner & modal when consecutive.
// RETURN button collapses expanded segments without page reload or resetting state.

import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, MapPin, Clock, RotateCcw, AlertCircle, X } from 'lucide-react';
import { railwayApi, TrainSegmentResult } from '../../api/railwayApi.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toAmPm(timeStr?: string): string {
  if (!timeStr || timeStr === '--' || timeStr === 'START' || timeStr === 'END' || timeStr === '--:--') {
    return '--:--';
  }
  const clean = timeStr.trim();
  if (/am|pm/i.test(clean)) return clean;
  const parts = clean.split(':');
  if (parts.length < 2) return clean;
  let h = parseInt(parts[0], 10);
  const m = parts[1].slice(0, 2);
  if (isNaN(h)) return clean;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '--';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

// ─────────────────────────────────────────────────────────────────────────────
// No Intermediate Station Modal (Section 6 & 22.4)
// ─────────────────────────────────────────────────────────────────────────────

interface NoIntermediateModalProps {
  fromName: string;
  toName: string;
  onClose: () => void;
}

const NoIntermediateModal: React.FC<NoIntermediateModalProps> = ({ fromName, toName, onClose }) => {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="no-intermediate-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden animate-scale-in">
        {/* Orange Notification Banner matching reference screenshot */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <h2 id="no-intermediate-title" className="font-black text-sm tracking-wide">
              No Intermediate Station
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition p-1 rounded-lg hover:bg-white/20"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
            <p>
              There is <strong className="text-amber-800 dark:text-amber-300">no intermediate station present</strong> between{' '}
              <strong className="text-slate-900 dark:text-white">{fromName}</strong> and{' '}
              <strong className="text-slate-900 dark:text-white">{toName}</strong>.
            </p>
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              This is a direct, continuous railway track section without intermediate passenger halts.
            </p>
          </div>

          <button
            id="no-intermediate-ok-btn"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-md transition active:scale-95"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TrainSegmentTimeline
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  trainNumber: string;
  fromCode: string;
  toCode: string;
  fromName: string;
  toName: string;
  fromDeparture?: string;
  toArrival?: string;
  journeyDistanceKm?: number;
}

export const TrainSegmentTimeline: React.FC<Props> = ({
  trainNumber,
  fromCode,
  toCode,
  fromName,
  toName,
  fromDeparture,
  toArrival,
  journeyDistanceKm,
}) => {
  const [segmentResult, setSegmentResult] = useState<TrainSegmentResult | null>(null);
  const [loadingSegment, setLoadingSegment] = useState(false);
  const [segmentLoaded, setSegmentLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [noIntermediateModal, setNoIntermediateModal] = useState<{ fromName: string; toName: string } | null>(null);
  const [timelineVisible, setTimelineVisible] = useState(false);

  const doLoadSegment = useCallback(async () => {
    if (segmentLoaded || loadingSegment) return;
    setLoadingSegment(true);
    try {
      const result = await railwayApi.getTrainSegment(trainNumber, fromCode, toCode);
      setSegmentResult(result);
    } catch {
      setSegmentResult({
        trainNumber,
        trainName: '',
        fromStation: { code: fromCode, name: fromName, scheduledDeparture: fromDeparture || '--:--', distanceFromSourceKm: 0 },
        toStation: { code: toCode, name: toName, scheduledArrival: toArrival || '--:--', distanceFromSourceKm: journeyDistanceKm || 0 },
        journeyDistanceKm: journeyDistanceKm || 0,
        journeyDurationMinutes: 0,
        intermediateStops: [],
        hasIntermediateStops: false,
      });
    } finally {
      setLoadingSegment(false);
      setSegmentLoaded(true);
    }
  }, [trainNumber, fromCode, toCode, fromName, toName, fromDeparture, toArrival, journeyDistanceKm, segmentLoaded, loadingSegment]);

  const handleShowTimeline = async () => {
    setTimelineVisible(true);
    await doLoadSegment();
  };

  const handleSegmentToggle = async () => {
    if (!segmentLoaded) {
      setLoadingSegment(true);
      try {
        const result = await railwayApi.getTrainSegment(trainNumber, fromCode, toCode);
        setSegmentResult(result);
        setSegmentLoaded(true);
        if (!result.intermediateStops || result.intermediateStops.length === 0) {
          setNoIntermediateModal({
            fromName: result.fromStation?.name || fromName,
            toName: result.toStation?.name || toName,
          });
          return;
        }
        setIsExpanded((prev) => !prev);
      } catch {
        setNoIntermediateModal({ fromName, toName });
      } finally {
        setLoadingSegment(false);
      }
      return;
    }

    const intermediates = segmentResult?.intermediateStops || [];
    if (intermediates.length === 0) {
      setNoIntermediateModal({
        fromName: segmentResult?.fromStation?.name || fromName,
        toName: segmentResult?.toStation?.name || toName,
      });
      return;
    }

    setIsExpanded((prev) => !prev);
  };

  const handleReturn = () => {
    // Collapses intermediate stations, keeps source and destination visible, no page reload
    setIsExpanded(false);
  };

  // Resolved display values
  const displayFromName = segmentResult?.fromStation.name || fromName;
  const displayFromCode = segmentResult?.fromStation.code || fromCode;
  const displayFromDep = toAmPm(segmentResult?.fromStation.scheduledDeparture || fromDeparture);
  const displayFromPlatform = segmentResult?.fromStation.platform;

  const displayToName = segmentResult?.toStation.name || toName;
  const displayToCode = segmentResult?.toStation.code || toCode;
  const displayToArr = toAmPm(segmentResult?.toStation.scheduledArrival || toArrival);
  const displayToPlatform = segmentResult?.toStation.platform;

  const displayDistance = segmentResult?.journeyDistanceKm ?? journeyDistanceKm;
  const displayDuration = segmentResult?.journeyDurationMinutes;
  const intermediateStops = segmentResult?.intermediateStops || [];
  const intermediateCount = intermediateStops.length;

  if (!timelineVisible) {
    return (
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          id={`show-timeline-${trainNumber}`}
          onClick={handleShowTimeline}
          className="w-full text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Show Journey Timeline</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <>
      {noIntermediateModal && (
        <NoIntermediateModal
          fromName={noIntermediateModal.fromName}
          toName={noIntermediateModal.toName}
          onClose={() => setNoIntermediateModal(null)}
        />
      )}

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-blue-500" />
            Route Segment
          </span>
          <div className="flex items-center gap-2">
            {displayDistance !== undefined && displayDistance > 0 && (
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                {displayDistance} km
                {displayDuration && displayDuration > 0 && (
                  <span className="ml-1 text-blue-600 dark:text-blue-400 font-bold">• {formatDuration(displayDuration)}</span>
                )}
              </span>
            )}
            <button
              onClick={() => {
                setTimelineVisible(false);
                setIsExpanded(false);
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Close Timeline"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3-Column Subheader */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black tracking-wider text-slate-400 uppercase">
          <div className="w-20 text-left">Arrival</div>
          <div className="flex-1 text-center text-blue-600 dark:text-blue-400">Station & Track</div>
          <div className="w-20 text-right">Departure</div>
        </div>

        {loadingSegment && (
          <div className="text-xs text-blue-500 text-center py-2 animate-pulse flex items-center justify-center gap-1.5">
            <Clock className="w-3 h-3 animate-spin" />
            Loading segment schedule...
          </div>
        )}

        {/* Vertical Timeline */}
        <div className="space-y-0.5">
          {/* SOURCE STATION ROW */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {/* Left: Origin (no arrival) */}
            <div className="w-20 text-left font-mono text-xs text-slate-400">
              ---
            </div>

            {/* Center: Node + Name + Code + PF */}
            <div className="flex-1 flex items-center gap-2 min-w-0 px-2">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-xs shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {displayFromName}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1 py-0.2 rounded bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                    {displayFromCode}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  {displayFromPlatform ? `PF ${displayFromPlatform}` : 'Platform not available'}
                </div>
              </div>
            </div>

            {/* Right: Departure */}
            <div className="w-20 text-right font-mono text-xs font-black text-slate-900 dark:text-white">
              {displayFromDep}
            </div>
          </div>

          {/* CLICKABLE TRACK SEGMENT CONNECTOR */}
          <div className="relative pl-3.5 pr-2 py-1">
            {/* Continuous Track Line */}
            <div className="absolute left-[22px] top-0 bottom-0 w-1 bg-blue-500 rounded-full" />

            <div className="ml-6 py-1">
              <button
                type="button"
                id={`seg-toggle-${trainNumber}`}
                onClick={handleSegmentToggle}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-98 shadow-2xs ${
                  isExpanded
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800'
                }`}
                aria-expanded={isExpanded}
                title="Click timeline segment to view scheduled intermediate stops"
              >
                <div className="flex items-center gap-1.5">
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>
                    {isExpanded
                      ? 'Hide Intermediate Stops'
                      : intermediateCount > 0
                      ? `Click to expand intermediate stops (${intermediateCount})`
                      : 'Click to inspect intermediate stops'}
                  </span>
                </div>
                {isExpanded && (
                  <span className="text-[10px] font-bold uppercase bg-white/20 px-2 py-0.5 rounded-md">
                    Expanded
                  </span>
                )}
              </button>

              {/* EXPANDED INTERMEDIATE STATIONS (Matching Section 22.1 & 22.2 Reference Design) */}
              {isExpanded && intermediateStops.length > 0 && (
                <div className="mt-2 space-y-1.5 animate-fade-in">
                  {/* RETURN BUTTON at top of expanded section */}
                  <div className="flex justify-end pb-1">
                    <button
                      id={`return-${trainNumber}`}
                      type="button"
                      onClick={handleReturn}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-black shadow-xs transition active:scale-95"
                      title="Return and collapse intermediate stations"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>RETURN</span>
                    </button>
                  </div>

                  {intermediateStops.map((istop) => {
                    const arr12H = toAmPm(istop.scheduledArrival);
                    const dep12H = toAmPm(istop.scheduledDeparture);

                    return (
                      <div
                        key={istop.stationCode}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs"
                      >
                        {/* Left Column: Arrival */}
                        <div className="w-20 text-left font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {arr12H !== '--:--' ? arr12H : '---'}
                        </div>

                        {/* Center Column: Node + Station Name + Distance + Platform */}
                        <div className="flex-1 flex items-center gap-2 min-w-0 px-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white dark:border-slate-900 shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                                {istop.stationName}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                {istop.stationCode}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {istop.distanceFromSourceKm > 0 && (
                                <span className="font-mono">{istop.distanceFromSourceKm} km</span>
                              )}
                              <span>•</span>
                              <span>
                                {istop.platform ? `PF ${istop.platform}` : 'Platform not available'}
                              </span>
                              {istop.haltMinutes > 0 ? (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-600 dark:text-amber-400 font-semibold">{istop.haltMinutes}m halt</span>
                                </>
                              ) : (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-500 dark:text-slate-400 font-medium">Pass-through</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Departure */}
                        <div className="w-20 text-right font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {dep12H !== '--:--' ? dep12H : '---'}
                        </div>
                      </div>
                    );
                  })}

                  {/* RETURN BUTTON at bottom of expanded section */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleReturn}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-black shadow-xs transition active:scale-95"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>RETURN</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DESTINATION STATION ROW */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {/* Left: Arrival */}
            <div className="w-20 text-left font-mono text-xs font-black text-slate-900 dark:text-white">
              {displayToArr}
            </div>

            {/* Center: Node + Name + Code + PF */}
            <div className="flex-1 flex items-center gap-2 min-w-0 px-2">
              <div className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-900 shadow-xs shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {displayToName}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1 py-0.2 rounded bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300">
                    {displayToCode}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  {displayToPlatform ? `PF ${displayToPlatform}` : 'Platform not available'}
                </div>
              </div>
            </div>

            {/* Right: Terminus (no departure) */}
            <div className="w-20 text-right font-mono text-xs text-slate-400">
              ---
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TrainSegmentTimeline;
