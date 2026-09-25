export interface LocalTrain {
  id: string;
  trainNumber: string;
  trainName: string;
  line: 'Western' | 'Central' | 'Harbour' | 'Trans-Harbour';
  sourceCode: string;
  sourceName: string;
  destinationCode: string;
  destinationName: string;
  type: 'Fast Local' | 'Slow Local' | 'AC Local' | 'MEMU' | 'DEMU';
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  distanceKm: number;
  fareSecondClass: number;
  fareFirstClass: number;
  fareAc: number;
  frequency: string;
  runningDays: string[];
  platform: string;
  cars: number; // 12 or 15
  status: 'On Time' | 'Delayed by 2 min' | 'Delayed by 5 min' | 'Departed';
  delayMinutes: number;
  stops: Array<{
    stationCode: string;
    stationName: string;
    arrivalTime: string;
    departureTime: string;
    platform: string;
    isFastStop: boolean;
  }>;
}

export interface LocalStationIndicatorTrain {
  trainNumber: string;
  destination: string;
  destinationCode: string;
  departureTime: string;
  expectedTime: string;
  platform: string;
  delayMinutes: number;
  speedType: 'FAST' | 'SLOW';
  isAc: boolean;
  cars: 12 | 15;
  status: string;
}

export const MUMBAI_LOCAL_LINES = [
  { id: 'western', name: 'Western Line', color: '#DC2626', terminalFrom: 'Churchgate', terminalTo: 'Dahanu Road', stationCount: 36 },
  { id: 'central', name: 'Central Main Line', color: '#2563EB', terminalFrom: 'CSMT', terminalTo: 'Kalyan / Karjat / Kasara', stationCount: 38 },
  { id: 'harbour', name: 'Harbour Line', color: '#16A34A', terminalFrom: 'CSMT', terminalTo: 'Panvel / Goregaon', stationCount: 28 },
  { id: 'trans-harbour', name: 'Trans-Harbour Line', color: '#9333EA', terminalFrom: 'Thane', terminalTo: 'Vashi / Panvel', stationCount: 12 },
];

import { DAHANU_CORRIDOR_LOCALS } from './mockDahanuCorridorData.js';

