import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Network, Building, Search, ExternalLink, ShieldCheck } from 'lucide-react';
import { railwayApi } from '../api/railwayApi.js';

interface ZoneItem {
  zone_code: string;
  zone_name: string;
  headquarters: string;
  divisions: string[];
  active: boolean;
  source?: string;
}

const FALLBACK_ZONES: ZoneItem[] = [
  { zone_code: 'CR', zone_name: 'Central Railway', headquarters: 'Mumbai (CSMT)', divisions: ['Mumbai CSMT', 'Bhusaval', 'Pune', 'Solapur', 'Nagpur'], active: true },
  { zone_code: 'WR', zone_name: 'Western Railway', headquarters: 'Mumbai (Churchgate)', divisions: ['Mumbai Central', 'Vadodara', 'Ahmedabad', 'Rajkot', 'Bhavnagar', 'Ratlam'], active: true },
  { zone_code: 'NR', zone_name: 'Northern Railway', headquarters: 'New Delhi (Baroda House)', divisions: ['Delhi', 'Ambala', 'Firozpur', 'Lucknow NR', 'Moradabad'], active: true },
  { zone_code: 'ER', zone_name: 'Eastern Railway', headquarters: 'Kolkata (Fairlie Place)', divisions: ['Howrah', 'Sealdah', 'Asansol', 'Malda'], active: true },
  { zone_code: 'SR', zone_name: 'Southern Railway', headquarters: 'Chennai Central', divisions: ['Chennai', 'Tiruchirappalli', 'Madurai', 'Palakkad', 'Salem', 'Thiruvananthapuram'], active: true },
  { zone_code: 'SCR', zone_name: 'South Central Railway', headquarters: 'Secunderabad (Rail Nilayam)', divisions: ['Secunderabad', 'Hyderabad', 'Vijayawada', 'Guntakal', 'Guntur', 'Nanded'], active: true },
  { zone_code: 'SER', zone_name: 'South Eastern Railway', headquarters: 'Kolkata (Garden Reach)', divisions: ['Kharagpur', 'Adra', 'Chakradharpur', 'Ranchi'], active: true },
  { zone_code: 'SWR', zone_name: 'South Western Railway', headquarters: 'Hubballi (Rail Soudha)', divisions: ['Hubballi', 'Bengaluru', 'Mysuru'], active: true },
  { zone_code: 'NWR', zone_name: 'North Western Railway', headquarters: 'Jaipur', divisions: ['Jaipur', 'Ajmer', 'Bikaner', 'Jodhpur'], active: true },
  { zone_code: 'NCR', zone_name: 'North Central Railway', headquarters: 'Prayagraj (Subedarganj)', divisions: ['Prayagraj', 'Agra', 'Jhansi'], active: true },
  { zone_code: 'NER', zone_name: 'North Eastern Railway', headquarters: 'Gorakhpur', divisions: ['Izzatnagar', 'Lucknow NER', 'Varanasi'], active: true },
  { zone_code: 'NFR', zone_name: 'Northeast Frontier Railway', headquarters: 'Maligaon, Guwahati', divisions: ['Alipurduar', 'Katihar', 'Lumding', 'Rangiya', 'Tinsukia'], active: true },
  { zone_code: 'ECR', zone_name: 'East Central Railway', headquarters: 'Hajipur', divisions: ['Danapur', 'Dhanbad', 'Pt. Deen Dayal Upadhyaya', 'Samastipur', 'Sonpur'], active: true },
  { zone_code: 'ECoR', zone_name: 'East Coast Railway', headquarters: 'Bhubaneswar', divisions: ['Khurda Road', 'Sambalpur', 'Waltair'], active: true },
  { zone_code: 'SECR', zone_name: 'South East Central Railway', headquarters: 'Bilaspur', divisions: ['Bilaspur', 'Raipur', 'Nagpur SECR'], active: true },
  { zone_code: 'WCR', zone_name: 'West Central Railway', headquarters: 'Jabalpur', divisions: ['Jabalpur', 'Bhopal', 'Kota'], active: true },
  { zone_code: 'METRO', zone_name: 'Metro Railway, Kolkata', headquarters: 'Kolkata (Park Street)', divisions: ['Kolkata Metro'], active: true },
  { zone_code: 'KRCL', zone_name: 'Konkan Railway Corporation Limited', headquarters: 'CBD Belapur, Navi Mumbai', divisions: ['Karwar', 'Ratnagiri'], active: true },
];

export const RailwayZonesPage: React.FC = () => {
  const [zones, setZones] = useState<ZoneItem[]>(FALLBACK_ZONES);
  const [search, setSearch] = useState('');

  useEffect(() => {
    railwayApi.getZones()
      .then((res: any) => {
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          setZones(res.data);
        }
      })
      .catch((err) => {
        console.warn('Using master zone directory fallback:', err);
      });
  }, []);

  const filtered = zones.filter((z) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      z.zone_code.toLowerCase().includes(q) ||
      z.zone_name.toLowerCase().includes(q) ||
      z.headquarters.toLowerCase().includes(q) ||
      z.divisions.some((d) => d.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Network className="w-7 h-7 text-blue-400" />
            <span>Indian Railway Zonal Directory</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete jurisdictional directory of all 18 Indian Railway Zones, Headquarters, and Administrative Divisions.
          </p>
        </div>
        <Link
          to="/railway-divisions"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-bold border border-slate-700 transition"
        >
          View All 71 Railway Divisions →
        </Link>
      </div>

      {/* Search Input */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by zone code (e.g. WR, CR, NR), zone name, HQ, or division..."
            className="w-full bg-slate-950 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 border border-slate-700 text-sm focus:border-blue-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
        </div>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((zone) => (
          <div
            key={zone.zone_code}
            className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-blue-500/40 transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-black font-mono px-3 py-1 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-300">
                  {zone.zone_code}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-bold">
                  Active IR Zone
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-white">{zone.zone_name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>HQ: {zone.headquarters}</span>
                </div>
              </div>

              {/* Divisions list */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Divisions ({zone.divisions.length})
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {zone.divisions.map((divName) => (
                    <span
                      key={divName}
                      className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-300"
                    >
                      {divName}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Verified IR Entity
              </span>
              <Link
                to={`/stations?zone=${zone.zone_code}`}
                className="text-blue-400 hover:text-blue-300 font-bold inline-flex items-center gap-1"
              >
                Stations <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
