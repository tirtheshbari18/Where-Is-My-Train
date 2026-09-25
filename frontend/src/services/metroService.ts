// Metro Service for Mumbai Metro network

export interface MetroLineItem {
  id: string;
  name: string;
  number: string;
  color: string;
  badgeBg: string;
  terminalFrom: string;
  terminalTo: string;
  distanceKm: number;
  stationCount: number;
  frequencyMinutes: number;
  firstTrainTime: string;
  lastTrainTime: string;
  stations: Array<{
    code: string;
    name: string;
    lineId: string;
    lineName: string;
    sequence: number;
    latitude: number;
    longitude: number;
    isInterchange: boolean;
    interchangeLines?: string[];
    platforms: string[];
  }>;
}

export interface MetroRoutePlan {
  fromStation: string;
  toStation: string;
  sameLine: boolean;
  linesUsed: string[];
  interchangeStations: string[];
  stopsCount: number;
  estimatedMinutes: number;
  fareToken: number;
  fareCard: number;
  firstTrain: string;
  lastTrain: string;
  frequency: string;
  path: string[];
}

export interface MetroIndicatorTrain {
  lineName: string;
  destination: string;
  platform: string;
  etaMinutes: number;
  status: string;
}

const FALLBACK_METRO_LINES: MetroLineItem[] = [
  {
    id: 'line-1',
    name: 'Blue Line 1',
    number: 'Line 1',
    color: '#0284C7',
    badgeBg: 'bg-sky-600',
    terminalFrom: 'Versova',
    terminalTo: 'Ghatkopar',
    distanceKm: 11.4,
    stationCount: 12,
    frequencyMinutes: 4,
    firstTrainTime: '05:30 AM',
    lastTrainTime: '11:40 PM',
    stations: [
      { code: 'VER', name: 'Versova', lineId: 'line-1', lineName: 'Blue Line 1', sequence: 1, latitude: 19.1311, longitude: 72.8182, isInterchange: false, platforms: ['1', '2'] },
      { code: 'DNN', name: 'D.N. Nagar', lineId: 'line-1', lineName: 'Blue Line 1', sequence: 2, latitude: 19.1278, longitude: 72.8291, isInterchange: true, interchangeLines: ['Line 2A (Yellow)'], platforms: ['1', '2'] },
      { code: 'AZD', name: 'Azad Nagar', lineId: 'line-1', lineName: 'Blue Line 1', sequence: 3, latitude: 19.1264, longitude: 72.8368, isInterchange: false, platforms: ['1', '2'] },
      { code: 'ADH_M', name: 'Andheri Metro', lineId: 'line-1', lineName: 'Blue Line 1', sequence: 4, latitude: 19.1205, longitude: 72.8471, isInterchange: true, interchangeLines: ['Western Railway Local'], platforms: ['1', '2'] },
      { code: 'WEH', name: 'Western Express Highway', lineId: 'line-1', lineName: 'Blue Line 1', sequence: 5, latitude: 19.1177, longitude: 72.8558, isInterchange: true, interchangeLines: ['Line 7 (Red)'], platforms: ['1', '2'] },
      { code: 'CKL', name: 'Chakala (J.B. Nagar)', lineId: 'line-1', lineName: 'Blue Line 1', sequence: 6, latitude: 19.1136, longitude: 72.8647, isInterchange: false, platforms: ['1', '2'] },
      { code: 'APM', name: 'Airport Road', lineId: 'line-1', lineName: 'Blue Line 1', sequence: 7, latitude: 19.1098, longitude: 72.8752, isInterchange: false, platforms: ['1', '2'] },
      { code: 'MRN', name: 'Marol Naka', lineId: 'line-1', lineName: 'Blue Line 1', sequence: 8, latitude: 19.1082, longitude: 72.8856, isInterchange: true, interchangeLines: ['Line 3 (Aqua Underground)'], platforms: ['1', '2'] },
      { code: 'SAKI', name: 'Saki Naka', lineId: 'line-1', lineName: 'Blue Line 1', sequence: 9, latitude: 19.1051, longitude: 72.8943, isInterchange: false, platforms: ['1', '2'] },
      { code: 'ASL', name: 'Asalpha', lineId: 'line-1', lineName: 'Blue Line 1', sequence: 10, latitude: 19.1009, longitude: 72.9022, isInterchange: false, platforms: ['1', '2'] },
      { code: 'JAG', name: 'Jagruti Nagar', lineId: 'line-1', lineName: 'Blue Line 1', sequence: 11, latitude: 19.0945, longitude: 72.9067, isInterchange: false, platforms: ['1', '2'] },
      { code: 'GHK', name: 'Ghatkopar', lineId: 'line-1', lineName: 'Blue Line 1', sequence: 12, latitude: 19.0865, longitude: 72.9089, isInterchange: true, interchangeLines: ['Central Railway Local'], platforms: ['1', '2'] },
    ],
  },
  {
    id: 'line-2a',
    name: 'Yellow Line 2A',
    number: 'Line 2A',
    color: '#EAB308',
    badgeBg: 'bg-amber-500',
    terminalFrom: 'Dahisar East',
    terminalTo: 'Andheri West (D.N. Nagar)',
    distanceKm: 18.6,
    stationCount: 9,
    frequencyMinutes: 5,
    firstTrainTime: '06:00 AM',
    lastTrainTime: '11:00 PM',
    stations: [
      { code: 'DHE', name: 'Dahisar East', lineId: 'line-2a', lineName: 'Yellow Line 2A', sequence: 1, latitude: 19.2558, longitude: 72.8687, isInterchange: true, platforms: ['1', '2'] },
      { code: 'ANP', name: 'Anand Nagar', lineId: 'line-2a', lineName: 'Yellow Line 2A', sequence: 2, latitude: 19.2510, longitude: 72.8590, isInterchange: false, platforms: ['1', '2'] },
      { code: 'BVI_W', name: 'Borivali West', lineId: 'line-2a', lineName: 'Yellow Line 2A', sequence: 3, latitude: 19.2310, longitude: 72.8460, isInterchange: false, platforms: ['1', '2'] },
      { code: 'KDV_W', name: 'Kandivali West', lineId: 'line-2a', lineName: 'Yellow Line 2A', sequence: 4, latitude: 19.2080, longitude: 72.8390, isInterchange: false, platforms: ['1', '2'] },
      { code: 'MLD_W', name: 'Malad West', lineId: 'line-2a', lineName: 'Yellow Line 2A', sequence: 5, latitude: 19.1860, longitude: 72.8340, isInterchange: false, platforms: ['1', '2'] },
      { code: 'GOR_W', name: 'Goregaon West', lineId: 'line-2a', lineName: 'Yellow Line 2A', sequence: 6, latitude: 19.1620, longitude: 72.8310, isInterchange: false, platforms: ['1', '2'] },
      { code: 'OSH', name: 'Oshiwara', lineId: 'line-2a', lineName: 'Yellow Line 2A', sequence: 7, latitude: 19.1480, longitude: 72.8300, isInterchange: false, platforms: ['1', '2'] },
      { code: 'ADW', name: 'Andheri West (D.N. Nagar)', lineId: 'line-2a', lineName: 'Yellow Line 2A', sequence: 8, latitude: 19.1280, longitude: 72.8290, isInterchange: true, platforms: ['1', '2'] },
    ],
  },
  {
    id: 'line-7',
    name: 'Red Line 7',
    number: 'Line 7',
    color: '#EF4444',
    badgeBg: 'bg-red-600',
    terminalFrom: 'Dahisar East',
    terminalTo: 'Gundavali (Andheri East)',
    distanceKm: 16.5,
    stationCount: 9,
    frequencyMinutes: 5,
    firstTrainTime: '06:00 AM',
    lastTrainTime: '11:15 PM',
    stations: [
      { code: 'DHE_7', name: 'Dahisar East', lineId: 'line-7', lineName: 'Red Line 7', sequence: 1, latitude: 19.2558, longitude: 72.8687, isInterchange: true, platforms: ['1', '2'] },
      { code: 'NGE', name: 'National Park (Borivali)', lineId: 'line-7', lineName: 'Red Line 7', sequence: 2, latitude: 19.2290, longitude: 72.8650, isInterchange: false, platforms: ['1', '2'] },
      { code: 'MGD', name: 'Magathane', lineId: 'line-7', lineName: 'Red Line 7', sequence: 3, latitude: 19.2080, longitude: 72.8620, isInterchange: false, platforms: ['1', '2'] },
      { code: 'AKR', name: 'Akurli (Kandivali)', lineId: 'line-7', lineName: 'Red Line 7', sequence: 4, latitude: 19.1950, longitude: 72.8600, isInterchange: false, platforms: ['1', '2'] },
      { code: 'DIN', name: 'Dindoshi (Malad)', lineId: 'line-7', lineName: 'Red Line 7', sequence: 5, latitude: 19.1760, longitude: 72.8590, isInterchange: false, platforms: ['1', '2'] },
      { code: 'AAR', name: 'Aarey', lineId: 'line-7', lineName: 'Red Line 7', sequence: 6, latitude: 19.1550, longitude: 72.8570, isInterchange: true, platforms: ['1', '2'] },
      { code: 'GUN', name: 'Gundavali (Andheri East)', lineId: 'line-7', lineName: 'Red Line 7', sequence: 7, latitude: 19.1177, longitude: 72.8558, isInterchange: true, platforms: ['1', '2'] },
    ],
  },
  {
    id: 'line-3',
    name: 'Aqua Line 3 (Underground)',
    number: 'Line 3',
    color: '#06B6D4',
    badgeBg: 'bg-cyan-600',
    terminalFrom: 'Aarey JVLR',
    terminalTo: 'BKC (Bandra Kurla Complex)',
    distanceKm: 12.4,
    stationCount: 8,
    frequencyMinutes: 6,
    firstTrainTime: '06:30 AM',
    lastTrainTime: '10:30 PM',
    stations: [
      { code: 'AAR_JV', name: 'Aarey JVLR', lineId: 'line-3', lineName: 'Aqua Line 3', sequence: 1, latitude: 19.1412, longitude: 72.8710, isInterchange: false, platforms: ['1', '2'] },
      { code: 'SEEPZ', name: 'SEEPZ', lineId: 'line-3', lineName: 'Aqua Line 3', sequence: 2, latitude: 19.1285, longitude: 72.8790, isInterchange: false, platforms: ['1', '2'] },
      { code: 'MIDC', name: 'MIDC Andheri', lineId: 'line-3', lineName: 'Aqua Line 3', sequence: 3, latitude: 19.1190, longitude: 72.8750, isInterchange: false, platforms: ['1', '2'] },
      { code: 'MRN_3', name: 'Marol Naka', lineId: 'line-3', lineName: 'Aqua Line 3', sequence: 4, latitude: 19.1082, longitude: 72.8856, isInterchange: true, platforms: ['1', '2'] },
      { code: 'CSIA_T2', name: 'CSMIA International Airport T2', lineId: 'line-3', lineName: 'Aqua Line 3', sequence: 5, latitude: 19.0950, longitude: 72.8740, isInterchange: false, platforms: ['1', '2'] },
      { code: 'CSIA_T1', name: 'CSMIA Domestic Airport T1', lineId: 'line-3', lineName: 'Aqua Line 3', sequence: 6, latitude: 19.0880, longitude: 72.8620, isInterchange: false, platforms: ['1', '2'] },
      { code: 'BKC_M', name: 'BKC (Bandra Kurla Complex)', lineId: 'line-3', lineName: 'Aqua Line 3', sequence: 7, latitude: 19.0650, longitude: 72.8690, isInterchange: false, platforms: ['1', '2'] },
    ],
  },
];