export const MOCK_LOCAL_TRAINS: LocalTrain[] = [
  // 93011 - Churchgate - Dahanu Road Fast Local
  {
    id: 'local_93011',
    trainNumber: '93011',
    trainName: 'Churchgate - Dahanu Road Fast Local',
    line: 'Western',
    sourceCode: 'CCG',
    sourceName: 'Churchgate',
    destinationCode: 'DRD',
    destinationName: 'Dahanu Road',
    type: 'Fast Local',
    departureTime: '07:42',
    arrivalTime: '10:15',
    durationMinutes: 153,
    distanceKm: 124,
    fareSecondClass: 10,
    fareFirstClass: 65,
    fareAc: 105,
    frequency: 'Daily (Every Morning)',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    platform: '3',
    cars: 12,
    status: 'On Time',
    delayMinutes: 0,
    stops: [
      { stationCode: 'CCG', stationName: 'Churchgate', arrivalTime: '07:42', departureTime: '07:42', platform: '3', isFastStop: true },
      { stationCode: 'MMCT', stationName: 'Mumbai Central', arrivalTime: '07:51', departureTime: '07:52', platform: '3', isFastStop: true },
      { stationCode: 'DDR', stationName: 'Dadar', arrivalTime: '08:00', departureTime: '08:01', platform: '4', isFastStop: true },
      { stationCode: 'BDTS', stationName: 'Bandra', arrivalTime: '08:07', departureTime: '08:08', platform: '4', isFastStop: true },
      { stationCode: 'ADH', stationName: 'Andheri', arrivalTime: '08:17', departureTime: '08:18', platform: '5', isFastStop: true },
      { stationCode: 'BVI', stationName: 'Borivali', arrivalTime: '08:34', departureTime: '08:35', platform: '4', isFastStop: true },
      { stationCode: 'BSR', stationName: 'Vasai Road', arrivalTime: '08:55', departureTime: '08:56', platform: '4', isFastStop: true },
      { stationCode: 'VR', stationName: 'Virar', arrivalTime: '09:07', departureTime: '09:08', platform: '3', isFastStop: true },
      { stationCode: 'VTN', stationName: 'Vaitarna', arrivalTime: '09:16', departureTime: '09:17', platform: '1', isFastStop: true },
      { stationCode: 'SAH', stationName: 'Saphale', arrivalTime: '09:23', departureTime: '09:24', platform: '2', isFastStop: true },
      { stationCode: 'KLV', stationName: 'Kelve Road', arrivalTime: '09:29', departureTime: '09:30', platform: '1', isFastStop: true },
      { stationCode: 'PLG', stationName: 'Palghar', arrivalTime: '09:37', departureTime: '09:38', platform: '1', isFastStop: true },
      { stationCode: 'UOI', stationName: 'Umroli', arrivalTime: '09:43', departureTime: '09:44', platform: '1', isFastStop: true },
      { stationCode: 'BOR', stationName: 'Boisar', arrivalTime: '09:50', departureTime: '09:51', platform: '2', isFastStop: true },
      { stationCode: 'VGN', stationName: 'Vangaon', arrivalTime: '10:00', departureTime: '10:01', platform: '1', isFastStop: true },
      { stationCode: 'DRD', stationName: 'Dahanu Road', arrivalTime: '10:15', departureTime: '10:15', platform: '1', isFastStop: true },
    ],
  },
  // 93025 - Virar - Dahanu Road Slow Local
  {
    id: 'local_93025',
    trainNumber: '93025',
    trainName: 'Virar - Dahanu Road Slow Local',
    line: 'Western',
    sourceCode: 'VR',
    sourceName: 'Virar',
    destinationCode: 'DRD',
    destinationName: 'Dahanu Road',
    type: 'Slow Local',
    departureTime: '11:05',
    arrivalTime: '12:15',
    durationMinutes: 70,
    distanceKm: 64,
    fareSecondClass: 10,
    fareFirstClass: 50,
    fareAc: 85,
    frequency: 'Daily',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    platform: '1',
    cars: 12,
    status: 'On Time',
    delayMinutes: 0,
    stops: [
      { stationCode: 'VR', stationName: 'Virar', arrivalTime: '11:05', departureTime: '11:05', platform: '1', isFastStop: false },
      { stationCode: 'VTN', stationName: 'Vaitarna', arrivalTime: '11:14', departureTime: '11:15', platform: '1', isFastStop: false },
      { stationCode: 'SAH', stationName: 'Saphale', arrivalTime: '11:21', departureTime: '11:22', platform: '2', isFastStop: false },
      { stationCode: 'KLV', stationName: 'Kelve Road', arrivalTime: '11:27', departureTime: '11:28', platform: '1', isFastStop: false },
      { stationCode: 'PLG', stationName: 'Palghar', arrivalTime: '11:35', departureTime: '11:36', platform: '2', isFastStop: false },
      { stationCode: 'UOI', stationName: 'Umroli', arrivalTime: '11:41', departureTime: '11:42', platform: '1', isFastStop: false },
      { stationCode: 'BOR', stationName: 'Boisar', arrivalTime: '11:48', departureTime: '11:50', platform: '1', isFastStop: false },
      { stationCode: 'VGN', stationName: 'Vangaon', arrivalTime: '12:00', departureTime: '12:01', platform: '1', isFastStop: false },
      { stationCode: 'DRD', stationName: 'Dahanu Road', arrivalTime: '12:15', departureTime: '12:15', platform: '2', isFastStop: false },
    ],
  },
  // 93013 - Churchgate - Dahanu Road AC Fast Local
  {
    id: 'local_93013',
    trainNumber: '93013',
    trainName: 'Churchgate - Dahanu Road AC Fast Local',
    line: 'Western',
    sourceCode: 'CCG',
    sourceName: 'Churchgate',
    destinationCode: 'DRD',
    destinationName: 'Dahanu Road',
    type: 'AC Local',
    departureTime: '14:20',
    arrivalTime: '16:55',
    durationMinutes: 155,
    distanceKm: 124,
    fareSecondClass: 10,
    fareFirstClass: 65,
    fareAc: 115,
    frequency: 'Daily',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    platform: '4',
    cars: 12,
    status: 'Delayed by 2 min',
    delayMinutes: 2,
    stops: [
      { stationCode: 'CCG', stationName: 'Churchgate', arrivalTime: '14:20', departureTime: '14:20', platform: '4', isFastStop: true },
      { stationCode: 'MMCT', stationName: 'Mumbai Central', arrivalTime: '14:29', departureTime: '14:30', platform: '3', isFastStop: true },
      { stationCode: 'DDR', stationName: 'Dadar', arrivalTime: '14:38', departureTime: '14:39', platform: '4', isFastStop: true },
      { stationCode: 'ADH', stationName: 'Andheri', arrivalTime: '14:55', departureTime: '14:56', platform: '5', isFastStop: true },
      { stationCode: 'BVI', stationName: 'Borivali', arrivalTime: '15:12', departureTime: '15:13', platform: '4', isFastStop: true },
      { stationCode: 'VR', stationName: 'Virar', arrivalTime: '15:45', departureTime: '15:46', platform: '3', isFastStop: true },
      { stationCode: 'VTN', stationName: 'Vaitarna', arrivalTime: '15:54', departureTime: '15:55', platform: '1', isFastStop: true },
      { stationCode: 'SAH', stationName: 'Saphale', arrivalTime: '16:01', departureTime: '16:02', platform: '2', isFastStop: true },
      { stationCode: 'KLV', stationName: 'Kelve Road', arrivalTime: '16:07', departureTime: '16:08', platform: '1', isFastStop: true },
      { stationCode: 'PLG', stationName: 'Palghar', arrivalTime: '16:15', departureTime: '16:16', platform: '1', isFastStop: true },
      { stationCode: 'UOI', stationName: 'Umroli', arrivalTime: '16:21', departureTime: '16:22', platform: '1', isFastStop: true },
      { stationCode: 'BOR', stationName: 'Boisar', arrivalTime: '16:28', departureTime: '16:30', platform: '2', isFastStop: true },
      { stationCode: 'VGN', stationName: 'Vangaon', arrivalTime: '16:40', departureTime: '16:41', platform: '1', isFastStop: true },
      { stationCode: 'DRD', stationName: 'Dahanu Road', arrivalTime: '16:55', departureTime: '16:55', platform: '1', isFastStop: true },
    ],
  },
  // 93005 - Churchgate - Virar Fast Local
  {
    id: 'local_93005',
    trainNumber: '93005',
    trainName: 'Churchgate - Virar Fast Local',
    line: 'Western',
    sourceCode: 'CCG',
    sourceName: 'Churchgate',
    destinationCode: 'VR',
    destinationName: 'Virar',
    type: 'Fast Local',
    departureTime: '08:15',
    arrivalTime: '09:38',
    durationMinutes: 83,
    distanceKm: 60,
    fareSecondClass: 10,
    fareFirstClass: 50,
    fareAc: 90,
    frequency: 'Daily (Every 10 min)',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    platform: '2',
    cars: 15,
    status: 'On Time',
    delayMinutes: 0,
    stops: [
      { stationCode: 'CCG', stationName: 'Churchgate', arrivalTime: '08:15', departureTime: '08:15', platform: '2', isFastStop: true },
      { stationCode: 'MMCT', stationName: 'Mumbai Central', arrivalTime: '08:24', departureTime: '08:25', platform: '3', isFastStop: true },
      { stationCode: 'DDR', stationName: 'Dadar', arrivalTime: '08:33', departureTime: '08:34', platform: '4', isFastStop: true },
      { stationCode: 'BDTS', stationName: 'Bandra', arrivalTime: '08:40', departureTime: '08:41', platform: '4', isFastStop: true },
      { stationCode: 'ADH', stationName: 'Andheri', arrivalTime: '08:50', departureTime: '08:51', platform: '5', isFastStop: true },
      { stationCode: 'BVI', stationName: 'Borivali', arrivalTime: '09:07', departureTime: '09:08', platform: '4', isFastStop: true },
      { stationCode: 'BSR', stationName: 'Vasai Road', arrivalTime: '09:27', departureTime: '09:28', platform: '4', isFastStop: true },
      { stationCode: 'VR', stationName: 'Virar', arrivalTime: '09:38', departureTime: '09:38', platform: '3', isFastStop: true },
    ],
  },
  // 97001 - CSMT - Kalyan Fast Local
  {
    id: 'local_97001',
    trainNumber: '97001',
    trainName: 'CSMT - Kalyan Fast Local',
    line: 'Central',
    sourceCode: 'CSMT',
    sourceName: 'Mumbai CSMT',
    destinationCode: 'KYN',
    destinationName: 'Kalyan Junction',
    type: 'Fast Local',
    departureTime: '08:30',
    arrivalTime: '09:32',
    durationMinutes: 62,
    distanceKm: 54,
    fareSecondClass: 10,
    fareFirstClass: 50,
    fareAc: 95,
    frequency: 'Daily (Every 7 min)',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    platform: '5',
    cars: 12,
    status: 'On Time',
    delayMinutes: 0,
    stops: [
      { stationCode: 'CSMT', stationName: 'Mumbai CSMT', arrivalTime: '08:30', departureTime: '08:30', platform: '5', isFastStop: true },
      { stationCode: 'BYR', stationName: 'Byculla', arrivalTime: '08:36', departureTime: '08:37', platform: '3', isFastStop: true },
      { stationCode: 'DDR', stationName: 'Dadar', arrivalTime: '08:44', departureTime: '08:45', platform: '4', isFastStop: true },
      { stationCode: 'CLA', stationName: 'Kurla', arrivalTime: '08:52', departureTime: '08:53', platform: '5', isFastStop: true },
      { stationCode: 'GC', stationName: 'Ghatkopar', arrivalTime: '08:58', departureTime: '08:59', platform: '4', isFastStop: true },
      { stationCode: 'TNA', stationName: 'Thane', arrivalTime: '09:12', departureTime: '09:13', platform: '5', isFastStop: true },
      { stationCode: 'DI', stationName: 'Dombivli', arrivalTime: '09:24', departureTime: '09:25', platform: '4', isFastStop: true },
      { stationCode: 'KYN', stationName: 'Kalyan Junction', arrivalTime: '09:32', departureTime: '09:32', platform: '4', isFastStop: true },
    ],
  },
  // 98001 - CSMT - Panvel Harbour Local
  {
    id: 'local_98001',
    trainNumber: '98001',
    trainName: 'CSMT - Panvel Harbour Local',
    line: 'Harbour',
    sourceCode: 'CSMT',
    sourceName: 'Mumbai CSMT',
    destinationCode: 'PNVL',
    destinationName: 'Panvel',
    type: 'Slow Local',
    departureTime: '08:45',
    arrivalTime: '10:05',
    durationMinutes: 80,
    distanceKm: 49,
    fareSecondClass: 10,
    fareFirstClass: 50,
    fareAc: 90,
    frequency: 'Daily (Every 12 min)',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    platform: '1',
    cars: 12,
    status: 'On Time',
    delayMinutes: 0,
    stops: [
      { stationCode: 'CSMT', stationName: 'Mumbai CSMT', arrivalTime: '08:45', departureTime: '08:45', platform: '1', isFastStop: false },
      { stationCode: 'VDLR', stationName: 'Vadala Road', arrivalTime: '09:03', departureTime: '09:04', platform: '1', isFastStop: false },
      { stationCode: 'CLA', stationName: 'Kurla', arrivalTime: '09:15', departureTime: '09:16', platform: '7', isFastStop: false },
      { stationCode: 'VSH', stationName: 'Vashi', arrivalTime: '09:34', departureTime: '09:35', platform: '2', isFastStop: false },
      { stationCode: 'NER', stationName: 'Nerul', arrivalTime: '09:44', departureTime: '09:45', platform: '2', isFastStop: false },
      { stationCode: 'BEPR', stationName: 'Belapur CBD', arrivalTime: '09:51', departureTime: '09:52', platform: '2', isFastStop: false },
      { stationCode: 'PNVL', stationName: 'Panvel', arrivalTime: '10:05', departureTime: '10:05', platform: '1', isFastStop: false },
    ],
  },
  ...DAHANU_CORRIDOR_LOCALS,
];
