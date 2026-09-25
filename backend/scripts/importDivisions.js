"use strict";
/**
 * Import Pipeline: Railway Divisions
 * Imports and validates all Railway Divisions and their parent zones
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.importDivisions = importDivisions;
const masterRailwayDb_js_1 = require("../src/data/masterRailwayDb.js");
function importDivisions(data = masterRailwayDb_js_1.MASTER_DIVISIONS) {
    const validZones = new Set(masterRailwayDb_js_1.MASTER_ZONES.map((z) => z.zone_code));
    const report = {
        total: data.length,
        valid: 0,
        invalid: 0,
        errors: [],
        records: [],
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
