import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  Shuffle,
  XCircle,
  Sparkles,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { railwayApi, TrainException } from '../api/railwayApi.js';

export const AlertsPage: React.FC = () => {
  const [exceptions, setExceptions] = useState<TrainException[]>([]);
  const [generalAlerts, setGeneralAlerts] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    Promise.all([
      railwayApi.getExceptions(selectedType),
      railwayApi.getGeneralAlerts(),
    ])
      .then(([exc, gen]) => {
        setExceptions(exc);
        setGeneralAlerts(gen);
      })
      .finally(() => setLoading(false));
  }, [selectedType]);

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      alert('Web Push Notifications are not supported in this browser environment.');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      new Notification('Where Is My Train Notifications Activated', {
        body: 'You will receive legitimate Indian Railways journey and delay alerts.',
        icon: '/train-icon.svg',
      });
    }
  };

  const getExceptionIcon = (type: string) => {
    switch (type) {
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'DIVERTED':
        return <Shuffle className="w-5 h-5 text-purple-400" />;
      case 'RESCHEDULED':
        return <Clock className="w-5 h-5 text-amber-400" />;
      case 'SPECIAL':
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Bell className="w-7 h-7 text-amber-400" />
            <span>Railway Alerts & Train Bulletins</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Authoritative notifications regarding cancellations, diversions, reschedule notices, and mega blocks.
          </p>
        </div>

        {/* Web Push Notification Toggle Button */}
        <div>
          {notificationPermission === 'granted' ? (
            <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-3.5 py-2 rounded-xl text-xs font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>Browser Alerts Active</span>
            </div>
          ) : (
            <button
              onClick={requestNotificationPermission}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition"
            >
              <Bell className="w-4 h-4" />
              <span>Enable Browser Train Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* General Operations Bulletins */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {generalAlerts.map((alert) => (
          <div
            key={alert.id}
            className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2"
          >
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>{alert.type}</span>
            </div>
            <h4 className="text-sm font-bold text-white">{alert.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {alert.description}
            </p>
          </div>
        ))}
      </div>

      {/* Exception Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {['ALL', 'CANCELLED', 'DIVERTED', 'RESCHEDULED', 'SPECIAL'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedType(cat)}
            className={`px-3.5 py-2 rounded-xl transition ${
              selectedType === cat
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat} Trains
          </button>
        ))}
      </div>

      {/* Exceptions List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-amber-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-semibold">Loading official railway notices...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {exceptions.map((exc) => (
            <div
              key={`${exc.trainNumber}_${exc.exceptionType}`}
              className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                    {getExceptionIcon(exc.exceptionType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {exc.trainNumber}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-white border border-slate-700">
                        {exc.exceptionType}
                      </span>
                      <span className="text-xs text-slate-400">
                        Effective: {exc.effectiveDate}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mt-1">
                      {exc.trainName}
                    </h3>

                    <div className="text-xs text-slate-400 mt-0.5">
                      {exc.sourceName} ({exc.sourceCode}) ➔ {exc.destName} ({exc.destCode})
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason & Diversion Route Details */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs space-y-1.5">
                <div>
                  <span className="text-slate-400">Reason: </span>
                  <span className="text-slate-200 font-medium">{exc.reason}</span>
                </div>
                {exc.divertedRoute && (
                  <div className="text-purple-300 font-mono text-[11px] bg-purple-950/30 p-2 rounded-lg border border-purple-500/30">
                    🔀 {exc.divertedRoute}
                  </div>
                )}
                {exc.rescheduledTime && (
                  <div className="text-amber-300 font-mono text-[11px] bg-amber-950/30 p-2 rounded-lg border border-amber-500/30">
                    ⏰ {exc.rescheduledTime}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
