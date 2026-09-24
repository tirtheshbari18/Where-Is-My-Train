import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radio, Search, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { railwayApi, TrainSummary } from '../api/railwayApi.js';
import { DelayBadge } from '../components/trains/DelayBadge.js';

export const LiveTrainsPage: React.FC = () => {
  const navigate = useNavigate();
  const [trainQuery, setTrainQuery] = useState('');
  const [activeTrains, setActiveTrains] = useState<TrainSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    railwayApi.searchTrains('').then((data) => {
      setActiveTrains(data);
    }).finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trainQuery.trim()) {
      navigate(`/train/${encodeURIComponent(trainQuery.trim())}?tab=live`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Live Interlocking Telemetry Feed</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <Radio className="w-7 h-7 text-amber-400 animate-pulse" />
          <span>Live Running Trains Radar</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Instant status inquiry for trains currently running on Indian Railway tracks.
        </p>
      </div>

      {/* Quick Search */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={trainQuery}
            onChange={(e) => setTrainQuery(e.target.value)}
            placeholder="Enter Train Number (e.g. 20901, 12951, 22436)..."
            className="w-full bg-slate-950 text-white placeholder-slate-500 rounded-2xl pl-12 pr-32 py-4 border border-slate-700 text-sm sm:text-base focus:border-amber-500 focus:outline-none"
          />
          <Search className="w-5 h-5 text-amber-400 absolute left-4 top-4.5" />
          <button
            type="submit"
            className="absolute right-2 top-2 bottom-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition"
          >
            Track Live
          </button>
        </form>
      </div>

      {/* Currently Running Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Trains In Transit Across Corridors</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {activeTrains.length} Active Feeds
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-amber-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs font-semibold">Scanning railway track sensors...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTrains.map((train) => (
              <div
                key={train.trainNumber}
                className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono font-extrabold text-amber-400 text-lg">
                      {train.trainNumber}
                    </span>
                    <DelayBadge delayMinutes={train.trainType === 'Vande Bharat' ? 5 : 12} />
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-1">
                    {train.trainName}
                  </h3>

                  <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                    <span className="font-semibold text-slate-300">{train.sourceCode}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                    <span className="font-semibold text-slate-300">{train.destinationCode}</span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono">{train.distanceKm} km</span>
                  </div>

                  <div className="mt-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-300 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">
                      Next stop expected on time
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800">
                  <Link
                    to={`/train/${train.trainNumber}?tab=live`}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
                  >
                    <span>Open Live Timeline & Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
