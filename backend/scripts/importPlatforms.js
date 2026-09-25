"use strict";
/**
 * Import Pipeline: Station Platforms
 * Validates platform numbers (e.g. 1, 2, 1A, 2A), station foreign keys, and statuses
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.importPlatforms = importPlatforms;
const masterRailwayDb_js_1 = require("../src/data/masterRailwayDb.js");
function importPlatforms(data = masterRailwayDb_js_1.MASTER_PLATFORMS) {
    const validStationCodes = new Set(masterRailwayDb_js_1.MASTER_STATIONS.map((s) => s.station_code));
    const seenStationPlatforms = new Set();
    const report = {
        total: data.length,
        valid: 0,
        invalid: 0,
        errors: [],
        records: [],
    };
    for (const pf of data) {
        if (!validStationCodes.has(pf.station_code)) {
            report.invalid++;
            report.errors.push(`Platform references unknown station: ${pf.station_code}`);
            continue;
        }
        if (!pf.platform_number || !/^[0-9]+[A-Z]?$/.test(pf.platform_number)) {
            report.invalid++;
            report.errors.push(`Invalid platform number format: ${pf.platform_number} at ${pf.station_code}`);
            continue;
        }
        const key = `${pf.station_code}_PF_${pf.platform_number}`;
        if (seenStationPlatforms.has(key)) {
            report.invalid++;
            report.errors.push(`Duplicate platform: ${key}`);
            continue;
        }
        seenStationPlatforms.add(key);
        report.valid++;
        report.records.push(pf);
    }
    return report;
}
if (process.argv[1]?.includes('importPlatforms')) {
    const result = importPlatforms();
    console.log(`[IMPORT PLATFORMS] Imported ${result.valid}/${result.total} platforms successfully.`);
}
