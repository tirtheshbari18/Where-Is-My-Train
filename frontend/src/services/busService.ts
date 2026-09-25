// Bus Service for Mumbai BEST & City Bus Transport

export interface BusRouteSummary {
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
  stops: Array<{
    stopSequence: number;
    stopName: string;
    area: string;
    latitude: number;
    longitude: number;
    scheduledTime: string;
    expectedTime: string;
  }>;
}

const FALLBACK_BUSES: BusRouteSummary[] = [
  {
    id: 'bus_203',
    busNumber: '203',
    routeName: 'Dahisar Bridge to Andheri Station (West)',
    operator: 'BEST',
    busType: 'AC Electric',
    fromStop: 'Dahisar Bridge',
    toStop: 'Andheri Station (West)',
    distanceKm: 16.2,
    totalStops: 9,
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
    totalStops: 6,
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
    id: 'bus_c40',
    busNumber: 'C-40',
    routeName: 'Backbay Depot to Trombay (Express)',
    operator: 'BEST',
    busType: 'AC Express',
    fromStop: 'Backbay Depot',
    toStop: 'Trombay',
    distanceKm: 24.5,
    totalStops: 6,
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

export const busService = {
  async searchBuses(query?: string, from?: string, to?: string): Promise<BusRouteSummary[]> {
    try {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      const res = await fetch(`/api/buses/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data.length > 0) return json.data;
      }
    } catch {
      // Fallback
    }

    let results = [...FALLBACK_BUSES];
    if (query) {
      const q = query.toLowerCase();
      results = results.filter((b) => b.busNumber.toLowerCase().includes(q) || b.routeName.toLowerCase().includes(q));
    }
    return results.length > 0 ? results : FALLBACK_BUSES;
  },

  async getBusTracking(busId: string): Promise<BusRouteSummary | null> {
    try {
      const res = await fetch(`/api/buses/${encodeURIComponent(busId)}/track`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) return json.data;
      }
    } catch {
      // Fallback
    }

    const bus = FALLBACK_BUSES.find((b) => b.id === busId || b.busNumber === busId);
    return bus || FALLBACK_BUSES[0];
  },
};
