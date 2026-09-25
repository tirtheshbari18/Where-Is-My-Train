"use strict";
/**
 * Import Pipeline: Master Stations
 * Validates station codes, names, categories, coordinates, and zone assignments
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.importStations = importStations;
const masterRailwayDb_js_1 = require("../src/data/masterRailwayDb.js");
function importStations(data = masterRailwayDb_js_1.MASTER_STATIONS) {
    const validZones = new Set(masterRailwayDb_js_1.MASTER_ZONES.map((z) => z.zone_code));
    const seenCodes = new Set();
    const report = {
        total: data.length,
        valid: 0,
        invalid: 0,
        duplicateCodes: 0,
        errors: [],
        records: [],
    };
    for (const stn of data) {
        // 1. Station code format check (2-5 uppercase letters)
        if (!stn.station_code || !/^[A-Z0-9]{2,6}$/.test(stn.station_code)) {
            report.invalid++;
            report.errors.push(`Invalid station code format: ${stn.station_code}`);
            continue;
        }
        // 2. Duplicate code check
        if (seenCodes.has(stn.station_code)) {
            report.duplicateCodes++;
            report.invalid++;
            report.errors.push(`Duplicate station code: ${stn.station_code}`);
            continue;
        }
        seenCodes.add(stn.station_code);
        // 3. Station name check
        if (!stn.station_name || stn.station_name.trim().length < 2) {
            report.invalid++;
            report.errors.push(`Invalid station name for code ${stn.station_code}`);
            continue;
        }
        // 4. Zone verification
        if (stn.zone_code && !validZones.has(stn.zone_code)) {
            report.invalid++;
            report.errors.push(`Station ${stn.station_code} has unknown zone: ${stn.zone_code}`);
            continue;
        }
        // 5. Coordinates range check
        if (typeof stn.latitude !== 'number' ||
            typeof stn.longitude !== 'number' ||
            stn.latitude < 6 ||
            stn.latitude > 38 ||
            stn.longitude < 68 ||
            stn.longitude > 98) {
            report.invalid++;
            report.errors.push(`Coordinates out of India bounds for ${stn.station_code}: (${stn.latitude}, ${stn.longitude})`);
            continue;
        }
        report.valid++;
        report.records.push(stn);
    }
    return report;
}
if (process.argv[1]?.includes('importStations')) {
    const result = importStations();
    console.log(`[IMPORT STATIONS] Imported ${result.valid}/${result.total} stations successfully.`);
}
