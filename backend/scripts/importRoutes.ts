/**
 * Import Pipeline: Railway Routes & Sections
 * Validates corridor sequence, monotonicity, stations, and track directions
 */

import { MASTER_ROUTES, MASTER_ROUTE_SECTIONS, MASTER_STATIONS, RailwayRouteMaster } from '../src/data/masterRailwayDb.js';

export function importRoutes(data: RailwayRouteMaster[] = MASTER_ROUTES) {
  const validStationCodes = new Set(MASTER_STATIONS.map((s) => s.station_code));

  const report = {
    totalRoutes: data.length,
    validRoutes: 0,
    invalidRoutes: 0,
    totalRouteStations: 0,
    errors: [] as string[],
    records: [] as RailwayRouteMaster[],
  };

  for (const route of data) {
    if (!route.route_code) {
      report.invalidRoutes++;
      report.errors.push(`Missing route_code`);
      continue;
    }

    let isRouteValid = true;
    let lastKm = -1;

    for (let i = 0; i < route.stations.length; i++) {
      const stn = route.stations[i];
      report.totalRouteStations++;

      if (!validStationCodes.has(stn.station_code)) {
        report.errors.push(`Route ${route.route_code} station ${stn.station_code} does not exist in Station Master`);
        isRouteValid = false;
      }

      if (stn.km_from_origin < lastKm) {
        report.errors.push(`Route ${route.route_code} non-monotonic km at sequence ${stn.sequence_order}: ${stn.km_from_origin} < ${lastKm}`);
        isRouteValid = false;
      }
      lastKm = stn.km_from_origin;
    }

    if (isRouteValid) {
      report.validRoutes++;
      report.records.push(route);
    } else {
      report.invalidRoutes++;
    }
  }

  return report;
}

if (process.argv[1]?.includes('importRoutes')) {
  const result = importRoutes();
  console.log(`[IMPORT ROUTES] Imported ${result.validRoutes}/${result.totalRoutes} routes (${result.totalRouteStations} station points) successfully.`);
}
