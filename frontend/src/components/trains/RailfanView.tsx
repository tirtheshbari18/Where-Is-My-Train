import React from 'react';
import {
  Gauge,
  Zap,
  Activity,
  Compass,
  Radio,
  Share2,
} from 'lucide-react';
import { RunningStatus, TrainSummary } from '../../api/railwayApi.js';

interface Props {
  train: TrainSummary & { locoType?: string };
  status: RunningStatus;
}

export const RailfanView: React.FC<Props> = ({ train, status }) => {
  return (
    <div className="space-y-6">
      {/* Railfan Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 border border-amber-500/30 shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Telemetry & Locomotive Insights (Railfan Mode)</span>
          </div>
          <h2 className="text-2xl font-black text-white font-mono">
            {train.trainNumber} • {train.trainName}
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            Zone: <strong className="text-amber-400">{train.zone || 'IR'}</strong> • Route: {train.sourceCode} ➔ {train.destinationCode} ({train.distanceKm} km)
          </p>
        </div>
        <div className="absolute right-4 bottom-2 text-8xl font-black font-mono text-white/5 select-none pointer-events-none">
          {train.trainNumber}
        </div>
      </div>

      {/* Grid of Railfan Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Locomotive Card */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold">Motive Power</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {status.locoNumber || 'Not available'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {train.locoType || 'Not available'}
          </div>
        </div>

        {/* Speed Telemetry */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold">Reported Speed</span>
            <Gauge className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono flex items-baseline gap-1">
            {status.speedKmH ? (
              <>
                <span>{status.speedKmH}</span>
                <span className="text-xs text-slate-400 font-normal">km/h</span>
              </>
            ) : (
              <span className="text-sm text-slate-400">Not available</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {status.speedKmH ? 'As reported by data provider' : 'Speed telemetry unavailable'}
          </div>
        </div>

        {/* Zone & Division */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold">Territory</span>
            <Compass className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {train.zone ? `${train.zone} Railway` : 'Not available'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Division: Not available
          </div>
        </div>

        {/* Reporting Mode */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold">Position Telemetry</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-base font-bold text-amber-400 capitalize">
            {status.positionType}-Based Feed
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Confidence: {status.dataSourceConfidence}
          </div>
        </div>
      </div>

      {/* Nearby Railway Activity */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <span>Nearby Railway Activity & Block Sections</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Operating parameters in this corridor are reported via authorized station interlocking points and electronic block instruments.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Previous Interlocking</span>
            <span className="font-bold text-white">
              {status.previousStation ? `${status.previousStation.name} (${status.previousStation.code})` : 'Origin Yard'}
            </span>
            <span className="text-[11px] text-emerald-400 block mt-1">
              ✓ Block Section Cleared
            </span>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-amber-500/30">
            <span className="text-slate-400 block mb-1">Current Section</span>
            <span className="font-bold text-amber-300">
              {status.lastReportedStation?.name || 'Section Transit'}
            </span>
            <span className="text-[11px] text-amber-400 block mt-1">
              • {status.delayMinutes > 0 ? `Running with +${status.delayMinutes} min delay` : 'No delay reported'}
            </span>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Next Approaching Block</span>
            <span className="font-bold text-white">
              {status.nextStation ? `${status.nextStation.name} (${status.nextStation.code})` : 'Destination'}
            </span>
            <span className="text-[11px] text-blue-400 block mt-1">
              Expected at {status.nextStation?.expectedArrival || '--:--'}
            </span>
          </div>
        </div>
      </div>

      {/* Share Train Status Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `${train.trainNumber} ${train.trainName} Status`,
                text: `Live tracking ${train.trainNumber} ${train.trainName}: currently at ${status.lastReportedStation?.name || 'en-route'}, delay: ${status.delayMinutes > 0 ? `+${status.delayMinutes} mins` : 'none'}. Track on Where Is My Train!`,
                url: window.location.href,
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('Tracking link copied to clipboard!');
            }
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
        >
          <Share2 className="w-4 h-4 text-amber-400" />
          <span>Share Train Status</span>
        </button>
      </div>
    </div>
  );
};
