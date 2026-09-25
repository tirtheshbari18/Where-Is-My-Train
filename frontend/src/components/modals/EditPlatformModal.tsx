import React, { useState } from 'react';
import { Layers, X, Info, Check, Trash2 } from 'lucide-react';

interface EditPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainNumber: string;
  stationCode: string;
  stationName: string;
  currentPlatform: string;
  lastUpdated?: string;
  source?: string;
  onSave: (newPlatform: string, source: string) => Promise<void>;
}

const COMMON_SOURCES = [
  'User Announcement',
  'Station Display Board',
  'Station Public Address (PA)',
  'Train Conductor / TTE',
  'Station Master Inquiry',
];

export const EditPlatformModal: React.FC<EditPlatformModalProps> = ({
  isOpen,
  onClose,
  trainNumber,
  stationCode,
  stationName,
  currentPlatform,
  lastUpdated,
  source = 'User Announcement',
  onSave,
}) => {
  const [platformNumber, setPlatformNumber] = useState(currentPlatform || '');
  const [customSource, setCustomSource] = useState(source);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!platformNumber.trim()) {
      setError('Please provide a platform number or choose Remove.');
      return;
    }
    try {
      setIsSaving(true);
      setError(null);
      await onSave(platformNumber.trim(), customSource);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save platform update.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await onSave('--', customSource);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to clear platform.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-platform-title"
      >
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">
                Train #{trainNumber}
              </span>
              <h2 id="edit-platform-title" className="text-lg font-bold">
                Edit Platform Number
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
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Station</p>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {stationName} ({stationCode})
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">Current Platform</p>
              <span className="inline-block px-2.5 py-0.5 mt-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Platform {currentPlatform || '--'}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Platform Number
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={platformNumber}
                onChange={(e) => setPlatformNumber(e.target.value)}
                placeholder="e.g. 1, 2, 3A..."
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {/* Quick platform selector chips */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[11px] text-slate-400 mr-1">Quick Select:</span>
              {['1', '2', '3', '4', '5', '6', '7', '8'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPlatformNumber(num)}
                  className={`px-2 py-1 text-xs font-bold rounded-lg border transition-all ${
                    platformNumber === num
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                  }`}
                >
                  PF {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Information Source
            </label>
            <select
              value={customSource}
              onChange={(e) => setCustomSource(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {COMMON_SOURCES.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          {/* Mandatory disclaimer from prompt */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-1">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <strong>Notice:</strong> Platform information is user-editable and may change according to railway operational announcements.
              </p>
            </div>
            {lastUpdated && (
              <p className="text-[11px] text-amber-700 dark:text-amber-300 pl-6">
                Last updated: {new Date(lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • Source: {source}
              </p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleRemove}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Platform'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
