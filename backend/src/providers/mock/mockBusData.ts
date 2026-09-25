export interface BusRoute {
  id: string;
  busNumber: string;
  routeName: string;
  operator: 'BEST' | 'TMT' | 'NMMT' | 'MBMT';
  busType: 'AC Electric' | 'Non-AC' | 'AC Express' | 'Mini Electric';
  fromStop: string;
  toStop: string;
  distanceKm: number;
  totalStops: number;
  fareMin: number;
  fareMax: number;
  frequencyMinutes: number;
  firstBus: string;
  lastBus: string;
  currentLocation: {
    stopName: string;
    latitude: number;
    longitude: number;
    speedKmH: number;
    progressPercentage: number;
  };
  nextStop: {
    stopName: string;
    distanceMeters: number;
    etaMinutes: number;
  };
  status: 'Running' | 'Delayed' | 'Heavy Traffic' | 'On Time';
  stops: BusStop[];
}

export interface BusStop {
  stopSequence: number;
  stopName: string;
  area: string;
  latitude: number;
  longitude: number;
  scheduledTime: string;
  expectedTime: string;
}

export const MOCK_BUS_ROUTES: BusRoute[] = [
  {
    id: 'bus_203',
    busNumber: '203',
    routeName: 'Dahisar Bridge to Andheri Station (West)',
    operator: 'BEST',
    busType: 'AC Electric',
    fromStop: 'Dahisar Bridge',
    toStop: 'Andheri Station (West)',
    distanceKm: 16.2,
    totalStops: 24,
    fareMin: 6,
    fareMax: 20,
    frequencyMinutes: 10,
    firstBus: '05:45 AM',
    lastBus: '11:15 PM',
    currentLocation: {
      stopName: 'Borivali Station (West)',
      latitude: 19.2288,
      longitude: 72.8541,
      speedKmH: 26,
      progressPercentage: 35,
    },
    nextStop: {
      stopName: 'Kandivali Telephone Exchange',
      distanceMeters: 850,
      etaMinutes: 3,
    },
    status: 'On Time',
    stops: [
      { stopSequence: 1, stopName: 'Dahisar Bridge', area: 'Dahisar', latitude: 19.2570, longitude: 72.8600, scheduledTime: '09:00 AM', expectedTime: '09:00 AM' },
      { stopSequence: 2, stopName: 'Dahisar Check Naka', area: 'Dahisar', latitude: 19.2510, longitude: 72.8580, scheduledTime: '09:05 AM', expectedTime: '09:05 AM' },
      { stopSequence: 3, stopName: 'Borivali Phatak', area: 'Borivali', latitude: 19.2380, longitude: 72.8560, scheduledTime: '09:12 AM', expectedTime: '09:13 AM' },
      { stopSequence: 4, stopName: 'Borivali Station (West)', area: 'Borivali', latitude: 19.2288, longitude: 72.8541, scheduledTime: '09:20 AM', expectedTime: '09:20 AM' },
      { stopSequence: 5, stopName: 'Kandivali Telephone Exchange', area: 'Kandivali', latitude: 19.2150, longitude: 72.8490, scheduledTime: '09:28 AM', expectedTime: '09:29 AM' },
      { stopSequence: 6, stopName: 'Malad Station (West)', area: 'Malad', latitude: 19.1860, longitude: 72.8440, scheduledTime: '09:38 AM', expectedTime: '09:40 AM' },
      { stopSequence: 7, stopName: 'Goregaon Bus Station (West)', area: 'Goregaon', latitude: 19.1620, longitude: 72.8410, scheduledTime: '09:48 AM', expectedTime: '09:50 AM' },
      { stopSequence: 8, stopName: 'Oshiwara Police Station', area: 'Jogeshwari', latitude: 19.1450, longitude: 72.8390, scheduledTime: '09:58 AM', expectedTime: '10:00 AM' },
      { stopSequence: 9, stopName: 'Andheri Station (West)', area: 'Andheri', latitude: 19.1205, longitude: 72.8430, scheduledTime: '10:10 AM', expectedTime: '10:12 AM' },
    ],
  },
  {
    id: 'bus_332',
    busNumber: '332',
    routeName: 'Kurla Station (West) to Andheri Station (East)',
    operator: 'BEST',
    busType: 'AC Electric',
    fromStop: 'Kurla Station (West)',
    toStop: 'Andheri Station (East)',
    distanceKm: 12.8,
    totalStops: 18,
    fareMin: 6,
    fareMax: 18,
    frequencyMinutes: 8,
    firstBus: '06:00 AM',
    lastBus: '11:30 PM',
    currentLocation: {
      stopName: 'Saki Naka Junction',
      latitude: 19.1051,
      longitude: 72.8943,
      speedKmH: 18,
      progressPercentage: 55,
    },
    nextStop: {
      stopName: 'Marol Naka',
      distanceMeters: 1100,
      etaMinutes: 4,
    },
    status: 'Running',
    stops: [
      { stopSequence: 1, stopName: 'Kurla Station (West)', area: 'Kurla', latitude: 19.0680, longitude: 72.8890, scheduledTime: '09:15 AM', expectedTime: '09:15 AM' },
      { stopSequence: 2, stopName: 'Bail Bazar', area: 'Kurla', latitude: 19.0800, longitude: 72.8910, scheduledTime: '09:22 AM', expectedTime: '09:23 AM' },
      { stopSequence: 3, stopName: 'Saki Naka Junction', area: 'Saki Naka', latitude: 19.1051, longitude: 72.8943, scheduledTime: '09:35 AM', expectedTime: '09:36 AM' },
      { stopSequence: 4, stopName: 'Marol Naka', area: 'Andheri East', latitude: 19.1082, longitude: 72.8856, scheduledTime: '09:42 AM', expectedTime: '09:44 AM' },
      { stopSequence: 5, stopName: 'Chakala (J.B. Nagar)', area: 'Andheri East', latitude: 19.1136, longitude: 72.8647, scheduledTime: '09:50 AM', expectedTime: '09:52 AM' },
      { stopSequence: 6, stopName: 'Andheri Station (East)', area: 'Andheri East', latitude: 19.1205, longitude: 72.8471, scheduledTime: '10:00 AM', expectedTime: '10:03 AM' },
    ],
  },
  {
    id: 'bus_415',
    busNumber: '415',
    routeName: 'Andheri Station (West) to SEEPZ Bus Station',
    operator: 'BEST',
    busType: 'Non-AC',
    fromStop: 'Andheri Station (West)',
    toStop: 'SEEPZ Bus Station',
    distanceKm: 9.4,
    totalStops: 14,
    fareMin: 6,
    fareMax: 15,
    frequencyMinutes: 12,
    firstBus: '06:15 AM',
    lastBus: '10:45 PM',
    currentLocation: {
      stopName: 'MIDC Police Station',
      latitude: 19.1210,
      longitude: 72.8710,
      speedKmH: 22,
      progressPercentage: 65,
    },
    nextStop: {
      stopName: 'SEEPZ Gate No. 1',
      distanceMeters: 600,
      etaMinutes: 2,
    },
    status: 'On Time',
    stops: [
      { stopSequence: 1, stopName: 'Andheri Station (West)', area: 'Andheri West', latitude: 19.1205, longitude: 72.8430, scheduledTime: '09:30 AM', expectedTime: '09:30 AM' },
      { stopSequence: 2, stopName: 'Western Express Highway', area: 'Andheri East', latitude: 19.1177, longitude: 72.8558, scheduledTime: '09:40 AM', expectedTime: '09:41 AM' },
      { stopSequence: 3, stopName: 'MIDC Police Station', area: 'Andheri East', latitude: 19.1210, longitude: 72.8710, scheduledTime: '09:50 AM', expectedTime: '09:51 AM' },
      { stopSequence: 4, stopName: 'SEEPZ Bus Station', area: 'SEEPZ', latitude: 19.1285, longitude: 72.8790, scheduledTime: '09:58 AM', expectedTime: '09:59 AM' },
    ],
  },
  {
    id: 'bus_c40',
    busNumber: 'C-40',
    routeName: 'Backbay Depot to Trombay (Express)',
    operator: 'BEST',
    busType: 'AC Express',
    fromStop: 'Backbay Depot',
    toStop: 'Trombay',
    distanceKm: 24.5,
    totalStops: 26,
    fareMin: 12,
    fareMax: 35,
    frequencyMinutes: 15,
    firstBus: '06:30 AM',
    lastBus: '10:00 PM',
    currentLocation: {
      stopName: 'Parel Workshop',
      latitude: 19.0020,
      longitude: 72.8410,
      speedKmH: 38,
      progressPercentage: 42,
    },
    nextStop: {
      stopName: 'Dadar TT Circle',
      distanceMeters: 1400,
      etaMinutes: 4,
    },
    status: 'On Time',
    stops: [
      { stopSequence: 1, stopName: 'Backbay Depot', area: 'Colaba', latitude: 18.9150, longitude: 72.8230, scheduledTime: '08:30 AM', expectedTime: '08:30 AM' },
      { stopSequence: 2, stopName: 'Churchgate Station', area: 'Churchgate', latitude: 18.9322, longitude: 72.8264, scheduledTime: '08:40 AM', expectedTime: '08:41 AM' },
      { stopSequence: 3, stopName: 'CSMT', area: 'Fort', latitude: 18.9401, longitude: 72.8354, scheduledTime: '08:48 AM', expectedTime: '08:50 AM' },
      { stopSequence: 4, stopName: 'Parel Workshop', area: 'Parel', latitude: 19.0020, longitude: 72.8410, scheduledTime: '09:05 AM', expectedTime: '09:07 AM' },
      { stopSequence: 5, stopName: 'Dadar TT Circle', area: 'Dadar', latitude: 19.0178, longitude: 72.8478, scheduledTime: '09:15 AM', expectedTime: '09:17 AM' },
      { stopSequence: 6, stopName: 'Trombay', area: 'Trombay', latitude: 19.0250, longitude: 72.9350, scheduledTime: '09:55 AM', expectedTime: '09:58 AM' },
    ],
  },
];
