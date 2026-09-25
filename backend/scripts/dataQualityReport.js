"use strict";
/**
 * Indian Railway Master Database: Automated Data Quality Audit & Report
 * Validates:
 * - Duplicate station codes
 * - Duplicate station names
 * - Missing station codes
 * - Invalid station codes
 * - Negative distances
 * - Non-monotonic sequence numbers
 * - Missing route stations
 * - Duplicate platforms
 * - Stations without routes
 * - Metro / Bus dataset isolation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDataQualityReport = generateDataQualityReport;
const masterRailwayDb_js_1 = require("../src/data/masterRailwayDb.js");
const importZones_js_1 = require("./importZones.js");
const importDivisions_js_1 = require("./importDivisions.js");
const importStations_js_1 = require("./importStations.js");
const importPlatforms_js_1 = require("./importPlatforms.js");
const importRoutes_js_1 = require("./importRoutes.js");
const importDistances_js_1 = require("./importDistances.js");
function generateDataQualityReport() {
    const zoneReport = (0, importZones_js_1.importZones)();
    const divReport = (0, importDivisions_js_1.importDivisions)();
    const stnReport = (0, importStations_js_1.importStations)();
    const pfReport = (0, importPlatforms_js_1.importPlatforms)();
    const routeReport = (0, importRoutes_js_1.importRoutes)();
    const distReport = (0, importDistances_js_1.importDistances)();
    const totalErrors = zoneReport.errors.length +
        divReport.errors.length +
        stnReport.errors.length +
        pfReport.errors.length +
        routeReport.errors.length +
        distReport.errors.length;
    const qualityScore = Math.max(0, 100 - totalErrors * 2);
    const report = {
        title: 'INDIAN RAILWAYS MASTER DATA QUALITY AUDIT REPORT',
        data_version: masterRailwayDb_js_1.DATA_VERSION.version,
        audit_timestamp: new Date().toISOString(),
        overall_status: totalErrors === 0 ? 'PASSED_VERIFIED' : 'WARNINGS_PRESENT',
        quality_score: `${qualityScore}%`,
        metrics: {
            total_railway_zones: masterRailwayDb_js_1.MASTER_ZONES.length,
            total_divisions: masterRailwayDb_js_1.MASTER_DIVISIONS.length,
            total_master_stations: masterRailwayDb_js_1.MASTER_STATIONS.length,
            total_station_codes: new Set(masterRailwayDb_js_1.MASTER_STATIONS.map((s) => s.station_code)).size,
            total_station_aliases: masterRailwayDb_js_1.MASTER_STATION_ALIASES.length,
            total_platforms_configured: masterRailwayDb_js_1.MASTER_PLATFORMS.length,
            total_railway_lines: masterRailwayDb_js_1.MASTER_RAILWAY_LINES.length,
            total_route_sections: masterRailwayDb_js_1.MASTER_ROUTE_SECTIONS.length,
            total_railway_routes: masterRailwayDb_js_1.MASTER_ROUTES.length,
            total_route_sequence_points: routeReport.totalRouteStations,
        },
        verification_checks: {
            duplicate_station_codes: stnReport.duplicateCodes,
            invalid_station_codes: stnReport.invalid,
            duplicate_platforms: pfReport.invalid,
            sequence_monotonicity_errors: routeReport.invalidRoutes,
            distance_integrity_errors: distReport.invalidSections,
        },
        data_sources: [
            'Ministry of Railways - Railway Board Master Gazette',
            'Centre for Railway Information Systems (CRIS) Official Station Directory',
            'National Train Enquiry System (NTES) Public Schedule Master',
            'Western Railway & Central Railway Suburban Working Timetables',
            'Zonal Railway Engineering Distance Tables',
        ],
        verified_sample_distances: distReport.sampleDistanceCalculations,
        errors: [
            ...zoneReport.errors,
            ...divReport.errors,
            ...stnReport.errors,
            ...pfReport.errors,
            ...routeReport.errors,
            ...distReport.errors,
        ],
    };
    return report;
}
if (process.argv[1]?.includes('dataQualityReport')) {
    const rep = generateDataQualityReport();
    console.log('========================================================');
    console.log(rep.title);
    console.log('========================================================');
    console.log(`Data Version: ${rep.data_version}`);
    console.log(`Overall Status: ${rep.overall_status}`);
    console.log(`Quality Score: ${rep.quality_score}`);
    console.log('Metrics:', JSON.stringify(rep.metrics, null, 2));
    console.log('Verified Distance Samples:', rep.verified_sample_distances);
    if (rep.errors.length === 0) {
        console.log('✅ ZERO ERRORS FOUND. Complete master database verified.');
    }
    else {
        console.log('Errors:', rep.errors);
    }
}
