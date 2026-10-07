import { TrainDetail, TrainStop } from '../../types/railway.types.js';
import { LocalTrain } from './mockLocalData.js';

interface StationMeta {
  code: string;
  name: string;
  lat: number;
  lng: number;
  kmFromCcg: number;
  platform: string;
}

const STATIONS: Record<string, StationMeta> = {
  CCG: { code: 'CCG', name: 'Churchgate', lat: 18.9322, lng: 72.8264, kmFromCcg: 0, platform: '3' },
  MMCT: { code: 'MMCT', name: 'Mumbai Central', lat: 18.9696, lng: 72.8193, kmFromCcg: 5, platform: '3' },
  DDR: { code: 'DDR', name: 'Dadar', lat: 19.0178, lng: 72.8478, kmFromCcg: 10, platform: '4' },
  BDTS: { code: 'BDTS', name: 'Bandra', lat: 19.0624, lng: 72.8407, kmFromCcg: 14, platform: '4' },
  ADH: { code: 'ADH', name: 'Andheri', lat: 19.1197, lng: 72.8464, kmFromCcg: 22, platform: '5' },
  BVI: { code: 'BVI', name: 'Borivali', lat: 19.2288, lng: 72.8541, kmFromCcg: 34, platform: '4' },
  BYR: { code: 'BYR', name: 'Bhayandar', lat: 19.3015, lng: 72.8512, kmFromCcg: 44, platform: '3' },
  BSR: { code: 'BSR', name: 'Vasai Road', lat: 19.3804, lng: 72.8317, kmFromCcg: 52, platform: '4' },
  VR: { code: 'VR', name: 'Virar', lat: 19.4674, lng: 72.8118, kmFromCcg: 60, platform: '3' },
  VTN: { code: 'VTN', name: 'Vaitarna', lat: 19.5312, lng: 72.8193, kmFromCcg: 69.1, platform: '1' },
  SAH: { code: 'SAH', name: 'Saphale', lat: 19.5772, lng: 72.8188, kmFromCcg: 75.7, platform: '2' },
  KLV: { code: 'KLV', name: 'Kelve Road', lat: 19.6268, lng: 72.7937, kmFromCcg: 83.2, platform: '1' },
  PLG: { code: 'PLG', name: 'Palghar', lat: 19.6967, lng: 72.7699, kmFromCcg: 91.3, platform: '1' },
  UOI: { code: 'UOI', name: 'Umroli', lat: 19.7423, lng: 72.7612, kmFromCcg: 97.9, platform: '1' },
  BOR: { code: 'BOR', name: 'Boisar', lat: 19.8000, lng: 72.7565, kmFromCcg: 104.9, platform: '2' },
  VGN: { code: 'VGN', name: 'Vangaon', lat: 19.8822, lng: 72.7489, kmFromCcg: 114.3, platform: '1' },
  DRD: { code: 'DRD', name: 'Dahanu Road', lat: 19.9734, lng: 72.7329, kmFromCcg: 126.6, platform: '1' },
  GVD: { code: 'GVD', name: 'Gholvad', lat: 20.0768, lng: 72.7369, kmFromCcg: 135.0, platform: '2' },
  BRRD: { code: 'BRRD', name: 'Bordi Road', lat: 20.1245, lng: 72.7482, kmFromCcg: 140.0, platform: '1' },
  SJN: { code: 'SJN', name: 'Sanjan', lat: 20.2012, lng: 72.8021, kmFromCcg: 148.0, platform: '2' },
  UBR: { code: 'UBR', name: 'Umargam Road', lat: 20.2456, lng: 72.8312, kmFromCcg: 154.0, platform: '2' },
  BLD: { code: 'BLD', name: 'Bhilad', lat: 20.2834, lng: 72.8687, kmFromCcg: 160.0, platform: '2' },
  VAPI: { code: 'VAPI', name: 'Vapi', lat: 20.3712, lng: 72.9042, kmFromCcg: 170.0, platform: '2' },
  BL: { code: 'BL', name: 'Valsad', lat: 20.6094, lng: 72.9342, kmFromCcg: 195.0, platform: '3' },
  BIM: { code: 'BIM', name: 'Bilimora Junction', lat: 20.7645, lng: 72.9612, kmFromCcg: 215.0, platform: '2' },
  NVS: { code: 'NVS', name: 'Navsari', lat: 20.9467, lng: 72.9520, kmFromCcg: 235.0, platform: '2' },
  ST: { code: 'ST', name: 'Surat', lat: 21.2049, lng: 72.8408, kmFromCcg: 263.0, platform: '1' },
  BH: { code: 'BH', name: 'Bharuch Junction', lat: 21.7051, lng: 72.9959, kmFromCcg: 322.0, platform: '4' },
  BRC: { code: 'BRC', name: 'Vadodara Junction', lat: 22.3106, lng: 73.1812, kmFromCcg: 393.0, platform: '2' },
  ANND: { code: 'ANND', name: 'Anand Junction', lat: 22.5645, lng: 72.9289, kmFromCcg: 428.0, platform: '3' },
  ADI: { code: 'ADI', name: 'Ahmedabad Junction', lat: 23.0238, lng: 72.6011, kmFromCcg: 492.0, platform: '6' },
  PNVL: { code: 'PNVL', name: 'Panvel Junction', lat: 18.9894, lng: 73.1216, kmFromCcg: 0, platform: '5' },
};

function addMinutes(timeStr: string, minutes: number): string {
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const total = (h * 60 + m + minutes) % (24 * 60);
  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
}

// Relative cumulative run times (minutes) from Virar for down trains:
// VR(0) -> VTN(+9) -> SAH(+16) -> KLV(+22) -> PLG(+30) -> UOI(+36) -> BOR(+43) -> VGN(+53) -> DRD(+68)
const DOWN_OFFSETS: Record<string, number> = {
  VR: 0,
  VTN: 9,
  SAH: 16,
  KLV: 22,
  PLG: 30,
  UOI: 36,
  BOR: 43,
  VGN: 53,
  DRD: 68,
};

// Relative cumulative run times (minutes) from Dahanu Road for up trains:
// DRD(0) -> VGN(+13) -> BOR(+23) -> UOI(+30) -> PLG(+36) -> KLV(+44) -> SAH(+51) -> VTN(+58) -> VR(+68)
const UP_OFFSETS: Record<string, number> = {
  DRD: 0,
  VGN: 13,
  BOR: 23,
  UOI: 30,
  PLG: 36,
  KLV: 44,
  SAH: 51,
  VTN: 58,
  VR: 68,
};

interface LocalConfig {
  trainNumber: string;
  sourceCode: string;
  type: 'Fast Local' | 'Slow Local' | 'AC Local';
  vrDepartureTime: string;
  cars?: number;
}

const DOWN_LOCAL_CONFIGS: LocalConfig[] = [
  { trainNumber: '93001', sourceCode: 'CCG', type: 'Fast Local', vrDepartureTime: '06:12' },
  { trainNumber: '93003', sourceCode: 'CCG', type: 'Fast Local', vrDepartureTime: '06:54' },
  { trainNumber: '93005', sourceCode: 'VR', type: 'Slow Local', vrDepartureTime: '05:15' },
  { trainNumber: '93007', sourceCode: 'CCG', type: 'Fast Local', vrDepartureTime: '07:26' },
  { trainNumber: '93009', sourceCode: 'BVI', type: 'Slow Local', vrDepartureTime: '07:40' },
  // 93011 is already existing in mockRailwayData
  { trainNumber: '93013', sourceCode: 'CCG', type: 'AC Local', vrDepartureTime: '09:55' },
  { trainNumber: '93015', sourceCode: 'DDR', type: 'Fast Local', vrDepartureTime: '10:18' },
  { trainNumber: '93017', sourceCode: 'VR', type: 'Slow Local', vrDepartureTime: '10:05' },
  { trainNumber: '93019', sourceCode: 'CCG', type: 'Fast Local', vrDepartureTime: '11:12' },
  { trainNumber: '93021', sourceCode: 'BVI', type: 'Slow Local', vrDepartureTime: '11:35' },
  { trainNumber: '93023', sourceCode: 'VR', type: 'Slow Local', vrDepartureTime: '11:40' },
  // 93025 is already existing in mockRailwayData
  { trainNumber: '93027', sourceCode: 'CCG', type: 'Fast Local', vrDepartureTime: '13:44' },
  { trainNumber: '93029', sourceCode: 'VR', type: 'Slow Local', vrDepartureTime: '13:40' },
  { trainNumber: '93031', sourceCode: 'BVI', type: 'Slow Local', vrDepartureTime: '14:55' },
  { trainNumber: '93033', sourceCode: 'DDR', type: 'Fast Local', vrDepartureTime: '15:58' },
  { trainNumber: '93035', sourceCode: 'CCG', type: 'Fast Local', vrDepartureTime: '16:44' },
  { trainNumber: '93037', sourceCode: 'VR', type: 'Slow Local', vrDepartureTime: '16:25' },
  { trainNumber: '93039', sourceCode: 'CCG', type: 'AC Local', vrDepartureTime: '18:14' },
  { trainNumber: '93041', sourceCode: 'BVI', type: 'Slow Local', vrDepartureTime: '18:25' },
  { trainNumber: '93043', sourceCode: 'CCG', type: 'Fast Local', vrDepartureTime: '19:42' },
  { trainNumber: '93045', sourceCode: 'DDR', type: 'Fast Local', vrDepartureTime: '20:12' },
  { trainNumber: '93047', sourceCode: 'CCG', type: 'Fast Local', vrDepartureTime: '21:04' },
  { trainNumber: '93049', sourceCode: 'VR', type: 'Slow Local', vrDepartureTime: '21:05' },
  { trainNumber: '93051', sourceCode: 'CCG', type: 'Fast Local', vrDepartureTime: '22:08' },
  { trainNumber: '93053', sourceCode: 'VR', type: 'Slow Local', vrDepartureTime: '22:45' },
  { trainNumber: '93055', sourceCode: 'CCG', type: 'Fast Local', vrDepartureTime: '00:38' },
];

function buildDownLocalTrain(cfg: LocalConfig): TrainDetail {
  const stops: TrainStop[] = [];
  let seq = 1;
  const vrTime = cfg.vrDepartureTime;

  // If starts before Virar, add starting stations
  if (cfg.sourceCode === 'CCG') {
    const ccgDep = addMinutes(vrTime, -80);
    stops.push({
      stopSequence: seq++,
      stationCode: 'CCG',
      stationName: 'Churchgate',
      scheduledArrival: 'START',
      scheduledDeparture: ccgDep,
      haltMinutes: 0,
      distanceFromSourceKm: 0,
      dayCount: 1,
      platform: '3',
      latitude: STATIONS.CCG.lat,
      longitude: STATIONS.CCG.lng,
    });
    stops.push({
      stopSequence: seq++,
      stationCode: 'MMCT',
      stationName: 'Mumbai Central',
      scheduledArrival: addMinutes(ccgDep, 9),
      scheduledDeparture: addMinutes(ccgDep, 10),
      haltMinutes: 1,
      distanceFromSourceKm: 5,
      dayCount: 1,
      platform: '3',
      latitude: STATIONS.MMCT.lat,
      longitude: STATIONS.MMCT.lng,
    });
    stops.push({
      stopSequence: seq++,
      stationCode: 'DDR',
      stationName: 'Dadar',
      scheduledArrival: addMinutes(ccgDep, 18),
      scheduledDeparture: addMinutes(ccgDep, 19),
      haltMinutes: 1,
      distanceFromSourceKm: 10,
      dayCount: 1,
      platform: '4',
      latitude: STATIONS.DDR.lat,
      longitude: STATIONS.DDR.lng,
    });
    stops.push({
      stopSequence: seq++,
      stationCode: 'BDTS',
      stationName: 'Bandra',
      scheduledArrival: addMinutes(ccgDep, 25),
      scheduledDeparture: addMinutes(ccgDep, 26),
      haltMinutes: 1,
      distanceFromSourceKm: 14,
      dayCount: 1,
      platform: '4',
      latitude: STATIONS.BDTS.lat,
      longitude: STATIONS.BDTS.lng,
    });
    stops.push({
      stopSequence: seq++,
      stationCode: 'ADH',
      stationName: 'Andheri',
      scheduledArrival: addMinutes(ccgDep, 35),
      scheduledDeparture: addMinutes(ccgDep, 36),
      haltMinutes: 1,
      distanceFromSourceKm: 22,
      dayCount: 1,
      platform: '5',
      latitude: STATIONS.ADH.lat,
      longitude: STATIONS.ADH.lng,
    });
    stops.push({
      stopSequence: seq++,
      stationCode: 'BVI',
      stationName: 'Borivali',
      scheduledArrival: addMinutes(ccgDep, 52),
      scheduledDeparture: addMinutes(ccgDep, 53),
      haltMinutes: 1,
      distanceFromSourceKm: 34,
      dayCount: 1,
      platform: '4',
      latitude: STATIONS.BVI.lat,
      longitude: STATIONS.BVI.lng,
    });
    stops.push({
      stopSequence: seq++,
      stationCode: 'BSR',
      stationName: 'Vasai Road',
      scheduledArrival: addMinutes(ccgDep, 70),
      scheduledDeparture: addMinutes(ccgDep, 71),
      haltMinutes: 1,
      distanceFromSourceKm: 52,
      dayCount: 1,
      platform: '4',
      latitude: STATIONS.BSR.lat,
      longitude: STATIONS.BSR.lng,
    });
  } else if (cfg.sourceCode === 'DDR') {
    const ddrDep = addMinutes(vrTime, -65);
    stops.push({
      stopSequence: seq++,
      stationCode: 'DDR',
      stationName: 'Dadar',
      scheduledArrival: 'START',
      scheduledDeparture: ddrDep,
      haltMinutes: 0,
      distanceFromSourceKm: 0,
      dayCount: 1,
      platform: '4',
      latitude: STATIONS.DDR.lat,
      longitude: STATIONS.DDR.lng,
    });
    stops.push({
      stopSequence: seq++,
      stationCode: 'ADH',
      stationName: 'Andheri',
      scheduledArrival: addMinutes(ddrDep, 18),
      scheduledDeparture: addMinutes(ddrDep, 19),
      haltMinutes: 1,
      distanceFromSourceKm: 12,
      dayCount: 1,
      platform: '5',
      latitude: STATIONS.ADH.lat,
      longitude: STATIONS.ADH.lng,
    });
    stops.push({
      stopSequence: seq++,
      stationCode: 'BVI',
      stationName: 'Borivali',
      scheduledArrival: addMinutes(ddrDep, 35),
      scheduledDeparture: addMinutes(ddrDep, 36),
      haltMinutes: 1,
      distanceFromSourceKm: 24,
      dayCount: 1,
      platform: '4',
      latitude: STATIONS.BVI.lat,
      longitude: STATIONS.BVI.lng,
    });
    stops.push({
      stopSequence: seq++,
      stationCode: 'BSR',
      stationName: 'Vasai Road',
      scheduledArrival: addMinutes(ddrDep, 54),
      scheduledDeparture: addMinutes(ddrDep, 55),
      haltMinutes: 1,
      distanceFromSourceKm: 42,
      dayCount: 1,
      platform: '4',
      latitude: STATIONS.BSR.lat,
      longitude: STATIONS.BSR.lng,
    });
  } else if (cfg.sourceCode === 'BVI') {
    const bviDep = addMinutes(vrTime, -45);
    stops.push({
      stopSequence: seq++,
      stationCode: 'BVI',
      stationName: 'Borivali',
      scheduledArrival: 'START',
      scheduledDeparture: bviDep,
      haltMinutes: 0,
      distanceFromSourceKm: 0,
      dayCount: 1,
      platform: '4',
      latitude: STATIONS.BVI.lat,
      longitude: STATIONS.BVI.lng,
    });
    stops.push({
      stopSequence: seq++,
      stationCode: 'BYR',
      stationName: 'Bhayandar',
      scheduledArrival: addMinutes(bviDep, 10),
      scheduledDeparture: addMinutes(bviDep, 11),
      haltMinutes: 1,
      distanceFromSourceKm: 10,
      dayCount: 1,
      platform: '3',
      latitude: STATIONS.BYR.lat,
      longitude: STATIONS.BYR.lng,
    });
    stops.push({
      stopSequence: seq++,
      stationCode: 'BSR',
      stationName: 'Vasai Road',
      scheduledArrival: addMinutes(bviDep, 22),
      scheduledDeparture: addMinutes(bviDep, 23),
      haltMinutes: 1,
      distanceFromSourceKm: 18,
      dayCount: 1,
      platform: '4',
      latitude: STATIONS.BSR.lat,
      longitude: STATIONS.BSR.lng,
    });
  }

  // All 9 stations from Virar to Dahanu Road
  const dahanuStations = ['VR', 'VTN', 'SAH', 'KLV', 'PLG', 'UOI', 'BOR', 'VGN', 'DRD'];
  const startKm = stops.length > 0 ? stops[0].distanceFromSourceKm : 0;
  const baseKm = STATIONS[cfg.sourceCode]?.kmFromCcg ?? 60;

  for (const stCode of dahanuStations) {
    const meta = STATIONS[stCode];
    const offset = DOWN_OFFSETS[stCode];
    const arrTime = addMinutes(vrTime, offset);
    const isFirst = stCode === 'VR' && cfg.sourceCode === 'VR';
    const isLast = stCode === 'DRD';
    const depTime = isLast ? 'END' : isFirst ? arrTime : addMinutes(arrTime, 1);
    const dist = Math.max(0, Math.round(meta.kmFromCcg - baseKm));

    stops.push({
      stopSequence: seq++,
      stationCode: meta.code,
      stationName: meta.name,
      scheduledArrival: isFirst ? 'START' : arrTime,
      scheduledDeparture: depTime,
      haltMinutes: isFirst || isLast ? 0 : 1,
      distanceFromSourceKm: dist,
      dayCount: 1,
      platform: meta.platform,
      latitude: meta.lat,
      longitude: meta.lng,
    });
  }

  const firstStop = stops[0];
  const lastStop = stops[stops.length - 1];

  const sName = STATIONS[cfg.sourceCode]?.name || 'Virar';
  const dName = 'Dahanu Road';
  const prefix = cfg.type === 'AC Local' ? 'AC Fast Local' : cfg.type;

  return {
    trainNumber: cfg.trainNumber,
    trainName: `${sName} - ${dName} ${prefix}`,
    sourceCode: cfg.sourceCode,
    sourceName: sName,
    destinationCode: 'DRD',
    destinationName: dName,
    trainType: cfg.type,
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departureTime: firstStop.scheduledDeparture,
    arrivalTime: lastStop.scheduledArrival,
    durationMinutes: 150,
    distanceKm: lastStop.distanceFromSourceKm,
    zone: 'WR',
    hasPantry: false,
    locoType: cfg.type === 'AC Local' ? '12-Car Medha AC EMU' : '12-Car BHEL EMU',
    schedule: stops,
  };
}

