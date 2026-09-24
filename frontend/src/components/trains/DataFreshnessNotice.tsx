import React from 'react';
import { Database, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

interface Props {
  source: string;
  updatedAt?: string;
  dataFreshnessText?: string;
  isStale?: boolean;
  staleWarning?: string;
  confidence?: string;
}

export const DataFreshnessNotice: React.FC<Props> = ({
  source,
  updatedAt,
  dataFreshnessText,
  isStale,
  staleWarning,
  confidence = 'Authoritative',
}) => {
  const formattedTime = updatedAt
    ? new Date(updatedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Recent';

  return (
    <div
      className={`rounded-xl p-3 text-xs border ${
        isStale
          ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
          : 'bg-slate-900/60 border-slate-800 text-slate-400'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isStale ? (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <div>
            <div className="flex items-center gap-1.5 font-medium text-slate-300">
              <Database className="w-3 h-3 text-slate-400" />
              <span>Source:</span>
              <span className="text-amber-400 font-semibold">{source}</span>
              {confidence && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {confidence}
                </span>
              )}
            </div>
            {dataFreshnessText && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                {dataFreshnessText}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Last Updated: {formattedTime}</span>
        </div>
      </div>

      {isStale && staleWarning && (
        <div className="mt-2 pt-2 border-t border-amber-500/20 text-amber-300 text-[11px]">
          ⚠️ {staleWarning}
        </div>
      )}
    </div>
  );
};
