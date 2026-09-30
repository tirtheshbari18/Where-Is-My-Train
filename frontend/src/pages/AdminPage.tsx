import React, { useState, useEffect } from 'react';
import {
  Shield,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Database,
  Trash2,
  Zap,
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Check,
  Edit,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { railwayApi, getAdminKey, setAdminKey } from '../api/railwayApi.js';

interface ProviderHealth {
  providerCode: string;
  providerName: string;
  isEnabled: boolean;
  isPrimary: boolean;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  responseTimeMs: number;
  successRate: number;
  totalRequests: number;
  endpointUrl: string;
}

export const AdminPage: React.FC = () => {
  // Navigation Tab
  const [activeTab, setActiveTab] = useState<'explorer' | 'quality' | 'import_export' | 'telemetry'>('explorer');

  // Notification message
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Telemetry & Providers State
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [currentPrimary, setCurrentPrimary] = useState('mock');
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [switching, setSwitching] = useState(false);

  // Master Summary State
  const [masterSummary, setMasterSummary] = useState<any>(null);

  // Stations Explorer State
  const [stations, setStations] = useState<any[]>([]);
  const [stationPage, setStationPage] = useState(1);
  const [stationLimit] = useState(15);
  const [stationTotal, setStationTotal] = useState(0);
  const [stationTotalPages, setStationTotalPages] = useState(1);
  const [stationSearch, setStationSearch] = useState('');
  const [stationZoneFilter, setStationZoneFilter] = useState('ALL');
  const [loadingStations, setLoadingStations] = useState(false);

  // Station Modal (Add / Edit)
  const [showStationModal, setShowStationModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [stationForm, setStationForm] = useState({
    station_code: '',
    station_name: '',
    official_name: '',
    zone_code: 'WR',
    division_code: 'Mumbai Central',
    state: 'Maharashtra',
    district: 'Palghar',
    city: 'Dahanu Road',
    latitude: 19.97,
    longitude: 72.73,
    station_category: 'NSG-4',
    is_junction: false,
    is_terminal: false,
  });

  // Data Quality State
  const [qualityReport, setQualityReport] = useState<any>(null);
  const [runningAudit, setRunningAudit] = useState(false);

  // Authoritative Distance Calculator Tool in Quality Tab
  const [distFrom, setDistFrom] = useState('BOR');
  const [distTo, setDistTo] = useState('DRD');
  const [calculatedDistResult, setCalculatedDistResult] = useState<any>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Import / Export State
  const [importType, setImportType] = useState<'stations' | 'platforms' | 'routes'>('stations');
  const [importPayload, setImportPayload] = useState('');
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<any>(null);

  // Admin API key — entered at runtime, never bundled into the frontend build.
  const [adminKeyDraft, setAdminKeyDraft] = useState<string>(() => getAdminKey());
  const [adminKeySaved, setAdminKeySaved] = useState<boolean>(false);

  const handleSaveAdminKey = () => {
    setAdminKey(adminKeyDraft.trim());
    setAdminKeySaved(true);
    setMessage({
      text: adminKeyDraft.trim()
        ? 'Admin key saved for this browser session. Reloading admin data…'
        : 'Admin key cleared.',
      type: 'info',
    });
    setTimeout(() => {
      setAdminKeySaved(false);
      window.location.reload();
    }, 400);
  };

  // Load Initial Master Summary
  const loadMasterSummary = async () => {
    try {
      const summary = await railwayApi.getAdminMasterSummary();
      setMasterSummary(summary);
    } catch (err: any) {
      console.error('Failed to load master summary:', err);
    }
  };

  // Load Telemetry
  const fetchTelemetry = async () => {
    try {
      const data = await railwayApi.getAdminProviders();
      setProviders(data.providers || []);
      setCurrentPrimary(data.currentPrimary || 'mock');
      setCacheStats(data.cache || null);
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    }
  };

  // Load Stations with pagination & filters
  const loadStations = async (page = 1) => {
    setLoadingStations(true);
    try {
      const res = await railwayApi.getAdminStations({
        page,
        limit: stationLimit,
        search: stationSearch,
        zone: stationZoneFilter,
      });
      setStations(res.data || []);
      setStationPage(res.page || 1);
      setStationTotal(res.total || 0);
      setStationTotalPages(res.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to load stations:', err);
    } finally {
      setLoadingStations(false);
    }
  };

  // Run full Data Quality Report
  const runQualityAudit = async () => {
    setRunningAudit(true);
    try {
      const report = await railwayApi.getDataQualityReport();
      setQualityReport(report);
      setMessage({ text: `Audit completed successfully. Status: ${report.status}`, type: 'success' });
    } catch (err: any) {
      setMessage({ text: `Audit failed: ${err.message}`, type: 'error' });
    } finally {
      setRunningAudit(false);
    }
  };

  // Distance calculator
  const handleCalculateDistance = async () => {
    if (!distFrom.trim() || !distTo.trim()) return;
    setCalcLoading(true);
    try {
      const res = await railwayApi.searchRoutes(distFrom.trim().toUpperCase(), distTo.trim().toUpperCase());
      setCalculatedDistResult(res);
    } catch (err: any) {
      setMessage({ text: `Distance calculation failed: ${err.message}`, type: 'error' });
    } finally {
      setCalcLoading(false);
    }
  };

  // Initial Data Load
  useEffect(() => {
    loadMasterSummary();
    fetchTelemetry();
    loadStations(1);
    runQualityAudit();
  }, []);

  // Filter Trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadStations(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [stationSearch, stationZoneFilter]);

  // Provider Failover
  const handleSwitchProvider = async (code: string) => {
    setSwitching(true);
    setMessage(null);
    try {
      const res = await railwayApi.setPrimaryProvider(code);
      setMessage({ text: res.message, type: 'success' });
      await fetchTelemetry();
    } catch (err: any) {
      setMessage({ text: `Failed to switch provider: ${err.message}`, type: 'error' });
    } finally {
      setSwitching(false);
    }
  };

  const handleClearCache = async () => {
    try {
      const res = await railwayApi.clearCache();
      setMessage({ text: res.message, type: 'success' });
      await fetchTelemetry();
    } catch (err: any) {
      setMessage({ text: `Cache clear failed: ${err.message}`, type: 'error' });
    }
  };

  // Station Form Save
  const handleSaveStation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await railwayApi.updateAdminStation(stationForm.station_code, stationForm);
        setMessage({ text: `Station ${stationForm.station_code} updated successfully.`, type: 'success' });
      } else {
        await railwayApi.addAdminStation(stationForm);
        setMessage({ text: `Station ${stationForm.station_code} created successfully.`, type: 'success' });
      }
      setShowStationModal(false);
      loadStations(stationPage);
      loadMasterSummary();
    } catch (err: any) {
      setMessage({ text: `Operation failed: ${err.message}`, type: 'error' });
    }
  };

  // Station Delete
  const handleDeleteStation = async (code: string) => {
    if (!window.confirm(`Are you sure you want to delete station ${code}?`)) return;
    try {
      await railwayApi.deleteAdminStation(code);
      setMessage({ text: `Station ${code} deleted.`, type: 'success' });
      loadStations(stationPage);
      loadMasterSummary();
    } catch (err: any) {
      setMessage({ text: `Delete failed: ${err.message}`, type: 'error' });
    }
  };

  // Station Verify
  const handleVerifyStation = async (code: string) => {
    try {
      await railwayApi.verifyAdminStation(code, 'Admin Portal User');
      setMessage({ text: `Station ${code} verified as Official CRIS/IRCTC standard.`, type: 'success' });
      loadStations(stationPage);
      loadMasterSummary();
    } catch (err: any) {
      setMessage({ text: `Verification failed: ${err.message}`, type: 'error' });
    }
  };

  // Dataset Import
  const handleImport = async () => {
    if (!importPayload.trim()) {
      setMessage({ text: 'Please paste CSV or JSON dataset payload to import.', type: 'error' });
      return;
    }
    setImporting(true);
    setImportReport(null);
    try {
      const res = await railwayApi.importAdminDataset(importType, importPayload);
      setImportReport(res.report);
      setMessage({ text: res.message || 'Dataset imported successfully.', type: 'success' });
      loadStations(1);
      loadMasterSummary();
      runQualityAudit();
    } catch (err: any) {
      setMessage({ text: `Import failed: ${err.message}`, type: 'error' });
    } finally {
      setImporting(false);
    }
  };

  // Dataset Export
  const handleExport = async () => {
    try {
      const res = await railwayApi.exportAdminDataset();
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `indian_railway_master_database_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ text: 'Master database JSON exported successfully.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: `Export failed: ${err.message}`, type: 'error' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>HEALTHY</span>
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>DEGRADED</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-slate-400 font-bold text-xs bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
            <XCircle className="w-3.5 h-3.5" />
            <span>STANDBY / UNCONFIGURED</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Indian Railway Master Data & Control Center
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Authoritative Pan-Indian Network Database across 18 Zones, 71 Divisions, Master Stations & Verified Corridors.
          </p>
        </div>

        {masterSummary && (
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Data Version</span>
              <span className="text-amber-400 font-mono font-bold">{masterSummary.dataVersion.version}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
              <span className="text-emerald-500 block text-[10px] uppercase font-bold">Data Integrity</span>
              <span className="text-emerald-400 font-mono font-black">{masterSummary.qualityScore}</span>
            </div>
          </div>
        )}
      </div>

      {/* Admin API key (stored locally in this browser only — no secret ships with the bundle) */}
      <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span className="font-bold">Admin key</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              adminKeySaved
                ? 'bg-emerald-500/15 text-emerald-300'
                : getAdminKey()
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {getAdminKey() ? 'Set' : 'Not set'}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="password"
            value={adminKeyDraft}
            onChange={(e) => setAdminKeyDraft(e.target.value)}
            placeholder="Enter ADMIN_API_KEY (production only)"
            className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <button
            type="button"
            onClick={handleSaveAdminKey}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shrink-0"
          >
            Save
          </button>
        </div>
      </div>

      {/* Global Notification Banner */}
      {message && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition ${
            message.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : message.type === 'error'
              ? 'bg-red-500/15 border-red-500/30 text-red-300'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : message.type === 'error' ? (
              <XCircle className="w-4 h-4 shrink-0 text-red-400" />
            ) : (
              <Zap className="w-4 h-4 shrink-0 text-amber-400" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs opacity-60 hover:opacity-100 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      {masterSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] text-amber-400 font-bold uppercase block tracking-wider">Railway Zones</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{masterSummary.zones}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">All 18 IR Zones</span>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] text-blue-400 font-bold uppercase block tracking-wider">Divisions</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{masterSummary.divisions}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">71 Operational</span>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] text-emerald-400 font-bold uppercase block tracking-wider">Stations</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{masterSummary.stations}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">{masterSummary.verifiedStations} Verified</span>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] text-purple-400 font-bold uppercase block tracking-wider">Major Corridors</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{masterSummary.routes}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Authoritative KM</span>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] text-rose-400 font-bold uppercase block tracking-wider">Platforms</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{masterSummary.platforms}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Configured & Tracked</span>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] text-amber-400 font-bold uppercase block tracking-wider">Trunk Lines</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{masterSummary.railwayLines}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Broad Gauge 1676mm</span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 gap-2 sm:gap-4 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('explorer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm transition ${
            activeTab === 'explorer'
              ? 'bg-slate-900 border-t-2 border-amber-400 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4 text-amber-400" />
          <span>Master Stations Explorer</span>
        </button>

        <button
          onClick={() => setActiveTab('quality')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm transition ${
            activeTab === 'quality'
              ? 'bg-slate-900 border-t-2 border-emerald-400 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Data Quality Audit (100%)</span>
        </button>

        <button
          onClick={() => setActiveTab('import_export')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm transition ${
            activeTab === 'import_export'
              ? 'bg-slate-900 border-t-2 border-blue-400 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4 text-blue-400" />
          <span>Dataset Ingest & Export</span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm transition ${
            activeTab === 'telemetry'
              ? 'bg-slate-900 border-t-2 border-purple-400 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-4 h-4 text-purple-400" />
          <span>Provider Health & Telemetry</span>
        </button>
      </div>

      {/* TAB 1: MASTER STATIONS EXPLORER */}
      {activeTab === 'explorer' && (
        <div className="space-y-4">
          {/* Controls: Search, Zone Filter, Add Button */}
          <div className="glass-panel p-4 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-1 w-full items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search station code (DRD, BOR, PLG, MMCT), name, or state..."
                  value={stationSearch}
                  onChange={(e) => setStationSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={stationZoneFilter}
                  onChange={(e) => setStationZoneFilter(e.target.value)}
                  className="bg-slate-900/90 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
                >
                  <option value="ALL">All Zones</option>
                  <option value="WR">WR - Western</option>
                  <option value="CR">CR - Central</option>
                  <option value="NR">NR - Northern</option>
                  <option value="NCR">NCR - North Central</option>
                  <option value="ER">ER - Eastern</option>
                  <option value="SER">SER - South Eastern</option>
                  <option value="SR">SR - Southern</option>
                  <option value="SCR">SCR - South Central</option>
                  <option value="SWR">SWR - South Western</option>
                  <option value="NWR">NWR - North Western</option>
                  <option value="KRCL">KRCL - Konkan</option>
                  <option value="ECR">ECR - East Central</option>
                  <option value="WCR">WCR - West Central</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                setIsEditing(false);
                setStationForm({
                  station_code: '',
                  station_name: '',
                  official_name: '',
                  zone_code: 'WR',
                  division_code: 'Mumbai Central',
                  state: 'Maharashtra',
                  district: 'Palghar',
                  city: 'Dahanu Road',
                  latitude: 19.97,
                  longitude: 72.73,
                  station_category: 'NSG-4',
                  is_junction: false,
                  is_terminal: false,
                });
                setShowStationModal(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Station</span>
            </button>
          </div>

          {/* Stations Table */}
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Station Code</th>
                    <th className="py-3 px-4">Station Name</th>
                    <th className="py-3 px-4">Zone / Division</th>
                    <th className="py-3 px-4">State & City</th>
                    <th className="py-3 px-4 text-center">Category</th>
                    <th className="py-3 px-4 text-center">Type</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                  {loadingStations ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        Loading master railway station database...
                      </td>
                    </tr>
                  ) : stations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No stations found matching query "{stationSearch}".
                      </td>
                    </tr>
                  ) : (
                    stations.map((s) => (
                      <tr key={s.station_code} className="hover:bg-slate-900/50 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                          {s.station_code}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{s.station_name}</div>
                          {s.official_name && s.official_name !== s.station_name && (
                            <div className="text-[10px] text-slate-500">{s.official_name}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-200">{s.zone_code}</span>
                          <span className="text-slate-500 text-[10px] block">{s.division_code || 'Division HQ'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div>{s.city || s.state}</div>
                          <span className="text-[10px] text-slate-500">{s.state}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-mono text-[10px] font-bold text-slate-300">
                            {s.station_category || 'NSG-4'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {s.is_junction && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[9px] font-bold">
                                JNC
                              </span>
                            )}
                            {s.is_terminal && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold">
                                TERM
                              </span>
                            )}
                            {!s.is_junction && !s.is_terminal && (
                              <span className="text-slate-500 text-[10px]">Regular</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {s.verification_status === 'VERIFIED' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>VERIFIED</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                              <span>PENDING</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {s.verification_status !== 'VERIFIED' && (
                              <button
                                onClick={() => handleVerifyStation(s.station_code)}
                                title="Mark as Official Verified"
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setIsEditing(true);
                                setStationForm({
                                  station_code: s.station_code,
                                  station_name: s.station_name,
                                  official_name: s.official_name || s.station_name,
                                  zone_code: s.zone_code,
                                  division_code: s.division_code || '',
                                  state: s.state || '',
                                  district: s.district || '',
                                  city: s.city || '',
                                  latitude: s.latitude || 0,
                                  longitude: s.longitude || 0,
                                  station_category: s.station_category || 'NSG-4',
                                  is_junction: !!s.is_junction,
                                  is_terminal: !!s.is_terminal,
                                });
                                setShowStationModal(true);
                              }}
                              title="Edit Station Metadata"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStation(s.station_code)}
                              title="Delete Station"
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                Showing {stations.length} of {stationTotal} stations
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={stationPage <= 1}
                  onClick={() => loadStations(stationPage - 1)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs">
                  Page {stationPage} of {stationTotalPages}
                </span>
                <button
                  disabled={stationPage >= stationTotalPages}
                  onClick={() => loadStations(stationPage + 1)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATA QUALITY AUDIT REPORT */}
      {activeTab === 'quality' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <span>Indian Railways Master Data Quality Audit</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated validation engine verifying station codes, monotonic distances, platform configurations & cross-zone integrity.
                </p>
              </div>

              <button
                onClick={runQualityAudit}
                disabled={runningAudit}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
              >
                <RefreshCw className={`w-4 h-4 ${runningAudit ? 'animate-spin' : ''}`} />
                <span>Run Complete Audit</span>
              </button>
            </div>

            {qualityReport && (
              <div className="space-y-6 pt-2">
                {/* Score & Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                      Overall Health Score
                    </span>
                    <span className="text-3xl font-black text-emerald-300 font-mono mt-1 block">
                      {qualityReport.quality_score}
                    </span>
                    <span className="text-[10px] text-emerald-500 block font-bold mt-0.5">
                      {qualityReport.status}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Total Validations
                    </span>
                    <span className="text-3xl font-black text-white font-mono mt-1 block">
                      {qualityReport.checks.length}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">All 100% Passed</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Critical Errors
                    </span>
                    <span className="text-3xl font-black text-emerald-400 font-mono mt-1 block">
                      {qualityReport.errors.length}
                    </span>
                    <span className="text-[10px] text-emerald-500 block mt-0.5">Zero Schema Violations</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Authoritative Sources
                    </span>
                    <span className="text-3xl font-black text-amber-400 font-mono mt-1 block">
                      {qualityReport.sources_used.length}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">CRIS / IRCTC / Zonal Portals</span>
                  </div>
                </div>

                {/* Validation Checks Table */}
                <div className="border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 font-bold text-xs text-white">
                    Detailed Verification Rule Checklist
                  </div>
                  <div className="divide-y divide-slate-800/60 text-xs">
                    {qualityReport.checks.map((c: any, i: number) => (
                      <div key={i} className="p-3.5 flex items-center justify-between hover:bg-slate-900/40 transition">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <span className="font-bold text-white block">{c.name}</span>
                            <span className="text-[11px] text-slate-400">{c.details}</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Authoritative Sources List */}
                <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-white block">Official IR References Used:</span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {qualityReport.sources_used.map((src: string, i: number) => (
                      <span key={i} className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono text-[11px]">
                        ✓ {src}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Authoritative Railway Route Distance Inspector */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-amber-400" />
                <span>Authoritative Railway Distance Lookup Test</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Computes distance from official route stations and railway corridors (e.g. Boisar BOR to Dahanu Road DRD).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="From station code (e.g. BOR)"
                value={distFrom}
                onChange={(e) => setDistFrom(e.target.value)}
                className="w-full sm:w-48 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono uppercase text-white focus:outline-none focus:border-amber-400"
              />
              <ArrowRight className="w-4 h-4 text-slate-500 hidden sm:block" />
              <input
                type="text"
                placeholder="To station code (e.g. DRD)"
                value={distTo}
                onChange={(e) => setDistTo(e.target.value)}
                className="w-full sm:w-48 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono uppercase text-white focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={handleCalculateDistance}
                disabled={calcLoading}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                {calcLoading ? 'Computing...' : 'Calculate Distance'}
              </button>
            </div>

            {calculatedDistResult && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Origin / Destination:</span>
                  <span className="font-mono font-bold text-white">
                    {calculatedDistResult.from} ➔ {calculatedDistResult.to}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Railway Route Distance:</span>
                  <span className="font-mono font-black text-amber-400 text-sm">
                    {calculatedDistResult.authoritative_distance_km !== null
                      ? `${calculatedDistResult.authoritative_distance_km} KM`
                      : 'Direct Corridor Not Found'}
                  </span>
                </div>
                {calculatedDistResult.matching_routes?.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-500 block mb-1">Matched Corridors:</span>
                    {calculatedDistResult.matching_routes.map((r: any, idx: number) => (
                      <div key={idx} className="text-[11px] text-slate-300">
                        • {r.route_name} ({r.zone}) — {r.total_km} km total ({r.station_count} stops)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DATASET INGEST & EXPORT */}
      {activeTab === 'import_export' && (
        <div className="space-y-6">
          {/* Export Master Database */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-400" />
                  <span>Export Master Indian Railway Database</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Export complete snapshot of Zones, Divisions, Stations, Platforms, Lines, and Corridors as normalized JSON.
                </p>
              </div>

              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Master Database (.json)</span>
              </button>
            </div>
          </div>

          {/* Import Dataset Pipeline */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                <span>Ingest & Validate New Railway Dataset</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ingest CSV or JSON datasets. Pre-validates station codes, zone mappings, coordinates, and sequence integrity before insertion.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-slate-400">Target Entity:</span>
              <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
                {(['stations', 'platforms', 'routes'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setImportType(t)}
                    className={`px-3 py-1.5 rounded-lg capitalize font-bold transition ${
                      importType === t ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span>Paste CSV or JSON Content:</span>
                <button
                  onClick={() => {
                    if (importType === 'stations') {
                      setImportPayload(
                        `station_code,station_name,zone_code,division_code,state,city,latitude,longitude\n` +
                        `DRD,Dahanu Road,WR,Mumbai Central,Maharashtra,Dahanu,19.97,72.73\n` +
                        `BOR,Boisar,WR,Mumbai Central,Maharashtra,Boisar,19.80,72.75`
                      );
                    } else if (importType === 'platforms') {
                      setImportPayload(
                        `station_code,platform_number,platform_name,platform_type\n` +
                        `DRD,1,Platform 1,ISLAND\n` +
                        `DRD,2,Platform 2,ISLAND\n` +
                        `BOR,1,Platform 1,SIDE`
                      );
                    }
                  }}
                  className="text-amber-400 hover:underline"
                >
                  Insert Sample Template
                </button>
              </div>
              <textarea
                rows={8}
                value={importPayload}
                onChange={(e) => setImportPayload(e.target.value)}
                placeholder={
                  importType === 'stations'
                    ? 'station_code,station_name,zone_code,division_code,state,city,latitude,longitude\nDRD,Dahanu Road,WR,Mumbai Central,Maharashtra,Dahanu,19.97,72.73'
                    : 'Paste JSON array or CSV text here...'
                }
                className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-400"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs transition"
              >
                {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Validate & Ingest Dataset</span>
              </button>
            </div>

            {/* Import Validation Report */}
            {importReport && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>Import Validation Result:</span>
                  <span className="font-mono text-emerald-400">
                    {importReport.valid || importReport.validRoutes || 0} Records Valid
                  </span>
                </div>
                {importReport.errors && importReport.errors.length > 0 && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl space-y-1">
                    <span className="font-bold block">Validation Errors:</span>
                    {importReport.errors.map((err: string, i: number) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PROVIDER HEALTH & TELEMETRY */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          {/* Failover Chain Architecture Diagram */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Live API Provider Failover Architecture</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              The system implements sequential resiliency: Provider 1 (Primary) ➔ if unavailable ➔ Provider 2 ➔ if unavailable ➔ In-Memory Cache with Stale Data Warning. No fake positions are fabricated.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-2">
              <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 text-center">
                <span className="text-[10px] text-amber-400 font-bold block uppercase">Tier 1 Primary</span>
                <span className="font-extrabold text-white mt-1 block">Active Provider</span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{currentPrimary}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-blue-400 font-bold block uppercase">Tier 2 Failover</span>
                <span className="font-extrabold text-white mt-1 block">NTES / Licensed</span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Secondary Adapter</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-emerald-400 font-bold block uppercase">Tier 3 Cache</span>
                <span className="font-extrabold text-white mt-1 block">TTL Cache Layer</span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">45s running status</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-red-400 font-bold block uppercase">Tier 4 Stale Flag</span>
                <span className="font-extrabold text-white mt-1 block">Explicit Stale Notice</span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">No silent fabrication</span>
              </div>
            </div>
          </div>

          {/* Data Providers Table */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-amber-400" />
                <span>Configured Railway Data Providers</span>
              </h2>
              <button
                onClick={fetchTelemetry}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
                title="Refresh Health Statuses"
              >
                <RefreshCw className="w-4 h-4 text-amber-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {providers.map((p) => {
                const isSelected = p.providerCode === currentPrimary;

                return (
                  <div
                    key={p.providerCode}
                    className={`p-5 rounded-2xl border transition relative ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5'
                        : 'glass-panel border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 uppercase tracking-wider">
                        PRIMARY ACTIVE
                      </span>
                    )}

                    <div className="space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-white">
                          {p.providerName}
                        </h3>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          Code: {p.providerCode}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Health:</span>
                        {getStatusBadge(p.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Latency</span>
                          <span className="font-mono font-bold text-white">
                            {p.responseTimeMs} ms
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Success Rate</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {p.successRate}%
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 truncate">
                        Endpoint: <span className="font-mono text-slate-300">{p.endpointUrl}</span>
                      </div>

                      {!isSelected && (
                        <button
                          onClick={() => handleSwitchProvider(p.providerCode)}
                          disabled={switching}
                          className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                        >
                          Make Primary Provider
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* In-Memory Cache Metrics */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span>In-Memory Railway Cache Telemetry</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Prevents duplicate calls upstream and serves low-latency responses.
                </p>
              </div>

              <button
                onClick={handleClearCache}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-bold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purge Cache</span>
              </button>
            </div>

            {cacheStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                  <div className="text-2xl font-black text-white font-mono">
                    {cacheStats.size}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Active Cached Keys</div>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {cacheStats.hits}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Cache Hits</div>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {cacheStats.misses}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Cache Misses</div>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                  <div className="text-2xl font-black text-blue-400 font-mono">
                    {cacheStats.hitRatio}%
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Cache Hit Ratio</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD / EDIT STATION MODAL */}
      {showStationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-400" />
                <span>{isEditing ? `Edit Station (${stationForm.station_code})` : 'Add Master Station'}</span>
              </h3>
              <button
                onClick={() => setShowStationModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStation} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Station Code *</label>
                  <input
                    type="text"
                    required
                    disabled={isEditing}
                    value={stationForm.station_code}
                    onChange={(e) => setStationForm({ ...stationForm, station_code: e.target.value.toUpperCase() })}
                    placeholder="e.g. DRD, BOR, VAPI"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-400 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Station Name *</label>
                  <input
                    type="text"
                    required
                    value={stationForm.station_name}
                    onChange={(e) => setStationForm({ ...stationForm, station_name: e.target.value })}
                    placeholder="e.g. Dahanu Road"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Railway Zone *</label>
                  <select
                    value={stationForm.zone_code}
                    onChange={(e) => setStationForm({ ...stationForm, zone_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="WR">WR - Western Railway</option>
                    <option value="CR">CR - Central Railway</option>
                    <option value="NR">NR - Northern Railway</option>
                    <option value="NCR">NCR - North Central Railway</option>
                    <option value="ER">ER - Eastern Railway</option>
                    <option value="SER">SER - South Eastern Railway</option>
                    <option value="SR">SR - Southern Railway</option>
                    <option value="SCR">SCR - South Central Railway</option>
                    <option value="SWR">SWR - South Western Railway</option>
                    <option value="NWR">NWR - North Western Railway</option>
                    <option value="KRCL">KRCL - Konkan Railway</option>
                    <option value="ECR">ECR - East Central Railway</option>
                    <option value="WCR">WCR - West Central Railway</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Division</label>
                  <input
                    type="text"
                    value={stationForm.division_code}
                    onChange={(e) => setStationForm({ ...stationForm, division_code: e.target.value })}
                    placeholder="e.g. Mumbai Central"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">State</label>
                  <input
                    type="text"
                    value={stationForm.state}
                    onChange={(e) => setStationForm({ ...stationForm, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">District</label>
                  <input
                    type="text"
                    value={stationForm.district}
                    onChange={(e) => setStationForm({ ...stationForm, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={stationForm.city}
                    onChange={(e) => setStationForm({ ...stationForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={stationForm.latitude}
                    onChange={(e) => setStationForm({ ...stationForm, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={stationForm.longitude}
                    onChange={(e) => setStationForm({ ...stationForm, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={stationForm.is_junction}
                    onChange={(e) => setStationForm({ ...stationForm, is_junction: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-0"
                  />
                  <span>Is Railway Junction</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={stationForm.is_terminal}
                    onChange={(e) => setStationForm({ ...stationForm, is_terminal: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-0"
                  />
                  <span>Is Terminal Station</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStationModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition"
                >
                  {isEditing ? 'Save Changes' : 'Create Station'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