// 8 MEMU trains down towards Dahanu
interface MemuConfig {
  trainNumber: string;
  trainName: string;
  sourceCode: string;
  destinationCode: string;
  vrTime: string;
}

const DOWN_MEMU_CONFIGS: MemuConfig[] = [
  { trainNumber: '69149', trainName: 'Virar - Dahanu Road MEMU', sourceCode: 'VR', destinationCode: 'DRD', vrTime: '04:15' },
  { trainNumber: '69151', trainName: 'Panvel - Dahanu Road MEMU', sourceCode: 'PNVL', destinationCode: 'DRD', vrTime: '06:55' },
  { trainNumber: '69153', trainName: 'Virar - Sanjan MEMU', sourceCode: 'VR', destinationCode: 'SJN', vrTime: '08:20' },
  { trainNumber: '69155', trainName: 'Virar - Surat MEMU', sourceCode: 'VR', destinationCode: 'ST', vrTime: '11:15' },
  { trainNumber: '69157', trainName: 'Panvel - Dahanu Road MEMU', sourceCode: 'PNVL', destinationCode: 'DRD', vrTime: '14:50' },
  { trainNumber: '69159', trainName: 'Virar - Dahanu Road MEMU', sourceCode: 'VR', destinationCode: 'DRD', vrTime: '17:35' },
  { trainNumber: '69161', trainName: 'Panvel - Dahanu Road MEMU', sourceCode: 'PNVL', destinationCode: 'DRD', vrTime: '19:48' },
  { trainNumber: '69163', trainName: 'Virar - Dahanu Road Night MEMU', sourceCode: 'VR', destinationCode: 'DRD', vrTime: '21:50' },
];

function buildDownMemuTrain(cfg: MemuConfig): TrainDetail {
  const stops: TrainStop[] = [];
  let seq = 1;

  if (cfg.sourceCode === 'PNVL') {
    const pnvlDep = addMinutes(cfg.vrTime, -95);
    stops.push({
      stopSequence: seq++,
      stationCode: 'PNVL',
      stationName: 'Panvel Junction',
      scheduledArrival: 'START',
      scheduledDeparture: pnvlDep,
      haltMinutes: 0,
      distanceFromSourceKm: 0,
      dayCount: 1,
      platform: '5',
      latitude: STATIONS.PNVL.lat,
      longitude: STATIONS.PNVL.lng,
    });
    stops.push({
      stopSequence: seq++,
      stationCode: 'BSR',
      stationName: 'Vasai Road',
      scheduledArrival: addMinutes(pnvlDep, 80),
      scheduledDeparture: addMinutes(pnvlDep, 82),
      haltMinutes: 2,
      distanceFromSourceKm: 65,
      dayCount: 1,
      platform: '6',
      latitude: STATIONS.BSR.lat,
      longitude: STATIONS.BSR.lng,
    });
  }

  const dahanuStations = ['VR', 'VTN', 'SAH', 'KLV', 'PLG', 'UOI', 'BOR', 'VGN', 'DRD'];
  const baseKm = cfg.sourceCode === 'PNVL' ? 60 - 75 : 60;

  for (const stCode of dahanuStations) {
    const meta = STATIONS[stCode];
    const offset = DOWN_OFFSETS[stCode];
    const arrTime = addMinutes(cfg.vrTime, offset);
    const isFirst = stCode === 'VR' && cfg.sourceCode === 'VR';
    const isLast = stCode === 'DRD' && cfg.destinationCode === 'DRD';
    const depTime = isLast ? 'END' : isFirst ? arrTime : addMinutes(arrTime, 1);
    const dist = Math.max(0, Math.round(meta.kmFromCcg - baseKm));

    stops.push({
      stopSequence: seq++,
      stationCode: meta.code,
      stationName: meta.name,
      scheduledArrival: isFirst ? 'START' : arrTime,
      scheduledDeparture: depTime,
      haltMinutes: isFirst || isLast ? 0 : 1,
      distanceFromSourceKm: dist,
      dayCount: 1,
      platform: meta.platform,
      latitude: meta.lat,
      longitude: meta.lng,
    });
  }

  // If going to SJN or ST, continue beyond DRD
  if (cfg.destinationCode === 'SJN' || cfg.destinationCode === 'ST') {
    const drdArr = addMinutes(cfg.vrTime, DOWN_OFFSETS.DRD);
    stops.push({
      stopSequence: seq++,
      stationCode: 'GVD',
      stationName: 'Gholvad',
      scheduledArrival: addMinutes(drdArr, 12),
      scheduledDeparture: addMinutes(drdArr, 13),
      haltMinutes: 1,
      distanceFromSourceKm: 75,
      dayCount: 1,
      platform: '2',
      latitude: STATIONS.GVD.lat,
      longitude: STATIONS.GVD.lng,
    });
    stops.push({
      stopSequence: seq++,
      stationCode: 'BRRD',
      stationName: 'Bordi Road',
      scheduledArrival: addMinutes(drdArr, 19),
      scheduledDeparture: addMinutes(drdArr, 20),
      haltMinutes: 1,
      distanceFromSourceKm: 80,
      dayCount: 1,
      platform: '1',
      latitude: STATIONS.BRRD.lat,
      longitude: STATIONS.BRRD.lng,
    });
    stops.push({
      stopSequence: seq++,
      stationCode: 'SJN',
      stationName: 'Sanjan',
      scheduledArrival: addMinutes(drdArr, 28),
      scheduledDeparture: cfg.destinationCode === 'SJN' ? 'END' : addMinutes(drdArr, 29),
      haltMinutes: cfg.destinationCode === 'SJN' ? 0 : 1,
      distanceFromSourceKm: 88,
      dayCount: 1,
      platform: '2',
      latitude: STATIONS.SJN.lat,
      longitude: STATIONS.SJN.lng,
    });

    if (cfg.destinationCode === 'ST') {
      stops.push({
        stopSequence: seq++,
        stationCode: 'UBR',
        stationName: 'Umargam Road',
        scheduledArrival: addMinutes(drdArr, 36),
        scheduledDeparture: addMinutes(drdArr, 37),
        haltMinutes: 1,
        distanceFromSourceKm: 94,
        dayCount: 1,
        platform: '2',
        latitude: STATIONS.UBR.lat,
        longitude: STATIONS.UBR.lng,
      });
      stops.push({
        stopSequence: seq++,
        stationCode: 'BLD',
        stationName: 'Bhilad',
        scheduledArrival: addMinutes(drdArr, 45),
        scheduledDeparture: addMinutes(drdArr, 46),
        haltMinutes: 1,
        distanceFromSourceKm: 100,
        dayCount: 1,
        platform: '2',
        latitude: STATIONS.BLD.lat,
        longitude: STATIONS.BLD.lng,
      });
      stops.push({
        stopSequence: seq++,
        stationCode: 'VAPI',
        stationName: 'Vapi',
        scheduledArrival: addMinutes(drdArr, 60),
        scheduledDeparture: addMinutes(drdArr, 62),
        haltMinutes: 2,
        distanceFromSourceKm: 110,
        dayCount: 1,
        platform: '2',
        latitude: STATIONS.VAPI.lat,
        longitude: STATIONS.VAPI.lng,
      });
      stops.push({
        stopSequence: seq++,
        stationCode: 'BL',
        stationName: 'Valsad',
        scheduledArrival: addMinutes(drdArr, 88),
        scheduledDeparture: addMinutes(drdArr, 92),
        haltMinutes: 4,
        distanceFromSourceKm: 135,
        dayCount: 1,
        platform: '3',
        latitude: STATIONS.BL.lat,
        longitude: STATIONS.BL.lng,
      });
      stops.push({
        stopSequence: seq++,
        stationCode: 'ST',
        stationName: 'Surat',
        scheduledArrival: addMinutes(drdArr, 160),
        scheduledDeparture: 'END',
        haltMinutes: 0,
        distanceFromSourceKm: 203,
        dayCount: 1,
        platform: '1',
        latitude: STATIONS.ST.lat,
        longitude: STATIONS.ST.lng,
      });
    }
  }

  const first = stops[0];
  const last = stops[stops.length - 1];

  return {
    trainNumber: cfg.trainNumber,
    trainName: cfg.trainName,
    sourceCode: first.stationCode,
    sourceName: first.stationName,
    destinationCode: last.stationCode,
    destinationName: last.stationName,
    trainType: 'MEMU',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departureTime: first.scheduledDeparture,
    arrivalTime: last.scheduledArrival,
    durationMinutes: 70,
    distanceKm: last.distanceFromSourceKm,
    zone: 'WR',
    hasPantry: false,
    locoType: '8-Car MEMU Rake',
    schedule: stops,
  };
}

