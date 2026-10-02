/**
 * Import Pipeline: Master Stations CLI
 */
import { importStations } from '../src/importers/railwayDataImporter.js';

export { importStations };

if (process.argv[1]?.includes('importStations')) {
  const result = importStations();
  console.log(`[IMPORT STATIONS] Successfully validated & imported ${result.valid}/${result.total} stations (${result.duplicateCodes} duplicates skipped).`);
}
