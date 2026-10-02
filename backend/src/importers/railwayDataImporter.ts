/**
 * Master Railway Data Importers & Validators
 * Provides core import, validation, and search indexing logic
 */

import { MASTER_STATIONS, MASTER_ZONES, MASTER_ROUTES, MASTER_ROUTE_SECTIONS, MasterStation } from '../data/masterRailwayDb.js';
import { MOCK_STATIONS, MOCK_TRAINS } from '../providers/mock/mockRailwayData.js';
import { TrainDetail, TrainStop } from '../types/railway.types.js';

export function importStations(data: MasterStation[] = MASTER_STATIONS) {
  const validZones = new Set(MASTER_ZONES.map((z) => z.zone_code));
  const seenCodes = new Set<string>();

  const report = {
    total: data.length,
    valid: 0,
    invalid: 0,
    duplicateCodes: 0,
    errors: [] as string[],
    records: [] as MasterStation[],
  };

  for (const stn of data) {
    if (!stn.station_code || !/^[A-Z0-9]{1,6}$/.test(stn.station_code)) {
      report.invalid++;
      report.errors.push(`Invalid station code format: ${stn.station_code}`);
      continue;
    }

    if (seenCodes.has(stn.station_code)) {
      report.duplicateCodes++;
      report.invalid++;
      report.errors.push(`Duplicate station code: ${stn.station_code}`);
      continue;
    }
    seenCodes.add(stn.station_code);

    if (!stn.station_name || stn.station_name.trim().length < 2) {
      report.invalid++;
      report.errors.push(`Invalid station name for code ${stn.station_code}`);
      continue;
    }

    if (stn.zone_code && !validZones.has(stn.zone_code)) {
      report.invalid++;
      report.errors.push(`Station ${stn.station_code} has unknown zone: ${stn.zone_code}`);
      continue;
    }

    if (
      typeof stn.latitude !== 'number' ||
      typeof stn.longitude !== 'number' ||
      stn.latitude < 6 ||
      stn.latitude > 38 ||
      stn.longitude < 68 ||
      stn.longitude > 98
    ) {
      report.invalid++;
      report.errors.push(`Station ${stn.station_code} has invalid coordinates: (${stn.latitude}, ${stn.longitude})`);
      continue;
    }

    report.valid++;
    report.records.push(stn);
  }

  return report;
}

export function importTrains(trains: TrainDetail[] = MOCK_TRAINS) {
  const seenNumbers = new Set<string>();
  const report = {
    total: trains.length,
    valid: 0,
    invalid: 0,
    duplicateNumbers: 0,
    errors: [] as string[],
    records: [] as TrainDetail[],
  };

  for (const train of trains) {
    if (!train.trainNumber || train.trainNumber.trim().length === 0) {
      report.invalid++;
      report.errors.push('Train record missing trainNumber');
      continue;
    }

    const tNum = train.trainNumber.trim();

    if (seenNumbers.has(tNum)) {
      report.duplicateNumbers++;
      report.invalid++;
      report.errors.push(`Duplicate train number: ${tNum}`);
      continue;
    }
    seenNumbers.add(tNum);

    if (!train.trainName || train.trainName.trim().length === 0) {
      report.invalid++;
      report.errors.push(`Train ${tNum} is missing trainName`);
      continue;
    }

    if (!train.sourceCode || !train.destinationCode) {
      report.invalid++;
      report.errors.push(`Train ${tNum} is missing source or destination code`);
      continue;
    }

    if (!train.runningDays || train.runningDays.length === 0) {
      report.invalid++;
      report.errors.push(`Train ${tNum} has no running days specified`);
      continue;
    }

    report.valid++;
    report.records.push(train);
  }

  return report;
}

