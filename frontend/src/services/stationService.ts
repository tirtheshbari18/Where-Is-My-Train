// Station Service for WHERE IS MY TRAIN
// Handles station searches, autocomplete, popular stations, and live boards

import { railwayApi, StationLocation, LiveStationBoard } from '../api/railwayApi.js';
import { offlineStorageService } from './offlineStorageService.js';

export const COMMON_POPULAR_STATIONS: StationLocation[] = [
  { code: 'BOR', name: 'Boisar', state: 'Maharashtra', zone: 'WR', division: 'Mumbai', latitude: 19.8000, longitude: 72.7565, numberOfPlatforms: 3, wifiAvailable: true },
  { code: 'DRD', name: 'Dahanu Road', state: 'Maharashtra', zone: 'WR', division: 'Mumbai', latitude: 19.9734, longitude: 72.7329, numberOfPlatforms: 4, wifiAvailable: true },
  { code: 'PLG', name: 'Palghar', state: 'Maharashtra', zone: 'WR', division: 'Mumbai', latitude: 19.6967, longitude: 72.7699, numberOfPlatforms: 3, wifiAvailable: true },
  { code: 'VR', name: 'Virar', state: 'Maharashtra', zone: 'WR', division: 'Mumbai', latitude: 19.4674, longitude: 72.8118, numberOfPlatforms: 8, wifiAvailable: true },
  { code: 'VTN', name: 'Vaitarna', state: 'Maharashtra', zone: 'WR', division: 'Mumbai', latitude: 19.5312, longitude: 72.8193, numberOfPlatforms: 2, wifiAvailable: true },
  { code: 'SAH', name: 'Saphale', state: 'Maharashtra', zone: 'WR', division: 'Mumbai', latitude: 19.5772, longitude: 72.8188, numberOfPlatforms: 3, wifiAvailable: true },
  { code: 'KLV', name: 'Kelve Road', state: 'Maharashtra', zone: 'WR', division: 'Mumbai', latitude: 19.6268, longitude: 72.7937, numberOfPlatforms: 3, wifiAvailable: true },
  { code: 'UOI', name: 'Umroli', state: 'Maharashtra', zone: 'WR', division: 'Mumbai', latitude: 19.7423, longitude: 72.7612, numberOfPlatforms: 2, wifiAvailable: true },
  { code: 'VGN', name: 'Vangaon', state: 'Maharashtra', zone: 'WR', division: 'Mumbai', latitude: 19.8822, longitude: 72.7489, numberOfPlatforms: 2, wifiAvailable: true },
  { code: 'GVD', name: 'Gholvad', state: 'Maharashtra', zone: 'WR', division: 'Mumbai', latitude: 20.0768, longitude: 72.7369, numberOfPlatforms: 2, wifiAvailable: true },
  { code: 'BRRD', name: 'Bordi Road', state: 'Maharashtra', zone: 'WR', division: 'Mumbai', latitude: 20.1245, longitude: 72.7482, numberOfPlatforms: 2, wifiAvailable: true },
  { code: 'SJN', name: 'Sanjan', state: 'Gujarat', zone: 'WR', division: 'Mumbai', latitude: 20.2012, longitude: 72.8021, numberOfPlatforms: 3, wifiAvailable: true },
  { code: 'UBR', name: 'Umargam Road', state: 'Gujarat', zone: 'WR', division: 'Mumbai', latitude: 20.2456, longitude: 72.8312, numberOfPlatforms: 3, wifiAvailable: true },
  { code: 'BLD', name: 'Bhilad', state: 'Gujarat', zone: 'WR', division: 'Mumbai', latitude: 20.2834, longitude: 72.8687, numberOfPlatforms: 3, wifiAvailable: true },
  { code: 'VAPI', name: 'Vapi', state: 'Gujarat', zone: 'WR', division: 'Mumbai', latitude: 20.3712, longitude: 72.9042, numberOfPlatforms: 3, wifiAvailable: true },
  { code: 'LJN', name: 'Lucknow Junction NER', state: 'Uttar Pradesh', zone: 'NER', division: 'Lucknow', latitude: 26.8322, longitude: 80.9208, numberOfPlatforms: 6, wifiAvailable: true },
  { code: 'LKO', name: 'Lucknow Charbagh NR', state: 'Uttar Pradesh', zone: 'NR', division: 'Lucknow', latitude: 26.8315, longitude: 80.9229, numberOfPlatforms: 9, wifiAvailable: true },
  { code: 'MMCT', name: 'Mumbai Central', state: 'Maharashtra', zone: 'WR', division: 'Mumbai', latitude: 18.9696, longitude: 72.8193, numberOfPlatforms: 9, wifiAvailable: true },
  { code: 'BVI', name: 'Borivali', state: 'Maharashtra', zone: 'WR', division: 'Mumbai', latitude: 19.2288, longitude: 72.8541, numberOfPlatforms: 10, wifiAvailable: true },
  { code: 'NDLS', name: 'New Delhi', state: 'Delhi', zone: 'NR', division: 'Delhi', latitude: 28.6427, longitude: 77.2195, numberOfPlatforms: 16, wifiAvailable: true },
  { code: 'HWH', name: 'Howrah Junction', state: 'West Bengal', zone: 'ER', division: 'Howrah', latitude: 22.5839, longitude: 88.3426, numberOfPlatforms: 23, wifiAvailable: true },
  { code: 'MAS', name: 'MGR Chennai Central', state: 'Tamil Nadu', zone: 'SR', division: 'Chennai', latitude: 13.0827, longitude: 80.2755, numberOfPlatforms: 12, wifiAvailable: true },
  { code: 'SBC', name: 'KSR Bengaluru City', state: 'Karnataka', zone: 'SWR', division: 'Bengaluru', latitude: 12.9781, longitude: 77.5696, numberOfPlatforms: 10, wifiAvailable: true },
  { code: 'ADI', name: 'Ahmedabad Junction', state: 'Gujarat', zone: 'WR', division: 'Ahmedabad', latitude: 23.0238, longitude: 72.6011, numberOfPlatforms: 12, wifiAvailable: true },
  { code: 'CNB', name: 'Kanpur Central', state: 'Uttar Pradesh', zone: 'NCR', division: 'Prayagraj', latitude: 26.4547, longitude: 80.3507, numberOfPlatforms: 10, wifiAvailable: true },
  { code: 'BSB', name: 'Varanasi Junction', state: 'Uttar Pradesh', zone: 'NER', division: 'Varanasi', latitude: 25.3284, longitude: 82.9863, numberOfPlatforms: 9, wifiAvailable: true },
  { code: 'KSJ', name: 'Kasganj Junction', state: 'Uttar Pradesh', zone: 'NER', division: 'Izzatnagar', latitude: 27.8115, longitude: 78.6472, numberOfPlatforms: 5, wifiAvailable: true },
];

