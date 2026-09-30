import React from 'react';
import {
  X,
  ArrowLeftRight,
  ChevronsRight,
  ShieldAlert,
  Train,
  Clock,
  Layers,
  Database,
  ExternalLink,
  Info,
} from 'lucide-react';
import { TrainOperation } from '../../api/railwayApi.js';
import { getOperationMeta } from '../../utils/operationRegistry.js';

interface OperationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  operation: TrainOperation | null;
  currentTrainNumber?: string;
  currentTrainName?: string;
}

export const OperationDetailModal: React.FC<OperationDetailModalProps> = ({
  isOpen,
  onClose,
  operation,
  currentTrainNumber,
  currentTrainName,
}) => {
  if (!isOpen || !operation) return null;

  const meta = getOperationMeta(operation.type);

  // Render icon based on meta.iconType
  const renderIcon = () => {
    switch (meta.iconType) {
      case 'OVERTAKING':
        return <ChevronsRight className="w-5 h-5 text-emerald-400" />;
      case 'OVERTAKEN':
        return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case 'PASSING':
        return <Train className="w-5 h-5 text-purple-400" />;
      case 'CROSSING':
      default:
        return <ArrowLeftRight className="w-5 h-5 text-blue-400" />;
    }
  };

  const currentNumber = currentTrainNumber || operation.trainNumber;
  const currentName = currentTrainName || operation.trainName;

  // Source classification transparency (Section 34)
  const source = operation.source || 'Indian Rail Info / CRIS Dataset';
  const isImported = source.toLowerCase().includes('imported') || source.toLowerCase().includes('archive');
  const isLive = source.toLowerCase().includes('controller') || source.toLowerCase().includes('live');
  const sourceBadge = isLive ? 'Live Track Event' : isImported ? 'Imported Dataset' : 'Verified Timetable';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="operation-modal-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        {/* Header - High Contrast Railway Theme */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 p-5 text-white flex items-center justify-between border-b border-blue-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              {renderIcon()}
            </div>
            <div>
              <span className="text-[11px] uppercase font-black tracking-widest text-blue-300">
                TRAIN OPERATION DETAIL
              </span>
              <h2 id="operation-modal-title" className="text-lg font-black leading-tight">
                {operation.label || meta.label}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Operation Summary Banner */}
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-950 dark:text-blue-200 leading-relaxed font-medium">
                {operation.description}
              </p>
            </div>
          </div>

          {/* Core Interactive Train Relationship Box (Section 15) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Current Train Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                CURRENT TRAIN
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-blue-600 text-white">
                  #{currentNumber}
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                  {currentName}
                </span>
              </div>
            </div>

            {/* Other Train Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                INTERACTING TRAIN
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                  #{operation.otherTrainNumber}
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                  {operation.otherTrainName}
                </span>
              </div>
              {operation.otherTrainRoute && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  Route: {operation.otherTrainRoute}
                </span>
              )}
            </div>
          </div>

          {/* Operational Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Station */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Station</span>
              <p className="font-black text-slate-900 dark:text-white text-sm mt-0.5 truncate">
                {operation.stationName}
              </p>
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {operation.stationCode}
              </span>
            </div>

            {/* Scheduled Time */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-500" />
                <span>Scheduled Time</span>
              </span>
              <p className="font-mono font-black text-slate-900 dark:text-white text-sm mt-0.5">
                {operation.scheduledTime || 'N/A'}
              </p>
              <span className="text-[10px] text-slate-400">
                Act: {operation.actualTime || operation.scheduledTime || 'N/A'}
              </span>
            </div>

            {/* Platform & Direction */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-500" />
                <span>Platform & Line</span>
              </span>
              <p className="font-black text-amber-600 dark:text-amber-400 text-sm mt-0.5">
                {operation.platform ? `Platform ${operation.platform}` : 'Platform not announced'}
              </p>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {operation.direction ? `Direction: ${operation.direction}` : 'Direction: Not specified'}
              </span>
            </div>
          </div>

          {/* Data Source & Provenance Transparency (Section 34) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-500" />
                <span>Source Authority</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {sourceBadge}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
              {source}
            </p>
            {operation.sourceUrl && (
              <a
                href={operation.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                <span>View source record on Indian Rail Info</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Retrieved: {operation.retrievedAt ? new Date(operation.retrievedAt).toLocaleDateString('en-IN') : 'Official Schedule'}</span>
              <span>Updated: {operation.lastUpdated ? new Date(operation.lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Live'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition active:scale-95"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