// Additional Express Trains stopping at Boisar and Dahanu Road
const DOWN_EXPRESS_TRAINS: TrainDetail[] = [
  // 19015 - Saurashtra Express
  {
    trainNumber: '19015',
    trainName: 'Saurashtra Express',
    sourceCode: 'MMCT',
    sourceName: 'Mumbai Central',
    destinationCode: 'ADI',
    destinationName: 'Ahmedabad Junction',
    trainType: 'Express',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departureTime: '09:30',
    arrivalTime: '20:10',
    durationMinutes: 640,
    distanceKm: 492,
    zone: 'WR',
    hasPantry: false,
    locoType: 'WAP-4 #22510 (Vadodara)',
    schedule: [
      { stopSequence: 1, stationCode: 'MMCT', stationName: 'Mumbai Central', scheduledArrival: 'START', scheduledDeparture: '09:30', haltMinutes: 0, distanceFromSourceKm: 0, dayCount: 1, platform: '2', latitude: 18.9696, longitude: 72.8193 },
      { stopSequence: 2, stationCode: 'DDR', stationName: 'Dadar', scheduledArrival: '09:41', scheduledDeparture: '09:43', haltMinutes: 2, distanceFromSourceKm: 6, dayCount: 1, platform: '5', latitude: 19.0178, longitude: 72.8478 },
      { stopSequence: 3, stationCode: 'BVI', stationName: 'Borivali', scheduledArrival: '10:14', scheduledDeparture: '10:16', haltMinutes: 2, distanceFromSourceKm: 30, dayCount: 1, platform: '6', latitude: 19.2288, longitude: 72.8541 },
      { stopSequence: 4, stationCode: 'PLG', stationName: 'Palghar', scheduledArrival: '11:06', scheduledDeparture: '11:08', haltMinutes: 2, distanceFromSourceKm: 87, dayCount: 1, platform: '1', latitude: 19.6967, longitude: 72.7699 },
      { stopSequence: 5, stationCode: 'BOR', stationName: 'Boisar', scheduledArrival: '11:21', scheduledDeparture: '11:23', haltMinutes: 2, distanceFromSourceKm: 98, dayCount: 1, platform: '2', latitude: 19.8000, longitude: 72.7565 },
      { stopSequence: 6, stationCode: 'VGN', stationName: 'Vangaon', scheduledArrival: '11:34', scheduledDeparture: '11:35', haltMinutes: 1, distanceFromSourceKm: 107.4, dayCount: 1, platform: '1', latitude: 19.8822, longitude: 72.7489, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 7, stationCode: 'DRD', stationName: 'Dahanu Road', scheduledArrival: '11:47', scheduledDeparture: '11:49', haltMinutes: 2, distanceFromSourceKm: 119.7, dayCount: 1, platform: '1', latitude: 19.9734, longitude: 72.7329 },
      { stopSequence: 8, stationCode: 'GVD', stationName: 'Gholvad', scheduledArrival: '12:02', scheduledDeparture: '12:04', haltMinutes: 2, distanceFromSourceKm: 135, dayCount: 1, platform: '2', latitude: 20.0768, longitude: 72.7369 },
      { stopSequence: 9, stationCode: 'SJN', stationName: 'Sanjan', scheduledArrival: '12:18', scheduledDeparture: '12:20', haltMinutes: 2, distanceFromSourceKm: 148, dayCount: 1, platform: '2', latitude: 20.2012, longitude: 72.8021 },
      { stopSequence: 10, stationCode: 'UBR', stationName: 'Umargam Road', scheduledArrival: '12:28', scheduledDeparture: '12:30', haltMinutes: 2, distanceFromSourceKm: 154, dayCount: 1, platform: '2', latitude: 20.2456, longitude: 72.8312 },
      { stopSequence: 11, stationCode: 'BLD', stationName: 'Bhilad', scheduledArrival: '12:39', scheduledDeparture: '12:41', haltMinutes: 2, distanceFromSourceKm: 160, dayCount: 1, platform: '2', latitude: 20.2834, longitude: 72.8687 },
      { stopSequence: 12, stationCode: 'VAPI', stationName: 'Vapi', scheduledArrival: '12:56', scheduledDeparture: '12:58', haltMinutes: 2, distanceFromSourceKm: 170, dayCount: 1, platform: '2', latitude: 20.3712, longitude: 72.9042 },
      { stopSequence: 13, stationCode: 'BL', stationName: 'Valsad', scheduledArrival: '13:30', scheduledDeparture: '13:35', haltMinutes: 5, distanceFromSourceKm: 195, dayCount: 1, platform: '3', latitude: 20.6094, longitude: 72.9342 },
      { stopSequence: 14, stationCode: 'ST', stationName: 'Surat', scheduledArrival: '14:45', scheduledDeparture: '14:50', haltMinutes: 5, distanceFromSourceKm: 263, dayCount: 1, platform: '1', latitude: 21.2049, longitude: 72.8408 },
      { stopSequence: 15, stationCode: 'BH', stationName: 'Bharuch Junction', scheduledArrival: '15:48', scheduledDeparture: '15:50', haltMinutes: 2, distanceFromSourceKm: 322, dayCount: 1, platform: '3', latitude: 21.7051, longitude: 72.9959 },
      { stopSequence: 16, stationCode: 'BRC', stationName: 'Vadodara Junction', scheduledArrival: '17:05', scheduledDeparture: '17:15', haltMinutes: 10, distanceFromSourceKm: 393, dayCount: 1, platform: '2', latitude: 22.3106, longitude: 73.1812 },
      { stopSequence: 17, stationCode: 'ANND', stationName: 'Anand Junction', scheduledArrival: '17:55', scheduledDeparture: '17:57', haltMinutes: 2, distanceFromSourceKm: 428, dayCount: 1, platform: '3', latitude: 22.5645, longitude: 72.9289 },
      { stopSequence: 18, stationCode: 'ADI', stationName: 'Ahmedabad Junction', scheduledArrival: '20:10', scheduledDeparture: 'END', haltMinutes: 0, distanceFromSourceKm: 492, dayCount: 1, platform: '5', latitude: 23.0238, longitude: 72.6011 },
    ],
  },
  // 12935 - Bandra Terminus - Surat InterCity Superfast
  {
    trainNumber: '12935',
    trainName: 'BDTS - Surat InterCity SF Express',
    sourceCode: 'BDTS',
    sourceName: 'Bandra Terminus',
    destinationCode: 'ST',
    destinationName: 'Surat',
    trainType: 'Superfast',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departureTime: '06:35',
    arrivalTime: '11:05',
    durationMinutes: 270,
    distanceKm: 252,
    zone: 'WR',
    hasPantry: false,
    locoType: 'WAP-7 #30480 (Vadodara)',
    schedule: [
      { stopSequence: 1, stationCode: 'BDTS', stationName: 'Bandra Terminus', scheduledArrival: 'START', scheduledDeparture: '06:35', haltMinutes: 0, distanceFromSourceKm: 0, dayCount: 1, platform: '4', latitude: 19.0624, longitude: 72.8407 },
      { stopSequence: 2, stationCode: 'ADH', stationName: 'Andheri', scheduledArrival: '06:48', scheduledDeparture: '06:50', haltMinutes: 2, distanceFromSourceKm: 8, dayCount: 1, platform: '8', latitude: 19.1197, longitude: 72.8464 },
      { stopSequence: 3, stationCode: 'BVI', stationName: 'Borivali', scheduledArrival: '07:05', scheduledDeparture: '07:07', haltMinutes: 2, distanceFromSourceKm: 19, dayCount: 1, platform: '6', latitude: 19.2288, longitude: 72.8541 },
      { stopSequence: 4, stationCode: 'VR', stationName: 'Virar', scheduledArrival: '07:34', scheduledDeparture: '07:36', haltMinutes: 2, distanceFromSourceKm: 45, dayCount: 1, platform: '3', latitude: 19.4674, longitude: 72.8118 },
      { stopSequence: 5, stationCode: 'PLG', stationName: 'Palghar', scheduledArrival: '08:04', scheduledDeparture: '08:06', haltMinutes: 2, distanceFromSourceKm: 76, dayCount: 1, platform: '1', latitude: 19.6967, longitude: 72.7699 },
      { stopSequence: 6, stationCode: 'BOR', stationName: 'Boisar', scheduledArrival: '08:18', scheduledDeparture: '08:20', haltMinutes: 2, distanceFromSourceKm: 87, dayCount: 1, platform: '2', latitude: 19.8000, longitude: 72.7565 },
      { stopSequence: 7, stationCode: 'VGN', stationName: 'Vangaon', scheduledArrival: '08:31', scheduledDeparture: '08:31', haltMinutes: 0, distanceFromSourceKm: 96.4, dayCount: 1, platform: '1', latitude: 19.8822, longitude: 72.7489, actionType: 'PASS', stop_status: 'PASS_THROUGH' },
      { stopSequence: 8, stationCode: 'DRD', stationName: 'Dahanu Road', scheduledArrival: '08:44', scheduledDeparture: '08:46', haltMinutes: 2, distanceFromSourceKm: 108.7, dayCount: 1, platform: '1', latitude: 19.9734, longitude: 72.7329 },
      { stopSequence: 9, stationCode: 'VAPI', stationName: 'Vapi', scheduledArrival: '09:32', scheduledDeparture: '09:34', haltMinutes: 2, distanceFromSourceKm: 157, dayCount: 1, platform: '1', latitude: 20.3712, longitude: 72.9042 },
      { stopSequence: 10, stationCode: 'BL', stationName: 'Valsad', scheduledArrival: '10:02', scheduledDeparture: '10:05', haltMinutes: 3, distanceFromSourceKm: 183, dayCount: 1, platform: '2', latitude: 20.6094, longitude: 72.9342 },
      { stopSequence: 11, stationCode: 'ST', stationName: 'Surat', scheduledArrival: '11:05', scheduledDeparture: 'END', haltMinutes: 0, distanceFromSourceKm: 252, dayCount: 1, platform: '1', latitude: 21.2049, longitude: 72.8408 },
    ],
  },
  // 22955 - Kutch SF Express
  {
    trainNumber: '22955',
    trainName: 'Kutch SF Express',
    sourceCode: 'BDTS',
    sourceName: 'Bandra Terminus',
    destinationCode: 'BHUJ',
    destinationName: 'Bhuj',
    trainType: 'Superfast',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departureTime: '17:45',
    arrivalTime: '08:30',
    durationMinutes: 885,
    distanceKm: 840,
    zone: 'WR',
    hasPantry: true,
    locoType: 'WAP-7 #30456 (Vadodara)',
    schedule: [
      { stopSequence: 1, stationCode: 'BDTS', stationName: 'Bandra Terminus', scheduledArrival: 'START', scheduledDeparture: '17:45', haltMinutes: 0, distanceFromSourceKm: 0, dayCount: 1, platform: '4', latitude: 19.0624, longitude: 72.8407 },
      { stopSequence: 2, stationCode: 'BVI', stationName: 'Borivali', scheduledArrival: '18:07', scheduledDeparture: '18:12', haltMinutes: 5, distanceFromSourceKm: 19, dayCount: 1, platform: '6', latitude: 19.2288, longitude: 72.8541 },
      { stopSequence: 3, stationCode: 'BOR', stationName: 'Boisar', scheduledArrival: '19:28', scheduledDeparture: '19:30', haltMinutes: 2, distanceFromSourceKm: 87, dayCount: 1, platform: '2', latitude: 19.8000, longitude: 72.7565 },
      { stopSequence: 4, stationCode: 'VGN', stationName: 'Vangaon', scheduledArrival: '19:42', scheduledDeparture: '19:42', haltMinutes: 0, distanceFromSourceKm: 96.4, dayCount: 1, platform: '1', latitude: 19.8822, longitude: 72.7489, actionType: 'PASS', stop_status: 'PASS_THROUGH' },
      { stopSequence: 5, stationCode: 'DRD', stationName: 'Dahanu Road', scheduledArrival: '19:55', scheduledDeparture: '19:57', haltMinutes: 2, distanceFromSourceKm: 108.7, dayCount: 1, platform: '1', latitude: 19.9734, longitude: 72.7329 },
      { stopSequence: 6, stationCode: 'VAPI', stationName: 'Vapi', scheduledArrival: '20:42', scheduledDeparture: '20:44', haltMinutes: 2, distanceFromSourceKm: 157, dayCount: 1, platform: '1', latitude: 20.3712, longitude: 72.9042 },
      { stopSequence: 7, stationCode: 'BL', stationName: 'Valsad', scheduledArrival: '21:08', scheduledDeparture: '21:10', haltMinutes: 2, distanceFromSourceKm: 183, dayCount: 1, platform: '2', latitude: 20.6094, longitude: 72.9342 },
      { stopSequence: 8, stationCode: 'ST', stationName: 'Surat', scheduledArrival: '22:15', scheduledDeparture: '22:20', haltMinutes: 5, distanceFromSourceKm: 252, dayCount: 1, platform: '1', latitude: 21.2049, longitude: 72.8408 },
      { stopSequence: 9, stationCode: 'BH', stationName: 'Bharuch Junction', scheduledArrival: '23:08', scheduledDeparture: '23:10', haltMinutes: 2, distanceFromSourceKm: 311, dayCount: 1, platform: '3', latitude: 21.7051, longitude: 72.9959 },
      { stopSequence: 10, stationCode: 'BRC', stationName: 'Vadodara Junction', scheduledArrival: '00:15', scheduledDeparture: '00:20', haltMinutes: 5, distanceFromSourceKm: 382, dayCount: 2, platform: '2', latitude: 22.3106, longitude: 73.1812 },
      { stopSequence: 11, stationCode: 'ANND', stationName: 'Anand Junction', scheduledArrival: '00:55', scheduledDeparture: '00:57', haltMinutes: 2, distanceFromSourceKm: 417, dayCount: 2, platform: '3', latitude: 22.5645, longitude: 72.9289 },
      { stopSequence: 12, stationCode: 'ADI', stationName: 'Ahmedabad Junction', scheduledArrival: '01:50', scheduledDeparture: '02:05', haltMinutes: 15, distanceFromSourceKm: 482, dayCount: 2, platform: '6', latitude: 23.0238, longitude: 72.6011 },
      { stopSequence: 13, stationCode: 'BHUJ', stationName: 'Bhuj', scheduledArrival: '08:30', scheduledDeparture: 'END', haltMinutes: 0, distanceFromSourceKm: 840, dayCount: 2, platform: '1', latitude: 23.2533, longitude: 69.6693 },
    ],
  },
  // 19217 - Saurashtra Janata Express
  {
    trainNumber: '19217',
    trainName: 'Saurashtra Janata Express',
    sourceCode: 'BDTS',
    sourceName: 'Bandra Terminus',
    destinationCode: 'RJT',
    destinationName: 'Rajkot Junction',
    trainType: 'Express',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departureTime: '13:40',
    arrivalTime: '06:10',
    durationMinutes: 990,
    distanceKm: 735,
    zone: 'WR',
    hasPantry: true,
    locoType: 'WAP-7 #30412 (Vadodara)',
    schedule: [
      { stopSequence: 1, stationCode: 'BDTS', stationName: 'Bandra Terminus', scheduledArrival: 'START', scheduledDeparture: '13:40', haltMinutes: 0, distanceFromSourceKm: 0, dayCount: 1, platform: '3', latitude: 19.0624, longitude: 72.8407 },
      { stopSequence: 2, stationCode: 'BVI', stationName: 'Borivali', scheduledArrival: '14:02', scheduledDeparture: '14:05', haltMinutes: 3, distanceFromSourceKm: 19, dayCount: 1, platform: '8', latitude: 19.2288, longitude: 72.8541 },
      { stopSequence: 3, stationCode: 'PLG', stationName: 'Palghar', scheduledArrival: '15:05', scheduledDeparture: '15:07', haltMinutes: 2, distanceFromSourceKm: 76, dayCount: 1, platform: '1', latitude: 19.6967, longitude: 72.7699 },
      { stopSequence: 4, stationCode: 'BOR', stationName: 'Boisar', scheduledArrival: '15:22', scheduledDeparture: '15:24', haltMinutes: 2, distanceFromSourceKm: 87, dayCount: 1, platform: '2', latitude: 19.8000, longitude: 72.7565 },
      { stopSequence: 5, stationCode: 'VGN', stationName: 'Vangaon', scheduledArrival: '15:37', scheduledDeparture: '15:38', haltMinutes: 1, distanceFromSourceKm: 96.4, dayCount: 1, platform: '1', latitude: 19.8822, longitude: 72.7489, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 6, stationCode: 'DRD', stationName: 'Dahanu Road', scheduledArrival: '15:52', scheduledDeparture: '15:54', haltMinutes: 2, distanceFromSourceKm: 108.7, dayCount: 1, platform: '1', latitude: 19.9734, longitude: 72.7329 },
      { stopSequence: 7, stationCode: 'VAPI', stationName: 'Vapi', scheduledArrival: '16:42', scheduledDeparture: '16:44', haltMinutes: 2, distanceFromSourceKm: 157, dayCount: 1, platform: '1', latitude: 20.3712, longitude: 72.9042 },
      { stopSequence: 8, stationCode: 'BL', stationName: 'Valsad', scheduledArrival: '17:10', scheduledDeparture: '17:15', haltMinutes: 5, distanceFromSourceKm: 183, dayCount: 1, platform: '2', latitude: 20.6094, longitude: 72.9342 },
      { stopSequence: 9, stationCode: 'ST', stationName: 'Surat', scheduledArrival: '18:22', scheduledDeparture: '18:27', haltMinutes: 5, distanceFromSourceKm: 252, dayCount: 1, platform: '1', latitude: 21.2049, longitude: 72.8408 },
      { stopSequence: 10, stationCode: 'BRC', stationName: 'Vadodara Junction', scheduledArrival: '20:15', scheduledDeparture: '20:25', haltMinutes: 10, distanceFromSourceKm: 382, dayCount: 1, platform: '2', latitude: 22.3106, longitude: 73.1812 },
      { stopSequence: 11, stationCode: 'ADI', stationName: 'Ahmedabad Junction', scheduledArrival: '22:20', scheduledDeparture: '22:35', haltMinutes: 15, distanceFromSourceKm: 482, dayCount: 1, platform: '5', latitude: 23.0238, longitude: 72.6011 },
      { stopSequence: 12, stationCode: 'RJT', stationName: 'Rajkot Junction', scheduledArrival: '06:10', scheduledDeparture: 'END', haltMinutes: 0, distanceFromSourceKm: 735, dayCount: 2, platform: '3', latitude: 22.3117, longitude: 70.7981 },
    ],
  },
  // 19001 - Virar - Surat Express Passenger (stops at all stations after Virar)
  {
    trainNumber: '19001',
    trainName: 'Virar - Surat Express Passenger',
    sourceCode: 'VR',
    sourceName: 'Virar',
    destinationCode: 'ST',
    destinationName: 'Surat',
    trainType: 'Passenger',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departureTime: '12:05',
    arrivalTime: '17:05',
    durationMinutes: 300,
    distanceKm: 203,
    zone: 'WR',
    hasPantry: false,
    locoType: 'WAP-4 (Vadodara)',
    schedule: [
      { stopSequence: 1, stationCode: 'VR', stationName: 'Virar', scheduledArrival: 'START', scheduledDeparture: '12:05', haltMinutes: 0, distanceFromSourceKm: 0, dayCount: 1, platform: '2', latitude: 19.4674, longitude: 72.8118 },
      { stopSequence: 2, stationCode: 'VTN', stationName: 'Vaitarna', scheduledArrival: '12:15', scheduledDeparture: '12:16', haltMinutes: 1, distanceFromSourceKm: 9, dayCount: 1, platform: '1', latitude: 19.5312, longitude: 72.8193 },
      { stopSequence: 3, stationCode: 'SAH', stationName: 'Saphale', scheduledArrival: '12:24', scheduledDeparture: '12:25', haltMinutes: 1, distanceFromSourceKm: 16, dayCount: 1, platform: '2', latitude: 19.5772, longitude: 72.8188 },
      { stopSequence: 4, stationCode: 'KLV', stationName: 'Kelve Road', scheduledArrival: '12:32', scheduledDeparture: '12:33', haltMinutes: 1, distanceFromSourceKm: 23, dayCount: 1, platform: '1', latitude: 19.6268, longitude: 72.7937 },
      { stopSequence: 5, stationCode: 'PLG', stationName: 'Palghar', scheduledArrival: '12:41', scheduledDeparture: '12:43', haltMinutes: 2, distanceFromSourceKm: 31, dayCount: 1, platform: '1', latitude: 19.6967, longitude: 72.7699 },
      { stopSequence: 6, stationCode: 'UOI', stationName: 'Umroli', scheduledArrival: '12:50', scheduledDeparture: '12:51', haltMinutes: 1, distanceFromSourceKm: 38, dayCount: 1, platform: '1', latitude: 19.7423, longitude: 72.7612 },
      { stopSequence: 7, stationCode: 'BOR', stationName: 'Boisar', scheduledArrival: '12:58', scheduledDeparture: '13:00', haltMinutes: 2, distanceFromSourceKm: 45, dayCount: 1, platform: '2', latitude: 19.8000, longitude: 72.7565 },
      { stopSequence: 8, stationCode: 'VGN', stationName: 'Vangaon', scheduledArrival: '13:10', scheduledDeparture: '13:11', haltMinutes: 1, distanceFromSourceKm: 54.4, dayCount: 1, platform: '1', latitude: 19.8822, longitude: 72.7489 },
      { stopSequence: 9, stationCode: 'DRD', stationName: 'Dahanu Road', scheduledArrival: '13:25', scheduledDeparture: '13:28', haltMinutes: 3, distanceFromSourceKm: 66.7, dayCount: 1, platform: '1', latitude: 19.9734, longitude: 72.7329 },
      { stopSequence: 10, stationCode: 'GVD', stationName: 'Gholvad', scheduledArrival: '13:40', scheduledDeparture: '13:41', haltMinutes: 1, distanceFromSourceKm: 75, dayCount: 1, platform: '2', latitude: 20.0768, longitude: 72.7369 },
      { stopSequence: 11, stationCode: 'BRRD', stationName: 'Bordi Road', scheduledArrival: '13:48', scheduledDeparture: '13:49', haltMinutes: 1, distanceFromSourceKm: 80, dayCount: 1, platform: '1', latitude: 20.1245, longitude: 72.7482 },
      { stopSequence: 12, stationCode: 'SJN', stationName: 'Sanjan', scheduledArrival: '13:58', scheduledDeparture: '14:00', haltMinutes: 2, distanceFromSourceKm: 88, dayCount: 1, platform: '2', latitude: 20.2012, longitude: 72.8021 },
      { stopSequence: 13, stationCode: 'UBR', stationName: 'Umargam Road', scheduledArrival: '14:08', scheduledDeparture: '14:10', haltMinutes: 2, distanceFromSourceKm: 94, dayCount: 1, platform: '2', latitude: 20.2456, longitude: 72.8312 },
      { stopSequence: 14, stationCode: 'BLD', stationName: 'Bhilad', scheduledArrival: '14:20', scheduledDeparture: '14:22', haltMinutes: 2, distanceFromSourceKm: 100, dayCount: 1, platform: '2', latitude: 20.2834, longitude: 72.8687 },
      { stopSequence: 15, stationCode: 'VAPI', stationName: 'Vapi', scheduledArrival: '14:38', scheduledDeparture: '14:40', haltMinutes: 2, distanceFromSourceKm: 110, dayCount: 1, platform: '2', latitude: 20.3712, longitude: 72.9042 },
      { stopSequence: 16, stationCode: 'BL', stationName: 'Valsad', scheduledArrival: '15:15', scheduledDeparture: '15:20', haltMinutes: 5, distanceFromSourceKm: 135, dayCount: 1, platform: '3', latitude: 20.6094, longitude: 72.9342 },
      { stopSequence: 17, stationCode: 'ST', stationName: 'Surat', scheduledArrival: '17:05', scheduledDeparture: 'END', haltMinutes: 0, distanceFromSourceKm: 203, dayCount: 1, platform: '1', latitude: 21.2049, longitude: 72.8408 },
    ],
  },
  // 22927 - Lokshakti SF Express
  {
    trainNumber: '22927',
    trainName: 'Lokshakti SF Express',
    sourceCode: 'BDTS',
    sourceName: 'Bandra Terminus',
    destinationCode: 'ADI',
    destinationName: 'Ahmedabad Junction',
    trainType: 'Superfast',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departureTime: '19:40',
    arrivalTime: '04:20',
    durationMinutes: 520,
    distanceKm: 482,
    zone: 'WR',
    hasPantry: false,
    locoType: 'WAP-7 #30511 (Vadodara)',
    schedule: [
      { stopSequence: 1, stationCode: 'BDTS', stationName: 'Bandra Terminus', scheduledArrival: 'START', scheduledDeparture: '19:40', haltMinutes: 0, distanceFromSourceKm: 0, dayCount: 1, platform: '5', latitude: 19.0624, longitude: 72.8407 },
      { stopSequence: 2, stationCode: 'ADH', stationName: 'Andheri', scheduledArrival: '19:48', scheduledDeparture: '19:50', haltMinutes: 2, distanceFromSourceKm: 8, dayCount: 1, platform: '8', latitude: 19.1197, longitude: 72.8464 },
      { stopSequence: 3, stationCode: 'BVI', stationName: 'Borivali', scheduledArrival: '20:05', scheduledDeparture: '20:09', haltMinutes: 4, distanceFromSourceKm: 19, dayCount: 1, platform: '8', latitude: 19.2288, longitude: 72.8541 },
      { stopSequence: 4, stationCode: 'PLG', stationName: 'Palghar', scheduledArrival: '21:00', scheduledDeparture: '21:02', haltMinutes: 2, distanceFromSourceKm: 76, dayCount: 1, platform: '1', latitude: 19.6967, longitude: 72.7699 },
      { stopSequence: 5, stationCode: 'BOR', stationName: 'Boisar', scheduledArrival: '21:14', scheduledDeparture: '21:16', haltMinutes: 2, distanceFromSourceKm: 87, dayCount: 1, platform: '2', latitude: 19.8000, longitude: 72.7565 },
      { stopSequence: 6, stationCode: 'VGN', stationName: 'Vangaon', scheduledArrival: '21:28', scheduledDeparture: '21:28', haltMinutes: 0, distanceFromSourceKm: 96.4, dayCount: 1, platform: '1', latitude: 19.8822, longitude: 72.7489, actionType: 'PASS', stop_status: 'PASS_THROUGH' },
      { stopSequence: 7, stationCode: 'DRD', stationName: 'Dahanu Road', scheduledArrival: '21:42', scheduledDeparture: '21:44', haltMinutes: 2, distanceFromSourceKm: 108.7, dayCount: 1, platform: '1', latitude: 19.9734, longitude: 72.7329 },
      { stopSequence: 8, stationCode: 'VAPI', stationName: 'Vapi', scheduledArrival: '22:28', scheduledDeparture: '22:30', haltMinutes: 2, distanceFromSourceKm: 157, dayCount: 1, platform: '1', latitude: 20.3712, longitude: 72.9042 },
      { stopSequence: 9, stationCode: 'BL', stationName: 'Valsad', scheduledArrival: '22:54', scheduledDeparture: '22:56', haltMinutes: 2, distanceFromSourceKm: 183, dayCount: 1, platform: '2', latitude: 20.6094, longitude: 72.9342 },
      { stopSequence: 10, stationCode: 'ST', stationName: 'Surat', scheduledArrival: '23:55', scheduledDeparture: '00:01', haltMinutes: 6, distanceFromSourceKm: 252, dayCount: 1, platform: '1', latitude: 21.2049, longitude: 72.8408 },
      { stopSequence: 11, stationCode: 'BRC', stationName: 'Vadodara Junction', scheduledArrival: '01:50', scheduledDeparture: '01:55', haltMinutes: 5, distanceFromSourceKm: 382, dayCount: 2, platform: '2', latitude: 22.3106, longitude: 73.1812 },
      { stopSequence: 12, stationCode: 'ANND', stationName: 'Anand Junction', scheduledArrival: '02:30', scheduledDeparture: '02:32', haltMinutes: 2, distanceFromSourceKm: 417, dayCount: 2, platform: '3', latitude: 22.5645, longitude: 72.9289 },
      { stopSequence: 13, stationCode: 'ADI', stationName: 'Ahmedabad Junction', scheduledArrival: '04:20', scheduledDeparture: 'END', haltMinutes: 0, distanceFromSourceKm: 482, dayCount: 2, platform: '5', latitude: 23.0238, longitude: 72.6011 },
    ],
  },
  // 22953 - Gujarat SF Express (Mumbai Central to Ahmedabad)
  {
    trainNumber: '22953',
    trainName: 'Gujarat SF Express',
    sourceCode: 'MMCT',
    sourceName: 'Mumbai Central',
    destinationCode: 'ADI',
    destinationName: 'Ahmedabad Junction',
    trainType: 'Superfast',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departureTime: '05:40',
    arrivalTime: '14:30',
    durationMinutes: 530,
    distanceKm: 491,
    zone: 'WR',
    hasPantry: false,
    locoType: 'WAP-7 #30480 (Vadodara)',
    schedule: [
      { stopSequence: 1, stationCode: 'MMCT', stationName: 'Mumbai Central', scheduledArrival: 'START', scheduledDeparture: '05:40', haltMinutes: 0, distanceFromSourceKm: 0, dayCount: 1, platform: '3', latitude: 18.9696, longitude: 72.8193, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 2, stationCode: 'DDR', stationName: 'Dadar', scheduledArrival: '05:50', scheduledDeparture: '05:52', haltMinutes: 2, distanceFromSourceKm: 6, dayCount: 1, platform: '5', latitude: 19.0178, longitude: 72.8478, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 3, stationCode: 'BVI', stationName: 'Borivali', scheduledArrival: '06:11', scheduledDeparture: '06:13', haltMinutes: 2, distanceFromSourceKm: 30, dayCount: 1, platform: '6', latitude: 19.2288, longitude: 72.8541, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 4, stationCode: 'PLG', stationName: 'Palghar', scheduledArrival: '07:05', scheduledDeparture: '07:07', haltMinutes: 2, distanceFromSourceKm: 87, dayCount: 1, platform: '1', latitude: 19.6967, longitude: 72.7699, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 5, stationCode: 'BOR', stationName: 'Boisar', scheduledArrival: '07:23', scheduledDeparture: '07:25', haltMinutes: 2, distanceFromSourceKm: 98, dayCount: 1, platform: '2', latitude: 19.8000, longitude: 72.7565, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 6, stationCode: 'VGN', stationName: 'Vangaon', scheduledArrival: '07:33', scheduledDeparture: '07:33', haltMinutes: 0, distanceFromSourceKm: 107.4, dayCount: 1, platform: '1', latitude: 19.8822, longitude: 72.7489, actionType: 'PASS', stop_status: 'PASS_THROUGH' },
      { stopSequence: 7, stationCode: 'DRD', stationName: 'Dahanu Road', scheduledArrival: '07:43', scheduledDeparture: '07:45', haltMinutes: 2, distanceFromSourceKm: 119.7, dayCount: 1, platform: '1', latitude: 19.9734, longitude: 72.7329, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 8, stationCode: 'UBR', stationName: 'Umargam Road', scheduledArrival: '08:02', scheduledDeparture: '08:04', haltMinutes: 2, distanceFromSourceKm: 139, dayCount: 1, platform: '2', latitude: 20.2456, longitude: 72.8312, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 9, stationCode: 'BLD', stationName: 'Bhilad', scheduledArrival: '08:14', scheduledDeparture: '08:16', haltMinutes: 2, distanceFromSourceKm: 156, dayCount: 1, platform: '2', latitude: 20.2834, longitude: 72.8687, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 10, stationCode: 'VAPI', stationName: 'Vapi', scheduledArrival: '08:24', scheduledDeparture: '08:26', haltMinutes: 2, distanceFromSourceKm: 167, dayCount: 1, platform: '2', latitude: 20.3712, longitude: 72.9042, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 11, stationCode: 'BL', stationName: 'Valsad', scheduledArrival: '08:50', scheduledDeparture: '08:55', haltMinutes: 5, distanceFromSourceKm: 194, dayCount: 1, platform: '3', latitude: 20.6094, longitude: 72.9342, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 12, stationCode: 'BIM', stationName: 'Bilimora Junction', scheduledArrival: '09:08', scheduledDeparture: '09:10', haltMinutes: 2, distanceFromSourceKm: 212, dayCount: 1, platform: '2', latitude: 20.7645, longitude: 72.9612, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 13, stationCode: 'NVS', stationName: 'Navsari', scheduledArrival: '09:28', scheduledDeparture: '09:30', haltMinutes: 2, distanceFromSourceKm: 233, dayCount: 1, platform: '2', latitude: 20.9467, longitude: 72.9520, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 14, stationCode: 'ST', stationName: 'Surat', scheduledArrival: '10:05', scheduledDeparture: '10:10', haltMinutes: 5, distanceFromSourceKm: 262, dayCount: 1, platform: '1', latitude: 21.2049, longitude: 72.8408, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 15, stationCode: 'BH', stationName: 'Bharuch Junction', scheduledArrival: '11:00', scheduledDeparture: '11:02', haltMinutes: 2, distanceFromSourceKm: 321, dayCount: 1, platform: '3', latitude: 21.7051, longitude: 72.9959, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 16, stationCode: 'BRC', stationName: 'Vadodara Junction', scheduledArrival: '12:05', scheduledDeparture: '12:10', haltMinutes: 5, distanceFromSourceKm: 391, dayCount: 1, platform: '2', latitude: 22.3106, longitude: 73.1812, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 17, stationCode: 'ANND', stationName: 'Anand Junction', scheduledArrival: '12:45', scheduledDeparture: '12:47', haltMinutes: 2, distanceFromSourceKm: 427, dayCount: 1, platform: '3', latitude: 22.5645, longitude: 72.9289, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 18, stationCode: 'ADI', stationName: 'Ahmedabad Junction', scheduledArrival: '14:30', scheduledDeparture: 'END', haltMinutes: 0, distanceFromSourceKm: 491, dayCount: 1, platform: '6', latitude: 23.0238, longitude: 72.6011, actionType: 'STOP', stop_status: 'STOP' },
    ],
  },
];

