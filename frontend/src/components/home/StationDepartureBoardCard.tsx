import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { railwayApi, LiveStationBoard } from '../../api/railwayApi.js';
import { StationAutocomplete } from '../common/StationAutocomplete.js';
import { useRequestGuard } from '../../hooks/useRequestGuard.js';

interface StationDepartureBoardCardProps {
  defaultStation?: string;
}

export const StationDepartureBoardCard: React.FC<StationDepartureBoardCardProps> = ({ defaultStation = 'BOR' }) => {
  const navigate = useNavigate();
  const [stationCode, setStationCode] = useState(defaultStation);
  const [board, setBoard] = useState<LiveStationBoard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'time' | 'delay' | 'platform'>('time');
  const guard = useRequestGuard();

  useEffect(() => {
    fetchDepartures(stationCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationCode]);

  const fetchDepartures = async (code: string) => {
    const reqId = guard.next();
    setLoading(true);
    setError(null);
    try {
      const data = await railwayApi.getLiveStation(code, 4);
      if (!guard.isCurrent(reqId)) return;
      setBoard(data);
    } catch {
      if (!guard.isCurrent(reqId)) return;
      // No fabricated sample board — show an honest unavailable state instead.
      setBoard(null);
      setError('Live departure data is unavailable for this station right now.');
    } finally {
      if (guard.isCurrent(reqId)) setLoading(false);
    }
  };

  const departures = board?.departures || [];

  const sortedDepartures = [...departures].sort((a, b) => {
    if (sortBy === 'time') return a.scheduledTime.localeCompare(b.scheduledTime);
    if (sortBy === 'delay') return b.delayMinutes - a.delayMinutes;
    if (sortBy === 'platform') return (a.platform || '').localeCompare(b.platform || '');
    return 0;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
      {/* Header & Station Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider">
              Station Departure Board
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upcoming train departures and live platform indicators
          </p>
        </div>

        <div className="w-full sm:w-60">
          <StationAutocomplete
            label=""
            value={stationCode}
            placeholder="Search Station..."
            onChange={(code) => {
              setStationCode(code);
            }}
          />
        </div>
      </div>

      {/* Sorting bar & Quick Station Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Hubs:</span>
          {[
            { name: 'Boisar', code: 'BOR' },
            { name: 'Palghar', code: 'PLG' },
            { name: 'Borivali', code: 'BVI' },
            { name: 'Surat', code: 'ST' },
            { name: 'Mumbai Central', code: 'MMCT' },
            { name: 'New Delhi', code: 'NDLS' },
          ].map((stn) => (
            <button
              key={stn.code}
              type="button"
              onClick={() => setStationCode(stn.code)}
              className={`py-1 px-2.5 rounded-lg text-xs font-medium transition ${
                stationCode === stn.code
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {stn.name}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400 text-[11px]">Sort:</span>
          {(['time', 'delay', 'platform'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setSortBy(mode)}
              className={`py-0.5 px-2 rounded-md text-[11px] font-semibold uppercase transition ${
                sortBy === mode
                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Departure Cards List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading live departures for {stationCode}...</span>
        </div>
      ) : error ? (
        <div className="py-6 text-center text-xs text-amber-500 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl">
          {error}
        </div>
      ) : sortedDepartures.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          No upcoming departures found for this station.
        </div>
      ) : (
        <div className="space-y-2">
          {sortedDepartures.map((train) => (
            <div
              key={`${train.trainNumber}_${train.scheduledTime}`}
              onClick={() => navigate(`/train/${train.trainNumber}`)}
              className="p-3 bg-slate-50 hover:bg-blue-50/50 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between cursor-pointer transition group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-blue-600 dark:text-blue-400">
                    {train.trainNumber}
                  </span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    {train.trainName}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span>To: <strong className="text-slate-700 dark:text-slate-300">{train.destinationName}</strong></span>
                  <span>•</span>
                  <span>Platform <strong className="text-blue-600 dark:text-blue-400">{train.platform || 'Not announced'}</strong></span>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="font-extrabold text-base text-slate-900 dark:text-white">
                  {train.expectedTime || train.scheduledTime}
                </div>
                <div>
                  {train.delayMinutes === 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                      ON TIME
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                      +{train.delayMinutes}m delay
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
