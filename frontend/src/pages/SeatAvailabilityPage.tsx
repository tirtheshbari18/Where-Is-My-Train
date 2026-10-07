import React, { useState } from 'react';
import {
  Armchair,
  Search,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface SeatClassStatus {
  classCode: string;
  className: string;
  status: 'AVAILABLE' | 'RAC' | 'WL' | 'REGRET' | 'NOT AVAILABLE';
  countText: string;
  fare: number;
  confirmationChance?: string;
  lastUpdated: string;
}

const SAMPLE_CLASSES: SeatClassStatus[] = [
  { classCode: '1A', className: 'First AC', status: 'AVAILABLE', countText: 'AVAILABLE 04', fare: 2150, confirmationChance: 'Guaranteed', lastUpdated: '12 mins ago' },
  { classCode: '2A', className: 'AC 2 Tier', status: 'AVAILABLE', countText: 'AVAILABLE 18', fare: 1320, confirmationChance: 'Guaranteed', lastUpdated: '10 mins ago' },
  { classCode: '3A', className: 'AC 3 Tier', status: 'RAC', countText: 'RAC 08', fare: 940, confirmationChance: '85% High', lastUpdated: '8 mins ago' },
  { classCode: 'SL', className: 'Sleeper Class', status: 'WL', countText: 'WL 32', fare: 365, confirmationChance: '62% Medium', lastUpdated: '5 mins ago' },
  { classCode: '2S', className: 'Second Sitting', status: 'AVAILABLE', countText: 'AVAILABLE 85', fare: 145, confirmationChance: 'Guaranteed', lastUpdated: '15 mins ago' },
];

export const SeatAvailabilityPage: React.FC = () => {
  const [trainNumber, setTrainNumber] = useState('12951');
  const [sourceCode, setSourceCode] = useState('MMCT');
  const [destCode, setDestCode] = useState('NDLS');
  const [journeyDate, setJourneyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [quota, setQuota] = useState('GN');
  const [results, setResults] = useState<SeatClassStatus[]>(SAMPLE_CLASSES);
  const [loading, setLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(true);

  const handleCheckSeats = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate lookup based on entered train
    setTimeout(() => {
      setResults(SAMPLE_CLASSES);
      setLoading(false);
      setHasQueried(true);
    }, 400);
  };

  const getStatusBadge = (status: SeatClassStatus['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50';
      case 'RAC':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      case 'WL':
        return 'bg-orange-950/80 text-orange-400 border-orange-500/50';
      default:
        return 'bg-rose-950/80 text-rose-400 border-rose-500/50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Armchair className="w-7 h-7 text-emerald-400" />
          <span>Seat Availability & Fare Enquiry</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Indian Railways reservation berth availability across AC, Sleeper, and General quotas with confirmation probability.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleCheckSeats} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Train Number
            </label>
            <input
              type="text"
              value={trainNumber}
              onChange={(e) => setTrainNumber(e.target.value)}
              placeholder="e.g. 12951, 20901, 22954"
              className="w-full bg-slate-950 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 border border-slate-700 text-sm focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              From Station
            </label>
            <input
              type="text"
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              placeholder="e.g. MMCT, BOR"
              className="w-full bg-slate-950 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 border border-slate-700 text-sm focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              To Station
            </label>
            <input
              type="text"
              value={destCode}
              onChange={(e) => setDestCode(e.target.value)}
              placeholder="e.g. NDLS, DRD"
              className="w-full bg-slate-950 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 border border-slate-700 text-sm focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Travel Date
            </label>
            <input
              type="date"
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
              className="w-full bg-slate-950 text-white rounded-xl px-3.5 py-2.5 border border-slate-700 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Quota
            </label>
            <select
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
              className="w-full bg-slate-950 text-white rounded-xl px-3.5 py-2.5 border border-slate-700 text-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="GN">General Quota (GN)</option>
              <option value="TQ">Tatkal Quota (TQ)</option>
              <option value="LD">Ladies Quota (LD)</option>
              <option value="SS">Senior Citizen (SS)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <span className="text-xs text-slate-400">
            Enquiry for: <strong className="text-white">{sourceCode}</strong> ➔ <strong className="text-white">{destCode}</strong>
          </span>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Checking...' : 'Check Availability'}</span>
          </button>
        </div>
      </form>

      {/* Compliance Notice */}
      <div className="p-3.5 bg-blue-950/40 border border-blue-800/50 rounded-2xl flex items-center justify-between gap-3 text-xs text-blue-200">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            PRS Live Architecture: Reservation charts finalize 4 hours before scheduled departure. Official booking via IRCTC.
          </span>
        </div>
        <a
          href="https://www.irctc.co.in/nget/train-search"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition shrink-0 flex items-center gap-1"
        >
          <span>Book on IRCTC</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Classes Grid */}
      {hasQueried && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((cls) => (
            <div
              key={cls.classCode}
              className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black font-mono px-3 py-0.5 rounded-xl bg-slate-800 text-white border border-slate-700">
                      {cls.classCode}
                    </span>
                    <span className="text-sm font-bold text-slate-300">
                      {cls.className}
                    </span>
                  </div>
                  <span className="text-lg font-mono font-black text-white">
                    ₹{cls.fare}
                  </span>
                </div>

                {/* Status pill */}
                <div className="mt-4 p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${getStatusBadge(
                        cls.status
                      )}`}
                    >
                      {cls.countText}
                    </span>
                    {cls.confirmationChance && (
                      <span className="text-xs font-semibold text-slate-400">
                        {cls.confirmationChance}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                    <span>Base Fare + IRCTC Charges</span>
                    <span>Updated {cls.lastUpdated}</span>
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Quota: {quota}</span>
                <a
                  href="https://www.irctc.co.in/nget/train-search"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  Book Seat <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
