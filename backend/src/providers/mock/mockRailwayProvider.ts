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
} from '../../types/railway.types.js';
import {
  MOCK_STATIONS,
  MOCK_TRAINS,
  MOCK_COACH_COMPOSITIONS,
  MOCK_EXCEPTIONS,
} from './mockRailwayData.js';

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
    // We pick station at index 3 or 4 to demonstrate live progress realistically
    const stops = train.schedule;
    const midIndex = Math.min(Math.floor(stops.length / 2), stops.length - 2);
    const lastReported = stops[midIndex];
    const prevStation = midIndex > 0 ? stops[midIndex - 1] : null;
    const nextStation = midIndex < stops.length - 1 ? stops[midIndex + 1] : null;
    const destStation = stops[stops.length - 1];

    // Realistic delay: Vande Bharat usually runs close to on-time (5-10m delay), others may have 12-25m
    const simulatedDelay = train.trainType === 'Vande Bharat' ? 6 : 14;

    return {
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      journeyDate: date,
      status: 'RUNNING',
      statusMessage: `Train passed ${lastReported.stationName} (${lastReported.stationCode}) running with +${simulatedDelay} min delay. Next stop: ${nextStation?.stationName || 'Destination'}.`,
      lastReportedStation: {
        code: lastReported.stationCode,
        name: lastReported.stationName,
        actualArrival: lastReported.scheduledArrival,
        actualDeparture: lastReported.scheduledDeparture,
        delayMinutes: simulatedDelay,
        platform: lastReported.platform || '1',
      },
      previousStation: prevStation
        ? {
            code: prevStation.stationCode,
            name: prevStation.stationName,
            passedAt: prevStation.scheduledDeparture,
            delayMinutes: Math.max(0, simulatedDelay - 4),
          }
        : null,
      nextStation: nextStation
        ? {
            code: nextStation.stationCode,
            name: nextStation.stationName,
            expectedArrival: nextStation.scheduledArrival,
            expectedDeparture: nextStation.scheduledDeparture,
            delayMinutes: simulatedDelay,
            platform: nextStation.platform || '2',
            distanceRemainingKm: nextStation.distanceFromSourceKm - lastReported.distanceFromSourceKm,
          }
        : null,
      currentStationTimelineIndex: midIndex,
      delayMinutes: simulatedDelay,
      expectedArrivalAtDestination: destStation.scheduledArrival,
      latitude: lastReported.latitude,
      longitude: lastReported.longitude,
      positionType: 'station', // Station-based reporting, transparently labeled
      speedKmH: train.trainType === 'Vande Bharat' ? 115 : 92,
      locoNumber: train.locoType?.includes('WAP-7')
        ? 'WAP-7 #30491 (BRC Shed)'
        : 'Vande Bharat Trainset Rake #08',
      source: 'Mock Railway Data Provider (Development Sandbox)',
      dataSourceConfidence: 'Simulated / Demo',
      updatedAt: new Date().toISOString(),
      dataFreshnessText: 'Last reported at station • Demo provider active',
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
    const fCode = fromCode.toUpperCase();
    const tCode = toCode.toUpperCase();

    const matches = MOCK_TRAINS.filter((train) => {
      const fromIndex = train.schedule.findIndex(
        (s) => s.stationCode.toUpperCase() === fCode
      );
      const toIndex = train.schedule.findIndex(
        (s) => s.stationCode.toUpperCase() === tCode
      );
      return fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex;
    });

    return matches.map((t) => this.toSummary(t));
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

    return {
      pnr,
      trainNumber: '20901',
      trainName: 'Vande Bharat Express',
      dateOfJourney: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      fromStation: 'MMCT - Mumbai Central',
      toStation: 'ADI - Ahmedabad Junction',
      boardingPoint: 'BVI - Borivali',
      reservationClass: 'Executive Chair Car (EC)',
      chartStatus: 'CHART NOT PREPARED',
      passengers: [
        {
          passengerNumber: 1,
          bookingStatus: 'CNF / E1 / 18',
          currentStatus: 'CNF / E1 / 18 (Window Seat)',
          coach: 'E1',
          berth: 18,
          berthType: 'Window Seat',
        },
      ],
      isAuthorizedProvider: false,
      notice:
        'DEMO DATA: Live PNR tracking is provided strictly through authorized CRIS/IRCTC gateways when production credentials are configured. Never use unauthorized screen-scraping services.',
    };
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
