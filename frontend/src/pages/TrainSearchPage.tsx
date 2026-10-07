import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Train, Filter, Loader2, AlertCircle, Clock, ArrowUpDown, WifiOff } from 'lucide-react';
import { railwayApi, TrainSummary } from '../api/railwayApi.js';
import { TrainCard } from '../components/trains/TrainCard.js';
import { offlineStorageService } from '../services/offlineStorageService.js';
import { useTranslation } from '../context/LanguageContext.js';
import { useRequestGuard } from '../hooks/useRequestGuard.js';
import { PRIMARY_FILTER_CATEGORIES, matchesCategory } from '../utils/trainCategory.js';
import { parseTimeToMinutes } from '../utils/timeFormat.js';

// Master category filter pills from Section 9 (ALL, EXPRESS, LOCALS, SUPERFAST, WEEKLY, etc.)
const TRAIN_TYPES = PRIMARY_FILTER_CATEGORIES;

type TimeSlot = 'ALL' | 'morning' | 'afternoon' | 'evening' | 'night';
type SortOption = 'default' | 'duration' | 'departure' | 'arrival';

export const TrainSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const { t } = useTranslation();

  const [query, setQuery] = useState(initialQuery);
  const [trains, setTrains] = useState<TrainSummary[]>([]);
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineResult, setIsOfflineResult] = useState(false);

  // Only the latest search may update the UI (rapid consecutive searches must not race).
  const searchGuard = useRequestGuard();

  const fetchTrains = async (q: string) => {
    const requestId = searchGuard.next();
    setLoading(true);
    setError(null);

    // If offline, use offlineStorageService
    if (!offlineStorageService.isOnline()) {
      const offlineData = offlineStorageService.searchOfflineTrains(q);
      if (!searchGuard.isCurrent(requestId)) return;
      setTrains(offlineData as any);
      setIsOfflineResult(true);
      setLoading(false);
      return;
    }

    try {
      const data = await railwayApi.searchTrains(q);
      if (!searchGuard.isCurrent(requestId)) return;
      setTrains(data);
      setIsOfflineResult(false);
      // Cache for offline search
      data.forEach((item) => offlineStorageService.cacheTrain(item));
    } catch (err: any) {
      if (!searchGuard.isCurrent(requestId)) return;
      // Fallback to offline search if API fails
      const offlineData = offlineStorageService.searchOfflineTrains(q);
      if (offlineData.length > 0) {
        setTrains(offlineData as any);
        setIsOfflineResult(true);
      } else {
        setError(err.message || 'Failed to search trains');
      }
    } finally {
      if (searchGuard.isCurrent(requestId)) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrains(initialQuery);
    return () => searchGuard.invalidate();
  }, [initialQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentQ = searchParams.get('q') || '';
    if (currentQ === query) {
      // Search params unchanged -> the effect above will not re-fire, fetch directly.
      fetchTrains(query);
    } else {
      // Changing the params re-runs the guarded effect, avoiding a duplicate request.
      setSearchParams(query ? { q: query } : {});
    }
  };

  // Filter and Sort
  const filteredTrains = trains
    .filter((t) => {
      // Filter by type
      if (selectedType !== 'ALL' && !matchesCategory(t.trainType, selectedType)) {
        return false;
      }

      // Filter by departure time slot
      if (selectedTimeSlot !== 'ALL') {
        const totalMinutes = parseTimeToMinutes(t.departureTime);
        const h = Math.floor(totalMinutes / 60);
        if (selectedTimeSlot === 'morning' && (h < 4 || h >= 12)) return false;
        if (selectedTimeSlot === 'afternoon' && (h < 12 || h >= 17)) return false;
        if (selectedTimeSlot === 'evening' && (h < 17 || h >= 21)) return false;
        if (selectedTimeSlot === 'night' && h >= 4 && h < 21) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'duration') {
        return (a.durationMinutes || 0) - (b.durationMinutes || 0);
      }
      if (sortBy === 'departure') {
        return parseTimeToMinutes(a.departureTime) - parseTimeToMinutes(b.departureTime);
      }
      if (sortBy === 'arrival') {
        return parseTimeToMinutes(a.arrivalTime) - parseTimeToMinutes(b.arrivalTime);
      }
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <Search className="w-7 h-7 text-blue-400" />
          <span>{t('search.title')}</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Search by train number (e.g. 05379, 20901, 12951), train name, or stations.
        </p>
      </div>

      {/* Offline Notice if applicable */}
      {isOfflineResult && (
        <div className="p-3 bg-amber-950/80 border border-amber-600 rounded-xl text-xs text-amber-300 flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Offline search mode: displaying previously cached Indian Railways timetables.</span>
        </div>
      )}

      {/* Search Input Box */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 05379, Lucknow, Kasganj, 20901, Vande Bharat, Rajdhani..."
          className="w-full bg-slate-900 text-white placeholder-slate-500 rounded-2xl pl-12 pr-28 py-3.5 border border-slate-700 focus:outline-none focus:border-blue-500 text-sm sm:text-base transition"
        />
        <Search className="w-5 h-5 text-blue-400 absolute left-4 top-4" />
        <button
          type="submit"
          className="absolute right-2 top-2 bottom-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow"
        >
          <span>Search</span>
        </button>
      </form>

      {/* Filters & Sorting Control Bar */}
      <div className="space-y-3">
        {/* Train Type Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-slate-500 shrink-0 mr-1" />
          {TRAIN_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedType === type
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Departure Time Slots & Sort Options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Time Slot Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-slate-400 text-[11px] font-semibold uppercase mr-1">Dep Time:</span>
            {[
              { slot: 'ALL', label: 'All Hours' },
              { slot: 'morning', label: 'Morning (04-12)' },
              { slot: 'afternoon', label: 'Afternoon (12-17)' },
              { slot: 'evening', label: 'Evening (17-21)' },
              { slot: 'night', label: 'Night (21-04)' },
            ].map(({ slot, label }) => (
              <button
                key={slot}
                onClick={() => setSelectedTimeSlot(slot as TimeSlot)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                  selectedTimeSlot === slot
                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-400 text-[11px] font-semibold uppercase">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="default">Default</option>
              <option value="duration">Fastest (Duration)</option>
              <option value="departure">Earliest Departure</option>
              <option value="arrival">Earliest Arrival</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-blue-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-medium">Scanning Railway Directory & Upstream Feeds...</span>
        </div>
      )}

      {error && (
        <div className="glass-panel p-4 rounded-2xl border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Grid */}
      {!loading && !error && (
        <>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Found <strong className="text-white">{filteredTrains.length}</strong> trains
              {selectedType !== 'ALL' && ` in ${selectedType}`}
              {selectedTimeSlot !== 'ALL' && ` (${selectedTimeSlot})`}
            </span>
          </div>

          {filteredTrains.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredTrains.map((train) => (
                <TrainCard key={train.trainNumber} train={train} />
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-10 text-center border border-slate-800">
              <Train className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">
                No trains matching your query
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try searching by a 5-digit train number (e.g. 05379, 20901) or a major junction name like Lucknow, Kasganj, Delhi, or Mumbai.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
