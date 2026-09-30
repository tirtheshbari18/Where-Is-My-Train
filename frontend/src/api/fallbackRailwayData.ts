// frontend/src/api/fallbackRailwayData.ts
//
// Last-resort timetable used ONLY when the live railway API is unreachable
// (backend down, gateway error, CORS failure, offline, missing env var, ...).
//
// The data below mirrors the published Western Railway Boisar <-> Dahanu Road
// corridor timetable served by the mock provider, so the Boisar -> Dahanu Road
// search still returns real, sensible results instead of an empty error state.
//
// Every list returned here is flagged by the caller with a clear
// "demo/offline timetable" notice so users are never misled into thinking the
// numbers are live.

import type { TrainSummary } from './railwayApi.js';
import { extractStationCode } from '../utils/stationResolver.js';

const DAILY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** [trainNumber, trainName, departure, arrival, durationMinutes, distanceKm, trainType] */
type SeedRow = [string, string, string, string, number, number, string];

const BOISAR_TO_DAHANU: SeedRow[] = [
  ['19016', 'Saurashtra Express', '08:42 AM', '09:04 AM', 22, 26, 'Express'],
  ['19015', 'Saurashtra Express', '11:23 AM', '11:47 AM', 24, 26, 'Express'],
  ['19417', 'Borivali - Vatva Express', '02:57 PM', '03:38 PM', 41, 21, 'Express'],
  ['19019', 'Haridwar Express', '01:44 AM', '02:08 AM', 24, 21, 'Express'],
  ['19217', 'Saurashtra Janata Express', '03:24 PM', '03:52 PM', 28, 21, 'Express'],
  ['19001', 'Virar - Surat Express Passenger', '01:00 PM', '01:25 PM', 25, 19, 'Passenger'],
  ['12935', 'BDTS - Surat InterCity SF Express', '08:20 AM', '08:44 AM', 24, 21, 'Superfast'],
  ['22955', 'Kutch SF Express', '07:30 PM', '07:55 PM', 25, 21, 'Superfast'],
  ['22927', 'Lokshakti SF Express', '09:16 PM', '09:42 PM', 26, 21, 'Superfast'],
  ['93001', 'Churchgate - Dahanu Road Fast Local', '06:56 AM', '07:20 AM', 24, 19, 'Fast Local'],
  ['93003', 'Churchgate - Dahanu Road Fast Local', '07:38 AM', '08:02 AM', 24, 19, 'Fast Local'],
  ['93007', 'Churchgate - Dahanu Road Fast Local', '08:10 AM', '08:34 AM', 24, 19, 'Fast Local'],
  ['93011', 'Churchgate - Dahanu Road Fast Local', '09:51 AM', '10:15 AM', 24, 19, 'Fast Local'],
  ['93013', 'Churchgate - Dahanu Road AC Fast Local', '10:39 AM', '11:03 AM', 24, 19, 'AC Local'],
  ['93015', 'Dadar - Dahanu Road Fast Local', '11:02 AM', '11:26 AM', 24, 19, 'Fast Local'],
  ['93025', 'Virar - Dahanu Road Slow Local', '11:50 AM', '12:15 PM', 25, 19, 'Slow Local'],
  ['93029', 'Virar - Dahanu Road Slow Local', '02:24 PM', '02:48 PM', 24, 19, 'Slow Local'],
  ['93033', 'Dadar - Dahanu Road Fast Local', '04:42 PM', '05:06 PM', 24, 19, 'Fast Local'],
  ['93039', 'Churchgate - Dahanu Road AC Fast Local', '06:58 PM', '07:22 PM', 24, 19, 'AC Local'],
  ['93045', 'Dadar - Dahanu Road Fast Local', '08:56 PM', '09:20 PM', 24, 19, 'Fast Local'],
  ['69149', 'Virar - Dahanu Road MEMU', '04:59 AM', '05:23 AM', 24, 19, 'MEMU'],
  ['69151', 'Panvel - Dahanu Road MEMU', '07:39 AM', '08:03 AM', 24, 19, 'MEMU'],
  ['69153', 'Virar - Sanjan MEMU', '09:04 AM', '09:28 AM', 24, 19, 'MEMU'],
  ['69155', 'Virar - Surat MEMU', '11:59 AM', '12:23 PM', 24, 19, 'MEMU'],
  ['69157', 'Panvel - Dahanu Road MEMU', '03:34 PM', '03:58 PM', 24, 19, 'MEMU'],
  ['69161', 'Panvel - Dahanu Road MEMU', '08:32 PM', '08:56 PM', 24, 19, 'MEMU'],
];

