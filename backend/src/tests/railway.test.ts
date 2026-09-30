import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { cacheService } from '../services/cacheService.js';
import { MockRailwayProvider } from '../providers/mock/mockRailwayProvider.js';
import { prisma } from '../db/prismaClient.js';

/**
 * The platform-vote endpoints are backed by PostgreSQL. This machine has no
 * reachable database (and no working Prisma query engine), so the Prisma client
 * is replaced with a tiny in-memory fake for these integration tests.
 *
 * That keeps the suite runnable everywhere while still exercising the real
 * Express route + controller logic (scoping, aggregation, verification
 * thresholds and the "never fabricate counts" contract). It does NOT verify
 * that rows survive in PostgreSQL — that still needs a real database.
 */
vi.mock('../db/prismaClient.js', () => {
  const rows: Array<{ vote: string; updatedAt: Date }> = [];
  const prismaFake = {
    platformVote: {
      findMany: async () => rows.slice(),
      findFirst: async () => null,
      upsert: async ({ create }: { create: { vote: string } }) => {
        rows.push({ vote: create.vote, updatedAt: new Date() });
        return create;
      },
    },
    __reset: () => {
      rows.length = 0;
    },
  };
  return { prisma: prismaFake };
});

describe('WHERE IS MY TRAIN - Backend API Tests', () => {
  beforeEach(() => {
    cacheService.clear();
    (prisma as unknown as { __reset?: () => void }).__reset?.();
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

  describe('Indian Railways Master Database & Data Quality', () => {
    it('should return master railway zones', async () => {
      const res = await request(app).get('/api/zones');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(18);
    });

    it('should return railway divisions filtered by zone', async () => {
      const res = await request(app).get('/api/divisions?zone=WR');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((d: any) => d.zone_code === 'WR')).toBe(true);
    });

    it('should return master railway lines', async () => {
      const res = await request(app).get('/api/railway-lines');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('should search master corridor routes between stations', async () => {
      const res = await request(app).get('/api/routes/search?from=BOR&to=DRD');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.authoritative_distance_km).toBe(22);
      expect(res.body.matching_routes.length).toBeGreaterThan(0);
    });

    it('should generate automated data quality audit report with 100% score', async () => {
      const res = await request(app).get('/api/data-quality-report');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overall_status).toBe('PASSED_VERIFIED');
      expect(res.body.data.errors).toHaveLength(0);
      expect(res.body.data.quality_score).toBe('100%');
    });
  });

  describe('Suburban Locals, Metro & Buses', () => {
    it('should return local train lines', async () => {
      const res = await request(app).get('/api/locals/lines');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should search local trains between Churchgate and Virar', async () => {
      const res = await request(app).get('/api/locals/search?origin=CCG&destination=VR');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should return metro network lines', async () => {
      const res = await request(app).get('/api/metro/lines');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should return active mega blocks and safety alerts', async () => {
      const res = await request(app).get('/api/blocks');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should search connecting bus routes', async () => {
      const res = await request(app).get('/api/buses/search');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Crowdsourced Platform Voting & Feedback', () => {
    it('should return platform vote statistics scoped to the requested platform', async () => {
      const res = await request(app).get('/api/platform-votes/19417/BOR?platform=2');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stationCode).toBe('BOR');
      expect(res.body.data.platform).toBe('2');
      expect(res.body.data.available).toBe(true);

      const d = res.body.data;
      // Counts are always internally consistent and never invented
      expect(d.totalVotes).toBe(d.yesCount + d.noCount + d.notSureCount);
      if (d.totalVotes === 0) {
        expect(d.approvalPercentage).toBe(0);
        expect(d.isCommunityVerified).toBe(false);
        expect(d.verificationStatus).toBe('NOT_VERIFIED');
      }
    });

    it('should not invent a platform when none was requested', async () => {
      const res = await request(app).get('/api/platform-votes/19417/BOR');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.platform).toBe('');
    });

    it('should accept community platform confirmation votes and count them', async () => {
      const res = await request(app)
        .post('/api/platform-votes')
        .send({
          trainNumber: '19417',
          stationCode: 'BOR',
          platform: '2',
          vote: 'YES',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userVoted).toBe('YES');
      expect(res.body.data.totalVotes).toBe(1);
      expect(res.body.data.yesCount).toBe(1);
      // A single vote must never be enough to claim community verification
      expect(res.body.data.isCommunityVerified).toBe(false);
      expect(res.body.data.verificationStatus).toBe('INSUFFICIENT_VOTES');
    });

    it('should verify only after enough agreeing votes, and mark disagreement disputed', async () => {
      const vote = (choice: string) =>
        request(app)
          .post('/api/platform-votes')
          .send({ trainNumber: '19417', stationCode: 'BOR', platform: '2', vote: choice });

      // Two more agreeing votes -> 3 total, 100% approval
      await vote('YES');
      await vote('YES');
      await vote('YES');
      let res = await request(app).get('/api/platform-votes/19417/BOR?platform=2');
      expect(res.body.data.totalVotes).toBe(3);
      expect(res.body.data.verificationStatus).toBe('VERIFIED');
      expect(res.body.data.isCommunityVerified).toBe(true);

      // One dissenting vote drops approval below the 80% threshold
      await vote('NO');
      res = await request(app).get('/api/platform-votes/19417/BOR?platform=2');
      expect(res.body.data.totalVotes).toBe(4);
      expect(res.body.data.noCount).toBe(1);
      expect(res.body.data.approvalPercentage).toBe(75); // 3 yes / (3 yes + 1 no)
      expect(res.body.data.verificationStatus).toBe('DISPUTED');
      expect(res.body.data.isCommunityVerified).toBe(false);
    });

    it('should accept user feedback submission', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .send({
          category: 'PLATFORM_ACCURACY',
          message: 'Platform 2 at Boisar is accurately tracked.',
          userEmail: 'user@example.com',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Admin Master Data Management', () => {
    it('should return master summary metrics', async () => {
      const res = await request(app).get('/api/admin/master-summary');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.zones).toBe(18);
      expect(res.body.data.divisions).toBe(71);
      expect(res.body.data.stations).toBeGreaterThan(100);
      expect(res.body.data.qualityScore).toBe('100%');
    });

    it('should return paginated stations with search and zone filtering', async () => {
      const res = await request(app).get('/api/admin/stations?page=1&limit=10&zone=WR&search=DAHANU');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].station_code).toBe('DRD');
    });

    it('should mark a station as officially verified', async () => {
      const res = await request(app)
        .post('/api/admin/stations/DRD/verify')
        .send({ verified_by: 'CRIS Inspector Test' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verification_status).toBe('VERIFIED');
    });

    it('should reject adding a station with a duplicate station code', async () => {
      const res = await request(app)
        .post('/api/admin/stations')
        .send({
          station_code: 'DRD',
          station_name: 'Dahanu Road Duplicate',
          zone_code: 'WR',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should export complete master railway database as JSON', async () => {
      const res = await request(app).get('/api/admin/export');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.zones.length).toBe(18);
      expect(res.body.data.divisions.length).toBe(71);
      expect(res.body.data.stations.length).toBeGreaterThan(100);
      expect(res.body.data.routes.length).toBeGreaterThan(10);
    });

    it('should validate and import valid dataset payload', async () => {
      const csvData = `station_code,station_name,zone_code,division_code,state,city,latitude,longitude\nTSTN,Test Station IR,WR,Mumbai Central,Maharashtra,TestCity,20.0,73.0`;
      const res = await request(app)
        .post('/api/admin/import')
        .send({
          type: 'stations',
          payload: csvData,
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.report.valid).toBe(1);
    });
  });
});

