import React from 'react';
import { CalendarX, X, AlertTriangle, Calendar } from 'lucide-react';

interface TrainNotRunningModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainNumber: string;
  trainName?: string;
  selectedDate: string; // YYYY-MM-DD
  runningDays: string[]; // e.g. ['Mon', 'Wed', 'Fri', 'Sun']
  exceptionReason?: string;
  isCancelled?: boolean;
}

const DAY_FULL_NAMES: Record<string, string> = {
  SUN: 'Sunday',
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
};

export const TrainNotRunningModal: React.FC<TrainNotRunningModalProps> = ({
  isOpen,
  onClose,
  trainNumber,
  trainName,
  selectedDate,
  runningDays,
  exceptionReason,
  isCancelled,
}) => {
  if (!isOpen) return null;

  // Format selected date
  const parsedDate = new Date(selectedDate);
  const dayName = isNaN(parsedDate.getTime())
    ? 'Selected Day'
    : parsedDate.toLocaleDateString('en-IN', { weekday: 'long' });

  const formattedDate = isNaN(parsedDate.getTime())
    ? selectedDate
    : parsedDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  const fullRunningDays = runningDays
    .map((d) => DAY_FULL_NAMES[d.toUpperCase()] || d)
    .join(', ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="not-running-title"
      >
        {/* Header with warning accent */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <CalendarX className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-red-200">
                Railway Schedule Notice
              </span>
              <h2 id="not-running-title" className="text-lg font-bold">
                {isCancelled ? 'Service Cancelled' : 'Train Not Running'}
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

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-200 text-sm">
                  {trainNumber} {trainName ? `- ${trainName}` : ''}
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1 leading-relaxed">
                  {isCancelled
                    ? `Scheduled service is cancelled on ${formattedDate}.`
                    : `This train is not scheduled to run on ${dayName} (${formattedDate}).`}
                </p>
                {exceptionReason && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium italic">
                    Reason: {exceptionReason}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Running Days Chips */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Scheduled Operating Days
            </div>
            <div className="flex flex-wrap gap-2">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => {
                const isRunning = runningDays.some(
                  (d) => d.toUpperCase() === day
                );
                return (
                  <span
                    key={day}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isRunning
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-sm'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 border border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    {DAY_FULL_NAMES[day] || day}
                  </span>
                );
              })}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              <strong className="text-slate-700 dark:text-slate-300">Running days:</strong>{' '}
              {fullRunningDays || 'No regular days reported.'}
            </p>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
            <strong>Railway Notice:</strong> Live GPS tracking and real-time running positions are only shown for active operating services on valid schedule dates.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-xl text-sm transition-colors shadow-sm"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
