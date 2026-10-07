import React from 'react';
import {
  MapPin,
  Clock,
  Navigation,
  Radio,
  Activity,
} from 'lucide-react';
import { CircularSpeedometer, SpeedMode } from './CircularSpeedometer.js';
import { DestinationAlarm } from './DestinationAlarm.js';
import { DelayBadge } from './DelayBadge.js';
import { TrainStop, RunningStatus } from '../../api/railwayApi.js';

interface LiveJourneyDashboardProps {
  trainNumber: string;
  trainName: string;
  runningStatus?: RunningStatus | null;
  schedule: TrainStop[];
  speedKmH: number | null;
  speedMode?: SpeedMode;
  onRefresh?: () => void;
  className?: string;
}

export const LiveJourneyDashboard: React.FC<LiveJourneyDashboardProps> = ({
  trainNumber,
  trainName,
  runningStatus,
  schedule,
  speedKmH,
  speedMode = 'LIVE SPEED',
  onRefresh,
  className = '',
}) => {
  const currentStation = runningStatus?.lastReportedStation;
  const nextStation = runningStatus?.nextStation;
  const destStation = schedule.length > 0 ? schedule[schedule.length - 1] : null;
  const originStation = schedule.length > 0 ? schedule[0] : null;

  // Calculate distance travelled vs total distance
  const totalDistanceKm = destStation?.distanceFromSourceKm || 100;
  const currentDistanceKm = currentStation
    ? schedule.find((s) => s.stationCode === currentStation.code)?.distanceFromSourceKm || 0
    : 0;
  const distanceRemainingKm = Math.max(0, totalDistanceKm - currentDistanceKm);
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((currentDistanceKm / totalDistanceKm) * 100))
  );

  // Data freshness indicator (🟢 Live, 🟡 Delayed update, ⚪ Scheduled information)
  const isLive = runningStatus?.positionType === 'gps' || runningStatus?.positionType === 'station';
  const delayMinutes = runningStatus?.delayMinutes || 0;
  const isDelayedUpdate = isLive && (runningStatus?.dataFreshnessText?.toLowerCase().includes('delayed') || delayMinutes > 30);

  const freshness = isDelayedUpdate
    ? {
        label: 'Delayed update',
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        dot: 'bg-amber-400',
      }
    : isLive
    ? {
        label: 'Live — updated recently',
        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        dot: 'bg-emerald-400 animate-pulse',
      }
    : {
        label: 'Scheduled information',
        color: 'bg-slate-700 text-slate-300 border-slate-600',
        dot: 'bg-slate-400',
      };

  // Find upcoming stations
  const currentIndex = schedule.findIndex((s) => s.stationCode === currentStation?.code);
  const upcomingStops = currentIndex >= 0 ? schedule.slice(currentIndex + 1, currentIndex + 5) : schedule.slice(0, 4);

  const isNextDest = nextStation?.code === destStation?.stationCode;

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-6 ${className}`}
      role="region"
      aria-label="Inside Train Live Journey Dashboard"
    >
      {/* Top Banner: Status & Data Freshness */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">
              LIVE JOURNEY TELEMETRY
            </span>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
              {trainNumber} — {trainName}
            </h3>
          </div>
        </div>

        {/* Freshness Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${freshness.color}`}
          >
            <span className={`w-2 h-2 rounded-full ${freshness.dot}`} />
            {freshness.label}
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg text-xs transition"
              title="Refresh telemetry"
            >
              <Radio className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Speedometer & Live Journey Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Speedometer Gauge (Left / Top on mobile) */}
        <div className="lg:col-span-5 flex justify-center">
          <CircularSpeedometer
            speedKmH={speedKmH}
            mode={speedMode}
            className="w-full max-w-xs"
          />
        </div>

        {/* Journey Progress and Stations (Right) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Station Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Last / Current Station */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800/90 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                Current / Last Station
              </span>
              <p className="text-base font-black text-white mt-1">
                {currentStation ? `${currentStation.name} (${currentStation.code})` : originStation?.stationName || 'En route'}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                <span>Dep: {currentStation?.actualDeparture || originStation?.scheduledDeparture || '--:--'}</span>
                {currentStation?.platform && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                    PF {currentStation.platform}
                  </span>
                )}
              </div>
            </div>

            {/* Next Scheduled Stop */}
            <div className="p-3.5 bg-slate-950/70 border border-blue-900/40 rounded-2xl">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                <Navigation className="w-3 h-3 text-blue-400" />
                Next Stop
              </span>
              <p className="text-base font-black text-blue-100 mt-1">
                {nextStation ? `${nextStation.name} (${nextStation.code})` : destStation?.stationName || 'Final destination'}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                <span>ETA: {nextStation?.expectedArrival || '--:--'}</span>
                {nextStation?.distanceRemainingKm !== undefined && (
                  <span className="text-blue-400 font-mono font-medium">
                    in {nextStation.distanceRemainingKm} km
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/90 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">
                {originStation?.stationCode || 'SRC'} → {destStation?.stationCode || 'DST'}
              </span>
              <span className="text-emerald-400 font-mono">{progressPercent}% Completed</span>
            </div>

            {/* Track Bar */}
            <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1 font-mono">
              <span>{Math.round(currentDistanceKm)} km covered</span>
              <span>{Math.round(distanceRemainingKm)} km remaining</span>
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-slate-950/50 border border-slate-800 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-500">Delay</span>
              <div className="mt-0.5">
                <DelayBadge delayMinutes={delayMinutes} size="sm" />
              </div>
            </div>
            <div className="p-2.5 bg-slate-950/50 border border-slate-800 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-500">Destination ETA</span>
              <p className="text-xs sm:text-sm font-black text-white mt-0.5 font-mono">
                {runningStatus?.expectedArrivalAtDestination || destStation?.scheduledArrival || '--:--'}
              </p>
            </div>
            <div className="p-2.5 bg-slate-950/50 border border-slate-800 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-500">Last Telemetry</span>
              <p className="text-xs sm:text-sm font-black text-slate-300 mt-0.5 truncate">
                {runningStatus?.updatedAt ? new Date(runningStatus.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Destination Alarm Section */}
      {destStation && (
        <DestinationAlarm
          destinationName={destStation.stationName}
          destinationCode={destStation.stationCode}
          distanceRemainingKm={distanceRemainingKm}
          isNextStationDestination={isNextDest}
        />
      )}

      {/* Upcoming Stations Timeline Preview */}
      {upcomingStops.length > 0 && (
        <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            Upcoming Scheduled Stations
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {upcomingStops.map((stn, idx) => (
              <div
                key={stn.stationCode + idx}
                className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-white">
                  <span className="truncate">{stn.stationName}</span>
                  <span className="text-blue-400 font-mono text-[11px] shrink-0 ml-1">
                    {stn.stationCode}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Arr: {stn.scheduledArrival || '--:--'}</span>
                  <span>{stn.distanceFromSourceKm} km</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