export function importTrainStops(trains: TrainDetail[] = MOCK_TRAINS) {
  let totalStops = 0;
  let validStops = 0;
  let invalidStops = 0;
  const errors: string[] = [];

  for (const train of trains) {
    const schedule = train.schedule || [];
    totalStops += schedule.length;

    let prevDistance = -1;
    let prevSeq = 0;

    for (let i = 0; i < schedule.length; i++) {
      const stop = schedule[i];
      const seq = stop.stopSequence || (stop as any).sequence_number || i + 1;

      if (seq <= prevSeq) {
        invalidStops++;
        errors.push(`Train ${train.trainNumber} stop sequence not strictly increasing at ${stop.stationCode} (seq ${seq} <= ${prevSeq})`);
      }
      prevSeq = seq;

      if (stop.distanceFromSourceKm < prevDistance) {
        invalidStops++;
        errors.push(`Train ${train.trainNumber} distance decreased at ${stop.stationCode}: ${stop.distanceFromSourceKm} < ${prevDistance}`);
      }
      prevDistance = stop.distanceFromSourceKm;

      if (!stop.stationCode || stop.stationCode.trim().length === 0) {
        invalidStops++;
        errors.push(`Train ${train.trainNumber} stop ${seq} missing stationCode`);
      } else {
        validStops++;
      }
    }
  }

  return {
    total: totalStops,
    valid: validStops,
    invalid: invalidStops,
    errors,
  };
}

export function validateRailwayData() {
  const errors: string[] = [];
  const warnings: string[] = [];

  const bor = MOCK_STATIONS.find((s) => s.code === 'BOR') || MASTER_STATIONS.find((s) => s.station_code === 'BOR');
  const vgn = MOCK_STATIONS.find((s) => s.code === 'VGN') || MASTER_STATIONS.find((s) => s.station_code === 'VGN');
  const drd = MOCK_STATIONS.find((s) => s.code === 'DRD') || MASTER_STATIONS.find((s) => s.station_code === 'DRD');

  if (!bor) errors.push('CRITICAL: Boisar (BOR) station record missing!');
  if (!vgn) errors.push('CRITICAL: Vangaon (VGN) station record missing!');
  if (!drd) errors.push('CRITICAL: Dahanu Road (DRD) station record missing!');

  const secBorVgn = MASTER_ROUTE_SECTIONS.find(
    (s) => s.from_station_code === 'BOR' && s.to_station_code === 'VGN'
  );
  const secVgnDrd = MASTER_ROUTE_SECTIONS.find(
    (s) => s.from_station_code === 'VGN' && s.to_station_code === 'DRD'
  );

  if (!secBorVgn) {
    errors.push('CRITICAL: Route section BOR -> VGN missing!');
  } else if (secBorVgn.distance_km !== 9.4) {
    warnings.push(`Section BOR -> VGN distance is ${secBorVgn.distance_km} km (expected 9.4 km)`);
  }

  if (!secVgnDrd) {
    errors.push('CRITICAL: Route section VGN -> DRD missing!');
  } else if (secVgnDrd.distance_km !== 12.3) {
    warnings.push(`Section VGN -> DRD distance is ${secVgnDrd.distance_km} km (expected 12.3 km)`);
  }

  let trainsPassingBorDrd = 0;
  let trainsWithVangaon = 0;

  for (const train of MOCK_TRAINS) {
    const borIdx = train.schedule.findIndex((s) => s.stationCode === 'BOR');
    const drdIdx = train.schedule.findIndex((s) => s.stationCode === 'DRD');

    if (borIdx !== -1 && drdIdx !== -1 && borIdx < drdIdx) {
      trainsPassingBorDrd++;
      const vgnIdx = train.schedule.findIndex((s) => s.stationCode === 'VGN');
      if (vgnIdx !== -1 && vgnIdx > borIdx && vgnIdx < drdIdx) {
        trainsWithVangaon++;
      } else {
        errors.push(`Train ${train.trainNumber} (${train.trainName}) traverses BOR -> DRD but omits Vangaon (VGN)!`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    trainsPassingBorDrd,
    trainsWithVangaon,
    totalStations: MASTER_STATIONS.length,
    totalTrains: MOCK_TRAINS.length,
  };
}

export function rebuildSearchIndex() {
  const stationIndex = MOCK_STATIONS.map((s) => ({
    code: s.code.toUpperCase(),
    name: s.name,
    tokens: [
      s.code.toLowerCase(),
      s.name.toLowerCase(),
      ...(s.state ? [s.state.toLowerCase()] : []),
    ],
  }));

  const trainIndex = MOCK_TRAINS.map((t) => ({
    number: t.trainNumber,
    name: t.trainName,
    type: t.trainType,
    tokens: [
      t.trainNumber.toLowerCase(),
      t.trainName.toLowerCase(),
      t.sourceCode.toLowerCase(),
      t.destinationCode.toLowerCase(),
    ],
  }));

  return {
    stationIndexCount: stationIndex.length,
    trainIndexCount: trainIndex.length,
    timestamp: new Date().toISOString(),
  };
}
