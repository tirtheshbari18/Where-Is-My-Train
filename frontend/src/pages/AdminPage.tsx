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
} from 'lucide-react';
import { railwayApi } from '../api/railwayApi.js';

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
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [currentPrimary, setCurrentPrimary] = useState('mock');
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [switching, setSwitching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const data = await railwayApi.getAdminProviders();
      setProviders(data.providers);
      setCurrentPrimary(data.currentPrimary);
      setCacheStats(data.cache);
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSwitchProvider = async (code: string) => {
    setSwitching(true);
    setMessage(null);
    try {
      const res = await railwayApi.setPrimaryProvider(code);
      setMessage(res.message);
      await fetchAdminData();
    } catch (err: any) {
      setMessage(`Failed to switch provider: ${err.message}`);
    } finally {
      setSwitching(false);
    }
  };

  const handleClearCache = async () => {
    try {
      const res = await railwayApi.clearCache();
      setMessage(res.message);
      await fetchAdminData();
    } catch (err: any) {
      setMessage(`Cache clear failed: ${err.message}`);
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <Shield className="w-7 h-7 text-amber-400" />
          <span>Railway Data Provider Orchestration & Admin Control</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor provider latencies, switch fallback priority, and inspect system cache performance.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs rounded-xl flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

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
            onClick={fetchAdminData}
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
  );
};
