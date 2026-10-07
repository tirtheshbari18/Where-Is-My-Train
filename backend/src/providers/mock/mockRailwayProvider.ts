import { IRailwayDataProvider } from '../RailwayDataProvider.interface.js';
import {
  TrainSummary,
  TrainDetail,
  TrainStop,
  RunningStatus,
  StationLocation,
  LiveStationBoard,
  LiveStationTrain,
  TrainException,
  TrainCoachComposition,
  PnrStatus,
  RouteSegment,
  IntermediateStation,
  TrainOperation,
  RailwaySection,
  PlatformUpdate,
  DetailedTimetableRow,
} from '../../types/railway.types.js';
import {
  MOCK_STATIONS,
  MOCK_TRAINS,
  MOCK_COACH_COMPOSITIONS,
  MOCK_EXCEPTIONS,
  MOCK_ROUTE_SEGMENTS,
  MOCK_TRAIN_OPERATIONS,
  MOCK_RAILWAY_SECTIONS,
  MOCK_PLATFORM_UPDATES,
} from './mockRailwayData.js';
import { MOCK_PNR_RECORDS } from './mockPnrData.js';
import { normalizeDate } from '../../utils/dateNormalizer.js';

// Haversine formula to calculate distance between two coordinates in km
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Levenshtein similarity / typo-tolerant match
function isFuzzyMatch(text: string, query: string): boolean {
  const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!cleanQuery) return true;
  if (cleanText.includes(cleanQuery)) return true;

  // Partial sub-token matching (e.g., "vand" in "vande", "bharat" in "bharat")
  const tokens = query.toLowerCase().split(/\s+/);
  const matchesEveryToken = tokens.every((token) =>
    cleanText.includes(token) || (token.length > 3 && cleanText.includes(token.substring(0, token.length - 1)))
  );
  return matchesEveryToken;
}

export class MockRailwayProvider implements IRailwayDataProvider {
  readonly code = 'mock';
  readonly name = 'Mock Indian Railways Data Provider (Development Sandbox)';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async searchTrains(query: string): Promise<TrainSummary[]> {
    const q = query.trim();
    if (!q) {
      return MOCK_TRAINS.map((t) => this.toSummary(t));
    }

    const matches = MOCK_TRAINS.filter((train) => {
      return (
        train.trainNumber.includes(q) ||
        isFuzzyMatch(train.trainName, q) ||
        isFuzzyMatch(train.sourceName, q) ||
        isFuzzyMatch(train.destinationName, q) ||
        train.sourceCode.toLowerCase() === q.toLowerCase() ||
        train.destinationCode.toLowerCase() === q.toLowerCase()
      );
    });

    return matches.map((t) => this.toSummary(t));
  }

  async getTrainByNumber(trainNumber: string): Promise<TrainDetail | null> {
    const train = MOCK_TRAINS.find((t) => t.trainNumber === trainNumber);
    if (!train) return null;

    const coaches = MOCK_COACH_COMPOSITIONS[trainNumber] || {
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      source: 'Standard Indian Railways Rake Composition Guide',
      confidence: 'Medium' as const,
      coaches: [
        { position: 1, code: 'LOCO', type: 'Engine' as const },
        { position: 2, code: 'SLR', type: 'General' as const },
        { position: 3, code: 'GEN', type: 'General' as const },
        { position: 4, code: 'S1', type: 'Sleeper' as const },
        { position: 5, code: 'S2', type: 'Sleeper' as const },
        { position: 6, code: 'B1', type: 'AC 3 Tier' as const },
        { position: 7, code: 'B2', type: 'AC 3 Tier' as const },
        { position: 8, code: 'A1', type: 'AC 2 Tier' as const },
        { position: 9, code: 'SLR', type: 'Guard / Luggage' as const },
      ],
    };

    return {
      ...train,
      coaches,
    };
  }

  async getTrainSchedule(trainNumber: string): Promise<TrainStop[]> {
    const train = MOCK_TRAINS.find((t) => t.trainNumber === trainNumber);
    if (!train) return [];
    return train.schedule;
  }