// Return (Up) trains from Dahanu Road towards Boisar / Virar / Mumbai
interface UpLocalConfig {
  trainNumber: string;
  destCode: string;
  type: 'Fast Local' | 'Slow Local' | 'AC Local';
  drdDepartureTime: string;
}

const UP_LOCAL_CONFIGS: UpLocalConfig[] = [
  { trainNumber: '93002', destCode: 'VR', type: 'Slow Local', drdDepartureTime: '05:40' },
  { trainNumber: '93004', destCode: 'CCG', type: 'Fast Local', drdDepartureTime: '06:05' },
  { trainNumber: '93006', destCode: 'VR', type: 'Slow Local', drdDepartureTime: '06:40' },
  { trainNumber: '93008', destCode: 'CCG', type: 'Fast Local', drdDepartureTime: '07:15' },
  { trainNumber: '93010', destCode: 'BVI', type: 'Slow Local', drdDepartureTime: '07:45' },
  { trainNumber: '93012', destCode: 'CCG', type: 'Fast Local', drdDepartureTime: '08:25' },
  { trainNumber: '93014', destCode: 'CCG', type: 'AC Local', drdDepartureTime: '09:00' },
  { trainNumber: '93016', destCode: 'DDR', type: 'Fast Local', drdDepartureTime: '09:35' },
  { trainNumber: '93018', destCode: 'VR', type: 'Slow Local', drdDepartureTime: '10:20' },
  { trainNumber: '93020', destCode: 'CCG', type: 'Fast Local', drdDepartureTime: '11:10' },
  { trainNumber: '93022', destCode: 'VR', type: 'Slow Local', drdDepartureTime: '11:45' },
  { trainNumber: '93024', destCode: 'BVI', type: 'Slow Local', drdDepartureTime: '12:30' },
  { trainNumber: '93026', destCode: 'VR', type: 'Slow Local', drdDepartureTime: '13:15' },
  { trainNumber: '93028', destCode: 'CCG', type: 'Fast Local', drdDepartureTime: '14:00' },
  { trainNumber: '93030', destCode: 'VR', type: 'Slow Local', drdDepartureTime: '14:40' },
  { trainNumber: '93032', destCode: 'BVI', type: 'Slow Local', drdDepartureTime: '15:20' },
  { trainNumber: '93034', destCode: 'DDR', type: 'Fast Local', drdDepartureTime: '16:05' },
  { trainNumber: '93036', destCode: 'CCG', type: 'Fast Local', drdDepartureTime: '16:50' },
  { trainNumber: '93038', destCode: 'VR', type: 'Slow Local', drdDepartureTime: '17:35' },
  { trainNumber: '93040', destCode: 'CCG', type: 'AC Local', drdDepartureTime: '18:15' },
  { trainNumber: '93042', destCode: 'BVI', type: 'Slow Local', drdDepartureTime: '18:55' },
  { trainNumber: '93044', destCode: 'CCG', type: 'Fast Local', drdDepartureTime: '19:40' },
  { trainNumber: '93046', destCode: 'DDR', type: 'Fast Local', drdDepartureTime: '20:30' },
  { trainNumber: '93048', destCode: 'CCG', type: 'Fast Local', drdDepartureTime: '21:15' },
  { trainNumber: '93050', destCode: 'VR', type: 'Slow Local', drdDepartureTime: '22:05' },
  { trainNumber: '93052', destCode: 'CCG', type: 'Fast Local', drdDepartureTime: '22:50' },
];

