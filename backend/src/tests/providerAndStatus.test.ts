import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  normalizeDate,
  getTodayInKolkata,
  parseTimeToMinutes,
  isOvernight,
  calculateDurationMinutes,
} from '../utils/dateNormalizer.js';
import { ExternalRailwayProvider } from '../providers/external/externalRailwayProvider.js';
import { providerManager } from '../providers/providerManager.js';

describe('WHERE IS MY TRAIN - Core Provider, Health & Status Tests', () => {
  // 1. Date Handling & Timezone Tests
  describe('Indian Railway Date & IST Handling', () => {
    it('should return today date in Asia/Kolkata timezone format YYYY-MM-DD', () => {
      const today = getTodayInKolkata();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should convert DD/MM/YYYY into YYYY-MM-DD correctly without browser timezone shift', () => {
      const { isoDate, isValid, dayOfWeek } = normalizeDate('01/10/2026');
      expect(isValid).toBe(true);
      expect(isoDate).toBe('2026-10-01');
      expect(dayOfWeek).toBe('Thu');
    });

    it('should convert DD-MM-YYYY into YYYY-MM-DD', () => {
      const { isoDate, isValid } = normalizeDate('15-08-2026');
      expect(isValid).toBe(true);
      expect(isoDate).toBe('2026-08-15');
    });

    it('should parse times and calculate overnight train durations correctly', () => {
      // 23:50 -> 05:30 next day
      const dep = '23:50';
      const arr = '05:30';
      expect(isOvernight(dep, arr)).toBe(true);
      const durationMins = calculateDurationMinutes(dep, arr);
      // 23:50 to midnight = 10 mins, midnight to 05:30 = 330 mins -> total = 340 mins = 5h 40m
      expect(durationMins).toBe(340);
    });
  });

  // 2. Trains Between Stations & Normalization
  describe('Trains Between Stations API (BOR -> DRD)', () => {
    it('should find trains between Boisar (BOR) and Dahanu Road (DRD)', async () => {
      const res = await request(app)
        .get('/api/trains/between?from=BOR&to=DRD&date=2026-10-01')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      // Verify normalized train model fields (Requirement 9)
      const firstTrain = res.body.data[0];
      expect(firstTrain).toHaveProperty('trainNumber');
      expect(firstTrain).toHaveProperty('trainName');
      expect(firstTrain).toHaveProperty('fromStation');
      expect(firstTrain.fromStation).toHaveProperty('code');
      expect(firstTrain).toHaveProperty('toStation');
      expect(firstTrain.toStation).toHaveProperty('code');
      expect(firstTrain).toHaveProperty('durationMinutes');
    });

    it('should deduplicate trains by trainNumber + journeyDate', async () => {
      const res = await request(app)
        .get('/api/trains-between?from=BOR&to=DRD&date=2026-10-01')
        .expect(200);

      const trains = res.body.data;
      const seen = new Set<string>();
      for (const t of trains) {
        const key = `${t.trainNumber}_${t.journeyDate || '2026-10-01'}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    });

    it('should reject missing station parameters with 400 Bad Request', async () => {
      const res = await request(app).get('/api/trains/between?from=BOR').expect(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_STATION_CODES');
    });
  });

  // 3. Live Status & Health Check
  describe('Live Status & Provider Healthcheck', () => {
    it('should return live status for train 19016 (Saurashtra Express)', async () => {
      const res = await request(app).get('/api/trains/19016/live').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.trainNumber).toBe('19016');
      expect(res.body.data.status).toBeDefined();
      expect(res.body.data.lastReportedStation).toBeDefined();
    });

    it('should support /status alias for backward compatibility', async () => {
      const res = await request(app).get('/api/trains/19016/status').expect(200);
      expect(res.body.success).toBe(true);
    });

    it('should return structured health telemetry on GET /api/health/railway (Requirement 26)', async () => {
      const res = await request(app).get('/api/health/railway').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.provider).toBeDefined();
      expect(res.body.status).toBe('healthy');
      expect(typeof res.body.latencyMs).toBe('number');
      expect(res.body.timestamp).toBeDefined();
    });

    it('should attach X-Request-ID to all responses for distributed tracing (Requirement 27)', async () => {
      const res = await request(app).get('/api/health').expect(200);
      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.headers['x-request-id'].length).toBeGreaterThan(5);
    });
  });

  // 4. Provider Abstraction & Error Handling
  describe('Provider Abstraction & Fallback Resilience', () => {
    it('ExternalRailwayProvider should report missing key when RAILWAY_API_KEY is unset', async () => {
      const ext = new ExternalRailwayProvider();
      const isUp = await ext.isAvailable();
      // Since no external key is configured in test env, it gracefully reports unavailable
      expect(isUp).toBe(false);
    });

    it('ProviderManager should fallback gracefully to mock provider', async () => {
      const isAvailable = await providerManager.isAvailable();
      expect(isAvailable).toBe(true);
      const trains = await providerManager.getTrainsBetweenStations('BOR', 'DRD', '2026-10-01');
      expect(trains.length).toBeGreaterThan(0);
    });
  });
});
