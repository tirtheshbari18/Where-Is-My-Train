import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  WifiOff,
  Bell,
  Info,
  Sun,
  Moon,
  Globe,
  RefreshCw,
  Volume2,
  VolumeX,
  ChevronRight,
  CheckCircle,
  Database,
  Trash2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.js';
import { useTranslation } from '../context/LanguageContext.js';
import { timetableService } from '../services/timetableService.js';


type RefreshInterval = '15' | '30' | '60' | '120';
type DataProvider = 'mock' | 'live';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale } = useTranslation();

  const [autoRefreshSecs, setAutoRefreshSecs] = useState<RefreshInterval>('30');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [platformAlerts, setPlatformAlerts] = useState(true);
  const [delayAlerts, setDelayAlerts] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [showLoco, setShowLoco] = useState(true);
  const [dataProvider, setDataProvider] = useState<DataProvider>('mock');
  const [notifPermission, setNotifPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [clearConfirm, setClearConfirm] = useState(false);
  const [saveDone, setSaveDone] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    // Load saved settings from localStorage
    const saved = localStorage.getItem('wimt_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.autoRefreshSecs) setAutoRefreshSecs(parsed.autoRefreshSecs);
        if (parsed.soundEnabled !== undefined) setSoundEnabled(parsed.soundEnabled);
        if (parsed.platformAlerts !== undefined) setPlatformAlerts(parsed.platformAlerts);
        if (parsed.delayAlerts !== undefined) setDelayAlerts(parsed.delayAlerts);
        if (parsed.compactView !== undefined) setCompactView(parsed.compactView);
        if (parsed.showLoco !== undefined) setShowLoco(parsed.showLoco);
        if (parsed.dataProvider) setDataProvider(parsed.dataProvider);
      } catch {}
    }
    setLastUpdated(timetableService.getLastUpdatedText());
  }, []);

  const handleSaveSettings = () => {
    const settings = {
      autoRefreshSecs, soundEnabled, platformAlerts,
      delayAlerts, compactView, showLoco, dataProvider,
    };
    localStorage.setItem('wimt_settings', JSON.stringify(settings));
    setSaveDone(true);
    setTimeout(() => setSaveDone(false), 2500);
  };

  const handleClearCache = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 4000);
      return;
    }
    // Clear all cached data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('wimt_') || key.startsWith('offline_') || key.startsWith('train_')) {
        localStorage.removeItem(key);
      }
    });
    if ('caches' in window) {
      caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
    }
    setClearConfirm(false);
    alert('Cache cleared successfully. App data refreshed.');
  };

  const requestNotifPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      new Notification('Where Is My Train Alerts Enabled', {
        body: 'You will receive live delay and platform change notifications.',
        icon: '/train-icon.svg',
      });
    }
  };

  const handleUpdateTimetable = async () => {
    setUpdateLoading(true);
    await timetableService.updateTimetable(() => {});
    setUpdateLoading(false);
    setLastUpdated(timetableService.getLastUpdatedText());
  };

  const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void; id: string }> = ({ value, onChange, id }) => (
    <button
      id={id}
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        value ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
          value ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );

  const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );

  const SettingRow: React.FC<{
    label: string;
    description?: string;
    children: React.ReactNode;
    id?: string;
  }> = ({ label, description, children, id }) => (
    <div className="flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition -mx-1">
      <div className="flex-1 pr-4">
        <label htmlFor={id} className="text-sm font-semibold text-slate-800 dark:text-slate-100 cursor-pointer">{label}</label>
        {description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          <span>Settings</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Customize app behaviour, notifications, and display preferences
        </p>
      </div>

      {/* SECTION: Appearance */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <SectionHeader
          icon={<Sun className="w-4 h-4 text-amber-500" />}
          title="Appearance"
          subtitle="Theme and display preferences"
        />
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 -mx-1">
          <SettingRow
            label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            description="Toggle between dark and light theme"
            id="theme-toggle"
          >
            <button
              id="theme-toggle"
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                theme === 'dark'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                  : 'bg-slate-900 text-slate-100 border-slate-700'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </SettingRow>

          <SettingRow
            label="Compact View"
            description="Show condensed train cards with less whitespace"
            id="compact-view"
          >
            <Toggle id="compact-view" value={compactView} onChange={setCompactView} />
          </SettingRow>

          <SettingRow
            label="Show Loco / Engine Details"
            description="Display locomotive type and number in train status"
            id="show-loco"
          >
            <Toggle id="show-loco" value={showLoco} onChange={setShowLoco} />
          </SettingRow>
        </div>
      </div>

      {/* SECTION: Language */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <SectionHeader
          icon={<Globe className="w-4 h-4 text-indigo-500" />}
          title="Language"
          subtitle="Interface language for station and train names"
        />
        <div className="grid grid-cols-3 gap-2">
          {[
            { code: 'en', label: 'English', native: 'English' },
            { code: 'hi', label: 'Hindi', native: 'हिंदी' },
            { code: 'mr', label: 'Marathi', native: 'मराठी' },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLocale(lang.code as any)}
              className={`py-2.5 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-0.5 ${
                locale === lang.code
                  ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-base">{lang.native}</span>
              <span className="text-[10px] opacity-80">{lang.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION: Live Data & Refresh */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <SectionHeader
          icon={<RefreshCw className="w-4 h-4 text-blue-500" />}
          title="Live Data & Refresh"
          subtitle="Control how often the app polls for live status"
        />
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 -mx-1">
          <SettingRow
            label="Auto-Refresh Interval"
            description="How often the station board auto-refreshes"
            id="refresh-interval"
          >
            <select
              id="refresh-interval"
              value={autoRefreshSecs}
              onChange={(e) => setAutoRefreshSecs(e.target.value as RefreshInterval)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="15">Every 15 seconds</option>
              <option value="30">Every 30 seconds</option>
              <option value="60">Every 1 minute</option>
              <option value="120">Every 2 minutes</option>
            </select>
          </SettingRow>

          <SettingRow
            label="Data Provider Mode"
            description="Mock mode uses realistic simulated data; Live requires an API key"
            id="data-provider"
          >
            <select
              id="data-provider"
              value={dataProvider}
              onChange={(e) => setDataProvider(e.target.value as DataProvider)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="mock">Mock (Sandbox)</option>
              <option value="live">Live API (requires key)</option>
            </select>
          </SettingRow>

          <div className="py-3.5 px-4 -mx-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Offline Timetable</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{lastUpdated}</div>
              </div>
              <button
                onClick={handleUpdateTimetable}
                disabled={updateLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 text-xs font-bold transition hover:bg-blue-100 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${updateLoading ? 'animate-spin' : ''}`} />
                {updateLoading ? 'Updating...' : 'Update Now'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: Notifications & Alerts */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <SectionHeader
          icon={<Bell className="w-4 h-4 text-amber-500" />}
          title="Notifications & Alerts"
          subtitle="Choose what alerts you receive"
        />
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 -mx-1">
          {/* Browser Notification Permission */}
          <div className="py-3.5 px-4 -mx-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Browser Push Notifications</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {notifPermission === 'granted'
                    ? '✅ Push alerts are active'
                    : notifPermission === 'denied'
                    ? '❌ Blocked — enable in browser settings'
                    : 'Allow alerts for delay and platform updates'}
                </div>
              </div>
              {notifPermission === 'granted' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Active
                </div>
              ) : (
                <button
                  onClick={requestNotifPermission}
                  disabled={notifPermission === 'denied'}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {notifPermission === 'denied' ? 'Blocked' : 'Enable'}
                </button>
              )}
            </div>
          </div>

          <SettingRow
            label="Delay Alerts"
            description="Notify when your tracked train is significantly delayed"
            id="delay-alerts"
          >
            <Toggle id="delay-alerts" value={delayAlerts} onChange={setDelayAlerts} />
          </SettingRow>

          <SettingRow
            label="Platform Change Alerts"
            description="Alert when a train's platform has changed at your station"
            id="platform-alerts"
          >
            <Toggle id="platform-alerts" value={platformAlerts} onChange={setPlatformAlerts} />
          </SettingRow>

          <SettingRow
            label="Audio Chime for Approaching Stop"
            description="Play a chime when your destination station is approaching (within 10 km)"
            id="sound-enabled"
          >
            <div className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-blue-500" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
              <Toggle id="sound-enabled" value={soundEnabled} onChange={setSoundEnabled} />
            </div>
          </SettingRow>
        </div>
      </div>

      {/* SECTION: Offline & PWA */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <SectionHeader
          icon={<WifiOff className="w-4 h-4 text-blue-500" />}
          title="Offline & PWA"
          subtitle="Cache, service worker, and offline mode settings"
        />
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 -mx-1">
          <SettingRow
            label="Offline Mode"
            description="When enabled, skips live API calls and only uses cached timetable data"
            id="offline-mode"
          >
            <Toggle id="offline-mode" value={offlineMode} onChange={setOfflineMode} />
          </SettingRow>

          <div className="py-3 px-4 -mx-1">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>
                <strong>CRITICAL RULE:</strong> Offline mode explicitly states "Offline — live status unavailable" and never falsely manufactures live train tracking data.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: Storage & Cache */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <SectionHeader
          icon={<Database className="w-4 h-4 text-slate-500" />}
          title="Storage & Cache"
          subtitle="Manage locally cached data"
        />
        <div className="space-y-2">
          <button
            onClick={handleClearCache}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition text-sm font-semibold border ${
              clearConfirm
                ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Trash2 className={`w-4 h-4 ${clearConfirm ? 'text-red-500' : 'text-slate-500'}`} />
              <span>{clearConfirm ? '⚠️ Tap again to confirm clear' : 'Clear App Cache & Local Data'}</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
        </div>
      </div>

      {/* SECTION: Data & Privacy */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <SectionHeader
          icon={<Shield className="w-4 h-4 text-emerald-500" />}
          title="Data Source & Privacy"
          subtitle="Transparency about data sources"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          This software is an original architecture implementing an adapter contract (
          <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px] font-mono">IRailwayDataProvider</code>
          ) that can switch between authorized NTES feeds, licensed APIs, and sandbox providers.
          Private APIs from Google Where Is My Train or m-Indicator are neither scraped nor reverse engineered.
        </p>
        <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span>App Version</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">v2.4.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Data Provider</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 uppercase">{dataProvider}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Platform</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">PWA + Web</span>
          </div>
        </div>
      </div>

      {/* Save Settings Button */}
      <button
        onClick={handleSaveSettings}
        className={`w-full py-4 rounded-2xl font-black text-sm tracking-wider uppercase shadow-lg transition active:scale-95 flex items-center justify-center gap-2 ${
          saveDone
            ? 'bg-emerald-600 text-white shadow-emerald-600/30'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
        }`}
      >
        {saveDone ? (
          <>
            <CheckCircle className="w-5 h-5" />
            <span>Settings Saved!</span>
          </>
        ) : (
          <>
            <SettingsIcon className="w-5 h-5" />
            <span>Save Settings</span>
          </>
        )}
      </button>

      <p className="text-center text-[11px] text-slate-400 dark:text-slate-600 pb-2">
        Where Is My Train v2.4.0 · Made for Indian Commuters
      </p>
    </div>
  );
};
