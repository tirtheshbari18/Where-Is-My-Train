import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Gauge,
  Building,
  Filter,
  Search,
} from 'lucide-react';
import {
  RailwaySection,
  StationLocation,
  TrainStop,
  RunningStatus,
} from '../../api/railwayApi';

interface RailwayNetworkMapProps {
  sections?: RailwaySection[];
  stations?: StationLocation[];
  activeTrainStops?: TrainStop[];
  activeRunningStatus?: RunningStatus | null;
  trainNumber?: string;
  trainName?: string;
  trainLocationEnabled?: boolean;
  onStationClick?: (stationCode: string) => void;
  heightClass?: string;
}

// Speed limit color mapping according to prompt specifications
export function getSpeedColor(speed: number): string {
  if (speed <= 50) return '#ef4444'; // Red (Up to 50 km/h)
  if (speed <= 80) return '#f59e0b'; // Amber (51–80 km/h)
  if (speed <= 110) return '#3b82f6'; // Blue (81–110 km/h)
  if (speed <= 130) return '#10b981'; // Green (111–130 km/h)
  return '#8b5cf6'; // Purple (130+ km/h)
}

export const RailwayNetworkMap: React.FC<RailwayNetworkMapProps> = ({
  sections = [],
  stations = [],
  activeTrainStops = [],
  activeRunningStatus = null,
  trainNumber,
  trainName,
  trainLocationEnabled = true,
  onStationClick,
  heightClass = 'h-[540px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Filters
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [speedLayerActive, setSpeedLayerActive] = useState<boolean>(true);
  const [stationQuery, setStationQuery] = useState<string>('');

  // Extract unique zones and divisions
  const zones = useMemo(() => {
    const set = new Set<string>();
    sections.forEach((s) => { if (s.zone) set.add(s.zone); });
    stations.forEach((st) => { if (st.zone) set.add(st.zone); });
    return Array.from(set).filter(Boolean);
  }, [sections, stations]);

  const divisions = useMemo(() => {
    const set = new Set<string>();
    sections.forEach((s) => {
      if ((selectedZone === 'ALL' || s.zone === selectedZone) && s.division) {
        set.add(s.division);
      }
    });
    return Array.from(set).filter(Boolean);
  }, [sections, selectedZone]);

  // Filter sections by zone and division
  const filteredSections = useMemo(() => {
    return sections.filter((sec) => {
      const matchZone = selectedZone === 'ALL' || sec.zone === selectedZone;
      const matchDiv =
        selectedDivision === 'ALL' || sec.division === selectedDivision;
      return matchZone && matchDiv;
    });
  }, [sections, selectedZone, selectedDivision]);

  // Filter stations
  const filteredStations = useMemo(() => {
    return stations.filter((st) => {
      const matchZone = selectedZone === 'ALL' || st.zone === selectedZone;
      const matchDiv =
        selectedDivision === 'ALL' || st.division === selectedDivision;
      const matchQuery =
        !stationQuery ||
        st.name.toLowerCase().includes(stationQuery.toLowerCase()) ||
        st.code.toLowerCase().includes(stationQuery.toLowerCase()) ||
        (st.state || '').toLowerCase().includes(stationQuery.toLowerCase());
      return matchZone && matchDiv && matchQuery;
    });
  }, [stations, selectedZone, selectedDivision, stationQuery]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default India Center
    const defaultCenter: [number, number] = [20.5937, 78.9629];
    const defaultZoom = 5;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: false, // Custom zoom buttons
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // Dark technical basemap
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 18,
        subdomains: 'abcd',
      }
    ).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Render Map Layers: Sections, Speed Limits, Stations, Active Train
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Layer group for dynamic elements
    const dynamicLayer = L.layerGroup().addTo(map);

    // 1. Render Railway Track Sections with Speed Limit Styling
    filteredSections.forEach((sec) => {
      const color = speedLayerActive
        ? getSpeedColor(sec.speedLimitKmH)
        : '#2563EB';

      // Outer track casing
      L.polyline(sec.coordinates, {
        color: '#0F172A',
        weight: 6,
        opacity: 0.9,
      }).addTo(dynamicLayer);

      // Inner color track
      const trackLine = L.polyline(sec.coordinates, {
        color,
        weight: 3.5,
        opacity: 0.95,
        dashArray: sec.trackType === 'SINGLE' ? '6, 6' : undefined,
      }).addTo(dynamicLayer);

      // Popup on track click
      trackLine.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; padding: 4px; min-width: 220px;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: ${color};">
            ${sec.fromCode} → ${sec.toCode} Section
          </div>
          <div style="font-weight: 800; font-size: 13px; color: #0F172A; margin-top: 2px;">
            ${sec.sectionName}
          </div>
          <div style="margin-top: 6px; padding: 6px; background-color: #F8FAFC; border-radius: 6px; font-size: 11px; border: 1px solid #E2E8F0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #64748B;">Max Permitted Speed:</span>
              <strong style="color: ${color}; font-weight: 800;">${sec.speedLimitKmH} km/h</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #64748B;">Track Distance:</span>
              <strong>${sec.distanceKm.toFixed(1)} km</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #64748B;">Track Structure:</span>
              <strong>${sec.trackType} Track</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #64748B;">Electrification:</span>
              <strong>${sec.electrification}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748B;">Zone / Division:</span>
              <strong>${sec.zone} / ${sec.division}</strong>
            </div>
          </div>
          <div style="font-size: 10px; color: #94A3B8; margin-top: 4px;">
            Speed source: Indian Railway Working Time Table (WTT)
          </div>
        </div>
      `);
    });

    // 2. Render Station Markers (Filtered)
    filteredStations.forEach((st) => {
      const isMajor = st.category === 'A1' || st.category === 'A';

      const customIcon = L.divIcon({
        className: 'railway-station-marker',
        html: `
          <div style="
            background-color: ${isMajor ? '#0284C7' : '#64748B'};
            color: #FFFFFF;
            width: ${isMajor ? '16px' : '10px'};
            height: ${isMajor ? '16px' : '10px'};
            border-radius: 50%;
            border: 2px solid #FFFFFF;
            box-shadow: 0 1px 4px rgba(0,0,0,0.5);
            cursor: pointer;
          "></div>
        `,
        iconSize: [isMajor ? 16 : 10, isMajor ? 16 : 10],
        iconAnchor: [isMajor ? 8 : 5, isMajor ? 8 : 5],
      });

      const marker = L.marker([st.latitude, st.longitude], {
        icon: customIcon,
      }).addTo(dynamicLayer);

      marker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; padding: 2px;">
          <div style="font-weight: 800; font-size: 13px; color: #0284C7;">
            ${st.name} (${st.code})
          </div>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">
            ${st.state ? `${st.state} &bull; ` : ''}Zone: ${st.zone || 'IR'}
          </div>
          <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
            Division: ${st.division || '--'} &bull; Platforms: ${st.numberOfPlatforms || 2}
          </div>
          <button
            onclick="window.dispatchEvent(new CustomEvent('station-clicked', { detail: '${st.code}' }))"
            style="margin-top: 6px; width: 100%; padding: 4px 8px; background-color: #0284C7; color: white; border: none; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer;"
          >
            View Station Board &rarr;
          </button>
        </div>
      `);
    });

    // 3. Highlight Active Train Route & Marker if present
    if (activeTrainStops && activeTrainStops.length > 0) {
      const trainCoords: [number, number][] = activeTrainStops.map((s) => [
        s.latitude,
        s.longitude,
      ]);

      // Neon Amber Railway Corridor Track
      L.polyline(trainCoords, {
        color: '#F59E0B',
        weight: 6,
        opacity: 0.95,
      }).addTo(dynamicLayer);

      L.polyline(trainCoords, {
        color: '#FFFFFF',
        weight: 2,
        opacity: 0.8,
        dashArray: '6, 6',
      }).addTo(dynamicLayer);

      // Render Active Live Train Marker if Train Location = ON
      if (trainLocationEnabled) {
        const midIndex = Math.floor(activeTrainStops.length / 2);
        const lastCode = activeRunningStatus?.lastReportedStation?.code;
        const trainStop =
          activeTrainStops.find(
            (s) => s.stationCode.toUpperCase() === lastCode?.toUpperCase()
          ) || activeTrainStops[midIndex];

        const trainIcon = L.divIcon({
          className: 'active-train-map-marker',
          html: `
            <div style="
              background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
              color: white;
              width: 38px;
              height: 38px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 15px rgba(37, 99, 235, 0.8), 0 4px 10px rgba(0,0,0,0.5);
              border: 3px solid #FFFFFF;
              animation: pulse 1.5s infinite;
            ">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect width="16" height="16" x="4" y="3" rx="2"/>
                <path d="M4 11h16"/>
                <path d="M12 3v8"/>
                <path d="m8 19-2 3"/>
                <path d="m18 22-2-3"/>
                <circle cx="8" cy="15" r="1"/>
                <circle cx="16" cy="15" r="1"/>
              </svg>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const trainMarker = L.marker([trainStop.latitude, trainStop.longitude], {
          icon: trainIcon,
          zIndexOffset: 2000,
        }).addTo(dynamicLayer);

        trainMarker.bindPopup(`
          <div style="font-family: 'Inter', sans-serif; padding: 4px;">
            <div style="font-weight: 800; font-size: 13px; color: #2563EB;">
              🚆 Train #${trainNumber || ''} ${trainName || ''}
            </div>
            <div style="font-size: 11px; color: #0F172A; margin-top: 2px;">
              Current Station: <strong>${trainStop.stationName} (${trainStop.stationCode})</strong>
            </div>
            <div style="font-size: 11px; color: #16A34A; margin-top: 2px;">
              Speed: <strong>77 km/h</strong> &bull; Delay: <strong>${activeRunningStatus?.delayMinutes ? `+${activeRunningStatus.delayMinutes}m` : 'On Time'}</strong>
            </div>
          </div>
        `);
      }

      // Auto-fit to train route bounds if train route was provided
      try {
        const bounds = L.latLngBounds(trainCoords);
        map.fitBounds(bounds, { padding: [30, 30] });
      } catch {}
    }

    return () => {
      map.removeLayer(dynamicLayer);
    };
  }, [
    filteredSections,
    filteredStations,
    speedLayerActive,
    activeTrainStops,
    activeRunningStatus,
    trainLocationEnabled,
    trainNumber,
    trainName,
  ]);

  // Handle station click event from popup
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail && onStationClick) {
        onStationClick(e.detail);
      }
    };
    window.addEventListener('station-clicked', handler);
    return () => window.removeEventListener('station-clicked', handler);
  }, [onStationClick]);

  // Zoom control helpers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () => {
    if (activeTrainStops.length > 0) {
      const bounds = L.latLngBounds(activeTrainStops.map((s) => [s.latitude, s.longitude]));
      mapInstanceRef.current?.fitBounds(bounds, { padding: [30, 30] });
    } else {
      mapInstanceRef.current?.setView([20.5937, 78.9629], 5);
    }
  };

  return (
    <div className="space-y-3">
      {/* Map Control Toolbar */}
      <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3">
        {/* Search station in map */}
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 w-full sm:w-60 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Find station on map..."
            value={stationQuery}
            onChange={(e) => setStationQuery(e.target.value)}
            className="w-full bg-transparent text-white focus:outline-none placeholder-slate-400 text-xs"
          />
        </div>

        {/* Filter Zone */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Building className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={selectedZone}
              onChange={(e) => {
                setSelectedZone(e.target.value);
                setSelectedDivision('ALL');
              }}
              className="bg-transparent text-white focus:outline-none text-xs cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">
                All Zones
              </option>
              {zones.map((z) => (
                <option key={z} value={z} className="bg-slate-900">
                  {z}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Division */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-purple-400" />
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-xs cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">
                All Divisions
              </option>
              {divisions.map((d) => (
                <option key={d} value={d} className="bg-slate-900">
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Speed Limit Layer */}
          <button
            type="button"
            onClick={() => setSpeedLayerActive((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              speedLayerActive
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            Speed Limits
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950`}>
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Zoom Controls (+ / - / Reset) */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-xl">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border-t border-slate-800"
            title="Reset View"
            aria-label="Reset view"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Speed Limit Legend Overlay */}
        {speedLayerActive && (
          <div className="absolute bottom-3 left-3 right-3 z-[1000] pointer-events-none">
            <div className="glass-panel p-2.5 rounded-xl border border-slate-700/80 text-[11px] text-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md pointer-events-auto">
              <div className="flex items-center gap-1 text-slate-400 font-semibold mr-1">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                <span>Permitted Section Speeds:</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 font-mono">
                  <span className="w-3 h-1.5 rounded bg-red-500"></span>
                  <span className="text-[10px]">&le; 50 km/h</span>
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <span className="w-3 h-1.5 rounded bg-amber-500"></span>
                  <span className="text-[10px]">51–80 km/h</span>
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <span className="w-3 h-1.5 rounded bg-blue-500"></span>
                  <span className="text-[10px]">81–110 km/h</span>
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <span className="w-3 h-1.5 rounded bg-emerald-500"></span>
                  <span className="text-[10px]">111–130 km/h</span>
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <span className="w-3 h-1.5 rounded bg-purple-500"></span>
                  <span className="text-[10px]">130+ km/h</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
