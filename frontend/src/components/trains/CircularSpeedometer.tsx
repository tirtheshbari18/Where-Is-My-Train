import React from 'react';
import { AlertCircle, Radio } from 'lucide-react';

export type SpeedMode = 'LIVE SPEED' | 'LAST KNOWN SPEED' | 'ESTIMATED SPEED' | 'UNAVAILABLE';

interface CircularSpeedometerProps {
  speedKmH: number | null;
  mode?: SpeedMode;
  maxSpeed?: number;
  className?: string;
}

export const CircularSpeedometer: React.FC<CircularSpeedometerProps> = ({
  speedKmH,
  mode = 'LIVE SPEED',
  maxSpeed = 160,
  className = '',
}) => {
  const isAvailable = speedKmH !== null && speedKmH !== undefined;
  const currentSpeed = isAvailable ? Math.max(0, Math.min(speedKmH, maxSpeed)) : 0;

  // Circular gauge geometry
  // Arc spans 240 degrees (from 150 deg to 390 deg / -30 deg)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (240 / 360);
  const strokeDashoffset = isAvailable
    ? arcLength - (currentSpeed / maxSpeed) * arcLength
    : arcLength;

  // Resolve badge color & label
  const getBadgeConfig = () => {
    if (!isAvailable || mode === 'UNAVAILABLE') {
      return {
        label: 'UNAVAILABLE',
        color: 'bg-slate-800 text-slate-400 border-slate-700',
        dotColor: 'bg-slate-500',
        textColor: 'text-slate-400',
        arcColor: '#64748b',
      };
    }
    switch (mode) {
      case 'LIVE SPEED':
        return {
          label: 'LIVE SPEED',
          color: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50',
          dotColor: 'bg-emerald-400 animate-ping',
          textColor: 'text-emerald-400',
          arcColor: '#10b981',
        };
      case 'LAST KNOWN SPEED':
        return {
          label: 'LAST KNOWN SPEED',
          color: 'bg-amber-950/80 text-amber-400 border-amber-500/50',
          dotColor: 'bg-amber-400',
          textColor: 'text-amber-400',
          arcColor: '#f59e0b',
        };
      case 'ESTIMATED SPEED':
        return {
          label: 'ESTIMATED SPEED',
          color: 'bg-blue-950/80 text-blue-400 border-blue-500/50',
          dotColor: 'bg-blue-400',
          textColor: 'text-blue-400',
          arcColor: '#3b82f6',
        };
      default:
        return {
          label: 'UNAVAILABLE',
          color: 'bg-slate-800 text-slate-400 border-slate-700',
          dotColor: 'bg-slate-500',
          textColor: 'text-slate-400',
          arcColor: '#64748b',
        };
    }
  };

  const badge = getBadgeConfig();

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl shadow-2xl text-center select-none ${className}`}
      role="region"
      aria-label="Train Speedometer"
    >
      {/* Top Header Badge */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${badge.color}`}
        >
          <span className={`w-2 h-2 rounded-full ${badge.dotColor}`} />
          {badge.label}
        </span>
      </div>

      {/* SVG Radial Gauge */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg
          className="w-full h-full transform -rotate-[210deg]"
          viewBox="0 0 180 180"
          aria-hidden="true"
        >
          {/* Background Track Arc */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth="12"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Active Speed Arc */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="transparent"
            stroke={badge.arcColor}
            strokeWidth="12"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{
              filter: isAvailable ? `drop-shadow(0 0 8px ${badge.arcColor}66)` : 'none',
            }}
          />
        </svg>

        {/* Center Speed Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {isAvailable ? (
            <>
              <span className="text-5xl font-black tracking-tight text-white font-mono drop-shadow-md">
                {Math.round(currentSpeed)}
              </span>
              <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 mt-0.5">
                km/h
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-1">
                CURRENT SPEED
              </span>
            </>
          ) : (
            <>
              <span className="text-4xl font-black text-slate-600 font-mono">--</span>
              <span className="text-xs uppercase font-bold text-slate-500 mt-1">km/h</span>
            </>
          )}
        </div>
      </div>

      {/* Footer Status / Disclaimer */}
      <div className="mt-1 min-h-[24px] px-2 text-center">
        {!isAvailable ? (
          <p className="text-xs text-amber-400/90 flex items-center justify-center gap-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Speed unavailable — waiting for live update</span>
          </p>
        ) : (
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
            <Radio className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Telemetry verified • Max {maxSpeed} km/h</span>
          </p>
        )}
      </div>
    </div>
  );
};
