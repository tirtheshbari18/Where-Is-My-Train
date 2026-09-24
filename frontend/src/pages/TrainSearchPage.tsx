import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Train, Filter, Loader2, AlertCircle } from 'lucide-react';
import { railwayApi, TrainSummary } from '../api/railwayApi.js';
import { TrainCard } from '../components/trains/TrainCard.js';

const TRAIN_TYPES = [
  'ALL',
  'Vande Bharat',
  'Rajdhani',
  'Shatabdi',
  'Superfast',
  'Express',
  'Special',
];

export const TrainSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [trains, setTrains] = useState<TrainSummary[]>([]);
  const [selectedType, setSelectedType] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrains = async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await railwayApi.searchTrains(q);
      setTrains(data);
    } catch (err: any) {
      setError(err.message || 'Failed to search trains');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrains(initialQuery);
  }, [initialQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
    fetchTrains(query);
  };

  const filteredTrains = trains.filter((t) => {
    if (selectedType === 'ALL') return true;
    return t.trainType === selectedType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <Search className="w-7 h-7 text-amber-400" />
          <span>Indian Railway Train Directory</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Search by 5-digit train number, train name, origin station, or destination.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 20901, 12951, Vande Bharat, Rajdhani, Mumbai Central, New Delhi..."
          className="w-full bg-slate-900 text-white placeholder-slate-500 rounded-2xl pl-12 pr-28 py-3.5 border border-slate-700 focus:outline-none focus:border-amber-500 text-sm sm:text-base transition"
        />
        <Search className="w-5 h-5 text-amber-400 absolute left-4 top-4" />
        <button
          type="submit"
          className="absolute right-2 top-2 bottom-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center gap-1.5"
        >
          <span>Search</span>
        </button>
      </form>

      {/* Train Type Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-slate-500 shrink-0 mr-1" />
        {TRAIN_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedType === type
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-amber-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-medium">Scanning Railway Directory...</span>
        </div>
      )}

      {error && (
        <div className="glass-panel p-4 rounded-2xl border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Grid */}
      {!loading && !error && (
        <>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Found <strong className="text-white">{filteredTrains.length}</strong> trains
              {selectedType !== 'ALL' && ` in ${selectedType} category`}
            </span>
          </div>

          {filteredTrains.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredTrains.map((train) => (
                <TrainCard key={train.trainNumber} train={train} />
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-10 text-center border border-slate-800">
              <Train className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">
                No trains matching your query
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Try searching with popular numbers like <strong>20901</strong>, <strong>12951</strong>, <strong>22436</strong>, or keywords like <strong>Rajdhani</strong>.
              </p>
              <button
                onClick={() => {
                  setQuery('');
                  setSelectedType('ALL');
                  fetchTrains('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
