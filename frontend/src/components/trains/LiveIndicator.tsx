import React from 'react';
import { MapPin, Navigation, Compass, Radio } from 'lucide-react';

interface Props {
  positionType: 'station' | 'gps' | 'estimated';
  lastReportedStationName?: string;
  className?: string;
}

export const LiveIndicator: React.FC<Props> = ({
  positionType,
  lastReportedStationName,
  className = '',
}) => {
  if (positionType === 'gps') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Navigation className="w-3.5 h-3.5" />
        <span>Live GPS Telemetry</span>
      </div>
    );
  }

  if (positionType === 'station') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-medium ${className}`}>
        <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
        <MapPin className="w-3.5 h-3.5 text-blue-400" />
        <span>
          Last Reported Station: {lastReportedStationName || 'Station Sensor'}
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-700/40 border border-slate-600/40 text-slate-300 text-xs font-medium ${className}`}>
      <Compass className="w-3.5 h-3.5 text-amber-400" />
      <span>Estimated Schedule Position</span>
    </div>
  );
};
