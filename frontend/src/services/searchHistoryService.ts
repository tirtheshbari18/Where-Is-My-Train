// Search History Service for Recent Train and Route Searches

export interface SearchHistoryEntry {
  id: string;
  trainNumber?: string;
  trainName?: string;
  sourceCode: string;
  sourceName?: string;
  destinationCode: string;
  destinationName?: string;
  type: 'TRAIN' | 'ROUTE' | 'LOCAL';
  timestamp: string;
}

const HISTORY_KEY = 'wimt_search_history_v2';

const DEFAULT_RECENT_SEARCHES: SearchHistoryEntry[] = [
  {
    id: 'sh_1',
    trainNumber: '22956',
    trainName: 'Kutch SF Express',
    sourceCode: 'BHUJ',
    sourceName: 'Bhuj',
    destinationCode: 'BDTS',
    destinationName: 'Bandra Terminus',
    type: 'TRAIN',
    timestamp: '2 hours ago',
  },
  {
    id: 'sh_2',
    trainNumber: '93025',
    trainName: 'Virar - Dahanu Road',
    sourceCode: 'BOR',
    sourceName: 'Boisar',
    destinationCode: 'DRD',
    destinationName: 'Dahanu Road',
    type: 'LOCAL',
    timestamp: 'Yesterday',
  },
  {
    id: 'sh_3',
    trainNumber: '12922',
    trainName: 'Flying Ranee',
    sourceCode: 'ST',
    sourceName: 'Surat',
    destinationCode: 'MMCT',
    destinationName: 'Mumbai Central',
    type: 'TRAIN',
    timestamp: '3 days ago',
  },
  {
    id: 'sh_4',
    trainNumber: '22917',
    trainName: 'Haridwar SF Express',
    sourceCode: 'BDTS',
    sourceName: 'Bandra Terminus',
    destinationCode: 'HW',
    destinationName: 'Haridwar',
    type: 'TRAIN',
    timestamp: '5 days ago',
  },
  {
    id: 'sh_5',
    trainNumber: '19019',
    trainName: 'Haridwar Express',
    sourceCode: 'BDTS',
    sourceName: 'Bandra Terminus',
    destinationCode: 'HW',
    destinationName: 'Haridwar',
    type: 'TRAIN',
    timestamp: '1 week ago',
  },
];

export const searchHistoryService = {
  getHistory(): SearchHistoryEntry[] {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(DEFAULT_RECENT_SEARCHES));
        return DEFAULT_RECENT_SEARCHES;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_RECENT_SEARCHES;
    }
  },

  addEntry(entry: Omit<SearchHistoryEntry, 'id' | 'timestamp'>): void {
    const list = this.getHistory().filter((item) => {
      if (entry.trainNumber && item.trainNumber) {
        return item.trainNumber !== entry.trainNumber;
      }
      return !(item.sourceCode === entry.sourceCode && item.destinationCode === entry.destinationCode);
    });

    const newEntry: SearchHistoryEntry = {
      ...entry,
      id: `sh_${Date.now()}`,
      timestamp: 'Just now',
    };

    const updated = [newEntry, ...list].slice(0, 10);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  },

  deleteEntry(id: string): SearchHistoryEntry[] {
    const list = this.getHistory().filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    return list;
  },

  clearAll(): void {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
  },
};