const DAHANU_TO_BOISAR: SeedRow[] = [
  ['93002', 'Dahanu Road - Virar Slow Local', '05:40 AM', '06:03 AM', 23, 19, 'Slow Local'],
  ['93004', 'Dahanu Road - Churchgate Fast Local', '06:05 AM', '06:28 AM', 23, 19, 'Fast Local'],
  ['93008', 'Dahanu Road - Churchgate Fast Local', '07:15 AM', '07:38 AM', 23, 19, 'Fast Local'],
  ['93012', 'Dahanu Road - Churchgate Fast Local', '08:25 AM', '08:48 AM', 23, 19, 'Fast Local'],
  ['93014', 'Dahanu Road - Churchgate AC Fast Local', '09:00 AM', '09:23 AM', 23, 19, 'AC Local'],
  ['93016', 'Dahanu Road - Dadar Fast Local', '09:35 AM', '09:58 AM', 23, 19, 'Fast Local'],
  ['93020', 'Dahanu Road - Churchgate Fast Local', '11:10 AM', '11:33 AM', 23, 19, 'Fast Local'],
  ['93026', 'Dahanu Road - Virar Slow Local', '01:15 PM', '01:38 PM', 23, 19, 'Slow Local'],
  ['93034', 'Dahanu Road - Dadar Fast Local', '04:05 PM', '04:28 PM', 23, 19, 'Fast Local'],
  ['93040', 'Dahanu Road - Churchgate AC Fast Local', '06:15 PM', '06:38 PM', 23, 19, 'AC Local'],
  ['93046', 'Dahanu Road - Dadar Fast Local', '08:30 PM', '08:53 PM', 23, 19, 'Fast Local'],
  ['93052', 'Dahanu Road - Churchgate Fast Local', '10:50 PM', '11:13 PM', 23, 19, 'Fast Local'],
  ['69150', 'Dahanu Road - Virar MEMU', '06:30 AM', '06:53 AM', 23, 19, 'MEMU'],
  ['69152', 'Dahanu Road - Panvel MEMU', '08:45 AM', '09:08 AM', 23, 19, 'MEMU'],
  ['69158', 'Dahanu Road - Panvel MEMU', '04:45 PM', '05:08 PM', 23, 19, 'MEMU'],
  ['69164', 'Dahanu Road - Virar Night MEMU', '11:30 PM', '11:53 PM', 23, 19, 'MEMU'],
  ['19418', 'Vatva - Borivali Express', '06:55 AM', '07:22 AM', 27, 21, 'Express'],
];

function materialise(
  rows: SeedRow[],
  fromCode: string,
  fromName: string,
  toCode: string,
  toName: string
): TrainSummary[] {
  return rows.map(
    ([trainNumber, trainName, departureTime, arrivalTime, durationMinutes, distanceKm, trainType]) => ({
      trainNumber,
      trainName,
      sourceCode: fromCode,
      sourceName: fromName,
      destinationCode: toCode,
      destinationName: toName,
      trainType,
      runningDays: [...DAILY],
      departureTime,
      arrivalTime,
      durationMinutes,
      distanceKm,
      zone: 'WR',
    })
  );
}

const CORRIDORS: Record<string, () => TrainSummary[]> = {
  'BOR>DRD': () => materialise(BOISAR_TO_DAHANU, 'BOR', 'Boisar', 'DRD', 'Dahanu Road'),
  'DRD>BOR': () => materialise(DAHANU_TO_BOISAR, 'DRD', 'Dahanu Road', 'BOR', 'Boisar'),
};

/**
 * Static timetable for a route pair, or `[]` when we have nothing trustworthy
 * to show. Callers must only use this after the live request failed.
 */
export function getFallbackTrainsBetween(from: string, to: string): TrainSummary[] {
  const key = `${extractStationCode(from)}>${extractStationCode(to)}`;
  const build = CORRIDORS[key];
  return build ? build() : [];
}
