/**
 * Railway Data Comprehensive Validator CLI
 */
import { validateRailwayData } from '../src/importers/railwayDataImporter.js';

export { validateRailwayData };

if (process.argv[1]?.includes('validateRailwayData')) {
  const result = validateRailwayData();
  console.log(`[VALIDATION RESULT] Valid: ${result.valid}`);
  console.log(`[VALIDATION RESULT] ${result.trainsWithVangaon}/${result.trainsPassingBorDrd} Boisar-Dahanu trains include Vangaon.`);
  if (result.errors.length > 0) {
    console.error(`[VALIDATION ERRORS] Found ${result.errors.length} errors:`, result.errors);
    process.exit(1);
  } else {
    console.log(`[VALIDATION SUCCESS] All ${result.totalStations} stations and ${result.totalTrains} trains passed integrity verification.`);
  }
}
