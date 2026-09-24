import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  WifiOff,
  Bell,
  Info,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [autoRefreshSecs, setAutoRefreshSecs] = useState('30');
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-amber-400" />
          <span>Platform Settings & Offline Capabilities</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure tracking preferences, notifications, and offline capabilities.
        </p>
      </div>

      <div className="space-y-4">
        {/* Refresh Interval Setting */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">Live Station Auto-Refresh Interval</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              How often station boards automatically poll for arrival and departure updates.
            </p>
          </div>
          <select
            value={autoRefreshSecs}
            onChange={(e) => setAutoRefreshSecs(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
          >
            <option value="15">Every 15 seconds</option>
            <option value="30">Every 30 seconds</option>
            <option value="60">Every 60 seconds</option>
          </select>
        </div>

        {/* Audio Signals */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Audio Chime for Approaching Stops</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Play subtle railway chime when train approaches within 10 km of your selected destination.
            </p>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-12 h-6 rounded-full p-1 transition ${
              soundEnabled ? 'bg-amber-500' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-slate-950 transition transform ${
                soundEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Offline Mode & PWA Rule */}
        <div className="glass-panel p-6 rounded-2xl border border-blue-500/30 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <WifiOff className="w-5 h-5 text-blue-400" />
            <span>Progressive Web App (PWA) & Offline Mode</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Where Is My Train caches app shells and static station/train directories for offline access during low-connectivity travel across railway tracks.
          </p>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-amber-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Crucial Rule:</strong> Offline mode explicitly states: <em>"Offline — live status unavailable"</em> and never falsely manufactures live train tracking.
            </span>
          </div>
        </div>

        {/* Legal & Architectural Disclosures */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>Data Source & Provider Adapter Guidelines</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            This software is an original architecture written from the ground up. It implements an adapter contract (<code>IRailwayDataProvider</code>) that can seamlessly switch between authorized NTES feeds, licensed APIs, and sandbox providers. Private APIs and assets from Google Where Is My Train or m-Indicator are neither scraped nor reverse engineered.
          </p>
        </div>
      </div>
    </div>
  );
};