function buildUpLocalTrain(cfg: UpLocalConfig): TrainDetail {
  const stops: TrainStop[] = [];
  let seq = 1;
  const drdDep = cfg.drdDepartureTime;

  // 9 stations from Dahanu Road to Virar
  const dahanuStations = ['DRD', 'VGN', 'BOR', 'UOI', 'PLG', 'KLV', 'SAH', 'VTN', 'VR'];

  for (const stCode of dahanuStations) {
    const meta = STATIONS[stCode];
    const offset = UP_OFFSETS[stCode];
    const arrTime = addMinutes(drdDep, offset);
    const isFirst = stCode === 'DRD';
    const isLast = stCode === 'VR' && cfg.destCode === 'VR';
    const depTime = isLast ? 'END' : isFirst ? arrTime : addMinutes(arrTime, 1);
    const dist = Math.max(0, Math.round(STATIONS.DRD.kmFromCcg - meta.kmFromCcg));

    stops.push({
      stopSequence: seq++,
      stationCode: meta.code,
      stationName: meta.name,
      scheduledArrival: isFirst ? 'START' : arrTime,
      scheduledDeparture: depTime,
      haltMinutes: isFirst || isLast ? 0 : 1,
      distanceFromSourceKm: dist,
      dayCount: 1,
      platform: meta.platform,
      latitude: meta.lat,
      longitude: meta.lng,
    });
  }

  // Extend to destination if past Virar
  const vrArr = addMinutes(drdDep, UP_OFFSETS.VR);
  if (cfg.destCode === 'BVI' || cfg.destCode === 'DDR' || cfg.destCode === 'CCG') {
    stops.push({
      stopSequence: seq++,
      stationCode: 'BSR',
      stationName: 'Vasai Road',
      scheduledArrival: addMinutes(vrArr, 10),
      scheduledDeparture: addMinutes(vrArr, 11),
      haltMinutes: 1,
      distanceFromSourceKm: Math.round(STATIONS.DRD.kmFromCcg - STATIONS.BSR.kmFromCcg),
      dayCount: 1,
      platform: '3',
      latitude: STATIONS.BSR.lat,
      longitude: STATIONS.BSR.lng,
    });
    stops.push({
      stopSequence: seq++,
      stationCode: 'BVI',
      stationName: 'Borivali',
      scheduledArrival: addMinutes(vrArr, 27),
      scheduledDeparture: cfg.destCode === 'BVI' ? 'END' : addMinutes(vrArr, 28),
      haltMinutes: cfg.destCode === 'BVI' ? 0 : 1,
      distanceFromSourceKm: Math.round(STATIONS.DRD.kmFromCcg - STATIONS.BVI.kmFromCcg),
      dayCount: 1,
      platform: '5',
      latitude: STATIONS.BVI.lat,
      longitude: STATIONS.BVI.lng,
    });
  }

  if (cfg.destCode === 'DDR' || cfg.destCode === 'CCG') {
    const bviDep = addMinutes(vrArr, 28);
    stops.push({
      stopSequence: seq++,
      stationCode: 'ADH',
      stationName: 'Andheri',
      scheduledArrival: addMinutes(bviDep, 14),
      scheduledDeparture: addMinutes(bviDep, 15),
      haltMinutes: 1,
      distanceFromSourceKm: Math.round(STATIONS.DRD.kmFromCcg - STATIONS.ADH.kmFromCcg),
      dayCount: 1,
      platform: '4',
      latitude: STATIONS.ADH.lat,
      longitude: STATIONS.ADH.lng,
    });
    stops.push({
      stopSequence: seq++,
      stationCode: 'DDR',
      stationName: 'Dadar',
      scheduledArrival: addMinutes(bviDep, 30),
      scheduledDeparture: cfg.destCode === 'DDR' ? 'END' : addMinutes(bviDep, 31),
      haltMinutes: cfg.destCode === 'DDR' ? 0 : 1,
      distanceFromSourceKm: Math.round(STATIONS.DRD.kmFromCcg - STATIONS.DDR.kmFromCcg),
      dayCount: 1,
      platform: '3',
      latitude: STATIONS.DDR.lat,
      longitude: STATIONS.DDR.lng,
    });
  }

  if (cfg.destCode === 'CCG') {
    const ddrDep = addMinutes(vrArr, 59);
    stops.push({
      stopSequence: seq++,
      stationCode: 'MMCT',
      stationName: 'Mumbai Central',
      scheduledArrival: addMinutes(ddrDep, 9),
      scheduledDeparture: addMinutes(ddrDep, 10),
      haltMinutes: 1,
      distanceFromSourceKm: Math.round(STATIONS.DRD.kmFromCcg - STATIONS.MMCT.kmFromCcg),
      dayCount: 1,
      platform: '2',
      latitude: STATIONS.MMCT.lat,
      longitude: STATIONS.MMCT.lng,
    });
    stops.push({
      stopSequence: seq++,
      stationCode: 'CCG',
      stationName: 'Churchgate',
      scheduledArrival: addMinutes(ddrDep, 18),
      scheduledDeparture: 'END',
      haltMinutes: 0,
      distanceFromSourceKm: Math.round(STATIONS.DRD.kmFromCcg - STATIONS.CCG.kmFromCcg),
      dayCount: 1,
      platform: '2',
      latitude: STATIONS.CCG.lat,
      longitude: STATIONS.CCG.lng,
    });
  }

  const first = stops[0];
  const last = stops[stops.length - 1];
  const destName = STATIONS[cfg.destCode]?.name || 'Virar';
  const prefix = cfg.type === 'AC Local' ? 'AC Fast Local' : cfg.type;

  return {
    trainNumber: cfg.trainNumber,
    trainName: `Dahanu Road - ${destName} ${prefix}`,
    sourceCode: 'DRD',
    sourceName: 'Dahanu Road',
    destinationCode: cfg.destCode,
    destinationName: destName,
    trainType: cfg.type,
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departureTime: first.scheduledDeparture,
    arrivalTime: last.scheduledArrival,
    durationMinutes: 145,
    distanceKm: last.distanceFromSourceKm,
    zone: 'WR',
    hasPantry: false,
    locoType: cfg.type === 'AC Local' ? '12-Car Medha AC EMU' : '12-Car BHEL EMU',
    schedule: stops,
  };
}

// 8 Return MEMUs
const UP_MEMU_CONFIGS: MemuConfig[] = [
  { trainNumber: '69150', trainName: 'Dahanu Road - Virar MEMU', sourceCode: 'DRD', destinationCode: 'VR', vrTime: '06:30' },
  { trainNumber: '69152', trainName: 'Dahanu Road - Panvel MEMU', sourceCode: 'DRD', destinationCode: 'PNVL', vrTime: '08:45' },
  { trainNumber: '69154', trainName: 'Sanjan - Virar MEMU', sourceCode: 'SJN', destinationCode: 'VR', vrTime: '10:45' },
  { trainNumber: '69156', trainName: 'Surat - Virar MEMU', sourceCode: 'ST', destinationCode: 'VR', vrTime: '13:30' },
  { trainNumber: '69158', trainName: 'Dahanu Road - Panvel MEMU', sourceCode: 'DRD', destinationCode: 'PNVL', vrTime: '16:45' },
  { trainNumber: '69160', trainName: 'Dahanu Road - Virar MEMU', sourceCode: 'DRD', destinationCode: 'VR', vrTime: '19:15' },
  { trainNumber: '69162', trainName: 'Dahanu Road - Panvel MEMU', sourceCode: 'DRD', destinationCode: 'PNVL', vrTime: '21:35' },
  { trainNumber: '69164', trainName: 'Dahanu Road - Virar Night MEMU', sourceCode: 'DRD', destinationCode: 'VR', vrTime: '23:30' },
];

