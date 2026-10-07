import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Building, Search } from 'lucide-react';
import { railwayApi } from '../api/railwayApi.js';

interface DivisionItem {
  division_code: string;
  division_name: string;
  zone_code: string;
  headquarters: string;
  active: boolean;
}

const FALLBACK_DIVISIONS: DivisionItem[] = [
  { division_code: 'BCT', division_name: 'Mumbai Central', zone_code: 'WR', headquarters: 'Mumbai Central', active: true },
  { division_code: 'BRC', division_name: 'Vadodara', zone_code: 'WR', headquarters: 'Vadodara', active: true },
  { division_code: 'ADI', division_name: 'Ahmedabad', zone_code: 'WR', headquarters: 'Ahmedabad', active: true },
  { division_code: 'RJT', division_name: 'Rajkot', zone_code: 'WR', headquarters: 'Rajkot', active: true },
  { division_code: 'BVP', division_name: 'Bhavnagar', zone_code: 'WR', headquarters: 'Bhavnagar', active: true },
  { division_code: 'RTM', division_name: 'Ratlam', zone_code: 'WR', headquarters: 'Ratlam', active: true },
  { division_code: 'CSMT', division_name: 'Mumbai CSMT', zone_code: 'CR', headquarters: 'Mumbai CSMT', active: true },
  { division_code: 'BSL', division_name: 'Bhusaval', zone_code: 'CR', headquarters: 'Bhusaval', active: true },
  { division_code: 'PUNE', division_name: 'Pune', zone_code: 'CR', headquarters: 'Pune', active: true },
  { division_code: 'SUR', division_name: 'Solapur', zone_code: 'CR', headquarters: 'Solapur', active: true },
  { division_code: 'NGP', division_name: 'Nagpur CR', zone_code: 'CR', headquarters: 'Nagpur', active: true },
  { division_code: 'DLI', division_name: 'Delhi', zone_code: 'NR', headquarters: 'New Delhi', active: true },
  { division_code: 'UMB', division_name: 'Ambala', zone_code: 'NR', headquarters: 'Ambala Cantt', active: true },
  { division_code: 'FZR', division_name: 'Firozpur', zone_code: 'NR', headquarters: 'Firozpur', active: true },
  { division_code: 'LKO-NR', division_name: 'Lucknow NR', zone_code: 'NR', headquarters: 'Lucknow', active: true },
  { division_code: 'MB', division_name: 'Moradabad', zone_code: 'NR', headquarters: 'Moradabad', active: true },
  { division_code: 'PRYJ', division_name: 'Prayagraj', zone_code: 'NCR', headquarters: 'Prayagraj', active: true },
  { division_code: 'AGC', division_name: 'Agra', zone_code: 'NCR', headquarters: 'Agra', active: true },
  { division_code: 'HWH', division_name: 'Howrah', zone_code: 'ER', headquarters: 'Howrah', active: true },
  { division_code: 'SDAH', division_name: 'Sealdah', zone_code: 'ER', headquarters: 'Sealdah', active: true },
  { division_code: 'MAS', division_name: 'Chennai', zone_code: 'SR', headquarters: 'Chennai Central', active: true },
  { division_code: 'SC', division_name: 'Secunderabad', zone_code: 'SCR', headquarters: 'Secunderabad', active: true },
  { division_code: 'KGP', division_name: 'Kharagpur', zone_code: 'SER', headquarters: 'Kharagpur', active: true },
  { division_code: 'SBC', division_name: 'Bengaluru', zone_code: 'SWR', headquarters: 'Bengaluru', active: true },
  { division_code: 'JP', division_name: 'Jaipur', zone_code: 'NWR', headquarters: 'Jaipur', active: true },
];

export const RailwayDivisionsPage: React.FC = () => {
  const [divisions, setDivisions] = useState<DivisionItem[]>(FALLBACK_DIVISIONS);
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    railwayApi.getDivisions()
      .then((res: any) => {
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          setDivisions(res.data);
        }
      })
      .catch((err) => {
        console.warn('Using master divisions fallback:', err);
      });
  }, []);

  const zonesList = Array.from(new Set(divisions.map((d) => d.zone_code))).sort();

  const filtered = divisions.filter((d) => {
    if (selectedZone !== 'ALL' && d.zone_code !== selectedZone) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      d.division_code.toLowerCase().includes(q) ||
      d.division_name.toLowerCase().includes(q) ||
      d.headquarters.toLowerCase().includes(q) ||
      d.zone_code.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-indigo-400" />
            <span>Indian Railway Divisions Directory</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Operational divisions across all 18 railway zones managing local tracks, train operations, and stations.
          </p>
        </div>
        <Link
          to="/railway-zones"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold border border-slate-700 transition"
        >
          ← View All 18 Railway Zones
        </Link>
      </div>

      {/* Controls Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Zone Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-500 font-bold shrink-0">Filter Zone:</span>
            <button
              onClick={() => setSelectedZone('ALL')}
              className={`px-3 py-1 rounded-lg shrink-0 font-bold transition ${
                selectedZone === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Zones
            </button>
            {zonesList.map((z) => (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                className={`px-2.5 py-1 rounded-lg shrink-0 font-bold transition ${
                  selectedZone === z
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search division or HQ..."
              className="w-full bg-slate-950 text-white placeholder-slate-500 rounded-xl pl-9 pr-3 py-1.5 border border-slate-700 text-xs focus:border-indigo-500 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Divisions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((div) => (
          <div
            key={div.division_code}
            className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/30 text-indigo-300">
                  {div.division_code}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  Zone: <strong className="text-white">{div.zone_code}</strong>
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-2">{div.division_name}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <Building className="w-3 h-3 text-slate-500 shrink-0" />
                HQ: {div.headquarters}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>Division Unit</span>
              <Link
                to={`/stations?division=${encodeURIComponent(div.division_name)}`}
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Stations →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
