import React from 'react';
import { Train, Check, Circle, Clock, ArrowDown } from 'lucide-react';
import { TrainStop } from '../../api/railwayApi.js';
import { Link } from 'react-router-dom';

interface Props {
  stops: TrainStop[];
  currentIndex: number;
  delayMinutes: number;
}

export const RailwayTimeline: React.FC<Props> = ({
  stops,
  currentIndex,
  delayMinutes,
}) => {
  return (
    <div className="relative py-4">
      {/* Visual railway track background line */}
      <div className="absolute left-[29px] top-6 bottom-6 w-1 bg-gradient-to-b from-emerald-500 via-amber-500 to-slate-800 rounded-full" />

      <div className="space-y-4 relative">
        {stops.map((stop, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;
          const isOrigin = index === 0;
          const isDestination = index === stops.length - 1;

          return (
            <div
              key={`${stop.stationCode}_${stop.stopSequence}`}
              className={`flex items-start gap-4 p-3 rounded-2xl transition ${
                isCurrent
                  ? 'bg-amber-500/10 border border-amber-500/40 shadow-lg shadow-amber-500/5'
                  : isCompleted
                  ? 'bg-slate-900/40 border border-slate-800/60 opacity-85'
                  : 'bg-slate-900/30 border border-slate-800/40'
              }`}
            >
              {/* Timeline Indicator Node */}
              <div className="relative z-10 shrink-0 mt-0.5">
                {isCompleted ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md shadow-emerald-500/30">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : isCurrent ? (
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/40 animate-pulse">
                      <Train className="w-4 h-4" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-950 animate-ping"></span>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 text-slate-500 flex items-center justify-center">
                    <Circle className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Station Info & Timings */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/station/${stop.stationCode}`}
                      className="font-bold text-sm sm:text-base text-white hover:text-amber-400 transition"
                    >
                      {stop.stationName}
                    </Link>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono font-bold border border-slate-700">
                      {stop.stationCode}
                    </span>
                    {stop.platform && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/50">
                        PF {stop.platform}
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isCompleted && (
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <span>Departed</span>
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 flex items-center gap-1 shadow">
                        <span>Current / Last Reported</span>
                        <ArrowDown className="w-3 h-3" />
                      </span>
                    )}
                    {isUpcoming && index === currentIndex + 1 && (
                      <span className="text-[11px] font-semibold text-blue-400">
                        Next Station
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrival & Departure Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-800/50 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Arrival</span>
                    <span className="font-mono font-medium text-slate-200">
                      {isOrigin ? 'Source Station' : stop.scheduledArrival}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Departure</span>
                    <span className="font-mono font-medium text-slate-200">
                      {isDestination ? 'Terminates' : stop.scheduledDeparture}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Halt & Distance</span>
                    <span className="font-mono text-slate-300 text-[11px]">
                      {stop.haltMinutes > 0 ? `${stop.haltMinutes}m halt` : 'Start/End'} • {stop.distanceFromSourceKm} km
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Running Status</span>
                    {isCompleted ? (
                      <span className="text-emerald-400 font-mono text-[11px]">Cleared on time</span>
                    ) : isCurrent ? (
                      <span className="text-amber-400 font-mono text-[11px] font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>+{delayMinutes}m delay</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">
                        Expected {delayMinutes > 0 ? `+${delayMinutes}m` : 'On time'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
