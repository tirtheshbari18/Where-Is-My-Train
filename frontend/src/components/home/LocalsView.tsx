import React, { useState, useEffect } from 'react';
import { Train, ArrowUpDown, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { localService, LocalTrainItem, LocalStationIndicatorTrain } from '../../services/localService.js';
import { formatTimeWithAmPm } from '../../utils/timeFormat.js';
import { useRequestGuard } from '../../hooks/useRequestGuard.js';

export const LocalsView: React.FC = () => {
  const navigate = useNavigate();
  const searchGuard = useRequestGuard();
  const indicatorGuard = useRequestGuard();

  // Search states
  const [fromStation, setFromStation] = useState('BOR');
  const [toStation, setToStation] = useState('DRD');
  const [selectedLine, setSelectedLine] = useState('Western');
  const [speedFilter, setSpeedFilter] = useState('All');
  const [results, setResults] = useState<LocalTrainItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Station indicator state
  const [indicatorStation, setIndicatorStation] = useState('BOR');
  const [indicatorTrains, setIndicatorTrains] = useState<LocalStationIndicatorTrain[]>([]);
  const [indicatorLoading, setIndicatorLoading] = useState(false);

  useEffect(() => {
    handleSearch();
    loadStationIndicator(indicatorStation);
  }, []);

  const handleSearch = async () => {
    const reqId = searchGuard.next();
    setIsSearching(true);
    try {
      const data = await localService.searchLocals(fromStation, toStation, selectedLine, speedFilter);
      if (!searchGuard.isCurrent(reqId)) return;
      setResults(data);
    } catch {
      // ignore
    } finally {
      if (searchGuard.isCurrent(reqId)) setIsSearching(false);
    }
  };

  const loadStationIndicator = async (stn: string) => {
    const reqId = indicatorGuard.next();
    setIndicatorLoading(true);
    try {
      const data = await localService.getStationIndicator(stn);
      if (!indicatorGuard.isCurrent(reqId)) return;
      setIndicatorTrains(data);
    } catch {
      // ignore
    } finally {
      if (indicatorGuard.isCurrent(reqId)) setIndicatorLoading(false);
    }
  };

  const handleSwap = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  return (
    <div className="space-y-6">
      {/* Search Mumbai Locals Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-black text-sm">
              WR
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Mumbai Suburban Local Trains
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Western, Central, and Harbour Line Timetables
              </p>
            </div>
          </div>

          {/* Line Selector Pills */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
            {['Western', 'Central', 'Harbour'].map((line) => (
              <button
                key={line}
                onClick={() => {
                  setSelectedLine(line);
                  handleSearch();
                }}
                className={`py-1 px-3 rounded-lg transition ${
                  selectedLine === line
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {line}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3 relative">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1 uppercase">
              From Local Station
            </label>
            <input
              type="text"
              value={fromStation}
              onChange={(e) => setFromStation(e.target.value)}
              placeholder="e.g. Boisar (BOR), Churchgate (CCG), Virar (VR)..."
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 rounded-2xl px-4 py-3 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end -my-2 relative z-10 mr-4">
            <button
              type="button"
              onClick={handleSwap}
              className="w-9 h-9 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-md active:rotate-180 transition-transform"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          <div className="-mt-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1 uppercase">
              To Local Station
            </label>
            <input
              type="text"
              value={toStation}
              onChange={(e) => setToStation(e.target.value)}
              placeholder="e.g. Dahanu Road (DRD), Borivali (BVI), Virar (VR)..."
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 rounded-2xl px-4 py-3 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Quick routes */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Quick Try:</span>
          {[
            { label: 'Boisar → Dahanu Road', from: 'BOR', to: 'DRD' },
            { label: 'Churchgate → Virar', from: 'CCG', to: 'VR' },
            { label: 'CSMT → Kalyan', from: 'CSMT', to: 'KYN' },
            { label: 'Churchgate → Dahanu', from: 'CCG', to: 'DRD' },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setFromStation(item.from);
                setToStation(item.to);
              }}
              className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Filter Pills: Fast / Slow / AC */}
        <div className="flex items-center gap-1.5 pt-1 text-xs">
          <span className="text-slate-400 text-[11px] font-medium">Train Type:</span>
          {['All', 'Fast Local', 'Slow Local', 'AC Local'].map((f) => (
            <button
              key={f}
              onClick={() => {
                setSpeedFilter(f);
                handleSearch();
              }}
              className={`py-1 px-3 rounded-lg text-xs font-semibold transition ${
                speedFilter === f
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Green Find Trains Button */}
        <button
          onClick={handleSearch}
          className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm tracking-wider uppercase shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
        >
          <Train className="w-4 h-4" />
          <span>FIND LOCAL TRAINS</span>
        </button>
      </div>

      {/* Local Train Search Results */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider">
            Available Local Services ({results.length})
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {fromStation} → {toStation}
          </span>
        </div>

        {isSearching ? (
          <div className="py-8 text-center text-xs text-slate-400">Searching local timetables...</div>
        ) : results.length === 0 ? (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No local trains found for this route. Try changing stations or filters.
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((train) => (
              <div
                key={train.id}
                onClick={() => navigate(`/train/${train.trainNumber}`)}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 hover:border-blue-400 shadow-md hover:shadow-lg transition cursor-pointer space-y-3 group"
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-blue-600 dark:text-blue-400">
                      {train.trainNumber}
                    </span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {train.trainName}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      train.type.includes('Fast')
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-300 dark:border-rose-900'
                        : train.type.includes('AC')
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-900'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900'
                    }`}
                  >
                    {train.type}
                  </span>
                </div>

                {/* Timing & Duration Row */}
                <div className="flex items-center justify-between py-1">
                  <div className="text-left">
                    <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      {formatTimeWithAmPm(train.departureTime)}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500">
                      {train.sourceName}
                    </div>
                  </div>

                  <div className="flex flex-col items-center px-4">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {train.durationMinutes} min
                    </span>
                    <div className="w-24 h-0.5 bg-slate-300 dark:bg-slate-700 relative my-1">
                      <div className="w-2 h-2 rounded-full bg-blue-600 absolute -top-[3px] left-1/2 -translate-x-1/2" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Direct</span>
                  </div>

                  <div className="text-right">
                    <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      {formatTimeWithAmPm(train.arrivalTime)}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500">
                      {train.destinationName}
                    </div>
                  </div>
                </div>

                {/* Meta details: Fare, Platform, Days */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹{train.fareSecondClass}
                    </span>
                    <span>Platform <strong>{train.platform}</strong></span>
                    <span className="hidden sm:inline">{train.cars} Cars</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Runs Daily</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                      {train.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Local Station Indicator Board (Section 14 of Prompt) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                Station-Indicator at: {indicatorStation === 'BOR' ? 'Boisar' : indicatorStation === 'PLG' ? 'Palghar' : indicatorStation === 'VR' ? 'Virar' : indicatorStation}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live suburban platform indicator board (Mumbai Station Display)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {['BOR', 'PLG', 'VR', 'BVI', 'CCG', 'KYN'].map((code) => (
              <button
                key={code}
                onClick={() => {
                  setIndicatorStation(code);
                  loadStationIndicator(code);
                }}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold transition ${
                  indicatorStation === code
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Indicator Screen style */}
        <div className="bg-slate-950 rounded-2xl p-4 border-2 border-amber-500/40 shadow-inner font-mono space-y-2 text-amber-400">
          <div className="grid grid-cols-6 text-[11px] font-bold text-amber-500 uppercase tracking-wider pb-2 border-b border-amber-500/30">
            <span className="col-span-1">PF</span>
            <span className="col-span-2">DESTINATION</span>
            <span className="col-span-1">TIME</span>
            <span className="col-span-1">SPEED</span>
            <span className="col-span-1 text-right">STATUS</span>
          </div>

          {indicatorLoading ? (
            <div className="py-4 text-center text-xs text-amber-400">Updating station indicator...</div>
          ) : indicatorTrains.length === 0 ? (
            <div className="py-4 text-center text-xs text-amber-400/60">No trains scheduled at this time.</div>
          ) : (
            indicatorTrains.map((tr, idx) => (
              <div
                key={idx}
                className="grid grid-cols-6 text-xs font-extrabold items-center py-1.5 border-b border-amber-500/10 hover:bg-amber-500/5 transition"
              >
                <span className="col-span-1 text-emerald-400 font-black text-sm">{tr.platform}</span>
                <span className="col-span-2 text-white truncate">{tr.destination}</span>
                <span className="col-span-1 text-amber-300 text-xs font-mono">{formatTimeWithAmPm(tr.departureTime)}</span>
                <span className="col-span-1">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                      tr.speedType === 'FAST'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    }`}
                  >
                    {tr.speedType}
                  </span>
                </span>
                <span className="col-span-1 text-right text-emerald-400 text-[11px]">
                  {tr.delayMinutes === 0 ? 'ON TIME' : `+${tr.delayMinutes}M`}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
