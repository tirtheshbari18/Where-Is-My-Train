import React, { useState, useEffect } from 'react';
import { Bus, Search, MapPin, Navigation, ArrowRight } from 'lucide-react';
import { busService, BusRouteSummary } from '../../services/busService.js';

export const BusView: React.FC = () => {
  const [yourLocation, setYourLocation] = useState('Borivali Station (West)');
  const [destination, setDestination] = useState('Andheri Station');
  const [busNumberQuery, setBusNumberQuery] = useState('');
  const [busResults, setBusResults] = useState<BusRouteSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [trackingBus, setTrackingBus] = useState<BusRouteSummary | null>(null);

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const data = await busService.searchBuses(busNumberQuery, yourLocation, destination);
      setBusResults(data);
      if (data.length > 0) setTrackingBus(data[0]);
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  };

  const handleSearchByNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busNumberQuery.trim()) return;
    setSearching(true);
    try {
      const data = await busService.searchBuses(busNumberQuery.trim());
      setBusResults(data);
      if (data.length > 0) setTrackingBus(data[0]);
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bus Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                BEST City Bus Tracking
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live bus routes, ETAs, and stop-by-stop live progression
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
            Live GPS Active
          </span>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1 uppercase">
              Your Location / Bus Stop
            </label>
            <div className="relative">
              <input
                type="text"
                value={yourLocation}
                onChange={(e) => setYourLocation(e.target.value)}
                placeholder="e.g. Borivali Station (West), Dahisar..."
                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 rounded-2xl pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:border-blue-500"
              />
              <MapPin className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1 uppercase">
              Destination or Bus Stop
            </label>
            <div className="relative">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Andheri Station, Trombay, SEEPZ..."
                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 rounded-2xl pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:border-blue-500"
              />
              <Navigation className="w-4 h-4 text-rose-500 absolute left-3.5 top-3.5" />
            </div>
          </div>
        </div>

        {/* Green Find Buses Action Button */}
        <button
          onClick={handleSearch}
          className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm tracking-wider uppercase shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
        >
          <Bus className="w-4 h-4" />
          <span>FIND BUSES</span>
        </button>
      </div>

      {/* Additional Search: Search by Bus Number */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-md">
        <form onSubmit={handleSearchByNumber} className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Search by Bus Number
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={busNumberQuery}
                onChange={(e) => setBusNumberQuery(e.target.value)}
                placeholder="e.g. 203, 332, 415, C-40, AS-4..."
                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl pl-9 pr-3 py-3 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-blue-500 transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        </form>
      </div>

      {/* Real-time Bus Tracking Simulator Section (Requirement 16) */}
      {trackingBus && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  Track your bus in realtime: BEST {trackingBus.busNumber}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {trackingBus.routeName}
              </p>
            </div>

            <div className="text-right">
              <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                ETA {trackingBus.nextStop.etaMinutes} min
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                Speed: {trackingBus.currentLocation.speedKmH} km/h
              </div>
            </div>
          </div>

          {/* Current location banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Current Stop: <strong className="text-slate-900 dark:text-white">{trackingBus.currentLocation.stopName}</strong></span>
            </div>
            <div className="text-slate-500 font-medium">
              Next: <strong className="text-blue-600 dark:text-blue-400">{trackingBus.nextStop.stopName}</strong>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-500">
              <span>{trackingBus.fromStop}</span>
              <span>{trackingBus.toStop}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${trackingBus.currentLocation.progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bus Results List */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider">
          Available Bus Routes ({busResults.length})
        </h3>

        {searching ? (
          <div className="py-6 text-center text-xs text-slate-400">Searching active bus schedules...</div>
        ) : (
          <div className="space-y-3">
            {busResults.map((bus) => (
              <div
                key={bus.id}
                onClick={() => setTrackingBus(bus)}
                className={`p-4 rounded-2xl border transition cursor-pointer space-y-3 ${
                  trackingBus?.id === bus.id
                    ? 'bg-blue-50/50 dark:bg-slate-800 border-blue-500 shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-blue-600 text-white font-black text-sm">
                      {bus.busNumber}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {bus.routeName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {bus.operator} • {bus.busType}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-black text-emerald-600">
                      ₹{bus.fareMin} - ₹{bus.fareMax}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Every {bus.frequencyMinutes}m
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <div>
                    Next Stop: <strong className="text-slate-800 dark:text-slate-200">{bus.nextStop.stopName}</strong>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                    <span>Track Live</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
