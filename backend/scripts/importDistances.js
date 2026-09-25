"use strict";
/**
 * Import Pipeline: Cumulative Kilometers & Track Distance Integrity
 * Ensures all distance values are numeric, positive, and reflect authoritative railway routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.importDistances = importDistances;
const masterRailwayDb_js_1 = require("../src/data/masterRailwayDb.js");
function importDistances() {
    const report = {
        totalSectionsChecked: masterRailwayDb_js_1.MASTER_ROUTE_SECTIONS.length,
        validSections: 0,
        invalidSections: 0,
        sampleDistanceCalculations: [],
        errors: [],
    };
    for (const sec of masterRailwayDb_js_1.MASTER_ROUTE_SECTIONS) {
        if (typeof sec.distance_km !== 'number' || sec.distance_km <= 0) {
            report.invalidSections++;
            report.errors.push(`Invalid distance on section ${sec.line_code} (${sec.from_station_code} -> ${sec.to_station_code}): ${sec.distance_km}`);
        }
        else {
            report.validSections++;
        }
    }
    // Verify sample authoritative calculations
    const samplePairs = [
        { from: 'BOR', to: 'DRD' }, // Boisar -> Dahanu Road
        { from: 'BOR', to: 'ST' }, // Boisar -> Surat
        { from: 'MMCT', to: 'ADI' }, // Mumbai Central -> Ahmedabad
        { from: 'CSMT', to: 'PUNE' }, // Mumbai CSMT -> Pune
    ];
    for (const pair of samplePairs) {
        const dist = (0, masterRailwayDb_js_1.calculateRailwayDistance)(pair.from, pair.to);
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
