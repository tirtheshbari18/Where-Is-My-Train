import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Train,
  MapPin,
  ArrowRightLeft,
  Calendar,
  Compass,
  Clock,
  Radio,
  Sparkles,
  Layers,
  Activity,
  History,
  Trash2,
  Navigation,
} from 'lucide-react';
import { railwayApi, TrainSummary, StationLocation } from '../api/railwayApi.js';
import { TrainCard } from '../components/trains/TrainCard.js';
import { storage, SearchHistoryItem } from '../utils/storage.js';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Search states
  const [trainQuery, setTrainQuery] = useState('');
  const [fromStation, setFromStation] = useState('MMCT');
  const [toStation, setToStation] = useState('GNC');
  const [travelDate, setTravelDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Data states
  const [popularTrains, setPopularTrains] = useState<TrainSummary[]>([]);
  const [nearbyStations, setNearbyStations] = useState<StationLocation[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'train' | 'between'>('train');

  useEffect(() => {
    // Load popular flagship trains
    railwayApi.searchTrains('').then((trains) => {
      setPopularTrains(trains.slice(0, 4));
    }).catch(console.error);

    setHistory(storage.getSearchHistory());
  }, []);

  const handleTrainSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainQuery.trim()) return;

    storage.addSearchHistory({
      query: trainQuery.trim(),
      type: 'TRAIN',
      label: `Train: ${trainQuery.trim()}`,
    });

    navigate(`/search?q=${encodeURIComponent(trainQuery.trim())}`);
  };

  const handleRouteSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromStation || !toStation) return;

    storage.addSearchHistory({
      query: `${fromStation} to ${toStation}`,
      type: 'ROUTE',
      label: `${fromStation} → ${toStation}`,
      subLabel: travelDate,
    });

    navigate(
      `/trains-between?from=${encodeURIComponent(
        fromStation
      )}&to=${encodeURIComponent(toStation)}&date=${travelDate}`
    );
  };

  const swapStations = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  const handleFindNearby = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const stations = await railwayApi.getNearbyStations(
            pos.coords.latitude,
            pos.coords.longitude,
            60
          );
          setNearbyStations(stations);
        } catch {
          setLocationError('Failed to fetch nearby railway stations.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        // Fallback gracefully to default Mumbai coordinates
        railwayApi.getNearbyStations(19.076, 72.877, 50).then(setNearbyStations);
        setLocationError(`Location note: ${err.message}. Showing Western & Central Railway hubs.`);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative pt-10 pb-16 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
        {/* Ambient Backlight Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-72 bg-gradient-to-b from-amber-500/15 via-blue-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wide uppercase shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Indian Railway Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Where is your train?
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal">
            Track live running status, platforms, delay minutes, coach compositions, and station boards across Indian Railways.
          </p>
        </div>

        {/* Dual Search Box Card */}
        <div className="max-w-3xl mx-auto mt-8 glass-panel rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-2xl">
          {/* Tab Selector */}
          <div className="flex rounded-xl bg-slate-900/80 p-1 mb-6 border border-slate-800 max-w-md mx-auto">
            <button
              onClick={() => setActiveTab('train')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs sm:text-sm font-bold transition ${
                activeTab === 'train'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Train className="w-4 h-4" />
              <span>Train Search & Live Status</span>
            </button>
            <button
              onClick={() => setActiveTab('between')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs sm:text-sm font-bold transition ${
                activeTab === 'between'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Trains Between Stations</span>
            </button>
          </div>

          {/* Tab 1: Single Train Search */}
          {activeTab === 'train' && (
            <form onSubmit={handleTrainSearch} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={trainQuery}
                  onChange={(e) => setTrainQuery(e.target.value)}
                  placeholder="Enter Train Number (e.g. 20901, 12951) or Train Name (e.g. Vande Bharat)..."
                  className="w-full bg-slate-950/80 text-white placeholder-slate-500 rounded-2xl pl-12 pr-4 py-4 border border-slate-700/80 focus:outline-none focus:border-amber-500 text-sm sm:text-base transition"
                />
                <Search className="w-5 h-5 text-amber-400 absolute left-4 top-4.5" />
              </div>

              {/* Quick Suggestion Pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Quick Try:</span>
                {[
                  { label: '20901 Vande Bharat', query: '20901' },
                  { label: '12951 Mumbai Rajdhani', query: '12951' },
                  { label: '22436 NDLS-BSB', query: '22436' },
                  { label: '12009 Shatabdi', query: '12009' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.query}
                    onClick={() => {
                      setTrainQuery(item.query);
                      navigate(`/search?q=${item.query}`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Train</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = trainQuery.trim() || '20901';
                    navigate(`/train/${target}?tab=live`);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition"
                >
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Track Live Running Status</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Trains Between Stations */}
          {activeTab === 'between' && (
            <form onSubmit={handleRouteSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
                {/* From Station */}
                <div className="md:col-span-3">
                  <label className="block text-left text-xs font-semibold text-slate-400 mb-1">
                    From Station
                  </label>
                  <input
                    type="text"
                    value={fromStation}
                    onChange={(e) => setFromStation(e.target.value.toUpperCase())}
                    placeholder="e.g. MMCT / Mumbai Central"
                    className="w-full bg-slate-950/80 text-white font-mono font-bold rounded-xl px-4 py-3 border border-slate-700 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Swap Button */}
                <div className="md:col-span-1 flex justify-center pt-4 md:pt-0">
                  <button
                    type="button"
                    onClick={swapStations}
                    className="p-3 rounded-full bg-slate-900 border border-slate-700 hover:border-amber-500 text-amber-400 hover:scale-110 transition"
                    title="Swap Stations"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* To Station */}
                <div className="md:col-span-3">
                  <label className="block text-left text-xs font-semibold text-slate-400 mb-1">
                    To Station
                  </label>
                  <input
                    type="text"
                    value={toStation}
                    onChange={(e) => setToStation(e.target.value.toUpperCase())}
                    placeholder="e.g. GNC / Gandhinagar"
                    className="w-full bg-slate-950/80 text-white font-mono font-bold rounded-xl px-4 py-3 border border-slate-700 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Date & Submit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-left text-xs font-semibold text-slate-400 mb-1">
                    Journey Date
                  </label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full bg-slate-950/80 text-white rounded-xl px-4 py-3 border border-slate-700 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>Find Available Trains</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* User Geolocation Option */}
          <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <button
              onClick={handleFindNearby}
              disabled={isLocating}
              className="flex items-center gap-2 text-slate-300 hover:text-amber-400 transition"
            >
              <Navigation className={`w-4 h-4 text-amber-400 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Detecting your coordinates...' : 'Find trains & stations near me'}</span>
            </button>

            <span className="text-slate-500 text-[11px]">
              Browser Geolocation • No background tracking
            </span>
          </div>

          {locationError && (
            <p className="mt-2 text-left text-xs text-amber-400 bg-amber-950/30 p-2 rounded-lg border border-amber-500/20">
              {locationError}
            </p>
          )}
        </div>

        {/* Nearby Stations Dropdown Cards if detected */}
        {nearbyStations.length > 0 && (
          <div className="max-w-3xl mx-auto mt-6 glass-panel rounded-2xl p-4 border border-blue-500/30 text-left">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Railway Stations Near You</span>
              </h3>
              <span className="text-xs text-slate-400">{nearbyStations.length} found</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {nearbyStations.map((st) => (
                <Link
                  key={st.code}
                  to={`/station/${st.code}`}
                  className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 hover:border-amber-500 transition group"
                >
                  <div className="font-mono font-bold text-amber-400 group-hover:text-amber-300">
                    {st.code}
                  </div>
                  <div className="text-xs text-white truncate font-medium">{st.name}</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {st.distanceKm} km away
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Recent Searches Pill Row */}
      {history.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Recent Searches</span>
            </div>
            <button
              onClick={() => {
                storage.clearSearchHistory();
                setHistory([]);
              }}
              className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {history.map((h) => (
              <button
                key={h.id}
                onClick={() => {
                  if (h.type === 'TRAIN') {
                    navigate(`/search?q=${encodeURIComponent(h.query)}`);
                  } else {
                    navigate(`/search?q=${encodeURIComponent(h.query)}`);
                  }
                }}
                className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500 text-xs text-slate-300 hover:text-white transition"
              >
                <Clock className="w-3 h-3 text-slate-500" />
                <span className="font-medium">{h.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Popular Flagship Trains */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Train className="w-6 h-6 text-amber-400" />
              <span>Premier Expresses & Vande Bharat</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Top tracked high-speed trains running on Indian Railways
            </p>
          </div>
          <Link
            to="/search"
            className="text-xs sm:text-sm font-semibold text-amber-400 hover:text-amber-300 transition flex items-center gap-1"
          >
            <span>View All</span>
            <Compass className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {popularTrains.map((train) => (
            <TrainCard key={train.trainNumber} train={train} />
          ))}
        </div>
      </section>

      {/* Railway System Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 text-center">
          <h3 className="text-lg font-bold text-white mb-2">
            Pan-India Railway Information Architecture
          </h3>
          <p className="text-xs text-slate-400 max-w-xl mx-auto mb-6">
            Supporting standard normalized datasets across all 18 Indian Railway Zones, divisions, and inter-zonal corridors.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <Layers className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <div className="text-2xl font-extrabold text-white font-mono">18</div>
              <div className="text-xs text-slate-400 mt-1">Railway Zones</div>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <Train className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-extrabold text-white font-mono">13,000+</div>
              <div className="text-xs text-slate-400 mt-1">Passenger Trains</div>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <MapPin className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-extrabold text-white font-mono">7,325+</div>
              <div className="text-xs text-slate-400 mt-1">Railway Stations</div>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <Activity className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-extrabold text-white font-mono">100%</div>
              <div className="text-xs text-slate-400 mt-1">Transparent Data</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
