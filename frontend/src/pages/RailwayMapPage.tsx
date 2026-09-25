import React, { useState, useEffect } from 'react';
import {
  Loader2,
  Info,
} from 'lucide-react';
import { railwayApi, RailwaySection, StationLocation } from '../api/railwayApi.js';
import { RailwayNetworkMap } from '../components/map/RailwayNetworkMap.js';
import { StationDetailModal } from '../components/modals/StationDetailModal.js';

export const RailwayMapPage: React.FC = () => {
  const [sections, setSections] = useState<RailwaySection[]>([]);
  const [stations, setStations] = useState<StationLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected station modal
  const [selectedStationCode, setSelectedStationCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setLoading(true);
        const mapData = await railwayApi.getRailwayMapData();
        setSections(mapData.sections || []);
        setStations(mapData.stations || []);
      } catch (err: any) {
        setError(err?.message || 'Failed to load Indian Railway network map.');
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                CRIS National Rail Geographic Information System
              </span>
              <span className="text-xs text-slate-400">Indian Railway Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              Indian Railway Network & Speed Limits Map
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Explore track geometry, section speed limits, zonal railway divisions, and station connectivity across India. Click any track section to view electrification and maximum permitted speed.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase font-bold block">
                Network Corridors
              </span>
              <span className="text-lg font-black font-mono text-emerald-400">
                {sections.length} Sections
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="h-[500px] flex flex-col items-center justify-center gap-3 text-blue-400 bg-slate-900/40 rounded-3xl border border-slate-800">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm font-semibold">Loading Indian Railway geospatial network...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-950/20 border border-red-900/40 rounded-3xl text-red-300 text-sm">
          {error}
        </div>
      ) : (
        /* Full Interactive Network Map */
        <div className="space-y-4">
          <RailwayNetworkMap
            sections={sections}
            stations={stations}
            heightClass="h-[600px] sm:h-[680px]"
            onStationClick={(stationCode) => setSelectedStationCode(stationCode)}
          />

          {/* Section Information Disclaimer */}
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Geospatial Data Notice:</strong> Speed limit color codes represent maximum sectional permissible speeds specified in the Zonal Railway Working Time Tables (WTT). Actual operational train speeds are subject to caution orders, temporary speed restrictions (TSR), signal aspects, and locomotive rake capabilities.
            </p>
          </div>
        </div>
      )}

      {/* Station Modal if clicked */}
      {selectedStationCode && (
        <StationDetailModal
          isOpen={true}
          onClose={() => setSelectedStationCode(null)}
          stationCode={selectedStationCode}
          stationName={stations.find((s) => s.code === selectedStationCode)?.name || selectedStationCode}
        />
      )}
    </div>
  );
};
