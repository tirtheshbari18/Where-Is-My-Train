// frontend/src/components/trains/TrainCard.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Train, ArrowRight, Clock, Heart, Utensils, CheckCircle2, MapPin } from 'lucide-react';
import { TrainSummary } from '../../api/railwayApi.js';
import { storage } from '../../utils/storage.js';
import { formatTimeWithAmPm } from '../../utils/timeFormat.js';
import { TrainRouteStatusModal } from './TrainRouteStatusModal.js';

interface Props {
  train: TrainSummary;
  onFavouriteToggle?: () => void;
  highlightRoute?: { from: string; to: string; date?: string };
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TrainCard: React.FC<Props> = ({ train, onFavouriteToggle, highlightRoute }) => {
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
        return 'bg-blue-600 text-white';
      case 'Rajdhani':
        return 'bg-red-600 text-white';
      case 'Shatabdi':
        return 'bg-cyan-700 text-white';
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

  const isLiveTelemetry = Boolean(train.isLive);
  const delay = train.delayMinutes ?? 0;

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
                {train.sourceCode}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {train.sourceName}
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
                {train.destinationCode}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {train.destinationName}
              </div>
            </div>
          </div>
        </div>

        {/* Status, Platform, Frequency & Duration Bar */}
        <div className="flex items-center justify-between gap-2 text-xs mb-3 px-1 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Live vs Scheduled Badge */}
            {isLiveTelemetry ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>● LIVE {delay > 0 ? `${delay}M LATE` : 'ON TIME'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span>SCHEDULED</span>
              </span>
            )}

            {/* Platform Badge */}
            {train.platform && (
              <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold font-mono text-[11px] border border-blue-200 dark:border-blue-800">
                PF {train.platform}
              </span>
            )}

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
            to={`/train/${train.trainNumber}`}
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
