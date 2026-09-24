import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { cacheService } from '../services/cacheService.js';
import { MockRailwayProvider } from '../providers/mock/mockRailwayProvider.js';

describe('WHERE IS MY TRAIN - Backend API Tests', () => {
  beforeEach(() => {
    cacheService.clear();
  });

  describe('Healthcheck & API Root', () => {
    it('should return health status ONLINE', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ONLINE');
    });

    it('should return API discovery documentation on root', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('WHERE IS MY TRAIN - Indian Railway Platform API');
    });
  });

  describe('Train Search & Typo Tolerance', () => {
    it('should find Vande Bharat with typo "vand bharat"', async () => {
      const res = await request(app).get('/api/trains/search?q=vand%20bharat');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].trainName).toContain('Vande Bharat');
    });

    it('should search train by exact train number 12951', async () => {
      const res = await request(app).get('/api/trains/search?q=12951');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].trainNumber).toBe('12951');
    });

    it('should return empty list when no trains match', async () => {
      const res = await request(app).get('/api/trains/search?q=xyznonexistenttrain999');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('Train Details & Running Status Normalization', () => {
    it('should return complete train details for 20901', async () => {
      const res = await request(app).get('/api/trains/20901');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.trainNumber).toBe('20901');
      expect(res.body.data.trainType).toBe('Vande Bharat');
      expect(res.body.data.schedule.length).toBeGreaterThan(3);
    });

    it('should return 404 for invalid train number', async () => {
      const res = await request(app).get('/api/trains/999999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TRAIN_NOT_FOUND');
    });

    it('should return properly normalized running status with positionType', async () => {
      const res = await request(app).get('/api/trains/20901/status');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.positionType).toBe('station'); // Transparently 'station', never fake GPS
      expect(res.body.data.lastReportedStation).toBeDefined();
      expect(res.body.data.source).toBeDefined();
    });

    it('should return coach composition for 20901', async () => {
      const res = await request(app).get('/api/trains/20901/coaches');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.coaches.length).toBeGreaterThan(0);
    });
  });

  describe('Station Search & Live Station Board', () => {
    it('should search stations by name or code', async () => {
      const res = await request(app).get('/api/stations/search?q=borivali');
      expect(res.status).toBe(200);
      expect(res.body.data.some((s: any) => s.code === 'BVI')).toBe(true);
    });

    it('should return 404 for invalid station code', async () => {
      const res = await request(app).get('/api/stations/INVALIDCODE99');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('STATION_NOT_FOUND');
    });

    it('should return live station board for MMCT', async () => {
      const res = await request(app).get('/api/stations/MMCT/live');
      expect(res.status).toBe(200);
      expect(res.body.data.stationCode).toBe('MMCT');
      expect(res.body.data.departures.length).toBeGreaterThan(0);
    });
  });

  describe('Trains Between Stations', () => {
    it('should find trains between Mumbai Central and Ahmedabad', async () => {
      const res = await request(app).get('/api/trains-between?from=MMCT&to=ADI');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.from).toBe('MMCT');
      expect(res.body.to).toBe('ADI');
    });

    it('should fail with 400 if station codes are missing', async () => {
      const res = await request(app).get('/api/trains-between?from=MMCT');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_STATION_CODES');
    });
  });

  describe('Nearby Stations Geo Search', () => {
    it('should find stations near Mumbai coordinates (19.22, 72.85)', async () => {
      const res = await request(app).get('/api/nearby-stations?lat=19.22&lng=72.85&radius=50');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].distanceKm).toBeDefined();
    });
  });

  describe('PNR Integration Validation', () => {
    it('should reject invalid PNR formats', async () => {
      const res = await request(app).get('/api/pnr/1234');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_PNR_FORMAT');
    });

    it('should return status and compliance disclaimer for 10-digit PNR', async () => {
      const res = await request(app).get('/api/pnr/1234567890');
      expect(res.status).toBe(200);
      expect(res.body.complianceNotice).toBeDefined();
      expect(res.body.officialPortalUrl).toBeDefined();
    });
  });

  describe('Admin and Data Providers', () => {
    it('should list all data providers and health', async () => {
      const res = await request(app).get('/api/admin/providers');
      expect(res.status).toBe(200);
      expect(res.body.data.providers.length).toBe(3);
    });

    it('should allow switching primary provider', async () => {
      const res = await request(app)
        .post('/api/admin/primary-provider')
        .send({ providerCode: 'mock' });
      expect(res.status).toBe(200);
      expect(res.body.currentPrimary).toBe('mock');
    });
  });

  describe('Caching System', () => {
    it('should cache and return stats', async () => {
      cacheService.set('test_key', { foo: 'bar' }, 10);
      const res = cacheService.get('test_key');
      expect(res.data).toEqual({ foo: 'bar' });
      expect(res.isStale).toBe(false);

      const stats = cacheService.getStats();
      expect(stats.hits).toBeGreaterThan(0);
    });
  });
});
