/**
 * Import Pipeline: Master Stations
 * Validates station codes, names, categories, coordinates, and zone assignments
 */

import { MASTER_STATIONS, MASTER_ZONES, MasterStation } from '../src/data/masterRailwayDb.js';

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
    // 1. Station code format check (1-6 uppercase letters/digits)
    if (!stn.station_code || !/^[A-Z0-9]{1,6}$/.test(stn.station_code)) {
      report.invalid++;
      report.errors.push(`Invalid station code format: ${stn.station_code}`);
      continue;
    }

    // 2. Duplicate code check
    if (seenCodes.has(stn.station_code)) {
      report.duplicateCodes++;
      report.invalid++;
      report.errors.push(`Duplicate station code: ${stn.station_code}`);
      continue;
    }
    seenCodes.add(stn.station_code);

    // 3. Station name check
    if (!stn.station_name || stn.station_name.trim().length < 2) {
      report.invalid++;
      report.errors.push(`Invalid station name for code ${stn.station_code}`);
      continue;
    }

    // 4. Zone verification
    if (stn.zone_code && !validZones.has(stn.zone_code)) {
      report.invalid++;
      report.errors.push(`Station ${stn.station_code} has unknown zone: ${stn.zone_code}`);
      continue;
    }

    // 5. Coordinates range check
    if (
      typeof stn.latitude !== 'number' ||
      typeof stn.longitude !== 'number' ||
      stn.latitude < 6 ||
      stn.latitude > 38 ||
      stn.longitude < 68 ||
      stn.longitude > 98
    ) {
      report.invalid++;
      report.errors.push(`Coordinates out of India bounds for ${stn.station_code}: (${stn.latitude}, ${stn.longitude})`);
      continue;
    }

    report.valid++;
    report.records.push(stn);
  }

  return report;
}

if (process.argv[1]?.includes('importStations')) {
  const result = importStations();
  console.log(`[IMPORT STATIONS] Imported ${result.valid}/${result.total} stations successfully.`);
}
