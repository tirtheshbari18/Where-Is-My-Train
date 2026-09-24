import React from 'react';
import { Link } from 'react-router-dom';
import { Train, ArrowRight, Clock, MapPin, Heart, Utensils } from 'lucide-react';
import { TrainSummary } from '../../api/railwayApi.js';
import { storage } from '../../utils/storage.js';

interface Props {
  train: TrainSummary;
  onFavouriteToggle?: () => void;
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TrainCard: React.FC<Props> = ({ train, onFavouriteToggle }) => {
  const [isFav, setIsFav] = React.useState(() =>
    storage.isFavourite('TRAIN', train.trainNumber)
  );

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

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'Vande Bharat':
        return 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/20';
      case 'Rajdhani':
        return 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-red-500/20';
      case 'Shatabdi':
        return 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-500/20';
      case 'Superfast':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800 transition relative group">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0 text-amber-400 group-hover:scale-105 transition-transform">
            <Train className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-extrabold text-white font-mono tracking-tight">
                {train.trainNumber}
              </span>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold shadow-sm ${getTypeBadgeClass(
                  train.trainType
                )}`}
              >
                {train.trainType}
              </span>
              {train.hasPantry && (
                <span
                  title="Pantry Car Available"
                  className="p-1 rounded-md bg-slate-800/80 text-amber-400 border border-slate-700"
                >
                  <Utensils className="w-3 h-3" />
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mt-1 line-clamp-1">
              {train.trainName}
            </h3>
          </div>
        </div>

        <button
          onClick={toggleFav}
          className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition"
          aria-label="Add to favourites"
        >
          <Heart
            className={`w-5 h-5 ${isFav ? 'text-red-500 fill-red-500' : ''}`}
          />
        </button>
      </div>

      {/* Origin -> Destination Route Details */}
      <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 mb-4">
        <div className="grid grid-cols-7 items-center text-center">
          <div className="col-span-3 text-left">
            <div className="text-lg font-bold text-white font-mono">
              {train.departureTime}
            </div>
            <div className="text-xs font-semibold text-amber-400">
              {train.sourceCode}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {train.sourceName}
            </div>
          </div>

          <div className="col-span-1 flex flex-col items-center justify-center">
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">
              {formatDuration(train.durationMinutes)}
            </span>
          </div>

          <div className="col-span-3 text-right">
            <div className="text-lg font-bold text-white font-mono">
              {train.arrivalTime}
            </div>
            <div className="text-xs font-semibold text-amber-400">
              {train.destinationCode}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {train.destinationName}
            </div>
          </div>
        </div>
      </div>

      {/* Running Days & Distance */}
      <div className="flex items-center justify-between gap-2 text-xs mb-4">
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-400 mr-1">Runs:</span>
          {ALL_DAYS.map((day) => {
            const runs = train.runningDays?.includes(day);
            return (
              <span
                key={day}
                className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                  runs
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-600 bg-slate-900/50'
                }`}
              >
                {day[0]}
              </span>
            );
          })}
        </div>

        <div className="text-slate-400 text-[11px] font-mono">
          {train.distanceKm} km
        </div>
      </div>

      {/* Action CTA Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
        <Link
          to={`/train/${train.trainNumber}`}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
        >
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Full Route</span>
        </Link>
        <Link
          to={`/train/${train.trainNumber}?tab=live`}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/10 transition"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Live Status</span>
        </Link>
      </div>
    </div>
  );
};
