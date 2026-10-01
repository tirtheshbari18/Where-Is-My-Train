// frontend/src/pages/TrainsBetweenPage.tsx
// Comprehensive Indian Railways Train Search & Tracking Page
// UX aligned with modern "Where Is My Train" app.

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  ArrowRightLeft,
  Filter,
  Train,
  AlertCircle,
  ArrowUpDown,
  Search,
  RefreshCw,
} from 'lucide-react';
import { railwayApi, TrainSummary, isConnectionError } from '../api/railwayApi.js';
import { getFallbackTrainsBetween } from '../api/fallbackRailwayData.js';
import { TrainCard } from '../components/trains/TrainCard.js';
import { StationAutocomplete } from '../components/common/StationAutocomplete.js';
import { offlineStorageService } from '../services/offlineStorageService.js';
import { searchHistoryService } from '../services/searchHistoryService.js';
import { useRequestGuard } from '../hooks/useRequestGuard.js';
import { matchesCategory } from '../utils/trainCategory.js';
import { normalizeDate } from '../utils/dateNormalizer.js';
import { extractStationCode } from '../utils/stationResolver.js';

// Category filter pills matching prompt specification
const FILTER_CLASSES = [
  'ALL',
  'EXPRESS',
  'LOCAL',
  'SUPERFAST',
  'PASSENGER',
  'MEMU',
  'DEMU',
  'VANDE BHARAT',
  'RAJDHANI',
  'WEEKLY',
] as const;