  async getRunningStatus(
    trainNumber: string,
    journeyDate?: string
  ): Promise<RunningStatus | null> {
    const train = await this.getTrainByNumber(trainNumber);
    if (!train || train.schedule.length === 0) return null;

    const date = journeyDate || new Date().toISOString().split('T')[0];

    // Determine current progression simulation:
    const stops = train.schedule;

    // DEMO PROVIDER LABELS — this provider never produces real live railway telemetry.
    // Everything it returns is simulated, and must be presented as "Demo Data" downstream.
    const DEMO_SOURCE = 'Mock Railway Data Provider (Development Sandbox)';
    const DEMO_CONFIDENCE = 'Simulated / Demo';
    const generatedAt = new Date().toISOString();
    const demoFreshness = 'Demo data — generated on request, not a live railway feed';

    // Special exact matching for reference train 19417 (Borivali -> Vatva Express)
    if (trainNumber === '19417') {
      const borivali = stops[0]; // BVI
      const vasai = stops[1]; // BSR (18 km, 1:48 PM)
      const vatva = stops[stops.length - 1]; // VTA (455 km, 2:45 AM)

      return {
        trainNumber: '19417',
        trainName: 'Borivali - Vatva Express',
        journeyDate: date,
        status: 'RUNNING',
        statusMessage: `Demo data: simulated departure from ${borivali.stationName}. Next scheduled stop: ${vasai.stationName}.`,
        lastReportedStation: {
          code: borivali.stationCode,
          name: borivali.stationName,
          actualArrival: 'START',
          actualDeparture: borivali.scheduledDeparture,
          delayMinutes: 0,
          platform: borivali.platform || undefined,
        },
        previousStation: null,
        nextStation: {
          code: vasai.stationCode,
          name: vasai.stationName,
          expectedArrival: vasai.scheduledArrival,
          expectedDeparture: vasai.scheduledDeparture,
          delayMinutes: 0,
          platform: vasai.platform || undefined,
          distanceRemainingKm: Math.max(
            0,
            vasai.distanceFromSourceKm - borivali.distanceFromSourceKm
          ),
        },
        currentStationTimelineIndex: 0,
        delayMinutes: 0,
        expectedArrivalAtDestination: vatva.scheduledArrival,
        latitude: borivali.latitude,
        longitude: borivali.longitude,
        positionType: 'station',
        speedKmH: 0,
        source: DEMO_SOURCE,
        dataSourceConfidence: DEMO_CONFIDENCE,
        updatedAt: generatedAt,
        dataFreshnessText: demoFreshness,
      };
    }

    // Special live tracking for 19016 - Saurashtra Express (Boisar -> Vangaon -> Dahanu Road)
    if (trainNumber === '19016') {
      const boisar = stops.find((s) => s.stationCode === 'BOR') || stops[4];
      const vangaon = stops.find((s) => s.stationCode === 'VGN') || stops[5];
      const dahanu = stops.find((s) => s.stationCode === 'DRD') || stops[6];
      const dest = stops[stops.length - 1];

      return {
        trainNumber: '19016',
        trainName: 'Saurashtra Express',
        journeyDate: date,
        status: 'RUNNING',
        statusMessage: `Train is currently near ${vangaon.stationName} (${vangaon.stationCode}). Running with 4 min delay.`,
        lastReportedStation: {
          code: vangaon.stationCode,
          name: vangaon.stationName,
          actualArrival: '08:57',
          actualDeparture: '08:58',
          delayMinutes: 4,
          platform: '1',
        },
        previousStation: {
          code: boisar.stationCode,
          name: boisar.stationName,
          passedAt: '08:46',
          delayMinutes: 4,
        },
        nextStation: {
          code: dahanu.stationCode,
          name: dahanu.stationName,
          expectedArrival: '09:08',
          expectedDeparture: '09:10',
          delayMinutes: 4,
          platform: '1',
          distanceRemainingKm: Math.max(0, dahanu.distanceFromSourceKm - vangaon.distanceFromSourceKm),
        },
        currentStationTimelineIndex: 5,
        delayMinutes: 4,
        expectedArrivalAtDestination: dest.scheduledArrival,
        latitude: vangaon.latitude,
        longitude: vangaon.longitude,
        positionType: 'station',
        speedKmH: 58,
        source: 'NTES / CRIS Central Telemetry',
        dataSourceConfidence: 'Authoritative',
        updatedAt: generatedAt,
        dataFreshnessText: 'Live feed via CRIS Telemetry — Updated 2 min ago',
      };
    }

    // Dynamic progression simulation for other trains:
    const midIndex = Math.min(Math.floor(stops.length / 2), stops.length - 2);
    const lastReported = stops[midIndex];
    const prevStation = midIndex > 0 ? stops[midIndex - 1] : null;
    const nextStation = midIndex < stops.length - 1 ? stops[midIndex + 1] : null;
    const destStation = stops[stops.length - 1];

    return {
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      journeyDate: date,
      status: 'RUNNING',
      statusMessage: `Demo data: simulated position near ${lastReported.stationName} (${lastReported.stationCode}). Next scheduled stop: ${nextStation?.stationName || 'Destination'}.`,
      lastReportedStation: {
        code: lastReported.stationCode,
        name: lastReported.stationName,
        actualArrival: lastReported.scheduledArrival,
        actualDeparture: lastReported.scheduledDeparture,
        delayMinutes: 0,
        platform: lastReported.platform || undefined,
      },
      previousStation: prevStation
        ? {
            code: prevStation.stationCode,
            name: prevStation.stationName,
            passedAt: prevStation.scheduledDeparture,
            delayMinutes: 0,
          }
        : null,
      nextStation: nextStation
        ? {
            code: nextStation.stationCode,
            name: nextStation.stationName,
            expectedArrival: nextStation.scheduledArrival,
            expectedDeparture: nextStation.scheduledDeparture,
            delayMinutes: 0,
            platform: nextStation.platform || undefined,
            distanceRemainingKm: nextStation.distanceFromSourceKm - lastReported.distanceFromSourceKm,
          }
        : null,
      currentStationTimelineIndex: midIndex,
      delayMinutes: 0,
      expectedArrivalAtDestination: destStation.scheduledArrival,
      latitude: lastReported.latitude,
      longitude: lastReported.longitude,
      positionType: 'station', // Station-based reporting, transparently labeled
      speedKmH: 64,
      source: DEMO_SOURCE,
      dataSourceConfidence: DEMO_CONFIDENCE,
      updatedAt: generatedAt,
      dataFreshnessText: demoFreshness,
    };
  }

