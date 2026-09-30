import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Route,
  ArrowLeftRight,
  Zap,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { railwayApi, RailwayRouteDetail, RailwayRouteStationItem } from '../api/railwayApi.js';

export const RoutePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
  const [selectedRouteCode, setSelectedRouteCode] = useState<string>(id || 'MMCT_ADI_CORRIDOR');
  const [routeDetail, setRouteDetail] = useState<RailwayRouteDetail | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isReversed, setIsReversed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Selected stations for distance calculator
  const [fromCode, setFromCode] = useState<string>('BOR');
  const [toCode, setToCode] = useState<string>('DRD');

  useEffect(() => {
    let stale = false;
    railwayApi.getRoutes().then((routes) => {
      if (!stale) setAvailableRoutes(routes);
    }).catch(console.warn);
    return () => {
      stale = true;
    };
  }, []);

  useEffect(() => {
    const codeToFetch = id || selectedRouteCode;
    let stale = false;
    setLoading(true);
    setRouteError(null);
    railwayApi.getRoute(codeToFetch)
      .then((data) => {
        if (stale) return;
        setRouteDetail(data);
        setSelectedRouteCode(data.route_code);
      })
      .catch((err) => {
        if (stale) return;
        console.error('Failed to load route:', err);
        setRouteDetail(null);
        setRouteError('This route could not be loaded right now. Please try again.');
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [id, selectedRouteCode]);

  const handleRouteChange = (code: string) => {
    setSelectedRouteCode(code);
    navigate(`/routes/${code}`);
  };

  const stationsToDisplay: RailwayRouteStationItem[] = routeDetail
    ? isReversed
      ? [...routeDetail.stations].reverse()
      : routeDetail.stations
    : [];

  // Calculate distance between selected stations
  const getCalculatedDistance = () => {
    if (!routeDetail) return null;
    const stnA = routeDetail.stations.find((s) => s.station_code === fromCode);
    const stnB = routeDetail.stations.find((s) => s.station_code === toCode);
    if (!stnA || !stnB) return null;
    return Math.abs(stnB.km_from_origin - stnA.km_from_origin);
  };

  const calculatedDist = getCalculatedDistance();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Route Switcher & Direction Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
              <Route className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Indian Railways Route Database
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {routeDetail?.route_name || 'Railway Corridor Timeline'}
              </h1>
            </div>
          </div>

          {/* Route selector dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedRouteCode}
              onChange={(e) => handleRouteChange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableRoutes.map((r) => (
                <option key={r.route_code} value={r.route_code}>
                  {r.route_name} ({r.total_distance_km} km)
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsReversed((prev) => !prev)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold transition active:scale-95"
              title="Reverse Route Direction"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Reverse Direction</span>
            </button>
          </div>
        </div>

        {/* Route Stats Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Corridor Distance</span>
            <span className="text-base font-black text-slate-900 dark:text-white font-mono">
              {routeDetail?.total_distance_km || 491} km
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Stations along Line</span>
            <span className="text-base font-black text-slate-900 dark:text-white font-mono">
              {routeDetail?.stations.length || 21} Stations
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Electrification</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> AC 25kV 50Hz
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Direction</span>
            <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono">
              {isReversed ? 'UP (Reverse)' : 'DOWN (Forward)'}
            </span>
          </div>
        </div>
      </div>

      {/* 20. AUTHORITATIVE DISTANCE CALCULATOR WIDGET */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-5 shadow-lg space-y-3 border-2 border-blue-500/40">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-blue-300">
            Authoritative Railway Distance Calculator (Route KM)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div>
            <label className="text-[10px] text-blue-200 block font-bold uppercase mb-1">From Station</label>
            <select
              value={fromCode}
              onChange={(e) => setFromCode(e.target.value)}
              className="w-full bg-slate-900/80 border border-blue-400/50 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
            >
              {routeDetail?.stations.map((s) => (
                <option key={s.station_code} value={s.station_code}>
                  {s.station_name} ({s.station_code}) - {s.km_from_origin} km
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-blue-200 block font-bold uppercase mb-1">To Station</label>
            <select
              value={toCode}
              onChange={(e) => setToCode(e.target.value)}
              className="w-full bg-slate-900/80 border border-blue-400/50 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
            >
              {routeDetail?.stations.map((s) => (
                <option key={s.station_code} value={s.station_code}>
                  {s.station_name} ({s.station_code}) - {s.km_from_origin} km
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-950/70 border border-blue-400/40 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold uppercase text-blue-300">Verified Rail Distance</span>
            <span className="text-xl font-black font-mono text-cyan-300">
              {calculatedDist !== null ? `${calculatedDist} km` : '-- km'}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 31. INTERACTIVE VERTICAL RAILWAY ROUTE TIMELINE                */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center justify-between">
          <span>Corridor Stations & Cumulative Distances</span>
          <span className="text-xs font-mono font-bold text-slate-400">
            {isReversed ? 'Reverse Sequence' : 'Sequential'}
          </span>
        </h2>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-blue-600">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-xs font-bold">Rendering railway track sequence...</span>
          </div>
        ) : !routeDetail ? (
          <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
            {routeError || 'No route data available for this selection.'}
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6">
            {/* Continuous Blue Vertical Railway Track Line */}
            <div className="absolute left-[23px] sm:left-[31px] top-4 bottom-4 w-1.5 bg-blue-600 z-0" />

            {stationsToDisplay.map((stn, index) => {
              const isFirst = index === 0;
              const isLast = index === stationsToDisplay.length - 1;
              const distFromOrigin = isReversed
                ? Math.abs((routeDetail?.total_distance_km || 0) - stn.km_from_origin)
                : stn.km_from_origin;

              return (
                <div key={stn.station_code} className="relative z-10 flex items-start gap-4">
                  {/* Circular Node on track */}
                  <div
                    className={`w-6 h-6 -ml-[13px] rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm shrink-0 ${
                      stn.is_junction
                        ? 'bg-amber-500 ring-4 ring-amber-200 dark:ring-amber-900'
                        : isFirst || isLast
                        ? 'bg-blue-600 ring-4 ring-blue-200 dark:ring-blue-900'
                        : 'bg-blue-600'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>

                  {/* Station card info */}
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 transition flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/station/${stn.station_code}`}
                          className="font-black text-sm sm:text-base text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition underline-offset-2 hover:underline"
                        >
                          {stn.station_name}
                        </Link>
                        <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          {stn.station_code}
                        </span>
                        {stn.is_junction && (
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            Junction
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        {stn.distance_from_previous_km > 0 && (
                          <span>+ {stn.distance_from_previous_km} km from previous</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-black font-mono text-blue-600 dark:text-blue-400">
                        {distFromOrigin} km
                      </div>
                      <Link
                        to={`/station/${stn.station_code}`}
                        className="text-[11px] font-bold text-slate-400 hover:text-blue-500 inline-flex items-center gap-1 mt-0.5"
                      >
                        <span>View Station</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
