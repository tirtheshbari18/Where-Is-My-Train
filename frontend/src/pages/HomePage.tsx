// frontend/src/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Train,
  Compass,
  Layers,
  Activity,
  MapPin,
  Sparkles,
  ArrowLeftRight,
  Radio,
  Clock,
  Calendar,
  Ticket,
  Map,
  GitFork,
  Zap,
  Armchair,
  ShieldAlert,
  Network,
} from 'lucide-react';
import { railwayApi, TrainSummary } from '../api/railwayApi.js';
import { TrainCard } from '../components/trains/TrainCard.js';
import { ExpressSearchCard } from '../components/home/ExpressSearchCard.js';
import { RecentSearchesCard } from '../components/home/RecentSearchesCard.js';
import { StationDepartureBoardCard } from '../components/home/StationDepartureBoardCard.js';
import { ExploreCard } from '../components/home/ExploreCard.js';
import { LocalsView } from '../components/home/LocalsView.js';
import { MetroView } from '../components/home/MetroView.js';
import { BusView } from '../components/home/BusView.js';

export const HomePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const currentMode = (searchParams.get('mode') || 'express').toLowerCase();

  const [popularTrains, setPopularTrains] = useState<TrainSummary[]>([]);
  const [loadingTrains, setLoadingTrains] = useState(false);

  useEffect(() => {
    if (currentMode === 'express') {
      setLoadingTrains(true);
      railwayApi
        .searchTrains('')
        .then((trains) => {
          // Provide prominent trains including 19417, 22956, 20901, 12951
          setPopularTrains(trains.slice(0, 4));
        })
        .catch(console.error)
        .finally(() => setLoadingTrains(false));
    }
  }, [currentMode]);

  return (
    <div className="min-h-screen pb-16">
      {/* Sub-Header Notice Bar */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 dark:from-slate-900 dark:to-slate-950 text-white py-3 px-4 shadow-sm border-b border-blue-500/20 dark:border-slate-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-bold tracking-wide">Live Railway Network Feed Active</span>
          </div>
          <span className="text-blue-200 dark:text-slate-400 font-mono hidden sm:inline">
            Western & Central Railway • All-India Express
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-5 space-y-6">
        {/* Render Active Transport Mode View */}
        {currentMode === 'locals' && <LocalsView />}
        {currentMode === 'metro' && <MetroView />}
        {currentMode === 'bus' && <BusView />}

        {/* EXPRESS MODE (Default) */}
        {currentMode === 'express' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 1. Main Express Search Card */}
            <ExpressSearchCard />

            {/* Quick Actions (Section 36) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span>Indian Railway Quick Services</span>
                </h3>
                <span className="text-xs text-slate-500 font-medium">NTES & CRIS Direct</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {[
                  {
                    to: '/trains-between',
                    label: 'Trains Between',
                    desc: 'Source to Dest',
                    icon: <ArrowLeftRight className="w-5 h-5 text-blue-400" />,
                    bg: 'hover:border-blue-500/50',
                  },
                  {
                    to: '/live-trains',
                    label: 'Live Train',
                    desc: 'GPS Telemetry',
                    icon: <Radio className="w-5 h-5 text-emerald-400" />,
                    bg: 'hover:border-emerald-500/50',
                  },
                  {
                    to: '/live-station',
                    label: 'Live Station',
                    desc: 'Departures Board',
                    icon: <Clock className="w-5 h-5 text-amber-400" />,
                    bg: 'hover:border-amber-500/50',
                  },
                  {
                    to: '/search',
                    label: 'Train Schedule',
                    desc: 'Full Timetable',
                    icon: <Calendar className="w-5 h-5 text-purple-400" />,
                    bg: 'hover:border-purple-500/50',
                  },
                  {
                    to: '/pnr',
                    label: 'PNR Status',
                    desc: 'Berth & Chart',
                    icon: <Ticket className="w-5 h-5 text-rose-400" />,
                    bg: 'hover:border-rose-500/50',
                  },
                  {
                    to: '/railway-map',
                    label: 'Railway Map',
                    desc: 'Interactive Network',
                    icon: <Map className="w-5 h-5 text-cyan-400" />,
                    bg: 'hover:border-cyan-500/50',
                  },
                  {
                    to: '/journey-planner',
                    label: 'Journey Planner',
                    desc: 'Multi-Modal Route',
                    icon: <GitFork className="w-5 h-5 text-teal-400" />,
                    bg: 'hover:border-teal-500/50',
                  },
                ].map((act, i) => (
                  <Link
                    key={i}
                    to={act.to}
                    className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl flex flex-col items-center text-center transition-all hover:scale-[1.02] shadow-sm ${act.bg}`}
                  >
                    <div className="mb-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                      {act.icon}
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                      {act.label}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {act.desc}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Secondary Quick Action Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <Link
                  to="/seat-availability"
                  className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Armchair className="w-4 h-4" />
                  <span>Seat Availability</span>
                </Link>
                <Link
                  to="/exceptions"
                  className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Train Exceptions</span>
                </Link>
                <Link
                  to="/railway-zones"
                  className="p-2.5 rounded-xl bg-blue-950/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Network className="w-4 h-4" />
                  <span>18 Railway Zones</span>
                </Link>
                <Link
                  to="/railway-divisions"
                  className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Layers className="w-4 h-4" />
                  <span>71 Divisions</span>
                </Link>
              </div>
            </section>

            {/* 2. Recent Searches Card */}
            <RecentSearchesCard />

            {/* 3. Station Departure Board Card */}
            <StationDepartureBoardCard defaultStation="BOR" />

            {/* 4. Explore Section (Section 5) */}
            <ExploreCard />

            {/* 4. Popular Trains Grid */}
            <section className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Train className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Popular High-Speed & Flagship Trains</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live tracked premier expresses on the Western and Golden corridors
                  </p>
                </div>
                <Link
                  to="/search"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <Compass className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loadingTrains ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-36 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {popularTrains.map((train) => (
                    <TrainCard key={train.trainNumber} train={train} />
                  ))}
                </div>
              )}
            </section>

            {/* 5. Indian Railways Network Stats */}
            <section className="pt-2">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pan-India Transport Architecture</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                  18 Railway Zones & Major Metro Metropolises
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-5">
                  Real-time synchronization across Express corridors, Mumbai Suburban locals, Metros, and City Buses.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1.5" />
                    <div className="text-xl font-black text-slate-900 dark:text-white font-mono">18</div>
                    <div className="text-[11px] text-slate-500 font-medium">Railway Zones</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <Train className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5" />
                    <div className="text-xl font-black text-slate-900 dark:text-white font-mono">13,000+</div>
                    <div className="text-[11px] text-slate-500 font-medium">Trains Tracked</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <MapPin className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
                    <div className="text-xl font-black text-slate-900 dark:text-white font-mono">7,325+</div>
                    <div className="text-[11px] text-slate-500 font-medium">Stations</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400 mx-auto mb-1.5" />
                    <div className="text-xl font-black text-slate-900 dark:text-white font-mono">Realtime</div>
                    <div className="text-[11px] text-slate-500 font-medium">GPS Simulation</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
