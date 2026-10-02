/**
 * Search Index Rebuilder CLI
 */
import { rebuildSearchIndex } from '../src/importers/railwayDataImporter.js';

export { rebuildSearchIndex };

if (process.argv[1]?.includes('rebuildSearchIndex')) {
  const result = rebuildSearchIndex();
  console.log(`[REBUILD SEARCH INDEX] Indexed ${result.stationIndexCount} stations and ${result.trainIndexCount} trains at ${result.timestamp}.`);
}
