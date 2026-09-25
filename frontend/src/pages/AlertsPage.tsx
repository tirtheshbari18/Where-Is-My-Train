// frontend/src/pages/AlertsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  Shuffle,
  XCircle,
  Loader2,
  CheckCircle,
  Construction,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { alertService, RailwayAlert, PowerBlockNotice } from '../services/alertService.js';

export const AlertsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'blocks'>('alerts');
  const [alerts, setAlerts] = useState<RailwayAlert[]>([]);
  const [powerBlocks, setPowerBlocks] = useState<PowerBlockNotice[]>([]);
  const [selectedLine, setSelectedLine] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    setLoading(true);
    Promise.all([
      alertService.getAlerts(),
      alertService.getPowerBlocks(selectedLine),
    ])
      .then(([altData, blockData]) => {
        setAlerts(altData);
        setPowerBlocks(blockData);
      })
      .finally(() => setLoading(false));
  }, [selectedLine]);

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      alert('Browser notifications are not supported in this environment.');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      new Notification('Train Alerts Activated', {
        body: 'You will receive notifications for delays, platform updates, and mega blocks.',
        icon: '/train-icon.svg',
      });
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800';
      case 'WARNING':
        return 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'CANCELLATION':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'DIVERSION':
        return <Shuffle className="w-5 h-5 text-purple-500" />;
      case 'DELAY':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'PLATFORM_CHANGE':
        return <Layers className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Bell className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span>Railway Alerts & Mega Blocks</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time railway notices, platform changes, and Mumbai power blocks
          </p>
        </div>

        {/* Web Push Notification Toggle Button */}
        <div>
          {notificationPermission === 'granted' ? (
            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Browser Alerts Active</span>
            </div>
          ) : (
            <button
              onClick={requestNotificationPermission}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition active:scale-95"
            >
              <Bell className="w-4 h-4" />
              <span>Enable Push Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs: Alerts vs Power Blocks */}
      <div className="flex rounded-2xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black tracking-wide transition ${
            activeTab === 'alerts'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Railway Notices & Alerts ({alerts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('blocks')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black tracking-wide transition ${
            activeTab === 'blocks'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Construction className="w-4 h-4" />
          <span>Mumbai Power & Traffic Blocks ({powerBlocks.length})</span>
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-blue-600 dark:text-blue-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-bold">Fetching latest railway bulletins...</span>
        </div>
      )}

      {/* TAB 1: GENERAL RAILWAY ALERTS */}
      {!loading && activeTab === 'alerts' && (
        <div className="space-y-3.5">
          {alerts.map((alt) => (
            <div
              key={alt.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                    {getAlertIcon(alt.type)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                      {alt.title}
                    </h3>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Source: {alt.source}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border tracking-wider shrink-0 ${getSeverityBadge(
                    alt.severity
                  )}`}
                >
                  {alt.severity}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-11">
                {alt.description}
              </p>

              <div className="text-[10px] text-slate-400 dark:text-slate-500 pl-11 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                <span>Effective: {new Date(alt.effectiveFrom).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: SPECIAL TRAFFIC & POWER BLOCKS (Section 21) */}
      {!loading && activeTab === 'blocks' && (
        <div className="space-y-4">
          {/* Line Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Line:</span>
            {['All', 'Western', 'Central', 'Harbour'].map((line) => (
              <button
                key={line}
                onClick={() => setSelectedLine(line)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedLine === line
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                {line} Line
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {powerBlocks.map((block) => (
              <div
                key={block.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                {/* Block Header */}
                <div className="bg-amber-500/10 dark:bg-amber-950/30 border-b border-amber-500/20 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Construction className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-300">
                      {block.blockType} • {block.line} Line
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    {block.zone} Division
                  </span>
                </div>

                <div className="p-4 sm:p-5 space-y-3.5">
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    {block.title}
                  </h3>

                  {/* Timing & Affected Route Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Block Window</div>
                      <div className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        <span>{block.date}</span>
                      </div>
                      <div className="font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                        {block.timeWindow}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Affected Section</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span className="truncate">{block.affectedRoute}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stations affected */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                      Stations Affected:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {block.affectedStations.map((stn) => (
                        <span
                          key={stn}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] border border-slate-200 dark:border-slate-700"
                        >
                          {stn}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Alternative route / arrangements */}
                  <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 text-xs">
                    <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1 mb-1">
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Alternative Arrangements</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{block.alternateArrangements}</p>
                  </div>

                  {/* Notice details */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2">
                    {block.noticeDetails}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
