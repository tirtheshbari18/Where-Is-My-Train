import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { TrainStop, RunningStatus } from '../../api/railwayApi.js';

interface Props {
  stops: TrainStop[];
  status?: RunningStatus | null;
  trainName?: string;
  trainNumber?: string;
}

export const LiveMap: React.FC<Props> = ({
  stops,
  status,
  trainName = 'Train',
  trainNumber = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (stops.length === 0) return;

    // Dispose old map instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center to middle of route
    const midIndex = Math.floor(stops.length / 2);
    const centerLat = stops[midIndex].latitude;
    const centerLng = stops[midIndex].longitude;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 6,
      zoomControl: true,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // Use dark mode friendly tile layer
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 18,
        subdomains: 'abcd',
      }
    ).addTo(map);

    // Route polyline coordinates
    const latLngs: L.LatLngExpression[] = stops.map((s) => [
      s.latitude,
      s.longitude,
    ]);

    // Draw route railway track line
    const railwayTrack = L.polyline(latLngs, {
      color: '#1E3E62',
      weight: 8,
      opacity: 0.8,
    }).addTo(map);

    // Overlay inner neon amber signal track
    L.polyline(latLngs, {
      color: '#F59E0B',
      weight: 3,
      opacity: 0.95,
      dashArray: '8, 6',
    }).addTo(map);

    // Add station markers
    stops.forEach((stop, idx) => {
      const isOrigin = idx === 0;
      const isDestination = idx === stops.length - 1;
      const isCurrentStop =
        status?.lastReportedStation?.code.toUpperCase() ===
        stop.stationCode.toUpperCase();

      const markerColor = isOrigin
        ? '#10B981'
        : isDestination
        ? '#EF4444'
        : isCurrentStop
        ? '#F59E0B'
        : '#38BDF8';

      const customIcon = L.divIcon({
        className: 'station-div-marker',
        html: `
          <div style="
            background-color: ${markerColor};
            width: ${isCurrentStop ? '18px' : '12px'};
            height: ${isCurrentStop ? '18px' : '12px'};
            border-radius: 50%;
            border: 2px solid #0B192C;
            box-shadow: 0 0 ${isCurrentStop ? '12px #F59E0B' : '4px rgba(0,0,0,0.5)'};
          "></div>
        `,
        iconSize: [isCurrentStop ? 18 : 12, isCurrentStop ? 18 : 12],
        iconAnchor: [isCurrentStop ? 9 : 6, isCurrentStop ? 9 : 6],
      });

      const marker = L.marker([stop.latitude, stop.longitude], {
        icon: customIcon,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; padding: 2px;">
          <div style="font-weight: 800; font-size: 13px; color: #F59E0B; margin-bottom: 2px;">
            ${stop.stationName} (${stop.stationCode})
          </div>
          <div style="font-size: 11px; color: #CBD5E1;">
            Stop #${stop.stopSequence} • Platform: ${stop.platform || 'TBD'}
          </div>
          <div style="font-size: 11px; color: #94A3B8; margin-top: 4px;">
            Arr: ${stop.scheduledArrival} | Dep: ${stop.scheduledDeparture}
          </div>
          <div style="font-size: 10px; color: #64748B; margin-top: 2px;">
            Distance: ${stop.distanceFromSourceKm} km from source
          </div>
        </div>
      `);
    });

    // Add Live Train Marker if status position is available
    if (status) {
      const trainLat =
        status.latitude ||
        stops.find(
          (s) =>
            s.stationCode.toUpperCase() ===
            status.lastReportedStation?.code.toUpperCase()
        )?.latitude ||
        centerLat;

      const trainLng =
        status.longitude ||
        stops.find(
          (s) =>
            s.stationCode.toUpperCase() ===
            status.lastReportedStation?.code.toUpperCase()
        )?.longitude ||
        centerLng;

      const trainIcon = L.divIcon({
        className: 'live-train-marker',
        html: `
          <div style="
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
            color: #070F1E;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 20px #F59E0B, 0 4px 10px rgba(0,0,0,0.6);
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

      const trainMarker = L.marker([trainLat, trainLng], {
        icon: trainIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      trainMarker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; padding: 4px;">
          <div style="font-weight: 800; font-size: 13px; color: #F59E0B;">
            🚂 ${trainNumber} ${trainName}
          </div>
          <div style="font-size: 11px; color: #38BDF8; margin-top: 2px;">
            ${status.positionType === 'station' ? 'Last Reported Station:' : 'Current Position:'}
            <strong>${status.lastReportedStation?.name || 'In-Transit'}</strong>
          </div>
          <div style="font-size: 11px; color: ${status.delayMinutes > 5 ? '#F87171' : '#34D399'}; margin-top: 2px;">
            ${status.delayMinutes > 5 ? `+${status.delayMinutes} mins delay` : 'Running on time'}
          </div>
          <div style="font-size: 10px; color: #94A3B8; margin-top: 4px; border-top: 1px solid #334155; pt: 2px;">
            ${status.dataFreshnessText}
          </div>
        </div>
      `);
      trainMarker.openPopup();
    }

    // Fit map bounds to view all route stations
    map.fitBounds(railwayTrack.getBounds(), {
      padding: [40, 40],
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [stops, status, trainName, trainNumber]);

  return (
    <div className="relative w-full h-[400px] sm:h-[480px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Legend & Transparency Overlay */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] pointer-events-none">
        <div className="glass-panel p-2.5 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-2 shadow-lg backdrop-blur-md pointer-events-auto">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Origin</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Reported Position</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span>Destination</span>
            </span>
          </div>

          <div className="text-[10px] text-slate-400">
            Simplified schematic track geometry • OpenStreetMap / Carto
          </div>
        </div>
      </div>
    </div>
  );
};
