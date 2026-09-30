import React, { useState, useEffect } from 'react';
import { History, ArrowRight, X, Trash2, Train } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchHistoryService, SearchHistoryEntry } from '../../services/searchHistoryService.js';

export const RecentSearchesCard: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(searchHistoryService.getHistory());
  }, []);

  const handleOpenSearch = (entry: SearchHistoryEntry) => {
    if (entry.trainNumber) {
      navigate(`/train/${entry.trainNumber}`);
    } else if (entry.sourceCode && entry.destinationCode) {
      navigate(`/trains-between?from=${encodeURIComponent(entry.sourceCode)}&to=${encodeURIComponent(entry.destinationCode)}`);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = searchHistoryService.deleteEntry(id);
    setHistory(updated);
  };

  const handleClearAll = () => {
    searchHistoryService.clearAll();
    setHistory([]);
  };

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-2">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider">
            SEARCH HISTORY
          </h3>
        </div>
        <div className="py-3 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No recent searches yet. Search for a train or route to see them here.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Quick Links:</span>
            {[
              { label: '12922 Flying Ranee (ST - MMCT)', num: '12922' },
              { label: '93023 Virar - Dahanu (BOR - DRD)', num: '93023' },
              { label: '12009 Ahmedabad Shatabdi (MMCT - ADI)', num: '12009' },
            ].map((route) => (
              <button
                key={route.num}
                type="button"
                onClick={() => navigate(`/train/${route.num}`)}
                className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 text-[11px] font-medium transition"
              >
                {route.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider">
            SEARCH HISTORY
          </h3>
        </div>
        <button
          onClick={handleClearAll}
          className="text-xs text-slate-400 hover:text-rose-500 transition flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => handleOpenSearch(item)}
            className="py-3 flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded-xl transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Train className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {item.trainNumber ? `${item.trainNumber} ` : ''}
                  {item.trainName || `${item.sourceCode} → ${item.destinationCode}`}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {item.sourceCode} - {item.destinationCode}
                  </span>
                  <span>•</span>
                  <span>{item.timestamp}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={(e) => handleDelete(e, item.id)}
                className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                title="Remove from history"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
