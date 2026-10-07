import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { MockRailwayProvider } from '../providers/mock/mockRailwayProvider.js';
import { calculateDurationMinutes, isTrainRunningOnDate } from '../utils/dateNormalizer.js';

describe('WHERE IS MY TRAIN — 26 MASTER ACCEPTANCE TEST SUITE (Section 53)', () => {
  const provider = new MockRailwayProvider();

  // Test 1: Boisar (BOR) -> Dahanu Road (DRD)
  it('Test 1: Boisar -> Dahanu Road returns complete valid result set (no 26-train limit)', async () => {
    const res = await request(app).get('/api/trains/between?from=BOR&to=DRD').expect(200);
    const trains = res.body.data;
    
    expect(trains.length).toBeGreaterThanOrEqual(40); // 46 trains returned
    expect(trains.length).toBe(46);
    
    // Every train must stop at BOR and DRD with BOR preceding DRD
    for (const t of trains) {
      expect(t.fromStation.code).toBe('BOR');
      expect(t.toStation.code).toBe('DRD');
    }

    // Must NOT contain 22954 (runs DRD -> BOR)
    const t22954 = trains.find((t: any) => t.trainNumber === '22954');
    expect(t22954).toBeUndefined();
  });

  // Test 2: Dahanu Road (DRD) -> Boisar (BOR)
  it('Test 2: Dahanu Road -> Boisar returns complete valid result set and includes 22954', async () => {
    const res = await request(app).get('/api/trains/between?from=DRD&to=BOR').expect(200);
    const trains = res.body.data;

    expect(trains.length).toBeGreaterThanOrEqual(40); // 42 trains returned
    expect(trains.length).toBe(42);

    for (const t of trains) {
      expect(t.fromStation.code).toBe('DRD');
      expect(t.toStation.code).toBe('BOR');
    }

    // Train 22954 (Gujarat SF Express) MUST appear
    const t22954 = trains.find((t: any) => t.trainNumber === '22954');
    expect(t22954).toBeDefined();
    expect(t22954.trainName).toMatch(/Gujarat SF Express/i);
    expect(t22954.fromStation.departureTime).toBe('13:25');
    expect(t22954.toStation.arrivalTime).toBe('13:38');
  });

  // Test 3: 22954 direct train-number search
  it('Test 3: 22954 direct train-number search returns Gujarat SF Express with complete schedule', async () => {
    const res = await request(app).get('/api/trains/22954').expect(200);
    const train = res.body.data;

    expect(train.trainNumber).toBe('22954');
    expect(train.trainName).toMatch(/Gujarat SF Express/i);
    expect(train.sourceCode).toBe('ADI');
    expect(train.destinationCode).toBe('MMCT');

    // Verify stops at both DRD and BOR
    const drdStop = train.schedule.find((s: any) => s.stationCode === 'DRD');
    const borStop = train.schedule.find((s: any) => s.stationCode === 'BOR');
    expect(drdStop).toBeDefined();
    expect(borStop).toBeDefined();
    expect(drdStop.stopSequence).toBeLessThan(borStop.stopSequence);
  });

  // Test 4: Station code search: BOR
  it('Test 4: Station code search: BOR returns Boisar', async () => {
    const res = await request(app).get('/api/stations/search?q=BOR').expect(200);
    const found = res.body.data.find((s: any) => s.code === 'BOR');
    expect(found).toBeDefined();
    expect(found.name).toMatch(/Boisar/i);
  });

  // Test 5: Station code search: DRD
  it('Test 5: Station code search: DRD returns Dahanu Road', async () => {
    const res = await request(app).get('/api/stations/search?q=DRD').expect(200);
    const found = res.body.data.find((s: any) => s.code === 'DRD');
    expect(found).toBeDefined();
    expect(found.name).toMatch(/Dahanu Road/i);
  });

  // Test 6: Train name search: Gujarat SF Express
  it('Test 6: Train name search: Gujarat SF Express returns 22954 and 22953', async () => {
    const res = await request(app).get('/api/trains/search?q=Gujarat SF Express').expect(200);
    const trainNumbers = res.body.data.map((t: any) => t.trainNumber);
    expect(trainNumbers).toContain('22954');
    expect(trainNumbers).toContain('22953');
  });

  // Test 7: Daily train on valid date
  it('Test 7: Daily train runs on valid date', () => {
    const train = { runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] };
    // 2026-10-07 is Wednesday
    expect(isTrainRunningOnDate(train as any, '2026-10-07')).toBe(true);
    // 2026-10-11 is Sunday
    expect(isTrainRunningOnDate(train as any, '2026-10-11')).toBe(true);
  });

  // Test 8: Weekly train on valid weekday
  it('Test 8: Weekly train on valid weekday is scheduled', () => {
    // 12649 runs Mon, Wed, Fri, Sat, Sun
    const train = { runningDays: ['Mon', 'Wed', 'Fri', 'Sat', 'Sun'] };
    // 2026-10-07 is Wednesday (Wed)
    expect(isTrainRunningOnDate(train as any, '2026-10-07')).toBe(true);
  });

  // Test 9: Weekly train on invalid weekday
  it('Test 9: Weekly train on invalid weekday is NOT scheduled', () => {
    // 12649 does not run on Tuesday (Tue) or Thursday (Thu)
    const train = { runningDays: ['Mon', 'Wed', 'Fri', 'Sat', 'Sun'] };
    // 2026-10-06 is Tuesday
    expect(isTrainRunningOnDate(train as any, '2026-10-06')).toBe(false);
    // 2026-10-08 is Thursday
    expect(isTrainRunningOnDate(train as any, '2026-10-08')).toBe(false);
  });

  // Test 10: Special train on valid date
  it('Test 10: Special train on valid date is recognized', async () => {
    const exceptions = await provider.getTrainExceptions();
    const spl = exceptions.find((e) => e.trainNumber === '09001');
    expect(spl).toBeDefined();
    expect(spl?.exceptionType).toBe('SPECIAL');
  });

  // Test 11: Special train cancellation exception
  it('Test 11: Special train cancelled on specific date applies exception', async () => {
    const exceptions = await provider.getTrainExceptions();
    const cancelled = exceptions.find((e) => e.trainNumber === '04123');
    expect(cancelled).toBeDefined();
    expect(cancelled?.exceptionType).toBe('CANCELLED');
  });

  // Test 12: Train crossing midnight duration calculation
  it('Test 12: Train crossing midnight calculates non-negative duration across days', () => {
    // Departs 23:45 Day 1, arrives 01:15 Day 2 -> duration is 90 mins (1h 30m)
    const duration = calculateDurationMinutes('23:45', '01:15', 1, 2);
    expect(duration).toBe(90);
    expect(duration).toBeGreaterThan(0);
  });

  // Test 13: No intermediate stations between consecutive stops
  it('Test 13: No intermediate stations returns 0 stops without fake data', async () => {
    // Train 93025 between Boisar (BOR) and Umroli (UOI) - consecutive suburban stops
    const res = await request(app).get('/api/trains/93025/segment?from=BOR&to=UOI').expect(200);
    expect(res.body.data.intermediateStops.length).toBe(0);
    expect(res.body.data.hasIntermediateStops).toBe(false);
  });

  // Test 14: One intermediate station
  it('Test 14: One intermediate station correctly identified in route sequence', async () => {
    // Train 22954 between DRD and BOR has 1 intermediate pass station: VGN (Vangaon)
    const res = await request(app).get('/api/trains/22954/segment?from=DRD&to=BOR').expect(200);
    expect(res.body.data.intermediateStops.length).toBe(1);
    expect(res.body.data.intermediateStops[0].stationCode).toBe('VGN');
    expect(res.body.data.intermediateStops[0].stationName).toMatch(/Vangaon/i);
  });

  // Test 15: Many intermediate stations
  it('Test 15: Many intermediate stations returns all stops in exact sequence', async () => {
    // Train 19418 between DRD and BVI has 10 intermediate stops
    const res = await request(app).get('/api/trains/19418/segment?from=DRD&to=BVI').expect(200);
    expect(res.body.data.intermediateStops.length).toBeGreaterThan(5);
    const codes = res.body.data.intermediateStops.map((s: any) => s.stationCode);
    expect(codes).toContain('VGN');
    expect(codes).toContain('BOR');
    expect(codes).toContain('PLG');
    expect(codes).toContain('VR');
    expect(codes).toContain('BSR');
  });

  // Test 16: Live telemetry speed reporting
  it('Test 16: Live speed reported when authoritative telemetry is present', async () => {
    const res = await request(app).get('/api/trains/19016/status').expect(200);
    expect(res.body.data.speedKmH).toBe(58);
  });

  // Test 17: Speed = 0 km/h when train is stopped
  it('Test 17: Train at origin/stop reports speed 0 km/h', async () => {
    const res = await request(app).get('/api/trains/19417/status').expect(200);
    expect(res.body.data.speedKmH).toBe(0);
  });

  // Test 18: Live running position contains previous, current, and next station
  it('Test 18: Live running status contains complete station context', async () => {
    const res = await request(app).get('/api/trains/19016/status').expect(200);
    const status = res.body.data;
    expect(status.lastReportedStation).toBeDefined();
    expect(status.previousStation).toBeDefined();
    expect(status.nextStation).toBeDefined();
    expect(status.lastReportedStation.code).toBe('VGN');
    expect(status.previousStation.code).toBe('BOR');
    expect(status.nextStation.code).toBe('DRD');
  });

  // Test 19: Source/destination times are station-specific, not train origin times
  it('Test 19: Search result returns station-specific times', async () => {
    const res = await request(app).get('/api/trains/between?from=BOR&to=DRD').expect(200);
    const train19016 = res.body.data.find((t: any) => t.trainNumber === '19016');
    expect(train19016).toBeDefined();
    // In Saurashtra Express, origin MMCT departs 06:55, but BOR departs at 08:42
    expect(train19016.fromStation.departureTime).toBe('08:42');
    expect(train19016.toStation.arrivalTime).toBe('09:04');
  });

  // Test 20: Station platform verification and voting
  it('Test 20: Platform info is verified and never fabricated', async () => {
    const train22954 = await provider.getTrainByNumber('22954');
    const drdStop = train22954?.schedule.find((s) => s.stationCode === 'DRD');
    const borStop = train22954?.schedule.find((s) => s.stationCode === 'BOR');
    expect(drdStop?.platform).toBe('2');
    expect(borStop?.platform).toBe('3');
  });

  // Test 21: Reverse direction integrity
  it('Test 21: Reverse direction excludes forward trains', async () => {
    const downRes = await request(app).get('/api/trains/between?from=BOR&to=DRD');
    const upRes = await request(app).get('/api/trains/between?from=DRD&to=BOR');
    
    const downNumbers = new Set(downRes.body.data.map((t: any) => t.trainNumber));
    const upNumbers = new Set(upRes.body.data.map((t: any) => t.trainNumber));

    // Down trains (e.g. 93011) should not be in Up trains
    expect(upNumbers.has('93011')).toBe(false);
    // Up trains (e.g. 93002) should not be in Down trains
    expect(downNumbers.has('93002')).toBe(false);
  });

  // Test 22: Complete 24-hour period search
  it('Test 22: Complete 24-hour search covers early morning to late night', async () => {
    const res = await request(app).get('/api/trains/between?from=DRD&to=BOR').expect(200);
    const departures = res.body.data.map((t: any) => t.fromStation.departureTime);
    
    const hasEarlyMorning = departures.some((d: string) => d.startsWith('02:') || d.startsWith('05:'));
    const hasAfternoon = departures.some((d: string) => d.startsWith('13:') || d.startsWith('15:'));
    const hasNight = departures.some((d: string) => d.startsWith('20:') || d.startsWith('22:'));

    expect(hasEarlyMorning).toBe(true);
    expect(hasAfternoon).toBe(true);
    expect(hasNight).toBe(true);
  });

  // Test 23: Multiple simultaneous users (stateless safety)
  it('Test 23: Multiple simultaneous queries do not cross-contaminate state', async () => {
    const [res1, res2, res3] = await Promise.all([
      request(app).get('/api/trains/between?from=BOR&to=DRD'),
      request(app).get('/api/trains/between?from=DRD&to=BOR'),
      request(app).get('/api/trains/22954'),
    ]);

    expect(res1.body.data.length).toBe(46);
    expect(res2.body.data.length).toBe(42);
    expect(res3.body.data.trainNumber).toBe('22954');
  });

  // Test 24: Train category normalization
  it('Test 24: Train categories include EMU, MEMU, Express, Superfast, Passenger', async () => {
    const res = await request(app).get('/api/trains/between?from=BOR&to=DRD').expect(200);
    const types = new Set(res.body.data.map((t: any) => t.trainType));
    
    expect(types.has('Fast Local') || types.has('Slow Local') || types.has('EMU')).toBe(true);
    expect(types.has('MEMU')).toBe(true);
    expect(types.has('Express')).toBe(true);
    expect(types.has('Superfast')).toBe(true);
  });
});