function buildUpMemuTrain(cfg: MemuConfig): TrainDetail {
  const stops: TrainStop[] = [];
  let seq = 1;
  const drdDep = cfg.vrTime;

  const dahanuStations = ['DRD', 'VGN', 'BOR', 'UOI', 'PLG', 'KLV', 'SAH', 'VTN', 'VR'];
  for (const stCode of dahanuStations) {
    const meta = STATIONS[stCode];
    const offset = UP_OFFSETS[stCode];
    const arrTime = addMinutes(drdDep, offset);
    const isFirst = stCode === 'DRD';
    const isLast = stCode === 'VR' && cfg.destinationCode === 'VR';
    const depTime = isLast ? 'END' : isFirst ? arrTime : addMinutes(arrTime, 1);
    const dist = Math.max(0, Math.round(STATIONS.DRD.kmFromCcg - meta.kmFromCcg));

    stops.push({
      stopSequence: seq++,
      stationCode: meta.code,
      stationName: meta.name,
      scheduledArrival: isFirst ? 'START' : arrTime,
      scheduledDeparture: depTime,
      haltMinutes: isFirst || isLast ? 0 : 1,
      distanceFromSourceKm: dist,
      dayCount: 1,
      platform: meta.platform,
      latitude: meta.lat,
      longitude: meta.lng,
    });
  }

  if (cfg.destinationCode === 'PNVL') {
    const vrArr = addMinutes(drdDep, UP_OFFSETS.VR);
    stops.push({
      stopSequence: seq++,
      stationCode: 'BSR',
      stationName: 'Vasai Road',
      scheduledArrival: addMinutes(vrArr, 14),
      scheduledDeparture: addMinutes(vrArr, 16),
      haltMinutes: 2,
      distanceFromSourceKm: Math.round(STATIONS.DRD.kmFromCcg - STATIONS.BSR.kmFromCcg),
      dayCount: 1,
      platform: '6',
      latitude: STATIONS.BSR.lat,
      longitude: STATIONS.BSR.lng,
    });
    stops.push({
      stopSequence: seq++,
      stationCode: 'PNVL',
      stationName: 'Panvel Junction',
      scheduledArrival: addMinutes(vrArr, 95),
      scheduledDeparture: 'END',
      haltMinutes: 0,
      distanceFromSourceKm: 140,
      dayCount: 1,
      platform: '5',
      latitude: STATIONS.PNVL.lat,
      longitude: STATIONS.PNVL.lng,
    });
  }

  const first = stops[0];
  const last = stops[stops.length - 1];

  return {
    trainNumber: cfg.trainNumber,
    trainName: cfg.trainName,
    sourceCode: first.stationCode,
    sourceName: first.stationName,
    destinationCode: last.stationCode,
    destinationName: last.stationName,
    trainType: 'MEMU',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departureTime: first.scheduledDeparture,
    arrivalTime: last.scheduledArrival,
    durationMinutes: 70,
    distanceKm: last.distanceFromSourceKm,
    zone: 'WR',
    hasPantry: false,
    locoType: '8-Car MEMU Rake',
    schedule: stops,
  };
}

// 19418 - Vatva - Borivali Express (Reverse of 19417)
const UP_19418_EXPRESS: TrainDetail = {
  trainNumber: '19418',
  trainName: 'Vatva - Borivali Express',
  sourceCode: 'VTA',
  sourceName: 'Vatva',
  destinationCode: 'BVI',
  destinationName: 'Borivali',
  trainType: 'Express',
  runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  departureTime: '23:45',
  arrivalTime: '14:10',
  durationMinutes: 865,
  distanceKm: 455,
  zone: 'WR',
  hasPantry: false,
  locoType: 'WAP-5 #30018 (Vadodara Shed)',
  schedule: [
    { stopSequence: 1, stationCode: 'VTA', stationName: 'Vatva', scheduledArrival: 'START', scheduledDeparture: '23:45', haltMinutes: 0, distanceFromSourceKm: 0, dayCount: 1, platform: '2', latitude: 22.9567, longitude: 72.6322 },
    { stopSequence: 2, stationCode: 'ANND', stationName: 'Anand Junction', scheduledArrival: '00:35', scheduledDeparture: '00:37', haltMinutes: 2, distanceFromSourceKm: 55, dayCount: 2, platform: '4', latitude: 22.5645, longitude: 72.9289 },
    { stopSequence: 3, stationCode: 'BRC', stationName: 'Vadodara Junction', scheduledArrival: '01:25', scheduledDeparture: '01:35', haltMinutes: 10, distanceFromSourceKm: 90, dayCount: 2, platform: '1', latitude: 22.3106, longitude: 73.1812 },
    { stopSequence: 4, stationCode: 'BH', stationName: 'Bharuch Junction', scheduledArrival: '02:35', scheduledDeparture: '02:40', haltMinutes: 5, distanceFromSourceKm: 161, dayCount: 2, platform: '4', latitude: 21.7051, longitude: 72.9959 },
    { stopSequence: 5, stationCode: 'ST', stationName: 'Surat', scheduledArrival: '03:45', scheduledDeparture: '03:50', haltMinutes: 5, distanceFromSourceKm: 220, dayCount: 2, platform: '2', latitude: 21.2049, longitude: 72.8408 },
    { stopSequence: 6, stationCode: 'BL', stationName: 'Valsad', scheduledArrival: '05:00', scheduledDeparture: '05:05', haltMinutes: 5, distanceFromSourceKm: 289, dayCount: 2, platform: '3', latitude: 20.6094, longitude: 72.9342 },
    { stopSequence: 7, stationCode: 'VAPI', stationName: 'Vapi', scheduledArrival: '05:35', scheduledDeparture: '05:37', haltMinutes: 2, distanceFromSourceKm: 315, dayCount: 2, platform: '2', latitude: 20.3712, longitude: 72.9042 },
    { stopSequence: 8, stationCode: 'BLD', stationName: 'Bhilad', scheduledArrival: '05:50', scheduledDeparture: '05:52', haltMinutes: 2, distanceFromSourceKm: 328, dayCount: 2, platform: '2', latitude: 20.2834, longitude: 72.8687 },
    { stopSequence: 9, stationCode: 'UBR', stationName: 'Umargam Road', scheduledArrival: '06:01', scheduledDeparture: '06:03', haltMinutes: 2, distanceFromSourceKm: 336, dayCount: 2, platform: '2', latitude: 20.2456, longitude: 72.8312 },
    { stopSequence: 10, stationCode: 'SJN', stationName: 'Sanjan', scheduledArrival: '06:12', scheduledDeparture: '06:14', haltMinutes: 2, distanceFromSourceKm: 342, dayCount: 2, platform: '2', latitude: 20.2012, longitude: 72.8021 },
    { stopSequence: 11, stationCode: 'BRRD', stationName: 'Bordi Road', scheduledArrival: '06:22', scheduledDeparture: '06:23', haltMinutes: 1, distanceFromSourceKm: 350, dayCount: 2, platform: '1', latitude: 20.1245, longitude: 72.7482 },
    { stopSequence: 12, stationCode: 'GVD', stationName: 'Gholvad', scheduledArrival: '06:31', scheduledDeparture: '06:33', haltMinutes: 2, distanceFromSourceKm: 355, dayCount: 2, platform: '2', latitude: 20.0768, longitude: 72.7369 },
    { stopSequence: 13, stationCode: 'DRD', stationName: 'Dahanu Road', scheduledArrival: '06:50', scheduledDeparture: '06:55', haltMinutes: 5, distanceFromSourceKm: 366, dayCount: 2, platform: '2', latitude: 19.9734, longitude: 72.7329 },
    { stopSequence: 14, stationCode: 'VGN', stationName: 'Vangaon', scheduledArrival: '07:08', scheduledDeparture: '07:10', haltMinutes: 2, distanceFromSourceKm: 378, dayCount: 2, platform: '1', latitude: 19.8822, longitude: 72.7489 },
    { stopSequence: 15, stationCode: 'BOR', stationName: 'Boisar', scheduledArrival: '07:22', scheduledDeparture: '07:25', haltMinutes: 3, distanceFromSourceKm: 387, dayCount: 2, platform: '3', latitude: 19.8000, longitude: 72.7565 },
    { stopSequence: 16, stationCode: 'UOI', stationName: 'Umroli', scheduledArrival: '07:33', scheduledDeparture: '07:34', haltMinutes: 1, distanceFromSourceKm: 393, dayCount: 2, platform: '1', latitude: 19.7423, longitude: 72.7612 },
    { stopSequence: 17, stationCode: 'PLG', stationName: 'Palghar', scheduledArrival: '07:44', scheduledDeparture: '07:47', haltMinutes: 3, distanceFromSourceKm: 399, dayCount: 2, platform: '2', latitude: 19.6967, longitude: 72.7699 },
    { stopSequence: 18, stationCode: 'KLV', stationName: 'Kelve Road', scheduledArrival: '07:56', scheduledDeparture: '07:58', haltMinutes: 2, distanceFromSourceKm: 406, dayCount: 2, platform: '1', latitude: 19.6268, longitude: 72.7937 },
    { stopSequence: 19, stationCode: 'SAH', stationName: 'Saphale', scheduledArrival: '08:06', scheduledDeparture: '08:08', haltMinutes: 2, distanceFromSourceKm: 413, dayCount: 2, platform: '1', latitude: 19.5772, longitude: 72.8188 },
    { stopSequence: 20, stationCode: 'VTN', stationName: 'Vaitarna', scheduledArrival: '08:18', scheduledDeparture: '08:19', haltMinutes: 1, distanceFromSourceKm: 420, dayCount: 2, platform: '1', latitude: 19.5312, longitude: 72.8193 },
    { stopSequence: 21, stationCode: 'VR', stationName: 'Virar', scheduledArrival: '08:32', scheduledDeparture: '08:35', haltMinutes: 3, distanceFromSourceKm: 429, dayCount: 2, platform: '4', latitude: 19.4674, longitude: 72.8118 },
    { stopSequence: 22, stationCode: 'BSR', stationName: 'Vasai Road', scheduledArrival: '08:50', scheduledDeparture: '08:52', haltMinutes: 2, distanceFromSourceKm: 437, dayCount: 2, platform: '3', latitude: 19.3804, longitude: 72.8317 },
    { stopSequence: 23, stationCode: 'BVI', stationName: 'Borivali', scheduledArrival: '14:10', scheduledDeparture: 'END', haltMinutes: 0, distanceFromSourceKm: 455, dayCount: 2, platform: '7', latitude: 19.2288, longitude: 72.8541 },
  ],
};

