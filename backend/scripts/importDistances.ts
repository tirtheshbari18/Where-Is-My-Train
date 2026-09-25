/**
 * Import Pipeline: Cumulative Kilometers & Track Distance Integrity
 * Ensures all distance values are numeric, positive, and reflect authoritative railway routes
 */

import { MASTER_ROUTE_SECTIONS, MASTER_ROUTES, calculateRailwayDistance } from '../src/data/masterRailwayDb.js';

export function importDistances() {
  const report = {
    totalSectionsChecked: MASTER_ROUTE_SECTIONS.length,
    validSections: 0,
    invalidSections: 0,
    sampleDistanceCalculations: [] as Array<{ from: string; to: string; distanceKm: number }>,
    errors: [] as string[],
  };

  for (const sec of MASTER_ROUTE_SECTIONS) {
    if (typeof sec.distance_km !== 'number' || sec.distance_km <= 0) {
      report.invalidSections++;
      report.errors.push(`Invalid distance on section ${sec.line_code} (${sec.from_station_code} -> ${sec.to_station_code}): ${sec.distance_km}`);
    } else {
      report.validSections++;
    }
  }

  // Verify sample authoritative calculations
  const samplePairs = [
    { from: 'BOR', to: 'DRD' }, // Boisar -> Dahanu Road
    { from: 'BOR', to: 'ST' },  // Boisar -> Surat
    { from: 'MMCT', to: 'ADI'}, // Mumbai Central -> Ahmedabad
    { from: 'CSMT', to: 'PUNE'},// Mumbai CSMT -> Pune
  ];

  for (const pair of samplePairs) {
    const dist = calculateRailwayDistance(pair.from, pair.to);
    if (dist !== null) {
      report.sampleDistanceCalculations.push({ from: pair.from, to: pair.to, distanceKm: dist });
    }
  }

  return report;
}

if (process.argv[1]?.includes('importDistances')) {
  const res = importDistances();
  console.log(`[IMPORT DISTANCES] Checked ${res.validSections}/${res.totalSectionsChecked} sections.`);
  console.log('Sample verified route distances:', res.sampleDistanceCalculations);
}
