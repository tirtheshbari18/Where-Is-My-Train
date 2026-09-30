import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Train, Clock, Layers } from 'lucide-react';
import { metroService, MetroLineItem, MetroRoutePlan, MetroIndicatorTrain } from '../../services/metroService.js';
import { useRequestGuard } from '../../hooks/useRequestGuard.js';

export const MetroView: React.FC = () => {
  const routeGuard = useRequestGuard();
  const indicatorGuard = useRequestGuard();
  const [lines, setLines] = useState<MetroLineItem[]>([]);
  const [fromStation, setFromStation] = useState('Versova');
  const [toStation, setToStation] = useState('Ghatkopar');
  const [routePlan, setRoutePlan] = useState<MetroRoutePlan | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);

  // Station indicator
  const [indicatorStation, setIndicatorStation] = useState('Ghatkopar');
  const [indicatorData, setIndicatorData] = useState<{
    station: string;
    line: string;
    color: string;
    nextTrains: MetroIndicatorTrain[];
  } | null>(null);

  // Map view toggle
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    metroService.getLines().then(setLines);
    handleFindMetro();
    loadIndicator(indicatorStation);
  }, []);

  const handleFindMetro = async () => {
    const reqId = routeGuard.next();
    setSearching(true);
    setSearchAttempted(true);
    try {
      const plan = await metroService.searchRoute(fromStation, toStation);
      if (!routeGuard.isCurrent(reqId)) return;
      setRoutePlan(plan);
    } catch {
      // ignore
    } finally {
      if (routeGuard.isCurrent(reqId)) setSearching(false);
    }
  };

  const loadIndicator = async (stn: string) => {
    const reqId = indicatorGuard.next();
    try {
      const data = await metroService.getStationIndicator(stn);
      if (!indicatorGuard.isCurrent(reqId)) return;
      setIndicatorData(data);
    } catch {
      // ignore
    }
  };

  const handleSwap = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  return (
    <div className="space-y-6">
      {/* Metro Search Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black text-sm">
              M
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Mumbai Metro Route Finder
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Line 1 (Blue), Line 2A (Yellow), Line 7 (Red), Line 3 (Aqua)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="py-1.5 px-3 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1.5 hover:bg-blue-100 transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showMap ? 'Hide Map' : 'View Metro Map'}</span>
          </button>
        </div>

        {/* Form Inputs */}
        <div className="space-y-3 relative">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1 uppercase">
              From Metro Station
            </label>
            <input
              type="text"
              value={fromStation}
              onChange={(e) => setFromStation(e.target.value)}
              placeholder="e.g. Versova, Andheri Metro, D.N. Nagar..."
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
              To Metro Station
            </label>
            <input
              type="text"
              value={toStation}
              onChange={(e) => setToStation(e.target.value)}
              placeholder="e.g. Ghatkopar, Gundavali, Marol Naka, BKC..."
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 rounded-2xl px-4 py-3 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Quick routes */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Popular:</span>
          {[
            { label: 'Versova → Ghatkopar', from: 'Versova', to: 'Ghatkopar' },
            { label: 'Andheri → Marol Naka', from: 'Andheri Metro', to: 'Marol Naka' },
            { label: 'Dahisar → Gundavali', from: 'Dahisar East', to: 'Gundavali' },
            { label: 'Aarey → BKC', from: 'Aarey JVLR', to: 'BKC' },
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

        {/* Green Find Trains Button */}
        <button
          onClick={handleFindMetro}
          disabled={searching}
          className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black text-sm tracking-wider uppercase shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
        >
          <Train className="w-4 h-4" />
          <span>{searching ? 'SEARCHING METRO...' : 'FIND METRO TRAINS'}</span>
        </button>
      </div>

      {/* Metro Route Result Card */}
      {searchAttempted && !searching && !routePlan && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
          No metro route found between those stations. Check the station names and try again.
        </div>
      )}
      {routePlan && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-base font-black text-slate-900 dark:text-white">
                {routePlan.fromStation} → {routePlan.toStation}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{routePlan.linesUsed.join(' • ')}</span>
                <span>•</span>
                <span>{routePlan.stopsCount} Stops</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                ₹{routePlan.fareToken}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                Smart Card: ₹{routePlan.fareCard}
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">Duration</div>
              <div className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">
                ~{routePlan.estimatedMinutes} min
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">Frequency</div>
              <div className="text-sm font-black text-blue-600 dark:text-blue-400 mt-0.5">
                {routePlan.frequency}
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">Timings</div>
              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                05:30 - 23:40
              </div>
            </div>
          </div>

          {/* Route path progression */}
          <div className="space-y-1.5 pt-1">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Stations along route ({routePlan.path.length})
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {routePlan.path.map((stn, idx) => (
                <React.Fragment key={stn}>
                  <span
                    className={`py-1 px-2.5 rounded-lg font-semibold ${
                      idx === 0 || idx === routePlan.path.length - 1
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {stn}
                  </span>
                  {idx < routePlan.path.length - 1 && (
                    <span className="text-slate-400">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Mumbai Metro Train Map Section (Requirement 15) */}
      {showMap && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Mumbai Metro Train Map</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">4 Active Lines</span>
          </div>

          {/* Stylized Railway / Metro Line Map Visualization */}
          <div className="space-y-4">
            {lines.map((line) => (
              <div key={line.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: line.color }} />
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {line.name} ({line.terminalFrom} ↔ {line.terminalTo})
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {line.distanceKm} km • {line.stationCount} stations
                  </span>
                </div>

                {/* Station nodes */}
                <div className="flex items-center gap-2 overflow-x-auto py-2">
                  {line.stations.map((stn, idx) => (
                    <div key={stn.code} className="flex items-center gap-2 shrink-0">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"
                          style={{ backgroundColor: stn.isInterchange ? '#F59E0B' : line.color }}
                          title={stn.isInterchange ? 'Interchange Station' : stn.name}
                        />
                        <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 mt-1 max-w-[80px] text-center truncate">
                          {stn.name}
                        </span>
                      </div>
                      {idx < line.stations.length - 1 && (
                        <div className="w-8 h-1 rounded" style={{ backgroundColor: line.color }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Station Indicator at: [Metro Station] */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Station-Indicator at: {indicatorStation}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Platform countdown timers and upcoming metro train arrivals
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {['Ghatkopar', 'Andheri Metro', 'Versova', 'Marol Naka', 'BKC'].map((stn) => (
              <button
                key={stn}
                onClick={() => {
                  setIndicatorStation(stn);
                  loadIndicator(stn);
                }}
                className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition ${
                  indicatorStation === stn
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {stn}
              </button>
            ))}
          </div>
        </div>

        {/* Live Indicator Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {indicatorData?.nextTrains.map((tr, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-blue-50/60 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 flex items-center justify-between"
            >
              <div>
                <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  {tr.lineName} • PF {tr.platform}
                </div>
                <div className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                  To {tr.destination}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                  ● {tr.status}
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {tr.etaMinutes}m
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">ETA</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
