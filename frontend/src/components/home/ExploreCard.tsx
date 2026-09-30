// frontend/src/components/home/ExploreCard.tsx
// Data-driven Explore Section for WHERE IS MY TRAIN (Requirement 5)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, MapPin, Train, ArrowRight, Sparkles, Building2 } from 'lucide-react';

export interface ExploreDestination {
  id: string;
  name: string;
  stationCode: string;
  stationName: string;
  badge: string;
  tagline: string;
  description: string;
  zone: string;
  division: string;
  platforms: number;
  popularTrains: string[];
  gradient: string;
}

const DESTINATIONS: ExploreDestination[] = [
  {
    id: 'dahanu',
    name: 'Dahanu',
    stationCode: 'DRD',
    stationName: 'Dahanu Road',
    badge: 'Western Railway Terminus',
    tagline: 'Coastal Gateway & Mumbai Suburban Northernmost Terminal',
    description:
      'Famous for its lush chikoo orchards and Bordi beach, Dahanu Road marks the northern terminus of the Mumbai Western Suburban corridor with over 24 daily originating EMUs and major express halts.',
    zone: 'WR (Western Railway)',
    division: 'Mumbai WR',
    platforms: 4,
    popularTrains: ['93011 Dahanu Local', '19417 Borivali-Vatva', '12922 Flying Ranee', '22956 Kutch SF'],
    gradient: 'from-blue-600 via-indigo-700 to-slate-900',
  },
  {
    id: 'boisar',
    name: 'Boisar',
    stationCode: 'BOR',
    stationName: 'Boisar',
    badge: 'Industrial Nuclear Hub',
    tagline: 'Gateway to Tarapur MIDC & Key Express Halting Station',
    description:
      'A bustling railway junction connecting Tarapur industrial cluster with Mumbai and Gujarat. High passenger density station serving daily commuters, MEMU services, and Saurashtra corridor expresses.',
    zone: 'WR (Western Railway)',
    division: 'Mumbai WR',
    platforms: 3,
    popularTrains: ['19417 Borivali-Vatva', '22956 Kutch SF', '12922 Flying Ranee', '93023 Virar-Dahanu'],
    gradient: 'from-indigo-600 via-purple-700 to-slate-900',
  },
  {
    id: 'palghar',
    name: 'Palghar',
    stationCode: 'PLG',
    stationName: 'Palghar',
    badge: 'District Headquarters',
    tagline: 'Administrative Capital & Major Western Railway Node',
    description:
      'The administrative headquarters of Palghar district, connecting rural coastal belts with metropolitan Mumbai. Features round-the-clock halts for superfast trains, MEMUs, and suburban locals.',
    zone: 'WR (Western Railway)',
    division: 'Mumbai WR',
    platforms: 3,
    popularTrains: ['12922 Flying Ranee', '22956 Kutch SF', '19417 Express', '93011 Local'],
    gradient: 'from-emerald-700 via-teal-800 to-slate-900',
  },
  {
    id: 'surat',
    name: 'Surat',
    stationCode: 'ST',
    stationName: 'Surat',
    badge: 'Golden Corridor Flagship',
    tagline: 'Diamond & Silk Metropolis on Mumbai-Delhi Trunk Line',
    description:
      'One of Indian Railways busiest A1-category stations handling over 150 daily superfasts, Rajdhani, and Vande Bharat expresses connecting Western India with Northern and Eastern corridors.',
    zone: 'WR (Western Railway)',
    division: 'Vadodara / Mumbai',
    platforms: 6,
    popularTrains: ['20901 Vande Bharat', '12951 Mumbai Rajdhani', '12922 Flying Ranee', '12009 Shatabdi'],
    gradient: 'from-amber-700 via-orange-800 to-slate-900',
  },
  {
    id: 'vapi',
    name: 'Vapi',
    stationCode: 'VAPI',
    stationName: 'Vapi',
    badge: 'Gujarat Industrial Gateway',
    tagline: 'Gateway to Daman, Silvassa & High-Speed Passenger Link',
    description:
      'Key commercial stop on the border of Maharashtra and Gujarat serving chemical industrial hubs and Union Territories of Daman and Diu with heavy business travel.',
    zone: 'WR (Western Railway)',
    division: 'Mumbai WR',
    platforms: 3,
    popularTrains: ['20901 Vande Bharat', '12009 Shatabdi', '19417 Borivali-Vatva', '22956 Kutch SF'],
    gradient: 'from-rose-700 via-purple-800 to-slate-900',
  },
];

export const ExploreCard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string>('dahanu');

  const current = DESTINATIONS.find((d) => d.id === selectedId) || DESTINATIONS[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
              EXPLORE RAILWAY DESTINATIONS
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
              Explore {current.name}
            </h2>
          </div>
        </div>

        {/* Quick Location Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {DESTINATIONS.map((dest) => {
            const isSelected = dest.id === selectedId;
            return (
              <button
                key={dest.id}
                type="button"
                onClick={() => setSelectedId(dest.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {dest.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Destination Showcase Banner */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${current.gradient} text-white p-5 shadow-lg space-y-3.5`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-black uppercase tracking-wider text-white mb-1.5">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>{current.badge}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">{current.name}</h3>
            <p className="text-xs text-blue-100 font-medium mt-0.5">{current.tagline}</p>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-block px-3 py-1 rounded-xl bg-black/30 backdrop-blur-xs font-mono font-black text-lg border border-white/20">
              {current.stationCode}
            </span>
            <span className="block text-[10px] text-blue-200 mt-1 uppercase font-bold">
              {current.stationName}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-100 leading-relaxed max-w-xl font-normal opacity-95">
          {current.description}
        </p>

        {/* Nearby Railway Information */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-white/15">
          <div className="bg-black/20 rounded-xl p-2.5">
            <span className="text-[10px] uppercase font-bold text-blue-200 block">Railway Zone</span>
            <span className="text-xs font-extrabold text-white">{current.zone}</span>
          </div>
          <div className="bg-black/20 rounded-xl p-2.5">
            <span className="text-[10px] uppercase font-bold text-blue-200 block">Division</span>
            <span className="text-xs font-extrabold text-white">{current.division}</span>
          </div>
          <div className="bg-black/20 rounded-xl p-2.5 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-blue-200 block">Platforms</span>
            <span className="text-xs font-extrabold text-white">{current.platforms} Platforms</span>
          </div>
        </div>

        {/* Popular Halting Trains */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] uppercase font-black text-amber-300 tracking-wider flex items-center gap-1">
            <Train className="w-3 h-3" />
            <span>Key Trains Serving {current.name}:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {current.popularTrains.map((tr) => (
              <span
                key={tr}
                className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white/15 backdrop-blur-xs text-white"
              >
                {tr}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/station/${current.stationCode}`)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Station Departure Board ({current.stationCode})</span>
          </button>
          <button
            type="button"
            onClick={() =>
              navigate(
                `/trains-between?from=BOR&to=${encodeURIComponent(
                  current.stationCode
                )}&date=${new Date().toISOString().split('T')[0]}`
              )
            }
            className="flex-1 py-2.5 px-4 rounded-xl bg-blue-500/40 hover:bg-blue-500/60 border border-white/30 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <MapPin className="w-4 h-4 text-amber-300" />
            <span>Find Trains to {current.name}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
