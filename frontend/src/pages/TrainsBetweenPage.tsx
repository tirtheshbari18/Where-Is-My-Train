// frontend/src/pages/TrainsBetweenPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  ArrowRightLeft,
  Filter,
  Train,
  Loader2,
  AlertCircle,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { railwayApi, TrainSummary } from '../api/railwayApi.js';
import { TrainCard } from '../components/trains/TrainCard.js';
import { StationAutocomplete } from '../components/common/StationAutocomplete.js';
import { offlineStorageService } from '../services/offlineStorageService.js';
import { searchHistoryService } from '../services/searchHistoryService.js';
import { useRequestGuard } from '../hooks/useRequestGuard.js';
import { PRIMARY_FILTER_CATEGORIES, matchesCategory } from '../utils/trainCategory.js';

// Master category filter pills from Section 9 (ALL, EXPRESS, LOCALS, SUPERFAST, WEEKLY, etc.)
const FILTER_CLASSES = PRIMARY_FILTER_CATEGORIES;

export const TrainsBetweenPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromParam = searchParams.get('from') || 'BOR';
  const toParam = searchParams.get('to') || 'DRD';
  const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [fromStation, setFromStation] = useState(fromParam);
  const [toStation, setToStation] = useState(toParam);
  const [travelDate, setTravelDate] = useState(dateParam);
  const [trains, setTrains] = useState<TrainSummary[]>([]);
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [sortBy, setSortBy] = useState<'departure' | 'arrival' | 'duration'>('departure');
  const [keywordFilter, setKeywordFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Only the latest trains-between request may update the UI.
  const searchGuard = useRequestGuard();

  const fetchTrainsBetween = async (from: string, to: string, date: string) => {
    const requestId = searchGuard.next();
    if (!from || !to) {
      if (searchGuard.isCurrent(requestId)) {
        setTrains([]);
        setLoading(false);
        setError(null);
      }
      return;
    }
    setLoading(true);
    setError(null);

    // Save into search history
    searchHistoryService.addEntry({
      type: 'ROUTE',
      sourceCode: from.toUpperCase(),
      destinationCode: to.toUpperCase(),
    });

    if (!offlineStorageService.isOnline()) {
      const cached = offlineStorageService.searchOfflineBetween(from, to);
      if (!searchGuard.isCurrent(requestId)) return;
      setTrains(cached as any);
      setIsOffline(true);
      setLoading(false);
      return;
    }

    try {
      const data = await railwayApi.getTrainsBetween(from, to, date);
      if (!searchGuard.isCurrent(requestId)) return;
      setTrains(data);
      setIsOffline(false);
      data.forEach((t) => offlineStorageService.cacheTrain(t));
    } catch (err: any) {
      if (!searchGuard.isCurrent(requestId)) return;
      const cached = offlineStorageService.searchOfflineBetween(from, to);
      if (cached.length > 0) {
        setTrains(cached as any);
        setIsOffline(true);
      } else {
        setError(err.message || 'Failed to find trains between stations');
        setTrains([]);
      }
    } finally {
      if (searchGuard.isCurrent(requestId)) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainsBetween(fromParam, toParam, dateParam);
    return () => searchGuard.invalidate();
  }, [fromParam, toParam, dateParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromStation || !toStation) return;
    if (fromStation.trim().toUpperCase() === toStation.trim().toUpperCase()) {
      setError('Source and destination stations cannot be the same.');
      return;
    }
    const nextParams = {
      from: fromStation.trim().toUpperCase(),
      to: toStation.trim().toUpperCase(),
      date: travelDate,
    };
    const paramsUnchanged =
      fromParam === nextParams.from && toParam === nextParams.to && dateParam === nextParams.date;
    if (paramsUnchanged) {
      // Params unchanged -> the guarded effect will not re-fire, fetch directly.
      fetchTrainsBetween(fromStation, toStation, travelDate);
    } else {
      setSearchParams(nextParams);
    }
  };

  const swapStations = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  const parseTimeMinutes = (timeStr?: string) => {
    if (!timeStr) return 0;
    const clean = timeStr.trim().toUpperCase();
    const isPm = clean.includes('PM');
    const isAm = clean.includes('AM');
    const parts = clean.replace(/[APM ]/g, '').split(':');
    let h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    if (isPm && h < 12) h += 12;
    if (isAm && h === 12) h = 0;
    return h * 60 + m;
  };

  const displayedTrains = useMemo(() => {
    let result = [...trains];

    // Filter by type
    if (selectedClass !== 'ALL') {
      result = result.filter((t) => matchesCategory(t.trainType, selectedClass));
    }

    // Filter by keyword
    if (keywordFilter.trim()) {
      const q = keywordFilter.toLowerCase();
      result = result.filter(
        (t) =>
          t.trainNumber.toLowerCase().includes(q) ||
          t.trainName.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'departure') {
        return parseTimeMinutes(a.departureTime) - parseTimeMinutes(b.departureTime);
      }
      if (sortBy === 'arrival') {
        return parseTimeMinutes(a.arrivalTime) - parseTimeMinutes(b.arrivalTime);
      }
      if (sortBy === 'duration') {
        return a.durationMinutes - b.durationMinutes;
      }
      return 0;
    });

    return result;
  }, [trains, selectedClass, sortBy, keywordFilter]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Trains Between Stations</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Direct suburban locals and express services with fares, durations, and live status
        </p>
      </div>

      {/* Query Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
      >
        {isOffline && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
            <span>Offline mode: showing previously saved schedule.</span>
            <span className="font-bold uppercase text-[10px] bg-amber-200 dark:bg-amber-900/60 px-2 py-0.5 rounded">
              Cached Data
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-end">
          <div className="sm:col-span-3">
            <StationAutocomplete
              label="From Station"
              value={fromStation}
              placeholder="e.g. BOR (Boisar)..."
              onChange={(code) => setFromStation(code)}
            />
          </div>

          <div className="sm:col-span-1 flex justify-center pb-1">
            <button
              type="button"
              onClick={swapStations}
              className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:scale-105 transition shadow-sm"
              title="Swap From and To"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="sm:col-span-3">
            <StationAutocomplete
              label="To Station"
              value={toStation}
              placeholder="e.g. DRD (Dahanu Road)..."
              onChange={(code) => setToStation(code)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Date of Travel
            </label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Train className="w-4 h-4" />
              <span>Find Trains</span>
            </button>
          </div>
        </div>
      </form>

      {/* Controls Bar: Sort, Filter & Keyword */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Keyword Search Input */}
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={keywordFilter}
              onChange={(e) => setKeywordFilter(e.target.value)}
              placeholder="Filter by train name/number..."
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-xl pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Sort Buttons */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> Sort:
            </span>
            {(['departure', 'arrival', 'duration'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition ${
                  sortBy === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100 dark:border-slate-800">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
          {FILTER_CLASSES.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedClass === cls
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Errors */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-blue-600 dark:text-blue-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-bold">Checking running schedules & trains...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results List */}
      {!loading && !error && (
        <>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Showing <strong className="text-slate-900 dark:text-white font-bold">{displayedTrains.length}</strong> trains from{' '}
              <strong className="text-blue-600 dark:text-blue-400">{fromParam}</strong> to{' '}
              <strong className="text-blue-600 dark:text-blue-400">{toParam}</strong>
            </span>
            <span className="text-[11px] font-mono">Sorted by {sortBy}</span>
          </div>

          {displayedTrains.length > 0 ? (
            <div className="space-y-3.5">
              {displayedTrains.map((train) => (
                <TrainCard
                  key={train.trainNumber}
                  train={train}
                  highlightRoute={{ from: fromParam, to: toParam }}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-slate-200 dark:border-slate-800 text-slate-500 text-xs shadow-sm">
              <Train className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <div className="font-bold text-slate-700 dark:text-slate-300">No trains found matching filters between {fromParam} and {toParam}</div>
              <div className="text-slate-400 mt-1">Try resetting the filter or searching for major junction codes like BOR, DRD, BVI, or MMCT.</div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