export class StationService {
  getPopularStations(): StationLocation[] {
    return COMMON_POPULAR_STATIONS;
  }

  async searchStations(query: string): Promise<StationLocation[]> {
    const q = query.trim().toLowerCase();

    // Check offline mode
    if (!offlineStorageService.isOnline()) {
      const cached = offlineStorageService.getCachedStations();
      const pool = cached.length > 0 ? cached : COMMON_POPULAR_STATIONS;
      if (!q) return pool.slice(0, 10);
      return pool.filter(
        (s) =>
          s.code.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          (s.state && s.state.toLowerCase().includes(q))
      );
    }

    try {
      const results = await railwayApi.searchStations(query);
      if (results.length > 0) {
        offlineStorageService.cacheStations(results);
      }
      return results;
    } catch {
      // Fallback to local pool
      return COMMON_POPULAR_STATIONS.filter(
        (s) =>
          s.code.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q)
      );
    }
  }

  async getStation(code: string): Promise<StationLocation | null> {
    try {
      return await railwayApi.getStation(code);
    } catch {
      return (
        COMMON_POPULAR_STATIONS.find(
          (s) => s.code.toUpperCase() === code.toUpperCase()
        ) || null
      );
    }
  }

  async getLiveBoard(code: string): Promise<LiveStationBoard | null> {
    try {
      return await railwayApi.getLiveStation(code);
    } catch {
      return null;
    }
  }
}

export const stationService = new StationService();
