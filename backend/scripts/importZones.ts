/**
 * Import Pipeline: Railway Zones
 * Imports and validates all Indian Railway Zones
 */

import { MASTER_ZONES, RailwayZoneMaster } from '../src/data/masterRailwayDb.js';

export function importZones(data: RailwayZoneMaster[] = MASTER_ZONES) {
  const report = {
    total: data.length,
    valid: 0,
    invalid: 0,
    errors: [] as string[],
    records: [] as RailwayZoneMaster[],
  };

  for (const zone of data) {
    if (!zone.zone_code || zone.zone_code.length < 2) {
      report.invalid++;
      report.errors.push(`Invalid zone_code: ${zone.zone_code}`);
      continue;
    }
    if (!zone.zone_name || zone.zone_name.length < 3) {
      report.invalid++;
      report.errors.push(`Invalid zone_name for zone: ${zone.zone_code}`);
      continue;
    }
    report.valid++;
    report.records.push(zone);
  }

  return report;
}

if (process.argv[1]?.includes('importZones')) {
  const result = importZones();
  console.log(`[IMPORT ZONES] Imported ${result.valid}/${result.total} zones successfully.`);
}
