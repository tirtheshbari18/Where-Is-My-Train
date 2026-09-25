/**
 * Import Pipeline: Railway Divisions
 * Imports and validates all Railway Divisions and their parent zones
 */

import { MASTER_DIVISIONS, MASTER_ZONES, RailwayDivisionMaster } from '../src/data/masterRailwayDb.js';

export function importDivisions(data: RailwayDivisionMaster[] = MASTER_DIVISIONS) {
  const validZones = new Set(MASTER_ZONES.map((z) => z.zone_code));
  const report = {
    total: data.length,
    valid: 0,
    invalid: 0,
    errors: [] as string[],
    records: [] as RailwayDivisionMaster[],
  };

  for (const div of data) {
    if (!div.division_code) {
      report.invalid++;
      report.errors.push(`Missing division_code for ${div.division_name}`);
      continue;
    }
    if (!validZones.has(div.zone_code)) {
      report.invalid++;
      report.errors.push(`Division ${div.division_code} references unknown zone: ${div.zone_code}`);
      continue;
    }
    report.valid++;
    report.records.push(div);
  }

  return report;
}

if (process.argv[1]?.includes('importDivisions')) {
  const result = importDivisions();
  console.log(`[IMPORT DIVISIONS] Imported ${result.valid}/${result.total} divisions successfully.`);
}
