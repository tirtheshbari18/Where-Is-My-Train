import { describe, it, expect } from 'vitest';
import { MockRailwayProvider } from '../providers/mock/mockRailwayProvider.js';

describe('Investigation of BOR <-> DRD Trains', () => {
  const provider = new MockRailwayProvider();

  it('checks BOR -> DRD and DRD -> BOR results', async () => {
    const borDrd = await provider.getTrainsBetweenStations('BOR', 'DRD');
    const drdBor = await provider.getTrainsBetweenStations('DRD', 'BOR');
    const t22954 = await provider.getTrainByNumber('22954');

    console.log('--- BOR -> DRD COUNT:', borDrd.length);
    console.log('BOR -> DRD trains:', borDrd.map(t => `${t.trainNumber} ${t.trainName}`));
    console.log('--- DRD -> BOR COUNT:', drdBor.length);
    console.log('DRD -> BOR trains:', drdBor.map(t => `${t.trainNumber} ${t.trainName}`));
    console.log('--- TRAIN 22954:', t22954 ? `${t22954.trainNumber} ${t22954.trainName}` : 'NOT FOUND');

    expect(borDrd).toBeDefined();

    const { MOCK_TRAINS } = await import('../providers/mock/mockRailwayData.js');
    const seen = new Set();
    const dups = [];
    for (const t of MOCK_TRAINS) {
      if (seen.has(t.trainNumber)) dups.push(`${t.trainNumber} - ${t.trainName}`);
      seen.add(t.trainNumber);
    }
    console.log('--- MOCK_TRAINS DUPLICATES:', dups);
  });
});