// Additional UP Express Trains stopping at Dahanu Road and Boisar (towards Mumbai)
const UP_EXPRESS_TRAINS: TrainDetail[] = [
  // 22954 - Gujarat SF Express (Ahmedabad to Mumbai Central)
  {
    trainNumber: '22954',
    trainName: 'Gujarat SF Express',
    sourceCode: 'ADI',
    sourceName: 'Ahmedabad Junction',
    destinationCode: 'MMCT',
    destinationName: 'Mumbai Central',
    trainType: 'Superfast',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departureTime: '07:00',
    arrivalTime: '15:55',
    durationMinutes: 535,
    distanceKm: 491,
    zone: 'WR',
    hasPantry: false,
    locoType: 'WAP-7 #30488 (Vadodara)',
    schedule: [
      { stopSequence: 1, stationCode: 'ADI', stationName: 'Ahmedabad Junction', scheduledArrival: 'START', scheduledDeparture: '07:00', haltMinutes: 0, distanceFromSourceKm: 0, dayCount: 1, platform: '6', latitude: 23.0238, longitude: 72.6011, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 2, stationCode: 'ANND', stationName: 'Anand Junction', scheduledArrival: '07:55', scheduledDeparture: '07:57', haltMinutes: 2, distanceFromSourceKm: 64, dayCount: 1, platform: '4', latitude: 22.5645, longitude: 72.9289, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 3, stationCode: 'BRC', stationName: 'Vadodara Junction', scheduledArrival: '08:35', scheduledDeparture: '08:40', haltMinutes: 5, distanceFromSourceKm: 100, dayCount: 1, platform: '1', latitude: 22.3106, longitude: 73.1812, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 4, stationCode: 'BH', stationName: 'Bharuch Junction', scheduledArrival: '09:35', scheduledDeparture: '09:37', haltMinutes: 2, distanceFromSourceKm: 170, dayCount: 1, platform: '4', latitude: 21.7051, longitude: 72.9959, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 5, stationCode: 'ST', stationName: 'Surat', scheduledArrival: '10:35', scheduledDeparture: '10:40', haltMinutes: 5, distanceFromSourceKm: 229, dayCount: 1, platform: '2', latitude: 21.2049, longitude: 72.8408, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 6, stationCode: 'NVS', stationName: 'Navsari', scheduledArrival: '11:05', scheduledDeparture: '11:07', haltMinutes: 2, distanceFromSourceKm: 258, dayCount: 1, platform: '2', latitude: 20.9467, longitude: 72.9520, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 7, stationCode: 'BIM', stationName: 'Bilimora Junction', scheduledArrival: '11:25', scheduledDeparture: '11:27', haltMinutes: 2, distanceFromSourceKm: 279, dayCount: 1, platform: '2', latitude: 20.7645, longitude: 72.9612, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 8, stationCode: 'BL', stationName: 'Valsad', scheduledArrival: '11:45', scheduledDeparture: '11:50', haltMinutes: 5, distanceFromSourceKm: 297, dayCount: 1, platform: '3', latitude: 20.6094, longitude: 72.9342, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 9, stationCode: 'VAPI', stationName: 'Vapi', scheduledArrival: '12:15', scheduledDeparture: '12:17', haltMinutes: 2, distanceFromSourceKm: 324, dayCount: 1, platform: '2', latitude: 20.3712, longitude: 72.9042, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 10, stationCode: 'BLD', stationName: 'Bhilad', scheduledArrival: '12:35', scheduledDeparture: '12:37', haltMinutes: 2, distanceFromSourceKm: 335, dayCount: 1, platform: '3', latitude: 20.2834, longitude: 72.8687, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 11, stationCode: 'SJN', stationName: 'Sanjan', scheduledArrival: '12:48', scheduledDeparture: '12:50', haltMinutes: 2, distanceFromSourceKm: 347, dayCount: 1, platform: '2', latitude: 20.2012, longitude: 72.8021, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 12, stationCode: 'UBR', stationName: 'Umargam Road', scheduledArrival: '13:00', scheduledDeparture: '13:02', haltMinutes: 2, distanceFromSourceKm: 352, dayCount: 1, platform: '2', latitude: 20.2456, longitude: 72.8312, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 13, stationCode: 'DRD', stationName: 'Dahanu Road', scheduledArrival: '13:23', scheduledDeparture: '13:25', haltMinutes: 2, distanceFromSourceKm: 372, dayCount: 1, platform: '2', latitude: 19.9734, longitude: 72.7329, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 14, stationCode: 'VGN', stationName: 'Vangaon', scheduledArrival: '13:31', scheduledDeparture: '13:31', haltMinutes: 0, distanceFromSourceKm: 381, dayCount: 1, platform: '1', latitude: 19.8822, longitude: 72.7489, actionType: 'PASS', stop_status: 'PASS_THROUGH' },
      { stopSequence: 15, stationCode: 'BOR', stationName: 'Boisar', scheduledArrival: '13:38', scheduledDeparture: '13:40', haltMinutes: 2, distanceFromSourceKm: 393, dayCount: 1, platform: '3', latitude: 19.8000, longitude: 72.7565, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 16, stationCode: 'PLG', stationName: 'Palghar', scheduledArrival: '13:58', scheduledDeparture: '14:00', haltMinutes: 2, distanceFromSourceKm: 405, dayCount: 1, platform: '2', latitude: 19.6967, longitude: 72.7699, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 17, stationCode: 'BVI', stationName: 'Borivali', scheduledArrival: '14:48', scheduledDeparture: '14:50', haltMinutes: 2, distanceFromSourceKm: 466, dayCount: 1, platform: '7', latitude: 19.2288, longitude: 72.8541, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 18, stationCode: 'DDR', stationName: 'Dadar', scheduledArrival: '15:25', scheduledDeparture: '15:27', haltMinutes: 2, distanceFromSourceKm: 485, dayCount: 1, platform: '5', latitude: 19.0178, longitude: 72.8478, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 19, stationCode: 'MMCT', stationName: 'Mumbai Central', scheduledArrival: '15:55', scheduledDeparture: 'END', haltMinutes: 0, distanceFromSourceKm: 491, dayCount: 1, platform: '3', latitude: 18.9696, longitude: 72.8193, actionType: 'STOP', stop_status: 'STOP' },
    ],
  },
  // 22946 - Saurashtra Mail (Porbandar to Mumbai Central)
  {
    trainNumber: '22946',
    trainName: 'Saurashtra Mail',
    sourceCode: 'PBR',
    sourceName: 'Porbandar',
    destinationCode: 'MMCT',
    destinationName: 'Mumbai Central',
    trainType: 'Express',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departureTime: '21:20',
    arrivalTime: '11:40',
    durationMinutes: 860,
    distanceKm: 955,
    zone: 'WR',
    hasPantry: false,
    locoType: 'WAP-4 #22510 (Vadodara)',
    schedule: [
      { stopSequence: 1, stationCode: 'ST', stationName: 'Surat', scheduledArrival: '06:05', scheduledDeparture: '06:10', haltMinutes: 5, distanceFromSourceKm: 692, dayCount: 2, platform: '2', latitude: 21.2049, longitude: 72.8408, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 2, stationCode: 'BL', stationName: 'Valsad', scheduledArrival: '07:15', scheduledDeparture: '07:20', haltMinutes: 5, distanceFromSourceKm: 760, dayCount: 2, platform: '3', latitude: 20.6094, longitude: 72.9342, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 3, stationCode: 'VAPI', stationName: 'Vapi', scheduledArrival: '07:45', scheduledDeparture: '07:47', haltMinutes: 2, distanceFromSourceKm: 786, dayCount: 2, platform: '2', latitude: 20.3712, longitude: 72.9042, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 4, stationCode: 'BLD', stationName: 'Bhilad', scheduledArrival: '08:00', scheduledDeparture: '08:02', haltMinutes: 2, distanceFromSourceKm: 797, dayCount: 2, platform: '2', latitude: 20.2834, longitude: 72.8687, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 5, stationCode: 'UBR', stationName: 'Umargam Road', scheduledArrival: '08:14', scheduledDeparture: '08:16', haltMinutes: 2, distanceFromSourceKm: 803, dayCount: 2, platform: '2', latitude: 20.2456, longitude: 72.8312, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 6, stationCode: 'SJN', stationName: 'Sanjan', scheduledArrival: '08:26', scheduledDeparture: '08:28', haltMinutes: 2, distanceFromSourceKm: 809, dayCount: 2, platform: '2', latitude: 20.2012, longitude: 72.8021, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 7, stationCode: 'GVD', stationName: 'Gholvad', scheduledArrival: '08:44', scheduledDeparture: '08:46', haltMinutes: 2, distanceFromSourceKm: 822, dayCount: 2, platform: '2', latitude: 20.0768, longitude: 72.7369, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 8, stationCode: 'DRD', stationName: 'Dahanu Road', scheduledArrival: '09:04', scheduledDeparture: '09:06', haltMinutes: 2, distanceFromSourceKm: 831, dayCount: 2, platform: '2', latitude: 19.9734, longitude: 72.7329, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 9, stationCode: 'VGN', stationName: 'Vangaon', scheduledArrival: '09:16', scheduledDeparture: '09:17', haltMinutes: 1, distanceFromSourceKm: 843, dayCount: 2, platform: '1', latitude: 19.8822, longitude: 72.7489, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 10, stationCode: 'BOR', stationName: 'Boisar', scheduledArrival: '09:28', scheduledDeparture: '09:30', haltMinutes: 2, distanceFromSourceKm: 854, dayCount: 2, platform: '3', latitude: 19.8000, longitude: 72.7565, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 11, stationCode: 'PLG', stationName: 'Palghar', scheduledArrival: '09:48', scheduledDeparture: '09:50', haltMinutes: 2, distanceFromSourceKm: 865, dayCount: 2, platform: '2', latitude: 19.6967, longitude: 72.7699, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 12, stationCode: 'BVI', stationName: 'Borivali', scheduledArrival: '10:40', scheduledDeparture: '10:43', haltMinutes: 3, distanceFromSourceKm: 925, dayCount: 2, platform: '7', latitude: 19.2288, longitude: 72.8541, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 13, stationCode: 'DDR', stationName: 'Dadar', scheduledArrival: '11:15', scheduledDeparture: '11:17', haltMinutes: 2, distanceFromSourceKm: 949, dayCount: 2, platform: '5', latitude: 19.0178, longitude: 72.8478, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 14, stationCode: 'MMCT', stationName: 'Mumbai Central', scheduledArrival: '11:40', scheduledDeparture: 'END', haltMinutes: 0, distanceFromSourceKm: 955, dayCount: 2, platform: '3', latitude: 18.9696, longitude: 72.8193, actionType: 'STOP', stop_status: 'STOP' },
    ],
  },
  // 12936 - Surat - BDTS InterCity SF Express
  {
    trainNumber: '12936',
    trainName: 'Surat - BDTS InterCity SF Express',
    sourceCode: 'ST',
    sourceName: 'Surat',
    destinationCode: 'BDTS',
    destinationName: 'Bandra Terminus',
    trainType: 'Superfast',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departureTime: '16:25',
    arrivalTime: '20:40',
    durationMinutes: 255,
    distanceKm: 252,
    zone: 'WR',
    hasPantry: false,
    locoType: 'WAP-7 #30480 (Vadodara)',
    schedule: [
      { stopSequence: 1, stationCode: 'ST', stationName: 'Surat', scheduledArrival: 'START', scheduledDeparture: '16:25', haltMinutes: 0, distanceFromSourceKm: 0, dayCount: 1, platform: '4', latitude: 21.2049, longitude: 72.8408, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 2, stationCode: 'BL', stationName: 'Valsad', scheduledArrival: '17:15', scheduledDeparture: '17:18', haltMinutes: 3, distanceFromSourceKm: 69, dayCount: 1, platform: '3', latitude: 20.6094, longitude: 72.9342, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 3, stationCode: 'VAPI', stationName: 'Vapi', scheduledArrival: '17:42', scheduledDeparture: '17:44', haltMinutes: 2, distanceFromSourceKm: 95, dayCount: 1, platform: '2', latitude: 20.3712, longitude: 72.9042, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 4, stationCode: 'DRD', stationName: 'Dahanu Road', scheduledArrival: '18:45', scheduledDeparture: '18:47', haltMinutes: 2, distanceFromSourceKm: 143, dayCount: 1, platform: '2', latitude: 19.9734, longitude: 72.7329, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 5, stationCode: 'VGN', stationName: 'Vangaon', scheduledArrival: '18:55', scheduledDeparture: '18:55', haltMinutes: 0, distanceFromSourceKm: 155, dayCount: 1, platform: '1', latitude: 19.8822, longitude: 72.7489, actionType: 'PASS', stop_status: 'PASS_THROUGH' },
      { stopSequence: 6, stationCode: 'BOR', stationName: 'Boisar', scheduledArrival: '19:05', scheduledDeparture: '19:07', haltMinutes: 2, distanceFromSourceKm: 165, dayCount: 1, platform: '3', latitude: 19.8000, longitude: 72.7565, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 7, stationCode: 'PLG', stationName: 'Palghar', scheduledArrival: '19:22', scheduledDeparture: '19:24', haltMinutes: 2, distanceFromSourceKm: 176, dayCount: 1, platform: '2', latitude: 19.6967, longitude: 72.7699, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 8, stationCode: 'VR', stationName: 'Virar', scheduledArrival: '19:48', scheduledDeparture: '19:48', haltMinutes: 0, distanceFromSourceKm: 207, dayCount: 1, platform: '3', latitude: 19.4674, longitude: 72.8118, actionType: 'PASS', stop_status: 'PASS_THROUGH' },
      { stopSequence: 9, stationCode: 'BVI', stationName: 'Borivali', scheduledArrival: '20:00', scheduledDeparture: '20:02', haltMinutes: 2, distanceFromSourceKm: 233, dayCount: 1, platform: '7', latitude: 19.2288, longitude: 72.8541, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 10, stationCode: 'ADH', stationName: 'Andheri', scheduledArrival: '20:18', scheduledDeparture: '20:20', haltMinutes: 2, distanceFromSourceKm: 244, dayCount: 1, platform: '8', latitude: 19.1197, longitude: 72.8464, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 11, stationCode: 'BDTS', stationName: 'Bandra Terminus', scheduledArrival: '20:40', scheduledDeparture: 'END', haltMinutes: 0, distanceFromSourceKm: 252, dayCount: 1, platform: '4', latitude: 19.0624, longitude: 72.8407, actionType: 'STOP', stop_status: 'STOP' },
    ],
  },
  // 19218 - Saurashtra Janata Express (Rajkot to Bandra Terminus)
  {
    trainNumber: '19218',
    trainName: 'Saurashtra Janata Express',
    sourceCode: 'RJT',
    sourceName: 'Rajkot Junction',
    destinationCode: 'BDTS',
    destinationName: 'Bandra Terminus',
    trainType: 'Express',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departureTime: '11:20',
    arrivalTime: '05:45',
    durationMinutes: 1105,
    distanceKm: 735,
    zone: 'WR',
    hasPantry: true,
    locoType: 'WAP-7 #30412 (Vadodara)',
    schedule: [
      { stopSequence: 1, stationCode: 'ST', stationName: 'Surat', scheduledArrival: '00:40', scheduledDeparture: '00:45', haltMinutes: 5, distanceFromSourceKm: 483, dayCount: 2, platform: '2', latitude: 21.2049, longitude: 72.8408, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 2, stationCode: 'BL', stationName: 'Valsad', scheduledArrival: '01:40', scheduledDeparture: '01:45', haltMinutes: 5, distanceFromSourceKm: 552, dayCount: 2, platform: '3', latitude: 20.6094, longitude: 72.9342, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 3, stationCode: 'VAPI', stationName: 'Vapi', scheduledArrival: '02:10', scheduledDeparture: '02:12', haltMinutes: 2, distanceFromSourceKm: 578, dayCount: 2, platform: '2', latitude: 20.3712, longitude: 72.9042, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 4, stationCode: 'DRD', stationName: 'Dahanu Road', scheduledArrival: '02:40', scheduledDeparture: '02:42', haltMinutes: 2, distanceFromSourceKm: 626, dayCount: 2, platform: '2', latitude: 19.9734, longitude: 72.7329, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 5, stationCode: 'VGN', stationName: 'Vangaon', scheduledArrival: '02:51', scheduledDeparture: '02:51', haltMinutes: 0, distanceFromSourceKm: 638, dayCount: 2, platform: '1', latitude: 19.8822, longitude: 72.7489, actionType: 'PASS', stop_status: 'PASS_THROUGH' },
      { stopSequence: 6, stationCode: 'BOR', stationName: 'Boisar', scheduledArrival: '03:02', scheduledDeparture: '03:04', haltMinutes: 2, distanceFromSourceKm: 648, dayCount: 2, platform: '3', latitude: 19.8000, longitude: 72.7565, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 7, stationCode: 'PLG', stationName: 'Palghar', scheduledArrival: '03:22', scheduledDeparture: '03:24', haltMinutes: 2, distanceFromSourceKm: 659, dayCount: 2, platform: '2', latitude: 19.6967, longitude: 72.7699, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 8, stationCode: 'BVI', stationName: 'Borivali', scheduledArrival: '04:45', scheduledDeparture: '04:48', haltMinutes: 3, distanceFromSourceKm: 716, dayCount: 2, platform: '7', latitude: 19.2288, longitude: 72.8541, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 9, stationCode: 'BDTS', stationName: 'Bandra Terminus', scheduledArrival: '05:45', scheduledDeparture: 'END', haltMinutes: 0, distanceFromSourceKm: 735, dayCount: 2, platform: '3', latitude: 19.0624, longitude: 72.8407, actionType: 'STOP', stop_status: 'STOP' },
    ],
  },
  // 19002 - Surat - Virar Express Passenger
  {
    trainNumber: '19002',
    trainName: 'Surat - Virar Express Passenger',
    sourceCode: 'ST',
    sourceName: 'Surat',
    destinationCode: 'VR',
    destinationName: 'Virar',
    trainType: 'Passenger',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departureTime: '04:15',
    arrivalTime: '10:25',
    durationMinutes: 370,
    distanceKm: 203,
    zone: 'WR',
    hasPantry: false,
    locoType: 'WAP-4 (Vadodara)',
    schedule: [
      { stopSequence: 1, stationCode: 'ST', stationName: 'Surat', scheduledArrival: 'START', scheduledDeparture: '04:15', haltMinutes: 0, distanceFromSourceKm: 0, dayCount: 1, platform: '1', latitude: 21.2049, longitude: 72.8408, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 2, stationCode: 'BL', stationName: 'Valsad', scheduledArrival: '05:45', scheduledDeparture: '05:50', haltMinutes: 5, distanceFromSourceKm: 68, dayCount: 1, platform: '3', latitude: 20.6094, longitude: 72.9342, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 3, stationCode: 'VAPI', stationName: 'Vapi', scheduledArrival: '06:30', scheduledDeparture: '06:32', haltMinutes: 2, distanceFromSourceKm: 93, dayCount: 1, platform: '2', latitude: 20.3712, longitude: 72.9042, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 4, stationCode: 'BLD', stationName: 'Bhilad', scheduledArrival: '06:50', scheduledDeparture: '06:52', haltMinutes: 2, distanceFromSourceKm: 103, dayCount: 1, platform: '2', latitude: 20.2834, longitude: 72.8687, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 5, stationCode: 'UBR', stationName: 'Umargam Road', scheduledArrival: '07:05', scheduledDeparture: '07:07', haltMinutes: 2, distanceFromSourceKm: 109, dayCount: 1, platform: '2', latitude: 20.2456, longitude: 72.8312, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 6, stationCode: 'SJN', stationName: 'Sanjan', scheduledArrival: '07:20', scheduledDeparture: '07:22', haltMinutes: 2, distanceFromSourceKm: 115, dayCount: 1, platform: '2', latitude: 20.2012, longitude: 72.8021, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 7, stationCode: 'BRRD', stationName: 'Bordi Road', scheduledArrival: '07:35', scheduledDeparture: '07:36', haltMinutes: 1, distanceFromSourceKm: 123, dayCount: 1, platform: '1', latitude: 20.1245, longitude: 72.7482, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 8, stationCode: 'GVD', stationName: 'Gholvad', scheduledArrival: '07:48', scheduledDeparture: '07:50', haltMinutes: 2, distanceFromSourceKm: 128, dayCount: 1, platform: '2', latitude: 20.0768, longitude: 72.7369, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 9, stationCode: 'DRD', stationName: 'Dahanu Road', scheduledArrival: '08:35', scheduledDeparture: '08:37', haltMinutes: 2, distanceFromSourceKm: 136, dayCount: 1, platform: '2', latitude: 19.9734, longitude: 72.7329, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 10, stationCode: 'VGN', stationName: 'Vangaon', scheduledArrival: '08:50', scheduledDeparture: '08:51', haltMinutes: 1, distanceFromSourceKm: 148, dayCount: 1, platform: '1', latitude: 19.8822, longitude: 72.7489, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 11, stationCode: 'BOR', stationName: 'Boisar', scheduledArrival: '09:05', scheduledDeparture: '09:07', haltMinutes: 2, distanceFromSourceKm: 158, dayCount: 1, platform: '3', latitude: 19.8000, longitude: 72.7565, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 12, stationCode: 'UOI', stationName: 'Umroli', scheduledArrival: '09:16', scheduledDeparture: '09:17', haltMinutes: 1, distanceFromSourceKm: 165, dayCount: 1, platform: '1', latitude: 19.7423, longitude: 72.7612, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 13, stationCode: 'PLG', stationName: 'Palghar', scheduledArrival: '09:28', scheduledDeparture: '09:30', haltMinutes: 2, distanceFromSourceKm: 172, dayCount: 1, platform: '2', latitude: 19.6967, longitude: 72.7699, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 14, stationCode: 'KLV', stationName: 'Kelve Road', scheduledArrival: '09:40', scheduledDeparture: '09:41', haltMinutes: 1, distanceFromSourceKm: 180, dayCount: 1, platform: '1', latitude: 19.6268, longitude: 72.7937, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 15, stationCode: 'SAH', stationName: 'Saphale', scheduledArrival: '09:52', scheduledDeparture: '09:53', haltMinutes: 1, distanceFromSourceKm: 187, dayCount: 1, platform: '1', latitude: 19.5772, longitude: 72.8188, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 16, stationCode: 'VTN', stationName: 'Vaitarna', scheduledArrival: '10:05', scheduledDeparture: '10:06', haltMinutes: 1, distanceFromSourceKm: 194, dayCount: 1, platform: '1', latitude: 19.5312, longitude: 72.8193, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 17, stationCode: 'VR', stationName: 'Virar', scheduledArrival: '10:25', scheduledDeparture: 'END', haltMinutes: 0, distanceFromSourceKm: 203, dayCount: 1, platform: '4', latitude: 19.4674, longitude: 72.8118, actionType: 'STOP', stop_status: 'STOP' },
    ],
  },
  // 22928 - Lokshakti SF Express (Ahmedabad to Bandra Terminus)
  {
    trainNumber: '22928',
    trainName: 'Lokshakti SF Express',
    sourceCode: 'ADI',
    sourceName: 'Ahmedabad Junction',
    destinationCode: 'BDTS',
    destinationName: 'Bandra Terminus',
    trainType: 'Superfast',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departureTime: '20:45',
    arrivalTime: '05:25',
    durationMinutes: 520,
    distanceKm: 482,
    zone: 'WR',
    hasPantry: false,
    locoType: 'WAP-7 #30511 (Vadodara)',
    schedule: [
      { stopSequence: 1, stationCode: 'ADI', stationName: 'Ahmedabad Junction', scheduledArrival: 'START', scheduledDeparture: '20:45', haltMinutes: 0, distanceFromSourceKm: 0, dayCount: 1, platform: '5', latitude: 23.0238, longitude: 72.6011, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 2, stationCode: 'ANND', stationName: 'Anand Junction', scheduledArrival: '21:30', scheduledDeparture: '21:32', haltMinutes: 2, distanceFromSourceKm: 65, dayCount: 1, platform: '4', latitude: 22.5645, longitude: 72.9289, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 3, stationCode: 'BRC', stationName: 'Vadodara Junction', scheduledArrival: '22:15', scheduledDeparture: '22:20', haltMinutes: 5, distanceFromSourceKm: 100, dayCount: 1, platform: '1', latitude: 22.3106, longitude: 73.1812, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 4, stationCode: 'ST', stationName: 'Surat', scheduledArrival: '00:35', scheduledDeparture: '00:40', haltMinutes: 5, distanceFromSourceKm: 230, dayCount: 2, platform: '2', latitude: 21.2049, longitude: 72.8408, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 5, stationCode: 'BL', stationName: 'Valsad', scheduledArrival: '01:38', scheduledDeparture: '01:40', haltMinutes: 2, distanceFromSourceKm: 299, dayCount: 2, platform: '3', latitude: 20.6094, longitude: 72.9342, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 6, stationCode: 'VAPI', stationName: 'Vapi', scheduledArrival: '02:05', scheduledDeparture: '02:07', haltMinutes: 2, distanceFromSourceKm: 325, dayCount: 2, platform: '2', latitude: 20.3712, longitude: 72.9042, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 7, stationCode: 'DRD', stationName: 'Dahanu Road', scheduledArrival: '02:50', scheduledDeparture: '02:52', haltMinutes: 2, distanceFromSourceKm: 373, dayCount: 2, platform: '2', latitude: 19.9734, longitude: 72.7329, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 8, stationCode: 'VGN', stationName: 'Vangaon', scheduledArrival: '02:59', scheduledDeparture: '02:59', haltMinutes: 0, distanceFromSourceKm: 385, dayCount: 2, platform: '1', latitude: 19.8822, longitude: 72.7489, actionType: 'PASS', stop_status: 'PASS_THROUGH' },
      { stopSequence: 9, stationCode: 'BOR', stationName: 'Boisar', scheduledArrival: '03:10', scheduledDeparture: '03:12', haltMinutes: 2, distanceFromSourceKm: 395, dayCount: 2, platform: '3', latitude: 19.8000, longitude: 72.7565, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 10, stationCode: 'PLG', stationName: 'Palghar', scheduledArrival: '03:30', scheduledDeparture: '03:32', haltMinutes: 2, distanceFromSourceKm: 406, dayCount: 2, platform: '2', latitude: 19.6967, longitude: 72.7699, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 11, stationCode: 'BVI', stationName: 'Borivali', scheduledArrival: '04:45', scheduledDeparture: '04:48', haltMinutes: 3, distanceFromSourceKm: 463, dayCount: 2, platform: '7', latitude: 19.2288, longitude: 72.8541, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 12, stationCode: 'ADH', stationName: 'Andheri', scheduledArrival: '05:04', scheduledDeparture: '05:06', haltMinutes: 2, distanceFromSourceKm: 474, dayCount: 2, platform: '8', latitude: 19.1197, longitude: 72.8464, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 13, stationCode: 'BDTS', stationName: 'Bandra Terminus', scheduledArrival: '05:25', scheduledDeparture: 'END', haltMinutes: 0, distanceFromSourceKm: 482, dayCount: 2, platform: '5', latitude: 19.0624, longitude: 72.8407, actionType: 'STOP', stop_status: 'STOP' },
    ],
  },
  // 19020 - Haridwar Express (Haridwar to Bandra Terminus)
  {
    trainNumber: '19020',
    trainName: 'Haridwar Express',
    sourceCode: 'HW',
    sourceName: 'Haridwar',
    destinationCode: 'BDTS',
    destinationName: 'Bandra Terminus',
    trainType: 'Express',
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    departureTime: '13:30',
    arrivalTime: '22:55',
    durationMinutes: 1945,
    distanceKm: 1616,
    zone: 'WR',
    hasPantry: false,
    locoType: 'WAP-7 #30310 (Ghaziabad)',
    schedule: [
      { stopSequence: 1, stationCode: 'ST', stationName: 'Surat', scheduledArrival: '17:35', scheduledDeparture: '17:40', haltMinutes: 5, distanceFromSourceKm: 1364, dayCount: 2, platform: '2', latitude: 21.2049, longitude: 72.8408, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 2, stationCode: 'BL', stationName: 'Valsad', scheduledArrival: '18:50', scheduledDeparture: '18:55', haltMinutes: 5, distanceFromSourceKm: 1433, dayCount: 2, platform: '3', latitude: 20.6094, longitude: 72.9342, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 3, stationCode: 'VAPI', stationName: 'Vapi', scheduledArrival: '19:25', scheduledDeparture: '19:27', haltMinutes: 2, distanceFromSourceKm: 1459, dayCount: 2, platform: '2', latitude: 20.3712, longitude: 72.9042, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 4, stationCode: 'DRD', stationName: 'Dahanu Road', scheduledArrival: '20:30', scheduledDeparture: '20:32', haltMinutes: 2, distanceFromSourceKm: 1507, dayCount: 2, platform: '2', latitude: 19.9734, longitude: 72.7329, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 5, stationCode: 'VGN', stationName: 'Vangaon', scheduledArrival: '20:42', scheduledDeparture: '20:42', haltMinutes: 0, distanceFromSourceKm: 1519, dayCount: 2, platform: '1', latitude: 19.8822, longitude: 72.7489, actionType: 'PASS', stop_status: 'PASS_THROUGH' },
      { stopSequence: 6, stationCode: 'BOR', stationName: 'Boisar', scheduledArrival: '20:55', scheduledDeparture: '20:57', haltMinutes: 2, distanceFromSourceKm: 1529, dayCount: 2, platform: '3', latitude: 19.8000, longitude: 72.7565, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 7, stationCode: 'PLG', stationName: 'Palghar', scheduledArrival: '21:18', scheduledDeparture: '21:20', haltMinutes: 2, distanceFromSourceKm: 1540, dayCount: 2, platform: '2', latitude: 19.6967, longitude: 72.7699, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 8, stationCode: 'BVI', stationName: 'Borivali', scheduledArrival: '22:05', scheduledDeparture: '22:08', haltMinutes: 3, distanceFromSourceKm: 1597, dayCount: 2, platform: '7', latitude: 19.2288, longitude: 72.8541, actionType: 'STOP', stop_status: 'STOP' },
      { stopSequence: 9, stationCode: 'BDTS', stationName: 'Bandra Terminus', scheduledArrival: '22:55', scheduledDeparture: 'END', haltMinutes: 0, distanceFromSourceKm: 1616, dayCount: 2, platform: '4', latitude: 19.0624, longitude: 72.8407, actionType: 'STOP', stop_status: 'STOP' },
    ],
  },
];

