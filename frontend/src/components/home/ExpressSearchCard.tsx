import React, { useState } from 'react';
import { ArrowUpDown, Search, Train } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StationAutocomplete } from '../common/StationAutocomplete.js';
import { searchHistoryService } from '../../services/searchHistoryService.js';

interface ExpressSearchCardProps {
  onTrainNumberSearch?: (query: string) => void;
}

export const ExpressSearchCard: React.FC<ExpressSearchCardProps> = () => {
  const navigate = useNavigate();

  const [fromStation, setFromStation] = useState('BOR');
  const [toStation, setToStation] = useState('DRD');
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [trainNumberQuery, setTrainNumberQuery] = useState('');

  const handleSwap = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  const handleFindTrains = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromStation || !toStation) return;

    searchHistoryService.addEntry({
      sourceCode: fromStation,
      destinationCode: toStation,
      type: 'ROUTE',
    });

    navigate(`/trains-between?from=${encodeURIComponent(fromStation)}&to=${encodeURIComponent(toStation)}&date=${travelDate}`);
  };

  const handleTrainNumberSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = trainNumberQuery.trim();
    if (!q) return;

    searchHistoryService.addEntry({
      trainNumber: q,
      sourceCode: 'NDLS',
      destinationCode: 'MMCT',
      type: 'TRAIN',
    });

    // If 4-5 digit number, go directly to live train tracking or search
    if (/^\d{4,5}$/.test(q)) {
      navigate(`/train/${q}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Route Box - Android Railway App Style with White card and Green action button */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
        <form onSubmit={handleFindTrains} className="space-y-4">
          <div className="space-y-3 relative">
            {/* From Station */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1 uppercase tracking-wider">
                From Station
              </label>
              <div className="relative">
                <StationAutocomplete
                  label=""
                  value={fromStation}
                  placeholder="e.g. Boisar (BOR), Borivali (BVI), Surat..."
                  onChange={(code) => setFromStation(code)}
                />
              </div>
            </div>

            {/* Swap Button (Floated between inputs) */}
            <div className="flex justify-end -my-2 relative z-10 mr-4">
              <button
                type="button"
                onClick={handleSwap}
                className="w-10 h-10 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-md transition-transform active:rotate-180"
                aria-label="Swap stations"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            {/* To Station */}
            <div className="-mt-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1 uppercase tracking-wider">
                To Station
              </label>
              <div className="relative">
                <StationAutocomplete
                  label=""
                  value={toStation}
                  placeholder="e.g. Dahanu Road (DRD), Vatva (VTA), Ahmedabad..."
                  onChange={(code) => setToStation(code)}
                />
              </div>
            </div>
          </div>

          {/* Quick Station Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Popular:</span>
            {[
              { label: 'Boisar → Dahanu Road', from: 'BOR', to: 'DRD' },
              { label: 'Borivali → Vatva', from: 'BVI', to: 'VTA' },
              { label: 'Mumbai → Surat', from: 'MMCT', to: 'ST' },
              { label: 'Mumbai → Ahmedabad', from: 'MMCT', to: 'ADI' },
            ].map((route) => (
              <button
                key={route.label}
                type="button"
                onClick={() => {
                  setFromStation(route.from);
                  setToStation(route.to);
                }}
                className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium transition"
              >
                {route.label}
              </button>
            ))}
          </div>

          {/* Date Picker Row */}
          <div className="pt-1 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setTravelDate(new Date().toISOString().split('T')[0])}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                setTravelDate(tomorrow);
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Tomorrow
            </button>
          </div>

          {/* Green Action Button: FIND TRAINS */}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition tracking-wider uppercase"
          >
            <Train className="w-5 h-5" />
            <span>FIND TRAINS</span>
          </button>
        </form>
      </div>

      {/* Additional Search: Search by Train Number / Name */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-md">
        <form onSubmit={handleTrainNumberSearch} className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Search by Train Number / Name
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={trainNumberQuery}
                onChange={(e) => setTrainNumberQuery(e.target.value)}
                placeholder="e.g. 19417, 22956 Kutch, 93011, Vande Bharat..."
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
          {/* Quick train suggestions */}
          <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
            <span className="text-slate-400 font-medium">Quick Train:</span>
            {[
              { num: '19417', name: '19417 Borivali-Vatva' },
              { num: '22956', name: '22956 Kutch SF' },
              { num: '93011', name: '93011 Dahanu Local' },
              { num: '20901', name: '20901 Vande Bharat' },
              { num: '12951', name: '12951 Rajdhani' },
            ].map((item) => (
              <button
                type="button"
                key={item.num}
                onClick={() => navigate(`/train/${item.num}`)}
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                {item.name}
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
};
