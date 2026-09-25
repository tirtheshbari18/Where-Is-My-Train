import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  RefreshCw,
  Search,
  Clock,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { railwayApi, LiveStationBoard, StationLocation } from '../api/railwayApi.js';
import { DelayBadge } from '../components/trains/DelayBadge.js';

const QUICK_STATIONS = [
  { code: 'LJN', name: 'Lucknow Jn' },
  { code: 'KSJ', name: 'Kasganj Jn' },
  { code: 'MMCT', name: 'Mumbai Central' },
  { code: 'BVI', name: 'Borivali' },
  { code: 'NDLS', name: 'New Delhi' },
  { code: 'HWH', name: 'Howrah' },
  { code: 'MAS', name: 'Chennai Central' },
  { code: 'CNB', name: 'Kanpur Central' },
  { code: 'ADI', name: 'Ahmedabad' },
];

export const LiveStationPage: React.FC = () => {
  const [selectedStation, setSelectedStation] = useState('MMCT');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StationLocation[]>([]);
  const [liveBoard, setLiveBoard] = useState<LiveStationBoard | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'arrivals' | 'departures' | 'delayed'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(30);

  const fetchBoard = async (code: string) => {
    try {
      const data = await railwayApi.getLiveStation(code, 4);
      setLiveBoard(data);
    } catch (err) {
      console.error('Failed to fetch live board:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchBoard(selectedStation);
    setRefreshCountdown(30);
  }, [selectedStation]);

  // Automatic 30s refresh countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchBoard(selectedStation);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedStation]);

  const handleStationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const results = await railwayApi.searchStations(searchQuery.trim());
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
  };

  // Compile train list based on filter
  const getDisplayTrains = () => {
    if (!liveBoard) return [];
    if (filterMode === 'arrivals') return liveBoard.arrivals;
    if (filterMode === 'departures') return liveBoard.departures;
    if (filterMode === 'delayed') return liveBoard.delayedTrains;

    // All combined
    return [...liveBoard.departures, ...liveBoard.arrivals];
  };

  const displayTrains = getDisplayTrains();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Clock className="w-7 h-7 text-amber-400" />
            <span>Live Station Departure & Arrival Board</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time railway station indicator displaying live train movements and platforms.
          </p>
        </div>

        {/* Auto Refresh Indicator */}
        <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs">
          <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span className="text-slate-400">Auto-refreshing in:</span>
          <span className="font-mono font-bold text-amber-400">{refreshCountdown}s</span>
        </div>
      </div>

      {/* Station Selector Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
        <form onSubmit={handleStationSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search and select any Indian Railway station (e.g. Borivali, Surat, New Delhi)..."
            className="w-full bg-slate-950 text-white placeholder-slate-500 rounded-xl pl-10 pr-24 py-2.5 border border-slate-700 text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
          >
            Find
          </button>
        </form>

        {/* Quick Station Select Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-semibold shrink-0">Popular Hubs:</span>
          {QUICK_STATIONS.map((st) => (
            <button
              key={st.code}
              onClick={() => {
                setSelectedStation(st.code);
                setSearchResults([]);
                setSearchQuery('');
              }}
              className={`px-3 py-1 rounded-lg shrink-0 font-medium transition ${
                selectedStation === st.code
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {st.name} ({st.code})
            </button>
          ))}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {searchResults.map((st) => (
              <button
                key={st.code}
                onClick={() => {
                  setSelectedStation(st.code);
                  setSearchResults([]);
                  setSearchQuery('');
                }}
                className="text-left p-2 rounded-lg hover:bg-slate-900 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white text-xs">{st.name}</div>
                  <div className="text-[10px] text-amber-400 font-mono">{st.code}</div>
                </div>
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Board Controls & Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterMode === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Scheduled ({((liveBoard?.departures.length ?? 0) + (liveBoard?.arrivals.length ?? 0))})
          </button>
          <button
            onClick={() => setFilterMode('departures')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterMode === 'departures'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Departing ({liveBoard?.departures.length ?? 0})
          </button>
          <button
            onClick={() => setFilterMode('arrivals')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterMode === 'arrivals'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Arriving ({liveBoard?.arrivals.length ?? 0})
          </button>
          <button
            onClick={() => setFilterMode('delayed')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterMode === 'delayed'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Delayed ({liveBoard?.delayedTrains.length ?? 0})
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Last updated: <strong className="text-slate-200">{liveBoard?.lastUpdated || 'Now'}</strong>
        </div>
      </div>

      {/* Live Train Board Items */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-amber-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-xs font-semibold">Syncing station electronic display board...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {displayTrains.length > 0 ? (
            displayTrains.map((train, idx) => (
              <div
                key={`${train.trainNumber}_${train.scheduledTime}_${idx}`}
                className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-amber-500/30 transition flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center font-mono shrink-0">
                    <span className="text-lg font-black text-white block">
                      {train.scheduledTime}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">
                      {train.type}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {train.trainNumber}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                        {train.trainType}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-semibold">
                        Platform {train.platform}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mt-1">
                      {train.trainName}
                    </h3>

                    <div className="text-xs text-slate-400 mt-0.5">
                      {train.sourceName} ➔ {train.destinationName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DelayBadge delayMinutes={train.delayMinutes} status={train.status} />
                  <Link
                    to={`/train/${train.trainNumber}`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                    title="Track Train"
                  >
                    <ExternalLink className="w-4 h-4 text-amber-400" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 text-slate-400 text-xs">
              No trains found under current filter for station {selectedStation}.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
