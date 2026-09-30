// Live Tracking Status Banner for WHERE IS MY TRAIN
// Renders authoritative status banners for Live, Low Accuracy, Stale, Offline, and Server Error states.

import React from 'react';
import { AlertCircle, RefreshCw, WifiOff, Clock, ShieldCheck, Activity } from 'lucide-react';
import {
  liveTrackingStatusService,
  TrackingEvaluationInput,
} from '../../services/liveTrackingStatusService.js';

interface LiveTrackingStatusBannerProps extends TrackingEvaluationInput {
  onRetry?: () => void;
  onViewLastKnown?: () => void;
  isRetrying?: boolean;
}

export const LiveTrackingStatusBanner: React.FC<LiveTrackingStatusBannerProps> = ({
  status,
  error,
  isOffline,
  isTimeout,
  httpStatusCode,
  config,
  onRetry,
  onViewLastKnown,
  isRetrying = false,
}) => {
  const evaluation = liveTrackingStatusService.evaluate({
    status,
    error,
    isOffline,
    isTimeout,
    httpStatusCode,
    config,
  });

  const getIcon = () => {
    switch (evaluation.state) {
      case 'OFFLINE':
        return <WifiOff className="w-5 h-5 text-slate-300 shrink-0" />;
      case 'API_ERROR':
        return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'TIMEOUT':
        return <Clock className="w-5 h-5 text-amber-300 shrink-0" />;
      case 'LOW_ACCURACY':
        return <Activity className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />;
      case 'STALE_DATA':
        return <Clock className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'SUCCESS':
        return <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400 shrink-0" />;
    }
  };

  // If status is standard live with no special banner required, render a compact live badge pill
  if (evaluation.state === 'SUCCESS') {
    return (
      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-black uppercase tracking-wider text-emerald-300">Live</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-300 font-medium">{evaluation.subtext}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="p-1 text-slate-400 hover:text-emerald-300 transition"
            title="Refresh location"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-4 border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${evaluation.bannerClass}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-black/20 shrink-0">{getIcon()}</div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-sm sm:text-base leading-tight">
              {evaluation.headline}
            </h3>
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${evaluation.badgeClass}`}
            >
              {evaluation.badgeLabel}
            </span>
          </div>
          <p className="text-xs opacity-90 mt-0.5 font-medium">{evaluation.subtext}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {evaluation.canViewLastKnown && onViewLastKnown && (
          <button
            onClick={onViewLastKnown}
            type="button"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition active:scale-95"
          >
            Last Known Position
          </button>
        )}

        {evaluation.canRetry && onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-black transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>Retry</span>
          </button>
        )}
      </div>
    </div>
  );
};
