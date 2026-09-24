import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Wifi, Layers, ExternalLink, Heart } from 'lucide-react';
import { StationLocation } from '../../api/railwayApi.js';
import { storage } from '../../utils/storage.js';

interface Props {
  station: StationLocation;
  onFavouriteToggle?: () => void;
}

export const StationCard: React.FC<Props> = ({ station, onFavouriteToggle }) => {
  const [isFav, setIsFav] = React.useState(() =>
    storage.isFavourite('STATION', station.code)
  );

  const toggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFav) {
      storage.removeFavourite('STATION', station.code);
      setIsFav(false);
    } else {
      storage.addFavourite({
        type: 'STATION',
        codeOrNumber: station.code,
        title: `${station.name} (${station.code})`,
        subtitle: `${station.zone || 'IR'} Railway • ${station.state || 'India'}`,
      });
      setIsFav(true);
    }
    onFavouriteToggle?.();
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800 transition relative group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 text-amber-400 group-hover:scale-105 transition-transform">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-amber-400 font-mono tracking-tight">
                {station.code}
              </span>
              {station.zone && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                  {station.zone} Railway
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-white mt-0.5 line-clamp-1">
              {station.name}
            </h3>
          </div>
        </div>

        <button
          onClick={toggleFav}
          className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition"
          aria-label="Save favourite station"
        >
          <Heart className={`w-5 h-5 ${isFav ? 'text-red-500 fill-red-500' : ''}`} />
        </button>
      </div>

      <div className="text-xs text-slate-400 space-y-1 mb-4">
        {station.division && (
          <div>Division: <span className="text-slate-300 font-medium">{station.division}</span></div>
        )}
        {station.state && (
          <div>State: <span className="text-slate-300 font-medium">{station.state}</span></div>
        )}
      </div>

      {/* Facilities & Distance */}
      <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800 text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>{station.numberOfPlatforms} Platforms</span>
          </span>
          {station.wifiAvailable && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Wifi className="w-3.5 h-3.5" />
              <span>Free WiFi</span>
            </span>
          )}
        </div>

        {station.distanceKm !== undefined && (
          <span className="font-mono text-amber-400 font-semibold text-[11px]">
            {station.distanceKm} km away
          </span>
        )}
      </div>

      {/* Action CTA */}
      <div className="mt-4">
        <Link
          to={`/station/${station.code}`}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
        >
          <span>View Live Departures & Arrivals</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