export const metroService = {
  async getLines(): Promise<MetroLineItem[]> {
    try {
      const res = await fetch('/api/metro/lines');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) return json.data;
      }
    } catch {
      // Fallback
    }
    return FALLBACK_METRO_LINES;
  },

  async searchRoute(from: string, to: string): Promise<MetroRoutePlan> {
    try {
      const res = await fetch(`/api/metro/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) return json.data;
      }
    } catch {
      // Fallback
    }

    return {
      fromStation: from || 'Versova',
      toStation: to || 'Ghatkopar',
      sameLine: true,
      linesUsed: ['Blue Line 1'],
      interchangeStations: [],
      stopsCount: 11,
      estimatedMinutes: 21,
      fareToken: 30,
      fareCard: 27,
      firstTrain: '05:30 AM',
      lastTrain: '11:40 PM',
      frequency: 'Every 4 minutes',
      path: ['Versova', 'D.N. Nagar', 'Azad Nagar', 'Andheri Metro', 'Western Express Highway', 'Chakala', 'Airport Road', 'Marol Naka', 'Saki Naka', 'Asalpha', 'Jagruti Nagar', 'Ghatkopar'],
    };
  },

  async getStationIndicator(stationName: string): Promise<{ station: string; line: string; color: string; nextTrains: MetroIndicatorTrain[] }> {
    try {
      const res = await fetch(`/api/metro/indicator?station=${encodeURIComponent(stationName)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) return json.data;
      }
    } catch {
      // Fallback
    }

    return {
      station: stationName || 'Ghatkopar',
      line: 'Blue Line 1',
      color: '#0284C7',
      nextTrains: [
        { lineName: 'Blue Line 1', destination: 'Versova', platform: '2', etaMinutes: 2, status: 'Approaching' },
        { lineName: 'Blue Line 1', destination: 'Versova', platform: '2', etaMinutes: 6, status: 'On Time' },
        { lineName: 'Blue Line 1', destination: 'Versova', platform: '2', etaMinutes: 11, status: 'Scheduled' },
      ],
    };
  },
};