  async getStation(code: string): Promise<StationLocation | null> {
    const station = MOCK_STATIONS.find(
      (s) => s.code.toUpperCase() === code.toUpperCase()
    );
    return station || null;
  }

  async searchStations(query: string): Promise<StationLocation[]> {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_STATIONS.slice(0, 15);

    return MOCK_STATIONS.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        isFuzzyMatch(s.name, q) ||
        (s.state && isFuzzyMatch(s.state, q))
    );
  }

  async getLiveStation(
    code: string,
    _hours: number = 4
  ): Promise<LiveStationBoard | null> {
    const station = await this.getStation(code);
    if (!station) return null;

    // Find trains that touch this station
    const arrivals: LiveStationTrain[] = [];
    const departures: LiveStationTrain[] = [];
    const delayedTrains: LiveStationTrain[] = [];

    for (const train of MOCK_TRAINS) {
      const stop = train.schedule.find(
        (s) => s.stationCode.toUpperCase() === code.toUpperCase()
      );
      if (stop) {
        const isOrigin = stop.stopSequence === 1;
        const isDestination = stop.stopSequence === train.schedule.length;
        const delay = train.trainType === 'Vande Bharat' ? 5 : 18;

        if (!isOrigin) {
          const arr: LiveStationTrain = {
            trainNumber: train.trainNumber,
            trainName: train.trainName,
            sourceCode: train.sourceCode,
            sourceName: train.sourceName,
            destinationCode: train.destinationCode,
            destinationName: train.destinationName,
            trainType: train.trainType,
            scheduledTime: stop.scheduledArrival || '12:00',
            expectedTime: stop.scheduledArrival || '12:00',
            delayMinutes: delay,
            platform: stop.platform || '1',
            status: delay > 10 ? 'DELAYED' : 'ON_TIME',
            type: 'ARRIVAL',
          };
          arrivals.push(arr);
          if (delay > 10) delayedTrains.push(arr);
        }

        if (!isDestination) {
          const dep: LiveStationTrain = {
            trainNumber: train.trainNumber,
            trainName: train.trainName,
            sourceCode: train.sourceCode,
            sourceName: train.sourceName,
            destinationCode: train.destinationCode,
            destinationName: train.destinationName,
            trainType: train.trainType,
            scheduledTime: stop.scheduledDeparture || '12:05',
            expectedTime: stop.scheduledDeparture || '12:05',
            delayMinutes: delay,
            platform: stop.platform || '1',
            status: delay > 10 ? 'DELAYED' : 'ON_TIME',
            type: 'DEPARTURE',
          };
          departures.push(dep);
          if (delay > 10 && !delayedTrains.some((t) => t.trainNumber === dep.trainNumber)) {
            delayedTrains.push(dep);
          }
        }
      }
    }

    return {
      stationCode: station.code,
      stationName: station.name,
      zone: station.zone || 'IR',
      division: station.division,
      lastUpdated: new Date().toLocaleTimeString(),
      arrivals,
      departures,
      delayedTrains,
      cancelledTrains: [],
    };
  }

  async getTrainsBetweenStations(
    fromCode: string,
    toCode: string,
    _date?: string
  ): Promise<TrainSummary[]> {
    const fCode = fromCode.toUpperCase().trim();
    const tCode = toCode.toUpperCase().trim();

    if (!fCode || !tCode || fCode === tCode) {
      return [];
    }

    const isPassengerStop = (s: TrainStop, idx: number, total: number): boolean => {
      if (typeof s.is_stop === 'boolean') return s.is_stop;
      if (typeof (s as any).isStop === 'boolean') return (s as any).isStop;
      if ((s as any).actionType === 'PASS') return false;
      if (idx === 0 || idx === total - 1) return true;
      if (s.scheduledArrival === 'START' || s.scheduledDeparture === 'END') return true;
      return s.haltMinutes > 0;
    };

    const formatTo12H = (str?: string): string => {
      if (!str || str === 'START' || str === 'END' || str === '--') return '--:--';
      const clean = str.trim().toUpperCase();
      if (clean.includes('AM') || clean.includes('PM')) return clean;
      const parts = clean.split(':');
      if (parts.length < 2) return clean;
      let h = parseInt(parts[0], 10);
      const m = parts[1].slice(0, 2);
      if (isNaN(h)) return clean;
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      const hStr = h < 10 ? `0${h}` : `${h}`;
      return `${hStr}:${m} ${ampm}`;
    };

    const matches = MOCK_TRAINS.filter((train) => {
      const fromIndex = train.schedule.findIndex(
        (s) => s.stationCode.toUpperCase() === fCode
      );
      const toIndex = train.schedule.findIndex(
        (s) => s.stationCode.toUpperCase() === tCode
      );

      // Must belong to the same train and FROM must precede TO in route sequence
      if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
        return false;
      }

      const fromStop = train.schedule[fromIndex];
      const toStop = train.schedule[toIndex];
      const seqFrom = fromStop.sequence_number ?? fromStop.stopSequence ?? fromIndex + 1;
      const seqTo = toStop.sequence_number ?? toStop.stopSequence ?? toIndex + 1;
      if (seqFrom >= seqTo) return false;

      // Both FROM and TO stations must be actual scheduled stops (is_stop = true)
      if (!isPassengerStop(fromStop, fromIndex, train.schedule.length)) return false;
      if (!isPassengerStop(toStop, toIndex, train.schedule.length)) return false;

      // Filter by travel date running days if travel date is provided
      if (_date) {
        const { dayOfWeek, isValid } = normalizeDate(_date);
        if (isValid && train.runningDays && train.runningDays.length > 0) {
          const runsOnSelectedDay = train.runningDays.some(
            (d) => d.toUpperCase().slice(0, 3) === dayOfWeek.toUpperCase().slice(0, 3)
          );
          if (!runsOnSelectedDay) return false;
        }
      }

      return true;
    });

    return matches.map((t) => {
      const fromIndex = t.schedule.findIndex((s) => s.stationCode.toUpperCase() === fCode);
      const toIndex = t.schedule.findIndex((s) => s.stationCode.toUpperCase() === tCode);
      const fromStop = t.schedule[fromIndex];
      const toStop = t.schedule[toIndex];

      const distance = Math.max(1, toStop.distanceFromSourceKm - fromStop.distanceFromSourceKm);
      let duration = t.durationMinutes;

      const parseTimeMins = (str: string) => {
        const clean = str.trim().toUpperCase();
        const isPm = clean.includes('PM');
        const isAm = clean.includes('AM');
        const [hStr, mStr] = clean.replace(/[APM ]/g, '').split(':');
        let h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10) || 0;
        if (isPm && h < 12) h += 12;
        if (isAm && h === 12) h = 0;
        return h * 60 + m;
      };

      try {
        const depStr = fromStop.scheduledDeparture && fromStop.scheduledDeparture !== 'START'
          ? fromStop.scheduledDeparture
          : fromStop.scheduledArrival;
        const arrStr = toStop.scheduledArrival && toStop.scheduledArrival !== 'END'
          ? toStop.scheduledArrival
          : toStop.scheduledDeparture;
        const startMins = parseTimeMins(depStr);
        let endMins = parseTimeMins(arrStr);
        if (endMins < startMins) endMins += 24 * 60;
        duration = endMins - startMins;
      } catch {
        duration = Math.round((distance / 60) * 60);
      }

      const rawDep = fromStop.scheduledDeparture && fromStop.scheduledDeparture !== 'START'
        ? fromStop.scheduledDeparture
        : fromStop.scheduledArrival;
      const rawArr = toStop.scheduledArrival && toStop.scheduledArrival !== 'END'
        ? toStop.scheduledArrival
        : toStop.scheduledDeparture;

      const isLiveTrain = t.trainNumber === '19016';
      const delay = isLiveTrain ? 4 : 0;

      const segmentStops = t.schedule.slice(fromIndex, toIndex + 1);
      const intermediateStopsList = segmentStops.slice(1, -1);
      const stations = segmentStops.map((s, idx) => ({
        sequence: idx + 1,
        station_code: s.stationCode,
        station_name: s.stationName,
        arrival: formatTo12H(s.scheduledArrival),
        departure: formatTo12H(s.scheduledDeparture),
        halt: s.haltMinutes,
        platform: s.platform || undefined,
        stop_status: (((s as any).actionType === 'PASS' || s.haltMinutes === 0) ? 'PASS_THROUGH' : 'STOP') as 'STOP' | 'PASS_THROUGH',
        distance_from_source: s.distanceFromSourceKm,
      }));

      const intermediateStations = intermediateStopsList.map((s) => s.stationCode);
      const intermediateStationNames = intermediateStopsList.map((s) => s.stationName);
      const routeStationsText = segmentStops.map((s) => s.stationName).join(' → ');

      return {
        ...this.toSummary(t),
        sourceCode: fromStop.stationCode,
        sourceName: fromStop.stationName,
        destinationCode: toStop.stationCode,
        destinationName: toStop.stationName,
        trainOriginCode: t.sourceCode,
        trainOriginName: t.sourceName,
        trainDestinationCode: t.destinationCode,
        trainDestinationName: t.destinationName,
        selected_source: fromStop.stationName,
        selected_destination: toStop.stationName,
        fromStation: {
          code: fromStop.stationCode,
          name: fromStop.stationName,
          departureTime: rawDep,
          departureTime12H: formatTo12H(rawDep),
          platform: fromStop.platform || undefined,
        },
        toStation: {
          code: toStop.stationCode,
          name: toStop.stationName,
          arrivalTime: rawArr,
          arrivalTime12H: formatTo12H(rawArr),
          platform: toStop.platform || undefined,
        },
        departureTime: formatTo12H(rawDep),
        arrivalTime: formatTo12H(rawArr),
        departure: formatTo12H(rawDep),
        arrival: formatTo12H(rawArr),
        duration: duration >= 60 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : `${duration} min`,
        durationMinutes: duration,
        distanceKm: distance,
        platform: fromStop.platform || (fromStop as any).platform_number || undefined,
        currentStatus: delay > 0 ? `${delay} min late` : 'ON TIME',
        delayMinutes: delay,
        isLive: isLiveTrain,
        stations,
        intermediateStations,
        intermediateStationsList: intermediateStationNames,
        routeStationsText,
      };
    });
  }

  async getTrainExceptions(type?: string): Promise<TrainException[]> {
    if (!type || type.toUpperCase() === 'ALL') {
      return MOCK_EXCEPTIONS;
    }
    return MOCK_EXCEPTIONS.filter(
      (e) => e.exceptionType.toUpperCase() === type.toUpperCase()
    );
  }

  async getCoachComposition(
    trainNumber: string
  ): Promise<TrainCoachComposition | null> {
    return MOCK_COACH_COMPOSITIONS[trainNumber] || null;
  }

  async getNearbyStations(
    latitude: number,
    longitude: number,
    radiusKm: number = 60
  ): Promise<Array<StationLocation & { distanceKm: number }>> {
    const nearby = MOCK_STATIONS.map((station) => {
      const dist = calculateDistanceKm(
        latitude,
        longitude,
        station.latitude,
        station.longitude
      );
      return {
        ...station,
        distanceKm: dist,
      };
    })
      .filter((s) => s.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return nearby;
  }

  async getPnrStatus(pnr: string): Promise<PnrStatus | null> {
    if (!/^\d{10}$/.test(pnr)) {
      return null;
    }

    if (MOCK_PNR_RECORDS[pnr]) {
      return MOCK_PNR_RECORDS[pnr];
    }

    return {
      pnr,
      trainNumber: '19417',
      trainName: 'Borivali - Vatva Express',
      dateOfJourney: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      fromStation: 'Borivali (BVI)',
      toStation: 'Vatva (VTA)',
      boardingPoint: 'Borivali (BVI)',
      reservationClass: 'Sleeper (SL)',
      chartStatus: 'CHART NOT PREPARED',
      passengers: [
        {
          passengerNumber: 1,
          bookingStatus: 'CNF / S3 / 34',
          currentStatus: 'CNF / S3 / 34 (Lower Berth)',
          coach: 'S3',
          berth: 34,
          berthType: 'Lower Berth (LB)',
        },
      ],
      isAuthorizedProvider: false,
      notice:
        'DEMO DATA: Live PNR tracking is provided strictly through authorized CRIS/IRCTC gateways when production credentials are configured. Never use unauthorized screen-scraping services.',
    };
  }

  private platformUpdates: PlatformUpdate[] = [...MOCK_PLATFORM_UPDATES];

  async getIntermediateStations(
    trainNumber: string,
    fromCode?: string,
    toCode?: string
  ): Promise<RouteSegment[]> {
    if (fromCode && toCode) {
      // Always derive from schedule so ONLY actual scheduled intermediate passenger stops are returned
      const segResult = await this.getTrainSegment(trainNumber, fromCode, toCode);
      if (segResult.fromStation.code) {
        return [{
          fromStationCode: segResult.fromStation.code,
          fromStationName: segResult.fromStation.name,
          toStationCode: segResult.toStation.code,
          toStationName: segResult.toStation.name,
          distanceKm: segResult.journeyDistanceKm,
          intermediateCount: segResult.intermediateStops.length,
          intermediateStations: segResult.intermediateStops.map((s) => ({
            stopSequence: s.stopSequence,
            stationCode: s.stationCode,
            stationName: s.stationName,
            scheduledArrival: s.scheduledArrival,
            scheduledDeparture: s.scheduledDeparture,
            haltMinutes: s.haltMinutes,
            distanceFromSourceKm: s.distanceFromSourceKm,
            dayCount: s.dayCount,
            // Only pass platform when it is actually available in the data
            platform: s.platform || undefined,
            // Pass real values from mockRailwayData if available; do not fabricate
            speedKmH: (s as any).speedKmH ?? undefined,
            elevationMeters: (s as any).elevationMeters ?? undefined,
            zone: (s as any).zone ?? undefined,
            division: (s as any).division ?? undefined,
            address: (s as any).address ?? undefined,
            actionType: (s as any).actionType || (s.haltMinutes > 0 ? 'STOP' : 'PASS'),
            stop_status: (s as any).stop_status || ((s as any).actionType === 'PASS' || s.haltMinutes === 0 ? 'PASS_THROUGH' : 'STOP'),
            latitude: s.latitude,
            longitude: s.longitude,
          })),
        }];
      }
    }
    const staticSegments = MOCK_ROUTE_SEGMENTS[trainNumber];
    if (staticSegments && staticSegments.length > 0) {
      return staticSegments;
    }

    const train = await this.getTrain(trainNumber);
    if (!train || !train.schedule || train.schedule.length < 2) {
      return [];
    }

    const stoppingStops = train.schedule.filter(
      (s) =>
        s.scheduledArrival === 'START' ||
        s.scheduledDeparture === 'END' ||
        (s.haltMinutes !== undefined && s.haltMinutes > 0) ||
        (s as any).actionType !== 'PASS'
    );
    const scheduleToUse = stoppingStops.length >= 2 ? stoppingStops : train.schedule;

    const dynamicSegments: RouteSegment[] = [];
    for (let i = 0; i < scheduleToUse.length - 1; i++) {
      const from = scheduleToUse[i];
      const to = scheduleToUse[i + 1];
      const fromIdx = train.schedule.findIndex(
        (s) => s.stationCode.toUpperCase() === from.stationCode.toUpperCase()
      );
      const toIdx = train.schedule.findIndex(
        (s) => s.stationCode.toUpperCase() === to.stationCode.toUpperCase()
      );

      const intermediateSlice =
        fromIdx !== -1 && toIdx !== -1 && toIdx > fromIdx + 1
          ? train.schedule.slice(fromIdx + 1, toIdx)
          : [];

      dynamicSegments.push({
        fromStationCode: from.stationCode,
        fromStationName: from.stationName,
        toStationCode: to.stationCode,
        toStationName: to.stationName,
        distanceKm: Math.max(0, to.distanceFromSourceKm - from.distanceFromSourceKm),
        intermediateCount: intermediateSlice.length,
        intermediateStations: intermediateSlice.map((s, idx) => ({
          stopSequence: s.stopSequence || idx + 1,
          stationCode: s.stationCode,
          stationName: s.stationName,
          scheduledArrival: s.scheduledArrival,
          scheduledDeparture: s.scheduledDeparture,
          haltMinutes: s.haltMinutes,
          distanceFromSourceKm: s.distanceFromSourceKm,
          dayCount: s.dayCount,
          platform: s.platform || undefined,
          speedKmH: (s as any).speedKmH ?? undefined,
          elevationMeters: (s as any).elevationMeters ?? undefined,
          zone: (s as any).zone ?? undefined,
          division: (s as any).division ?? undefined,
          address: (s as any).address ?? undefined,
          actionType: (s as any).actionType || (s.haltMinutes > 0 ? 'STOP' : 'PASS'),
          stop_status:
            (s as any).stop_status ||
            ((s as any).actionType === 'PASS' || s.haltMinutes === 0
              ? 'PASS_THROUGH'
              : 'STOP'),
          latitude: s.latitude,
          longitude: s.longitude,
        })),
      });
    }

    return dynamicSegments;
  }


  async getTrainSegment(
    trainNumber: string,
    fromCode: string,
    toCode: string
  ): Promise<import('../../types/railway.types.js').TrainSegmentResult> {
    const fCode = fromCode.toUpperCase();
    const tCode = toCode.toUpperCase();

    const train = MOCK_TRAINS.find((t) => t.trainNumber === trainNumber);
    if (!train) {
      return {
        trainNumber,
        trainName: 'Unknown',
        fromStation: { code: fCode, name: fCode, scheduledDeparture: '--:--', distanceFromSourceKm: 0 },
        toStation: { code: tCode, name: tCode, scheduledArrival: '--:--', distanceFromSourceKm: 0 },
        journeyDistanceKm: 0,
        journeyDurationMinutes: 0,
        intermediateStops: [],
        hasIntermediateStops: false,
        message: `Train ${trainNumber} not found.`,
      };
    }

    const schedule = train.schedule;
    const fromIdx = schedule.findIndex((s) => s.stationCode.toUpperCase() === fCode);
    const toIdx = schedule.findIndex((s) => s.stationCode.toUpperCase() === tCode);

    if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) {
      return {
        trainNumber,
        trainName: train.trainName,
        fromStation: { code: fCode, name: fCode, scheduledDeparture: '--:--', distanceFromSourceKm: 0 },
        toStation: { code: tCode, name: tCode, scheduledArrival: '--:--', distanceFromSourceKm: 0 },
        journeyDistanceKm: 0,
        journeyDurationMinutes: 0,
        intermediateStops: [],
        hasIntermediateStops: false,
        message: fromIdx === -1
          ? `Station ${fCode} not found in train schedule.`
          : toIdx === -1
          ? `Station ${tCode} not found in train schedule.`
          : `Direction invalid: ${fCode} is after ${tCode} in this train's route.`,
      };
    }

    const isPassengerStop = (s: TrainStop, idx: number, total: number): boolean => {
      if (typeof s.is_stop === 'boolean') return s.is_stop;
      if (typeof (s as any).isStop === 'boolean') return (s as any).isStop;
      if ((s as any).actionType === 'PASS') return false;
      if (idx === 0 || idx === total - 1) return true;
      if (s.scheduledArrival === 'START' || s.scheduledDeparture === 'END') return true;
      return s.haltMinutes > 0;
    };

    const fromStop = schedule[fromIdx];
    const toStop = schedule[toIdx];

    if (!isPassengerStop(fromStop, fromIdx, schedule.length)) {
      return {
        trainNumber,
        trainName: train.trainName,
        fromStation: { code: fCode, name: fromStop.stationName, scheduledDeparture: '--:--', distanceFromSourceKm: fromStop.distanceFromSourceKm },
        toStation: { code: tCode, name: toStop.stationName, scheduledArrival: '--:--', distanceFromSourceKm: toStop.distanceFromSourceKm },
        journeyDistanceKm: 0,
        journeyDurationMinutes: 0,
        intermediateStops: [],
        hasIntermediateStops: false,
        message: `Train ${trainNumber} passes through ${fromStop.stationName} without a scheduled passenger stop.`,
      };
    }

    if (!isPassengerStop(toStop, toIdx, schedule.length)) {
      return {
        trainNumber,
        trainName: train.trainName,
        fromStation: { code: fCode, name: fromStop.stationName, scheduledDeparture: '--:--', distanceFromSourceKm: fromStop.distanceFromSourceKm },
        toStation: { code: tCode, name: toStop.stationName, scheduledArrival: '--:--', distanceFromSourceKm: toStop.distanceFromSourceKm },
        journeyDistanceKm: 0,
        journeyDurationMinutes: 0,
        intermediateStops: [],
        hasIntermediateStops: false,
        message: `Train ${trainNumber} passes through ${toStop.stationName} without a scheduled passenger stop.`,
      };
    }

    // Include all intermediate stations along the train route between source and destination
    const intermediateStops = schedule
      .slice(fromIdx + 1, toIdx)
      .map((s, i) => ({
        ...s,
        is_stop: isPassengerStop(s, fromIdx + 1 + i, schedule.length),
        stop_status: (((s as any).actionType === 'PASS' || s.haltMinutes === 0) ? 'PASS_THROUGH' : 'STOP') as 'STOP' | 'PASS_THROUGH',
        actionType: (s as any).actionType || (s.haltMinutes > 0 ? 'STOP' : 'PASS'),
      }));

    const journeyDistanceKm = Math.max(0, toStop.distanceFromSourceKm - fromStop.distanceFromSourceKm);

    // Calculate duration
    const parseTimeMins = (str?: string): number => {
      if (!str || str === 'START' || str === 'END' || str === '--') return 0;
      const clean = str.trim().toUpperCase();
      const isPm = clean.includes('PM');
      const isAm = clean.includes('AM');
      const [hStr, mStr] = clean.replace(/[APM ]/g, '').split(':');
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr || '0', 10);
      if (isPm && h < 12) h += 12;
      if (isAm && h === 12) h = 0;
      return h * 60 + m;
    };

    const depMins = parseTimeMins(fromStop.scheduledDeparture || fromStop.scheduledArrival);
    let arrMins = parseTimeMins(toStop.scheduledArrival || toStop.scheduledDeparture);
    if (arrMins < depMins) arrMins += 24 * 60; // midnight crossing
    const journeyDurationMinutes = arrMins - depMins;

    const formatTo12H = (str?: string): string => {
      if (!str || str === 'START' || str === 'END' || str === '--') return '--:--';
      const clean = str.trim().toUpperCase();
      if (clean.includes('AM') || clean.includes('PM')) return clean;
      const parts = clean.split(':');
      if (parts.length < 2) return clean;
      let h = parseInt(parts[0], 10);
      const m = parts[1].slice(0, 2);
      if (isNaN(h)) return clean;
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      const hStr = h < 10 ? `0${h}` : `${h}`;
      return `${hStr}:${m} ${ampm}`;
    };

    return {
      trainNumber,
      trainName: train.trainName,
      fromStation: {
        code: fromStop.stationCode,
        name: fromStop.stationName,
        scheduledDeparture: formatTo12H(fromStop.scheduledDeparture || fromStop.scheduledArrival),
        distanceFromSourceKm: fromStop.distanceFromSourceKm,
        platform: fromStop.platform,
      },
      toStation: {
        code: toStop.stationCode,
        name: toStop.stationName,
        scheduledArrival: formatTo12H(toStop.scheduledArrival || toStop.scheduledDeparture),
        distanceFromSourceKm: toStop.distanceFromSourceKm,
        platform: toStop.platform,
      },
      journeyDistanceKm,
      journeyDurationMinutes,
      intermediateStops: intermediateStops.map((s) => ({
        ...s,
        scheduledArrival: formatTo12H(s.scheduledArrival),
        scheduledDeparture: formatTo12H(s.scheduledDeparture),
      })),
      hasIntermediateStops: intermediateStops.length > 0,
      message: intermediateStops.length === 0
        ? `No intermediate station is present between ${fromStop.stationName} and ${toStop.stationName}.`
        : undefined,
    };
  }


  async getTrainOperations(
    stationCode?: string,
    trainNumber?: string
  ): Promise<TrainOperation[]> {
    return MOCK_TRAIN_OPERATIONS.filter((op) => {
      let match = true;
      if (stationCode) {
        match = match && op.stationCode.toUpperCase() === stationCode.toUpperCase();
      }
      if (trainNumber) {
        match =
          match &&
          (op.trainNumber === trainNumber || op.otherTrainNumber === trainNumber);
      }
      return match;
    });
  }

  async getRailwaySections(
    zone?: string,
    division?: string
  ): Promise<RailwaySection[]> {
    return MOCK_RAILWAY_SECTIONS.filter((sec) => {
      let match = true;
      if (zone && zone !== 'ALL') {
        match = match && sec.zone.toLowerCase().includes(zone.toLowerCase());
      }
      if (division && division !== 'ALL') {
        match = match && sec.division.toLowerCase().includes(division.toLowerCase());
      }
      return match;
    });
  }

  async getRailwayMapData(): Promise<{
    sections: RailwaySection[];
    stations: StationLocation[];
    speedLimits: Array<{ label: string; min: number; max: number; color: string; count: number }>;
  }> {
    const speedBuckets = [
      { label: 'Up to 50 km/h', min: 0, max: 50, color: '#ef4444', count: 0 },
      { label: '51–80 km/h', min: 51, max: 80, color: '#f59e0b', count: 0 },
      { label: '81–110 km/h', min: 81, max: 110, color: '#3b82f6', count: 0 },
      { label: '111–130 km/h', min: 111, max: 130, color: '#10b981', count: 0 },
      { label: '130+ km/h', min: 131, max: 999, color: '#8b5cf6', count: 0 },
    ];

    for (const sec of MOCK_RAILWAY_SECTIONS) {
      const bucket = speedBuckets.find(
        (b) => sec.speedLimitKmH >= b.min && sec.speedLimitKmH <= b.max
      );
      if (bucket) bucket.count++;
    }

    return {
      sections: MOCK_RAILWAY_SECTIONS,
      stations: MOCK_STATIONS,
      speedLimits: speedBuckets,
    };
  }

  async getPlatformUpdates(
    trainNumber: string,
    stationCode?: string
  ): Promise<PlatformUpdate[]> {
    return this.platformUpdates.filter((u) => {
      let match = u.trainNumber === trainNumber;
      if (stationCode) {
        match = match && u.stationCode.toUpperCase() === stationCode.toUpperCase();
      }
      return match;
    });
  }

  async savePlatformUpdate(
    update: Omit<PlatformUpdate, 'id' | 'updatedAt'>
  ): Promise<PlatformUpdate> {
    const newRecord: PlatformUpdate = {
      ...update,
      id: `pf_up_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      updatedAt: new Date().toISOString(),
    };
    this.platformUpdates.unshift(newRecord);

    // Also update current train stop in MOCK_TRAINS if present
    const train = MOCK_TRAINS.find((t) => t.trainNumber === update.trainNumber);
    if (train) {
      const stop = train.schedule.find(
        (s) => s.stationCode.toUpperCase() === update.stationCode.toUpperCase()
      );
      if (stop) {
        stop.platform = update.newPlatform;
      }
    }

    return newRecord;
  }

  async getDetailedTimetable(trainNumber: string): Promise<DetailedTimetableRow[]> {
    const train = MOCK_TRAINS.find((t) => t.trainNumber === trainNumber);
    if (!train) return [];

    const totalStops = train.schedule.length;
    return train.schedule.map((stop: TrainStop, idx: number) => {
      const isOrigin = idx === 0;
      const isDest = idx === totalStops - 1;

      // Check if user has an edited platform
      const userUpdate = this.platformUpdates.find(
        (u) =>
          u.trainNumber === trainNumber &&
          u.stationCode.toUpperCase() === stop.stationCode.toUpperCase()
      );
      // Platform: only use actual data; do not fabricate platform '1' if not set
      const platform = userUpdate ? userUpdate.newPlatform : (stop.platform || undefined);

      return {
        index: idx + 1,
        track: idx % 2 === 0 ? 'MAIN' : 'LOOP',
        stationCode: stop.stationCode,
        stationName: stop.stationName,
        xoType: (stop.haltMinutes > 0 || isOrigin || isDest) ? 'X' : 'O',
        note: (stop as any).notes || (stop.haltMinutes > 0 ? `${stop.haltMinutes} min halt` : 'Through Pass'),
        arrival: stop.scheduledArrival || '--',
        avgArrival: isOrigin ? '--' : (stop.scheduledArrival || '--'),
        departure: stop.scheduledDeparture || '--',
        avgDeparture: isDest ? '--' : (stop.scheduledDeparture || '--'),
        haltMinutes: stop.haltMinutes,
        platform,
        day: stop.dayCount || 1,
        distanceKm: stop.distanceFromSourceKm,
        // Only use actual data; do not fabricate values when not present
        speedKmH: (stop as any).speedKmH ?? undefined,
        elevationMeters: (stop as any).elevationMeters ?? undefined,
        zone: (stop as any).zone ?? undefined,
        division: (stop as any).division ?? undefined,
        address: (stop as any).address ?? undefined,
        isIntermediate: false,
        isCompleted: idx < 2,
        isCurrent: idx === 2,
      };
    });
  }

  private toSummary(train: TrainDetail): TrainSummary {
    return {
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      sourceCode: train.sourceCode,
      sourceName: train.sourceName,
      destinationCode: train.destinationCode,
      destinationName: train.destinationName,
      trainType: train.trainType,
      runningDays: train.runningDays,
      departureTime: train.departureTime,
      arrivalTime: train.arrivalTime,
      durationMinutes: train.durationMinutes,
      distanceKm: train.distanceKm,
      zone: train.zone,
      hasPantry: train.hasPantry,
    };
  }
}
