export interface PowerBlockNotice {
  id: string;
  zone: string;
  line: 'Western' | 'Central' | 'Harbour' | 'All';
  title: string;
  blockType: 'MEGA BLOCK' | 'JUMBO BLOCK' | 'MAINTENANCE' | 'POWER BLOCK';
  date: string;
  timeWindow: string;
  affectedRoute: string;
  affectedStations: string[];
  alternateArrangements: string;
  noticeDetails: string;
  severity: 'WARNING' | 'CRITICAL' | 'INFO';
  isActive: boolean;
}

export const MOCK_POWER_BLOCKS: PowerBlockNotice[] = [
  {
    id: 'block_01',
    zone: 'WR',
    line: 'Western',
    title: '5-Hour Jumbo Block between Borivali and Goregaon UP & DOWN Fast Lines',
    blockType: 'JUMBO BLOCK',
    date: 'Sunday, Upcoming Weekend',
    timeWindow: '10:00 AM to 03:00 PM',
    affectedRoute: 'Borivali (BVI) - Goregaon (GMN) UP & DOWN Fast tracks',
    affectedStations: ['Borivali', 'Kandivali', 'Malad', 'Goregaon'],
    alternateArrangements: 'All UP & DOWN Fast line suburban trains will be diverted to Slow lines between Borivali and Andheri.',
    noticeDetails: 'To carry out track maintenance, signaling inspection, and overhead equipment (OHE) wire maintenance. Passengers are requested to plan their journeys accordingly.',
    severity: 'WARNING',
    isActive: true,
  },
  {
    id: 'block_02',
    zone: 'CR',
    line: 'Central',
    title: 'Mega Block on Matunga - Mulund UP & DOWN Fast Lines',
    blockType: 'MEGA BLOCK',
    date: 'Sunday, Upcoming Weekend',
    timeWindow: '11:05 AM to 03:55 PM',
    affectedRoute: 'Matunga (MTN) - Mulund (MLND) Fast Line Corridors',
    affectedStations: ['Matunga', 'Sion', 'Kurla', 'Ghatkopar', 'Vikhroli', 'Bhandup', 'Mulund'],
    alternateArrangements: 'Fast line trains will be operated on UP and DOWN Slow lines between Matunga and Mulund stations halting at all stations.',
    noticeDetails: 'Infrastructure maintenance, diamond crossing upkeep, and signaling software upgrade by Central Railway Mumbai Division.',
    severity: 'WARNING',
    isActive: true,
  },
  {
    id: 'block_03',
    zone: 'CR',
    line: 'Harbour',
    title: 'Special Traffic Block between Kurla and Vashi on Harbour Line',
    blockType: 'POWER BLOCK',
    date: 'Sunday Night / Early Morning',
    timeWindow: '01:30 AM to 04:30 AM',
    affectedRoute: 'Kurla - Vashi Harbour Line Section',
    affectedStations: ['Kurla', 'Tilak Nagar', 'Chembur', 'Govandi', 'Mankhurd', 'Vashi'],
    alternateArrangements: 'Special midnight shuttle services will operate between Panvel and Vashi, and CSMT and Kurla.',
    noticeDetails: 'Replacement of overhead 25kV traction insulators and power cables across the Vashi creek railway bridge.',
    severity: 'INFO',
    isActive: true,
  },
  {
    id: 'block_04',
    zone: 'WR',
    line: 'Western',
    title: 'Dahanu Road - Boisar Electronic Interlocking Night Block',
    blockType: 'MAINTENANCE',
    date: 'Saturday / Sunday Midnight',
    timeWindow: '00:45 AM to 04:15 AM',
    affectedRoute: 'Dahanu Road (DRD) - Boisar (BOR) Suburban Trunk',
    affectedStations: ['Dahanu Road', 'Vangaon', 'Boisar'],
    alternateArrangements: 'Late night local service 93033 will terminate at Boisar instead of Dahanu Road.',
    noticeDetails: 'Testing and integration of modernized solid-state electronic interlocking at Palghar-Dahanu Road corridor.',
    severity: 'INFO',
    isActive: true,
  },
];
