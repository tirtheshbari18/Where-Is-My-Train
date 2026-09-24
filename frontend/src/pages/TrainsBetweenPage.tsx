import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  ArrowRightLeft,
  Filter,
  Train,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { railwayApi, TrainSummary } from '../api/railwayApi.js';
import { TrainCard } from '../components/trains/TrainCard.js';

const FILTER_CLASSES = [
  'ALL',
  'Vande Bharat',
  'Rajdhani',
  'Shatabdi',
  'Superfast',
  'Express',
  'Special',
];

export const TrainsBetweenPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromParam = searchParams.get('from') || 'MMCT';
  const toParam = searchParams.get('to') || 'ADI';
  const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [fromStation, setFromStation] = useState(fromParam);
  const [toStation, setToStation] = useState(toParam);
  const [travelDate, setTravelDate] = useState(dateParam);
  const [trains, setTrains] = useState<TrainSummary[]>([]);
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrainsBetween = async (from: string, to: string, date: string) => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    try {
      const data = await railwayApi.getTrainsBetween(from, to, date);
      setTrains(data);
    } catch (err: any) {
      setError(err.message || 'Failed to find trains between stations');
      setTrains([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainsBetween(fromParam, toParam, dateParam);
  }, [fromParam, toParam, dateParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromStation || !toStation) return;
    setSearchParams({
      from: fromStation.trim().toUpperCase(),
      to: toStation.trim().toUpperCase(),
      date: travelDate,
    });
    fetchTrainsBetween(fromStation, toStation, travelDate);
  };

  const swapStations = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  const filteredTrains = trains.filter((t) => {
    if (selectedClass === 'ALL') return true;
    return t.trainType === selectedClass;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <Calendar className="w-7 h-7 text-amber-400" />
          <span>Trains Between Stations</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Direct trains, timetables, duration, and running frequency between two stations.
        </p>
      </div>

      {/* Query Bar */}
      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Origin Station Code
            </label>
            <input
              type="text"
              value={fromStation}
              onChange={(e) => setFromStation(e.target.value.toUpperCase())}
              placeholder="e.g. MMCT / BVI"
              className="w-full bg-slate-950 text-white font-mono font-bold rounded-xl px-4 py-3 border border-slate-700 text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-1 flex justify-center pt-2 md:pt-4">
            <button
              type="button"
              onClick={swapStations}
              className="p-3 rounded-full bg-slate-900 border border-slate-700 hover:border-amber-500 text-amber-400 hover:scale-110 transition"
              title="Swap From and To"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Destination Station Code
            </label>
            <input
              type="text"
              value={toStation}
              onChange={(e) => setToStation(e.target.value.toUpperCase())}
              placeholder="e.g. ADI / NDLS"
              className="w-full bg-slate-950 text-white font-mono font-bold rounded-xl px-4 py-3 border border-slate-700 text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Date of Travel
            </label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full bg-slate-950 text-white rounded-xl px-4 py-3 border border-slate-700 text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
            >
              <span>Search Available Trains</span>
            </button>
          </div>
        </div>
      </form>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-slate-500 shrink-0 mr-1" />
        {FILTER_CLASSES.map((cls) => (
          <button
            key={cls}
            onClick={() => setSelectedClass(cls)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedClass === cls
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cls}
          </button>
        ))}
      </div>

      {/* Loading & Errors */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-amber-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-semibold">Finding direct train routes...</span>
        </div>
      )}

      {error && (
        <div className="glass-panel p-4 rounded-2xl border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Train Cards List */}
      {!loading && !error && (
        <>
          <div className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredTrains.length}</strong> trains from{' '}
            <strong className="text-amber-400">{fromParam}</strong> to{' '}
            <strong className="text-amber-400">{toParam}</strong>
          </div>

          {filteredTrains.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredTrains.map((train) => (
                <TrainCard key={train.trainNumber} train={train} />
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 text-slate-400 text-xs">
              <Train className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <div>No direct trains found between {fromParam} and {toParam} on this route.</div>
              <div className="text-slate-500 mt-1">Try major junctions like MMCT, NDLS, HWH, BRC, or ADI.</div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
