// frontend/src/hooks/useInsideTrainSpeed.ts
// Robust Live Speed Telemetry Hook for "Where Is My Train"
// Priorities:
// 1. Authoritative/reliable live telemetry speed from provider (status.speedKmH)
// 2. Smoothed GPS speed (coords.speed * 3.6 or distance/time delta)
// 3. Stopped train = 0 km/h
// 4. Unavailable = null (renders as '-- km/h', never fabricated)
// Handles permission denied without crashing and supports retry.

import { useState, useEffect, useRef, useCallback } from 'react';

function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface UseInsideTrainSpeedOptions {
  insideTrain: boolean;
  providerSpeedKmH?: number | null;
  trainStatus?: string | null;
}

export interface UseInsideTrainSpeedResult {
  speedKmH: number | null;
  speedText: string;
  isStopped: boolean;
  permissionDenied: boolean;
  retryLocation: () => void;
  speedSource: 'provider' | 'gps' | 'stopped' | 'unavailable';
}

export function useInsideTrainSpeed({
  insideTrain,
  providerSpeedKmH,
  trainStatus,
}: UseInsideTrainSpeedOptions): UseInsideTrainSpeedResult {
  const [gpsSpeed, setGpsSpeed] = useState<number | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  const lastPosRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);
  const speedSamplesRef = useRef<number[]>([]);

  const retryLocation = useCallback(() => {
    setPermissionDenied(false);
    setRetryTrigger((prev) => prev + 1);
  }, []);

  const statusUpper = (trainStatus || '').toUpperCase();
  const isTrainStopped =
    statusUpper === 'STOPPED' ||
    statusUpper === 'AT_STATION' ||
    statusUpper === 'COMPLETED' ||
    statusUpper === 'ARRIVED';

  // Watch GPS speed when insideTrain is active
  useEffect(() => {
    if (!insideTrain) {
      setGpsSpeed(null);
      setPermissionDenied(false);
      lastPosRef.current = null;
      speedSamplesRef.current = [];
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setPermissionDenied(true);
      return;
    }

    let watchId: number | null = null;

    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setPermissionDenied(false);
          const coords = pos.coords;
          let instantSpeedKmH: number | null = null;

          if (coords.speed !== null && coords.speed !== undefined && !isNaN(coords.speed) && coords.speed >= 0) {
            instantSpeedKmH = coords.speed * 3.6;
          } else if (lastPosRef.current) {
            const dt = (pos.timestamp - lastPosRef.current.timestamp) / 1000;
            if (dt >= 1.5) {
              const distKm = calculateHaversineKm(
                lastPosRef.current.lat,
                lastPosRef.current.lng,
                coords.latitude,
                coords.longitude
              );
              instantSpeedKmH = distKm / (dt / 3600);
            }
          }

          lastPosRef.current = {
            lat: coords.latitude,
            lng: coords.longitude,
            timestamp: pos.timestamp,
          };

          // Filter out extreme GPS noise (> 220 km/h)
          if (instantSpeedKmH !== null && instantSpeedKmH >= 0 && instantSpeedKmH < 220) {
            // Treat very low speeds (< 2 km/h) as stopped (0 km/h)
            const cleanSpeed = instantSpeedKmH < 2 ? 0 : instantSpeedKmH;
            speedSamplesRef.current.push(cleanSpeed);
            if (speedSamplesRef.current.length > 5) {
              speedSamplesRef.current.shift();
            }
            // Moving average smoothing
            const avg =
              speedSamplesRef.current.reduce((a, b) => a + b, 0) /
              speedSamplesRef.current.length;
            setGpsSpeed(Math.round(avg));
          }
        },
        (err) => {
          if (err.code === 1) {
            // PERMISSION_DENIED
            setPermissionDenied(true);
            setGpsSpeed(null);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 3000,
        }
      );
    } catch {
      setPermissionDenied(true);
    }

    return () => {
      if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [insideTrain, retryTrigger]);

  // Determine effective speed and source based on priority rules
  let effectiveSpeed: number | null = null;
  let source: 'provider' | 'stopped' | 'gps' | 'unavailable' = 'unavailable';

  if (isTrainStopped) {
    effectiveSpeed = 0;
    source = 'stopped';
  } else if (providerSpeedKmH !== null && providerSpeedKmH !== undefined && !isNaN(providerSpeedKmH)) {
    effectiveSpeed = Math.max(0, Math.round(providerSpeedKmH));
    source = 'provider';
  } else if (gpsSpeed !== null) {
    effectiveSpeed = gpsSpeed;
    source = 'gps';
  } else {
    effectiveSpeed = null;
    source = 'unavailable';
  }

  const speedText = effectiveSpeed !== null ? `${effectiveSpeed} km/h` : '-- km/h';

  return {
    speedKmH: effectiveSpeed,
    speedText,
    isStopped: effectiveSpeed === 0 || isTrainStopped,
    permissionDenied,
    retryLocation,
    speedSource: source,
  };
}