// Generate all Down and Up trains
export const DAHANU_CORRIDOR_TRAINS: TrainDetail[] = [
  ...DOWN_LOCAL_CONFIGS.map(buildDownLocalTrain),
  ...DOWN_MEMU_CONFIGS.map(buildDownMemuTrain),
  ...DOWN_EXPRESS_TRAINS,
  ...UP_LOCAL_CONFIGS.map(buildUpLocalTrain),
  ...UP_MEMU_CONFIGS.map(buildUpMemuTrain),
  ...UP_EXPRESS_TRAINS,
  UP_19418_EXPRESS,
];

// Export as LocalTrain items for Mumbai Local subsystem
export const DAHANU_CORRIDOR_LOCALS: LocalTrain[] = [
  ...DOWN_LOCAL_CONFIGS.map((cfg) => {
    const detail = buildDownLocalTrain(cfg);
    return {
      id: `local_${detail.trainNumber}`,
      trainNumber: detail.trainNumber,
      trainName: detail.trainName,
      line: 'Western' as const,
      sourceCode: detail.sourceCode,
      sourceName: detail.sourceName,
      destinationCode: detail.destinationCode,
      destinationName: detail.destinationName,
      type: cfg.type,
      departureTime: detail.departureTime,
      arrivalTime: detail.arrivalTime,
      durationMinutes: detail.durationMinutes,
      distanceKm: detail.distanceKm,
      fareSecondClass: 10,
      fareFirstClass: 65,
      fareAc: cfg.type === 'AC Local' ? 115 : 90,
      frequency: 'Daily',
      runningDays: detail.runningDays,
      platform: detail.schedule[0]?.platform || '1',
      cars: 12,
      status: 'On Time' as const,
      delayMinutes: 0,
      stops: detail.schedule.map((s) => ({
        stationCode: s.stationCode,
        stationName: s.stationName,
        arrivalTime: s.scheduledArrival === 'START' ? s.scheduledDeparture : s.scheduledArrival,
        departureTime: s.scheduledDeparture === 'END' ? s.scheduledArrival : s.scheduledDeparture,
        platform: s.platform || '1',
        isFastStop: cfg.type === 'Fast Local' || cfg.type === 'AC Local',
      })),
    };
  }),
  ...UP_LOCAL_CONFIGS.map((cfg) => {
    const detail = buildUpLocalTrain(cfg);
    return {
      id: `local_${detail.trainNumber}`,
      trainNumber: detail.trainNumber,
      trainName: detail.trainName,
      line: 'Western' as const,
      sourceCode: detail.sourceCode,
      sourceName: detail.sourceName,
      destinationCode: detail.destinationCode,
      destinationName: detail.destinationName,
      type: cfg.type,
      departureTime: detail.departureTime,
      arrivalTime: detail.arrivalTime,
      durationMinutes: detail.durationMinutes,
      distanceKm: detail.distanceKm,
      fareSecondClass: 10,
      fareFirstClass: 65,
      fareAc: cfg.type === 'AC Local' ? 115 : 90,
      frequency: 'Daily',
      runningDays: detail.runningDays,
      platform: detail.schedule[0]?.platform || '1',
      cars: 12,
      status: 'On Time' as const,
      delayMinutes: 0,
      stops: detail.schedule.map((s) => ({
        stationCode: s.stationCode,
        stationName: s.stationName,
        arrivalTime: s.scheduledArrival === 'START' ? s.scheduledDeparture : s.scheduledArrival,
        departureTime: s.scheduledDeparture === 'END' ? s.scheduledArrival : s.scheduledDeparture,
        platform: s.platform || '1',
        isFastStop: cfg.type === 'Fast Local' || cfg.type === 'AC Local',
      })),
    };
  }),
];
