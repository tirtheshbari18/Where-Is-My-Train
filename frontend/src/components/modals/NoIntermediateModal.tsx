import React from 'react';
import { Route, X, Info } from 'lucide-react';

interface NoIntermediateModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromStationName: string;
  fromStationCode: string;
  toStationName: string;
  toStationCode: string;
}

export const NoIntermediateModal: React.FC<NoIntermediateModalProps> = ({
  isOpen,
  onClose,
  fromStationName,
  fromStationCode,
  toStationName,
  toStationCode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="no-intermediate-title"
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Route className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-blue-200">
                Railway Route Information
              </span>
              <h2 id="no-intermediate-title" className="text-lg font-bold">
                No Intermediate Stations
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-200 text-sm">
                  Direct Railway Block Section
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                  No intermediate stations found between{' '}
                  <strong className="font-bold">
                    {fromStationName} ({fromStationCode})
                  </strong>{' '}
                  and{' '}
                  <strong className="font-bold">
                    {toStationName} ({toStationCode})
                  </strong>
                  .
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 gap-3">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {fromStationCode}
            </span>
            <span className="text-slate-400">───── Direct Track ─────</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {toStationCode}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            This track section connects consecutive stations without any suburban halts, flag stations, or crossing loops.
          </p>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
