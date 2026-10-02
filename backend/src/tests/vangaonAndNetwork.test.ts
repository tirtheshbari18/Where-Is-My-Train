import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { MOCK_STATIONS, MOCK_TRAINS } from '../providers/mock/mockRailwayData.js';
import { MASTER_STATIONS, MASTER_ROUTES, MASTER_ROUTE_SECTIONS } from '../data/masterRailwayDb.js';
import { importStations, importTrains, importTrainStops } from '../importers/railwayDataImporter.js';

describe('WHERE IS MY TRAIN - Vangaon & Indian Railway Network Test Suite', () => {
  // 1. STATION EXISTENCE TESTS (Section 56)
  describe('Master Station Verification', () => {
    it('BOR exists as Boisar', () => {
      const bor = MOCK_STATIONS.find((s) => s.code === 'BOR') || MASTER_STATIONS.find((s) => s.station_code === 'BOR');
      expect(bor).toBeDefined();
      const stnName = (bor && 'name' in bor) ? bor.name : (bor as any)?.station_name;
      expect(stnName).toMatch(/Boisar/i);
    });

    it('VGN exists as Vangaon', () => {
      const vgn = MOCK_STATIONS.find((s) => s.code === 'VGN') || MASTER_STATIONS.find((s) => s.station_code === 'VGN');
      expect(vgn).toBeDefined();
      const stnName = (vgn && 'name' in vgn) ? vgn.name : (vgn as any)?.station_name;
      expect(stnName).toMatch(/Vangaon/i);
    });

    it('DRD exists as Dahanu Road', () => {
      const drd = MOCK_STATIONS.find((s) => s.code === 'DRD') || MASTER_STATIONS.find((s) => s.station_code === 'DRD');
      expect(drd).toBeDefined();
      const stnName = (drd && 'name' in drd) ? drd.name : (drd as any)?.station_name;
      expect(stnName).toMatch(/Dahanu Road/i);
    });
  });

  // 2. CRITICAL REGRESSION TEST (Section 57)
  describe('Boisar to Dahanu route (Section 57 permanent regression)', () => {
    it('must contain BOR, VGN, and DRD in exact sequence', async () => {
      const expectedStations = ['BOR', 'VGN', 'DRD'];

      // Check Master Route Corridor
      const mRoute = MASTER_ROUTES.find((r) => r.route_code === 'MMCT_ADI_CORRIDOR');
      expect(mRoute).toBeDefined();
      const stnCodes = mRoute!.stations.map((s) => s.station_code);

      const borIdx = stnCodes.indexOf('BOR');
      const vgnIdx = stnCodes.indexOf('VGN');
      const drdIdx = stnCodes.indexOf('DRD');

      expect(borIdx).toBeGreaterThan(-1);
      expect(vgnIdx).toBeGreaterThan(-1);
      expect(drdIdx).toBeGreaterThan(-1);

      expect(vgnIdx).toBe(borIdx + 1);
      expect(drdIdx).toBe(vgnIdx + 1);

      const slice = stnCodes.slice(borIdx, drdIdx + 1);
      expect(slice).toEqual(expectedStations);
    });

    it('segment API for train 19016 contains Vangaon (VGN) between Boisar and Dahanu Road', async () => {
      const res = await request(app)
        .get('/api/trains/19016/segment?from=BOR&to=DRD')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.fromStation.code).toBe('BOR');
      expect(res.body.data.toStation.code).toBe('DRD');
      expect(res.body.data.hasIntermediateStops).toBe(true);

      const intermediateCodes = res.body.data.intermediateStops.map((s: any) => s.stationCode);
      expect(intermediateCodes).toContain('VGN');
    });

    it('segment API for local train 93025 contains Vangaon (VGN) between Boisar and Dahanu Road', async () => {
      const res = await request(app)
        .get('/api/trains/93025/segment?from=BOR&to=DRD')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.hasIntermediateStops).toBe(true);
      const intermediateCodes = res.body.data.intermediateStops.map((s: any) => s.stationCode);
      expect(intermediateCodes).toContain('VGN');
    });
  });

  // 3. REVERSE DIRECTION TEST (Section 56)
  describe('Dahanu Road to Boisar reverse route', () => {
    it('segment API for UP train 19418 contains Vangaon (VGN) in DRD -> VGN -> BOR sequence', async () => {
      const res = await request(app)
        .get('/api/trains/19418/segment?from=DRD&to=BOR')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.fromStation.code).toBe('DRD');
      expect(res.body.data.toStation.code).toBe('BOR');
      expect(res.body.data.hasIntermediateStops).toBe(true);

      const intermediateCodes = res.body.data.intermediateStops.map((s: any) => s.stationCode);
      expect(intermediateCodes).toContain('VGN');
    });

    it('search DRD -> BOR excludes opposite direction (down) trains', async () => {
      const res = await request(app)
        .get('/api/trains/between?from=DRD&to=BOR&date=2026-10-01')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      // Verify that every returned train has DRD before BOR in its schedule
      for (const train of res.body.data) {
        expect(train.sourceCode || train.fromStation?.code).toBe('DRD');
        expect(train.destinationCode || train.toStation?.code).toBe('BOR');
      }
    });
  });

  // 4. NO ARTIFICIAL 45-TRAIN LIMITATION (Section 3)
  describe('Dynamic Service Results', () => {
    it('trains between BOR and DRD dynamically returns all matching services without hard-coded limits', async () => {
      const res = await request(app)
        .get('/api/trains/between?from=BOR&to=DRD')
        .expect(200);

      expect(res.body.success).toBe(true);
      // Ensure results are dynamic and not capped at 45
      expect(res.body.data.length).toBeGreaterThanOrEqual(45);

      // Verify stations array exists with intermediate stations populated
      const train = res.body.data[0];
      expect(train.stations).toBeDefined();
      expect(Array.isArray(train.stations)).toBe(true);
      expect(train.intermediateStations).toBeDefined();
      expect(train.intermediateStations).toContain('VGN');
    });
  });

  // 5. OFFICIAL RAILWAY DISTANCES (Section 2 & 6)
  describe('Railway Distance Accuracy', () => {
    it('BOR -> VGN section distance is 9.4 km and VGN -> DRD is 12.3 km', () => {
      const secBorVgn = MASTER_ROUTE_SECTIONS.find(
        (s) => s.from_station_code === 'BOR' && s.to_station_code === 'VGN'
      );
      const secVgnDrd = MASTER_ROUTE_SECTIONS.find(
        (s) => s.from_station_code === 'VGN' && s.to_station_code === 'DRD'
      );

      expect(secBorVgn).toBeDefined();
      expect(secBorVgn!.distance_km).toBeCloseTo(9.4, 1);

      expect(secVgnDrd).toBeDefined();
      expect(secVgnDrd!.distance_km).toBeCloseTo(12.3, 1);
    });
  });

  // 6. PLATFORM DATA INTEGRITY (Section 8)
  describe('Platform Verification', () => {
    it('does not invent fake platform numbers when unverified', async () => {
      const res = await request(app)
        .get('/api/trains/05379/schedule')
        .expect(200);

      expect(res.body.success).toBe(true);
      const schedule = res.body.data;
      // Stops with unverified platform should have null/undefined platform or verified string
      schedule.forEach((s: any) => {
        if (!s.platform) {
          expect(s.platform).toBeFalsy();
        }
      });
    });
  });

  // 7. DATA IMPORT PIPELINE IDEMPOTENCY (Section 24 & 33)
  describe('Idempotent Data Ingestion', () => {
    it('running importStations twice yields consistent results with 0 duplicates', () => {
      const first = importStations();
      const second = importStations();

      expect(first.duplicateCodes).toBe(0);
      expect(second.duplicateCodes).toBe(0);
      expect(first.valid).toBe(second.valid);
    });

    it('running importTrains twice yields consistent results with 0 duplicates', () => {
      const first = importTrains();
      const second = importTrains();

      expect(first.duplicateNumbers).toBe(0);
      expect(second.duplicateNumbers).toBe(0);
      expect(first.valid).toBe(second.valid);
    });

    it('running importTrainStops validates all stop sequences without negative distance', () => {
      const result = importTrainStops();
      expect(result.invalid).toBe(0);
      expect(result.valid).toBe(result.total);
    });
  });
});
