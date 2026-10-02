/**
 * Import Pipeline: Train Stops CLI
 */
import { importTrainStops } from '../src/importers/railwayDataImporter.js';

export { importTrainStops };

if (process.argv[1]?.includes('importTrainStops')) {
  const result = importTrainStops();
  console.log(`[IMPORT TRAIN STOPS] Validated and imported ${result.valid}/${result.total} train stops across all trains.`);
}
