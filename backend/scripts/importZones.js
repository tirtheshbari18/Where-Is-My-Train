"use strict";
/**
 * Import Pipeline: Railway Zones
 * Imports and validates all Indian Railway Zones
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.importZones = importZones;
const masterRailwayDb_js_1 = require("../src/data/masterRailwayDb.js");
function importZones(data = masterRailwayDb_js_1.MASTER_ZONES) {
    const report = {
        total: data.length,
        valid: 0,
        invalid: 0,
        errors: [],
        records: [],
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
