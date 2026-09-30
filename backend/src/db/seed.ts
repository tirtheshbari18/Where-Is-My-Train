import { PrismaClient } from '@prisma/client';
import {
  INDIAN_RAILWAY_ZONES,
  MOCK_STATIONS,
  MOCK_TRAINS,
} from '../providers/mock/mockRailwayData.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Indian Railways Database...');

  // 1. Seed Railway Zones
  for (const zone of INDIAN_RAILWAY_ZONES) {
    await prisma.railwayZone.upsert({
      where: { code: zone.code },
      update: {
        name: zone.name,
        headquarters: zone.headquarters,
        divisions: JSON.stringify(zone.divisions),
      },
      create: {
        code: zone.code,
        name: zone.name,
        headquarters: zone.headquarters,
        divisions: JSON.stringify(zone.divisions),
      },
    });
  }
  console.log(`✓ Seeded ${INDIAN_RAILWAY_ZONES.length} Railway Zones`);

  // 2. Seed Stations
  for (const st of MOCK_STATIONS) {
    await prisma.station.upsert({
      where: { code: st.code },
      update: {
        name: st.name,
        state: st.state,
        zoneCode: st.zone,
        latitude: st.latitude,
        longitude: st.longitude,
        numberOfPlatforms: st.numberOfPlatforms,
        stationCategory: st.category || 'NSG-1',
        wifiAvailable: st.wifiAvailable ?? true,
      },
      create: {
        code: st.code,
        name: st.name,
        state: st.state,
        zoneCode: st.zone,
        latitude: st.latitude,
        longitude: st.longitude,
        numberOfPlatforms: st.numberOfPlatforms,
        stationCategory: st.category || 'NSG-1',
        wifiAvailable: st.wifiAvailable ?? true,
      },
    });
  }
  console.log(`✓ Seeded ${MOCK_STATIONS.length} Railway Stations`);

  // 3. Seed Trains and Stops
  for (const tr of MOCK_TRAINS) {
    const train = await prisma.train.upsert({
      where: { trainNumber: tr.trainNumber },
      update: {
        trainName: tr.trainName,
        sourceCode: tr.sourceCode,
        destinationCode: tr.destinationCode,
        trainType: tr.trainType,
        runningDays: JSON.stringify(tr.runningDays),
        distanceKm: tr.distanceKm,
        durationMinutes: tr.durationMinutes,
        zoneCode: tr.zone,
        hasPantry: tr.hasPantry ?? true,
      },
      create: {
        trainNumber: tr.trainNumber,
        trainName: tr.trainName,
        sourceCode: tr.sourceCode,
        destinationCode: tr.destinationCode,
        trainType: tr.trainType,
        runningDays: JSON.stringify(tr.runningDays),
        distanceKm: tr.distanceKm,
        durationMinutes: tr.durationMinutes,
        zoneCode: tr.zone,
        hasPantry: tr.hasPantry ?? true,
      },
    });

    for (const stop of tr.schedule) {
      await prisma.trainStop.upsert({
        where: {
          trainNumber_stopSequence: {
            trainNumber: train.trainNumber,
            stopSequence: stop.stopSequence,
          },
        },
        update: {
          stationCode: stop.stationCode,
          scheduledArrival: stop.scheduledArrival,
          scheduledDeparture: stop.scheduledDeparture,
          haltMinutes: stop.haltMinutes,
          distanceFromSourceKm: stop.distanceFromSourceKm,
          dayCount: stop.dayCount,
          platform: stop.platform,
        },
        create: {
          trainNumber: train.trainNumber,
          stopSequence: stop.stopSequence,
          stationCode: stop.stationCode,
          scheduledArrival: stop.scheduledArrival,
          scheduledDeparture: stop.scheduledDeparture,
          haltMinutes: stop.haltMinutes,
          distanceFromSourceKm: stop.distanceFromSourceKm,
          dayCount: stop.dayCount,
          platform: stop.platform,
        },
      });
    }
  }
  console.log(`✓ Seeded ${MOCK_TRAINS.length} Trains and their schedules`);

  // 4. Seed Data Providers
  const providers = [
    { code: 'ntes', name: 'Official Indian Railways NTES Gateway', priority: 1, isEnabled: false },
    { code: 'licensed', name: 'Licensed Commercial Railway Data API', priority: 2, isEnabled: false },
    { code: 'mock', name: 'Mock Indian Railways Sandbox Provider', priority: 3, isEnabled: true },
  ];

  for (const prov of providers) {
    await prisma.dataProvider.upsert({
      where: { code: prov.code },
      update: {
        name: prov.name,
        priority: prov.priority,
        isEnabled: prov.isEnabled,
      },
      create: {
        code: prov.code,
        name: prov.name,
        priority: prov.priority,
        isEnabled: prov.isEnabled,
      },
    });
  }
  console.log(`✓ Seeded Data Providers`);
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