export const TrainsBetweenPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Normalize initial parameters
  const rawFromParam = searchParams.get('from') || 'BOR';
  const rawToParam = searchParams.get('to') || 'DRD';
  const rawDateParam = searchParams.get('date') || '2026-09-30';

  const initialFrom = extractStationCode(rawFromParam);
  const initialTo = extractStationCode(rawToParam);
  const { isoDate: initialDate } = normalizeDate(rawDateParam);

  const [fromStation, setFromStation] = useState(initialFrom);
  const [toStation, setToStation] = useState(initialTo);
  const [travelDate, setTravelDate] = useState(initialDate);
  const [trains, setTrains] = useState<TrainSummary[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'departure' | 'arrival' | 'duration' | 'name' | 'number'>('departure');
  const [keywordFilter, setKeywordFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [refreshingLive, setRefreshingLive] = useState(false);
  // Non-fatal banner: shown when we had to serve a bundled timetable because
  // the live railway API could not be reached.
  const [dataNotice, setDataNotice] = useState<string | null>(null);

  // Request guard to prevent race conditions
  const searchGuard = useRequestGuard();

  const fetchTrainsBetween = async (from: string, to: string, date: string) => {
    const requestId = searchGuard.next();
    const cleanFrom = extractStationCode(from);
    const cleanTo = extractStationCode(to);
    const { isoDate: cleanDate } = normalizeDate(date);

    if (!cleanFrom || !cleanTo) {
      if (searchGuard.isCurrent(requestId)) {
        setTrains([]);
        setLoading(false);
        setError(null);
        setDataNotice(null);
      }
      return;
    }

    setLoading(true);
    setError(null);
    setDataNotice(null);

    // Save into search history
    searchHistoryService.addEntry({
      type: 'ROUTE',
      sourceCode: cleanFrom,
      destinationCode: cleanTo,
    });

    if (!offlineStorageService.isOnline()) {
      const cached = offlineStorageService.searchOfflineBetween(cleanFrom, cleanTo);
      if (!searchGuard.isCurrent(requestId)) return;
      setTrains(cached as any);
      setIsOffline(true);
      setDataNotice(null);
      setLoading(false);
      return;
    }

    try {
      console.log(`[TrainsBetween] Searching trains between ${cleanFrom} and ${cleanTo} on ${cleanDate}`);
      let data = await railwayApi.getTrainsBetween(cleanFrom, cleanTo, cleanDate);
      if (!searchGuard.isCurrent(requestId)) return;

      if (!data || data.length === 0) {
        data = getFallbackTrainsBetween(cleanFrom, cleanTo);
        if (data.length > 0) {
          setDataNotice(
            `Live railway data is unreachable right now, so this is the bundled offline timetable for ` +
              `${data[0].sourceName} (${data[0].sourceCode}) - ${data[0].destinationName} ` +
              `(${data[0].destinationCode}). Tap Retry to load live availability, delays and platforms.`
          );
        }
      }

      setTrains(data);
      setIsOffline(false);
      setError(null);
      data.forEach((t) => offlineStorageService.cacheTrain(t));
    } catch (err: any) {
      console.error('[TrainsBetween] Search request failed:', err);
      if (!searchGuard.isCurrent(requestId)) return;

      const msg = err?.message || '';
      const cached = offlineStorageService.searchOfflineBetween(cleanFrom, cleanTo);

      if (cached.length > 0) {
        setTrains(cached as any);
        setIsOffline(true);
        setError(null);
        setDataNotice(null);
        return;
      }

      // The live railway service could not be reached (or answered with a
      // gateway error). Serve the bundled corridor timetable rather than
      // dropping the user into an empty error state.
      const fallback = getFallbackTrainsBetween(cleanFrom, cleanTo);
      if (fallback.length > 0) {
        setTrains(fallback);
        setIsOffline(false);
        setError(null);
        setDataNotice(
          `Live railway data is unreachable right now, so this is the bundled offline timetable for ` +
            `${fallback[0].sourceName} (${fallback[0].sourceCode}) - ${fallback[0].destinationName} ` +
            `(${fallback[0].destinationCode}). Tap Retry to load live availability, delays and platforms.`
        );
        return;
      }

      // Nothing local to fall back on: report a precise reason when we have one.
      if (!isConnectionError(err) && msg) {
        setError(msg);
      } else {
        setError(
          'Unable to connect to railway data service. Please check your connection and try again.'
        );
      }
      setTrains([]);
    } finally {
      if (searchGuard.isCurrent(requestId)) setLoading(false);
    }
  };

  useEffect(() => {
    setFromStation(initialFrom);
    setToStation(initialTo);
    setTravelDate(initialDate);
    fetchTrainsBetween(initialFrom, initialTo, initialDate);
    return () => searchGuard.invalidate();
  }, [rawFromParam, rawToParam, rawDateParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFrom = extractStationCode(fromStation);
    const cleanTo = extractStationCode(toStation);
    const { isoDate: cleanDate } = normalizeDate(travelDate);

    if (!cleanFrom || !cleanTo) return;
    if (cleanFrom === cleanTo) {
      setError('Source and destination stations cannot be the same.');
      return;
    }

    const nextParams = {
      from: cleanFrom,
      to: cleanTo,
      date: cleanDate,
    };

    setSearchParams(nextParams);
    fetchTrainsBetween(cleanFrom, cleanTo, cleanDate);
  };

  const swapStations = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  const handleRetryLive = async () => {
    setRefreshingLive(true);
    await fetchTrainsBetween(fromStation, toStation, travelDate);
    setRefreshingLive(false);
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

    // Filter by category
    if (selectedClass !== 'ALL') {
      result = result.filter((t) => matchesCategory(t.trainType, selectedClass));
    }

    // Filter by keyword search
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
      if (sortBy === 'name') {
        return a.trainName.localeCompare(b.trainName);
      }
      if (sortBy === 'number') {
        return a.trainNumber.localeCompare(b.trainNumber);
      }
      return 0;
    });

    return result;
  }, [trains, selectedClass, sortBy, keywordFilter]);

  const activeDateDetails = useMemo(() => normalizeDate(travelDate), [travelDate]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-5">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Train className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            WHERE IS MY TRAIN
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Indian Railways live train search, direct schedules, and platform tracking
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

        {dataNotice && !isOffline && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex flex-wrap items-center justify-between gap-3">
            <span className="leading-relaxed">{dataNotice}</span>
            <span className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fetchTrainsBetween(fromStation, toStation, travelDate)}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
              <span className="font-bold uppercase text-[10px] bg-blue-200 dark:bg-blue-900/60 px-2 py-0.5 rounded">
                Offline Timetable
              </span>
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
              aria-label="Swap Stations"
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
            <div className="relative">
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm focus:border-blue-500 focus:outline-none shadow-sm"
              />
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
              {activeDateDetails.formattedDisplay}
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Train className="w-4 h-4" />
              <span>FIND TRAINS</span>
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
              placeholder="Filter by train name or number (e.g. 19016)..."
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-xl pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          </div>

          {/* Sort Buttons */}
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> Sort:
            </span>
            {(
              [
                { id: 'departure', label: 'Departure' },
                { id: 'arrival', label: 'Arrival' },
                { id: 'duration', label: 'Duration' },
                { id: 'name', label: 'Train Name' },
                { id: 'number', label: 'Train No.' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  sortBy === s.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100 dark:border-slate-800">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
          {FILTER_CLASSES.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedClass === cls
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* SKELETON LOADING STATE */}
      {loading && (
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2 text-xs font-bold">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Finding trains between {extractStationCode(fromStation)} and {extractStationCode(toStation)}...</span>
            </div>
            <span className="text-[11px] text-blue-500">Checking schedules & live telemetry</span>
          </div>

          {/* Skeleton Cards */}
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-3 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
                  <div className="space-y-1.5">
                    <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="w-48 h-3 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
                  </div>
                </div>
                <div className="w-16 h-6 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
              </div>
              <div className="h-16 bg-slate-100 dark:bg-slate-800/40 rounded-xl"></div>
              <div className="flex justify-between">
                <div className="w-24 h-4 bg-slate-100 dark:bg-slate-800 rounded"></div>
                <div className="w-28 h-8 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>Connection Notice</span>
          </div>
          <p className="leading-relaxed font-semibold">{error}</p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setError(null);
                fetchTrainsBetween(fromStation, toStation, travelDate);
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold transition shadow-sm inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                fetchTrainsBetween(fromStation, toStation, travelDate);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5"
            >
              <span>Try Again</span>
            </button>
          </div>
        </div>
      )}

      {/* RESULTS LIST & SUMMARY */}
      {!loading && !error && (
        <>
          {/* Header Summary & Scheduled vs Live Banner */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1 flex-wrap gap-2">
              <div>
                <span className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  {displayedTrains.length} TRAINS FOUND
                </span>
                <span className="ml-2 text-slate-500 font-medium">
                  {extractStationCode(fromStation)} &rarr; {extractStationCode(toStation)}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>{activeDateDetails.formattedDisplay}</span>
              </div>
            </div>

            {/* Scheduled fallback notice banner */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <div className="font-extrabold text-xs">⚠ Live running information unavailable</div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Showing scheduled train timings.</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRetryLive}
                disabled={refreshingLive}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-600 transition flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshingLive ? 'animate-spin' : ''}`} />
                <span>{refreshingLive ? 'Checking...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {displayedTrains.length > 0 ? (
            <div className="space-y-3.5">
              {displayedTrains.map((train) => (
                <TrainCard
                  key={train.trainNumber}
                  train={train}
                  highlightRoute={{
                    from: extractStationCode(fromStation),
                    to: extractStationCode(toStation),
                    date: travelDate,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 text-slate-500 text-xs shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <Train className="w-6 h-6 opacity-60" />
              </div>
              <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                No trains found between {extractStationCode(fromStation) === 'BOR' ? 'Boisar' : extractStationCode(fromStation)} ({extractStationCode(fromStation)}) and {extractStationCode(toStation) === 'DRD' ? 'Dahanu Road' : extractStationCode(toStation)} ({extractStationCode(toStation)}) for {activeDateDetails.formattedDisplayLong || activeDateDetails.formattedDisplay}
              </div>
              <p className="text-slate-400 max-w-sm mx-auto leading-relaxed">
                Try another date or reverse the stations. Direct services and suburban EMU locals operate daily on the Western line.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    swapStations();
                    fetchTrainsBetween(toStation, fromStation, travelDate);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold transition flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Reverse Stations</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedClass('ALL')}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
