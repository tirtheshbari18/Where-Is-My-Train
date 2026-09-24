import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  delayMinutes: number;
  status?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const DelayBadge: React.FC<Props> = ({
  delayMinutes,
  status = 'RUNNING',
  size = 'md',
}) => {
  const isCancelled = status === 'CANCELLED';
  const isDiverted = status === 'DIVERTED';
  const isRescheduled = status === 'RESCHEDULED';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-semibold',
  };

  if (isCancelled) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 ${sizeClasses[size]}`}
      >
        <XCircle className="w-3.5 h-3.5" />
        <span>Cancelled</span>
      </span>
    );
  }

  if (isDiverted) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 ${sizeClasses[size]}`}
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Diverted</span>
      </span>
    );
  }

  if (isRescheduled) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 ${sizeClasses[size]}`}
      >
        <Clock className="w-3.5 h-3.5" />
        <span>Rescheduled</span>
      </span>
    );
  }

  if (delayMinutes <= 5) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium ${sizeClasses[size]}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Right Time</span>
      </span>
    );
  }

  if (delayMinutes <= 30) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium ${sizeClasses[size]}`}
      >
        <Clock className="w-3.5 h-3.5" />
        <span>+{delayMinutes}m Late</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-medium ${sizeClasses[size]}`}
    >
      <AlertTriangle className="w-3.5 h-3.5" />
      <span>+{delayMinutes}m Late</span>
    </span>
  );
};
