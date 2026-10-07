import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  XCircle,
  Shuffle,
  Clock,
  Sparkles,
  Search,
  Loader2,
  Calendar,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { railwayApi, TrainException } from '../api/railwayApi.js';
import { useRequestGuard } from '../hooks/useRequestGuard.js';

type ExceptionFilter = 'ALL' | 'CANCELLED' | 'DIVERTED' | 'RESCHEDULED' | 'SPECIAL';

export const TrainExceptionsPage: React.FC = () => {
  const [exceptions, setExceptions] = useState<TrainException[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<ExceptionFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const guard = useRequestGuard();

  const fetchExceptions = async (filter: ExceptionFilter) => {
    const reqId = guard.next();
    setLoading(true);
    setError(null);
    try {
      const typeParam = filter === 'ALL' ? undefined : filter;
      const data = await railwayApi.getTrainExceptions(typeParam);
      if (!guard.isCurrent(reqId)) return;
      setExceptions(data);
    } catch (err: any) {
      if (!guard.isCurrent(reqId)) return;
      console.error('Failed to fetch train exceptions:', err);
      setError('Unable to load railway exceptions. Showing scheduled operation bulletins.');
    } finally {
      if (guard.isCurrent(reqId)) setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions(selectedFilter);
  }, [selectedFilter]);

  const filtered = exceptions.filter((ex) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      ex.trainNumber.toLowerCase().includes(q) ||
      ex.trainName.toLowerCase().includes(q) ||
      ex.sourceName.toLowerCase().includes(q) ||
      ex.destName.toLowerCase().includes(q) ||
      ex.reason.toLowerCase().includes(q)
    );
  });

  const getBadge = (type: TrainException['exceptionType']) => {
    switch (type) {
      case 'CANCELLED':
        return {
          icon: <XCircle className="w-4 h-4" />,
          label: 'Cancelled',
          classes: 'bg-rose-950/80 text-rose-300 border-rose-500/50',
        };
      case 'DIVERTED':
        return {
          icon: <Shuffle className="w-4 h-4" />,
          label: 'Diverted',
          classes: 'bg-purple-950/80 text-purple-300 border-purple-500/50',
        };
      case 'RESCHEDULED':
        return {
          icon: <Clock className="w-4 h-4" />,
          label: 'Rescheduled',
          classes: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
        };
      case 'SPECIAL':
        return {
          icon: <Sparkles className="w-4 h-4" />,
          label: 'Special Service',
          classes: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
        };
      default:
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          label: type,
          classes: 'bg-slate-800 text-slate-300 border-slate-700',
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <ShieldAlert className="w-7 h-7 text-rose-500" />
          <span>Indian Railway Operational Exceptions & Bulletins</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Official NTES & CRIS service exceptions including cancellations, route diversions, rescheduled services, and holiday specials.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(
              [
                { id: 'ALL', label: 'All Exceptions' },
                { id: 'CANCELLED', label: 'Cancelled' },
                { id: 'DIVERTED', label: 'Diverted' },
                { id: 'RESCHEDULED', label: 'Rescheduled' },
                { id: 'SPECIAL', label: 'Special Trains' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedFilter === tab.id
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by train number, route, reason..."
              className="w-full bg-slate-950 text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 border border-slate-700 text-xs focus:border-rose-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Content State */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-rose-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-semibold">Loading official railway exceptions...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs font-semibold">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const badge = getBadge(item.exceptionType);
              return (
                <div
                  key={`${item.trainNumber}_${item.effectiveDate}_${idx}`}
                  className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border ${badge.classes}`}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {item.effectiveDate}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-black text-rose-400">
                          {item.trainNumber}
                        </span>
                        <h3 className="text-sm font-bold text-white truncate">
                          {item.trainName}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {item.sourceName} ({item.sourceCode}) ➔ {item.destName} ({item.destCode})
                      </p>
                    </div>

                    {/* Specific Exception Detail */}
                    <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                        Operational Reason
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        {item.reason}
                      </p>
                      {item.divertedRoute && (
                        <div className="pt-1 text-xs text-purple-300 font-medium">
                          <strong>Diverted via:</strong> {item.divertedRoute}
                        </div>
                      )}
                      {item.rescheduledTime && (
                        <div className="pt-1 text-xs text-amber-300 font-medium">
                          <strong>Rescheduled to:</strong> {item.rescheduledTime}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Indian Railways Bulletin
                    </span>
                    <Link
                      to={`/train/${item.trainNumber}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition"
                    >
                      <span>View Route</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full glass-panel p-12 text-center rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No railway exceptions reported under current filter criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
