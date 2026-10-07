// frontend/src/components/trains/TrainCard.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Train,
  ArrowRight,
  Clock,
  Heart,
  Utensils,
  CheckCircle2,
  MapPin,
  AlertTriangle,
  RefreshCw,
  Navigation,
} from 'lucide-react';
import { TrainSummary } from '../../api/railwayApi.js';
import { storage } from '../../utils/storage.js';
import { formatTimeWithAmPm } from '../../utils/timeFormat.js';
import { TrainRouteStatusModal } from './TrainRouteStatusModal.js';

interface Props {
  train: TrainSummary;
  onFavouriteToggle?: () => void;
  highlightRoute?: { from: string; to: string; date?: string };
  onRetryLive?: (trainNumber: string) => void;
  isLiveLoading?: boolean;
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TrainCard: React.FC<Props> = ({
  train,
  onFavouriteToggle,
  highlightRoute,
  onRetryLive,
  isLiveLoading = false,
}) => {
  const [isFav, setIsFav] = useState(() =>
    storage.isFavourite('TRAIN', train.trainNumber)
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFav) {
      storage.removeFavourite('TRAIN', train.trainNumber);
      setIsFav(false);
    } else {
      storage.addFavourite({
        type: 'TRAIN',
        codeOrNumber: train.trainNumber,
        title: `${train.trainNumber} - ${train.trainName}`,
        subtitle: `${train.sourceCode} → ${train.destinationCode}`,
      });
      setIsFav(true);
    }
    onFavouriteToggle?.();
  };

  const isLocal =
    train.trainType.toLowerCase().includes('local') ||
    train.trainType.toLowerCase().includes('suburban') ||
    train.trainType.toLowerCase().includes('memu') ||
    train.trainType.toLowerCase().includes('emu');

  const isFastLocal = train.trainType.toLowerCase().includes('fast');

