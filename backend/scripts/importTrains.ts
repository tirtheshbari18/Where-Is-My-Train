/**
 * Import Pipeline: Master Trains CLI
 */
import { importTrains } from '../src/importers/railwayDataImporter.js';

export { importTrains };

if (process.argv[1]?.includes('importTrains')) {
  const result = importTrains();
  console.log(`[IMPORT TRAINS] Successfully validated & imported ${result.valid}/${result.total} passenger services (${result.duplicateNumbers} duplicates skipped).`);
}