  const getTypeBadgeClass = (type: string) => {
    if (isLocal) {
      return isFastLocal
        ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
        : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    }
    switch (type) {
      case 'Vande Bharat':
        return 'bg-blue-600 text-white border-blue-600';
      case 'Rajdhani':
        return 'bg-red-600 text-white border-red-600';
      case 'Shatabdi':
        return 'bg-cyan-700 text-white border-cyan-700';
      case 'Superfast':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const getFare = () => {
    if (isLocal) {
      if (train.distanceKm <= 20) return 5;
      if (train.distanceKm <= 50) return 10;
      if (train.distanceKm <= 80) return 15;
      return 20;
    }
    if (train.trainType === 'Vande Bharat') {
      return Math.max(380, Math.round(train.distanceKm * 2.1));
    }
    return Math.max(35, Math.round(train.distanceKm * 0.4));
  };

  const isDaily =
    !train.runningDays ||
    train.runningDays.length === 7 ||
    ALL_DAYS.every((d) => train.runningDays?.includes(d));

  const live = train.liveStatus;
  const hasLive = Boolean(live && live.available);
  const delay = live?.delayMinutes ?? train.delayMinutes ?? 0;

  // Accessible Delay & Status configuration
  const renderStatusBadge = () => {
    if (isLiveLoading) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
          <span>Fetching live status...</span>
        </span>
      );
    }

    if (hasLive && live) {
      if (live.status === 'CANCELLED') {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-300 dark:border-red-700">
            <span aria-hidden="true">🔴</span>
            <span>CANCELLED</span>
          </span>
        );
      }
      if (live.status === 'DIVERTED') {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <span aria-hidden="true">🟡</span>
            <span>DIVERTED</span>
          </span>
        );
      }
      if (delay === 0) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <span aria-hidden="true">🟢</span>
            <span>ON TIME</span>
          </span>
        );
      }
      if (delay <= 15) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <span aria-hidden="true">🟡</span>
            <span>{delay} MIN LATE</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-300 dark:border-red-700">
          <span aria-hidden="true">🔴</span>
          <span>{delay} MIN LATE</span>
        </span>
      );
    }

    if (train.isLive) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
          <span aria-hidden="true">🟢</span>
          <span>● LIVE {delay > 0 ? `${delay}M LATE` : 'ON TIME'}</span>
        </span>
      );
    }

    // Live status unavailable fallback
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
        <span>SCHEDULED</span>
      </span>
    );
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition duration-200 relative group">
        {/* Header Row: Train Number, Badge, Name & Fav */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 font-black">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {train.trainNumber}
                </span>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${getTypeBadgeClass(
                    train.trainType
                  )}`}
                >
                  {train.trainType}
                </span>
                {train.hasPantry && (
                  <span
                    title="Pantry Car Available"
                    className="p-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  >
                    <Utensils className="w-3 h-3" />
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 line-clamp-1">
                {train.trainName}
              </h3>
            </div>
          </div>

          <button
            onClick={toggleFav}
            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Add to favourites"
          >
            <Heart className={`w-5 h-5 ${isFav ? 'text-red-500 fill-red-500' : ''}`} />
          </button>
        </div>

        {/* Main Journey Segment Row */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60 mb-3">
          <div className="grid grid-cols-7 items-center text-center">
            <div className="col-span-3 text-left">
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono">
                {formatTimeWithAmPm(train.departureTime)}
              </div>
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {train.fromStation?.code || train.sourceCode}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {train.fromStation?.name || train.sourceName}
              </div>
            </div>

            <div className="col-span-1 flex flex-col items-center justify-center">
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5 whitespace-nowrap">
                {formatDuration(train.durationMinutes)}
              </span>
            </div>

            <div className="col-span-3 text-right">
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono">
                {formatTimeWithAmPm(train.arrivalTime)}
              </div>
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {train.toStation?.code || train.destinationCode}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {train.toStation?.name || train.destinationName}
              </div>
            </div>
          </div>
        </div>

        {/* Full Service Origin/Destination if different from selected segment */}
        {train.trainOriginName && train.trainDestinationName && (train.trainOriginCode !== (train.fromStation?.code || train.sourceCode) || train.trainDestinationCode !== (train.toStation?.code || train.destinationCode)) && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 px-1 flex items-center gap-1.5 truncate">
            <span className="font-semibold text-slate-400">Service:</span>
            <span>{train.trainOriginName}</span>
            <span>→</span>
            <span>{train.trainDestinationName}</span>
          </div>
        )}

        {/* Intermediate Station Route Pathway (e.g. Boisar → Vangaon → Dahanu Road) */}
        {(train.routeStationsText || (train.intermediateStationsList && train.intermediateStationsList.length > 0)) && (
          <div className="bg-blue-50/60 dark:bg-blue-950/40 rounded-xl px-3 py-2 border border-blue-100 dark:border-blue-900/40 mb-3 flex items-center justify-between text-xs">
            <div className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Route:</span>
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100">
                {train.routeStationsText || `${train.fromStation?.name || train.sourceName} → ${train.intermediateStationsList?.join(' → ')} → ${train.toStation?.name || train.destinationName}`}
              </span>
            </div>
          </div>
        )}

        {/* Live Running Information Card (Requirements 10 & 24) */}
        {hasLive && live ? (
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl p-3 border border-emerald-200/80 dark:border-emerald-800/60 mb-3 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {renderStatusBadge()}
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                {live.lastUpdated || 'Updated just now'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300 pt-1">
              {live.currentStation && (
                <div className="flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Location: </span>
                    {live.currentStation.startsWith('At ') || live.currentStation.startsWith('Between ')
                      ? live.currentStation
                      : `At ${live.currentStation}`}
                  </span>
                </div>
              )}

              {live.nextStation && (
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Next: </span>
                    {live.nextStation}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : live && !live.available ? (
          // Live status unavailable for this train (Requirement 11)
          <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-xl p-2.5 border border-amber-200 dark:border-amber-800/60 mb-3 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>LIVE STATUS: Temporarily unavailable</span>
            </div>
            {onRetryLive && (
              <button
                type="button"
                onClick={() => onRetryLive(train.trainNumber)}
                disabled={isLiveLoading}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold text-[11px] transition"
              >
                <RefreshCw className={`w-3 h-3 ${isLiveLoading ? 'animate-spin' : ''}`} />
                <span>Retry</span>
              </button>
            )}
          </div>
        ) : null}

        {/* Platform, Fare & Operating Frequency Bar */}
        <div className="flex items-center justify-between gap-2 text-xs mb-3 px-1 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {!hasLive && renderStatusBadge()}

            {/* Platform Badge (Requirement 33: Never invent platform number) */}
            <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold font-mono text-[11px] border border-blue-200 dark:border-blue-800">
              {train.platform || live?.platform
                ? `PF ${train.platform || live?.platform}`
                : 'Platform: Not available'}
            </span>

            {/* Fare badge */}
            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold font-mono text-[11px] border border-emerald-200 dark:border-emerald-800">
              ₹{getFare()}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              {isDaily ? 'Runs Daily' : `Runs (${train.runningDays?.length || 0} days/wk)`}
            </span>
            <span className="font-mono">{train.distanceKm} km</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm transition active:scale-95"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>View Route & Status</span>
          </button>

          <Link
            to={`/train/${train.trainNumber}${highlightRoute?.date ? `?date=${highlightRoute.date}` : ''}`}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Full Schedule</span>
          </Link>
        </div>
      </div>

      {/* Expanded Route & Status Modal */}
      {isModalOpen && (
        <TrainRouteStatusModal
          train={train}
          fromCode={highlightRoute?.from || train.sourceCode}
          toCode={highlightRoute?.to || train.destinationCode}
          travelDate={highlightRoute?.date}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};
