// Local Storage utilities for Favourites, Search History, and Preferences

export interface FavouriteItem {
  id: string;
  type: 'TRAIN' | 'STATION';
  codeOrNumber: string;
  title: string;
  subtitle: string;
  savedAt: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  type: 'TRAIN' | 'STATION' | 'ROUTE';
  label: string;
  subLabel?: string;
  timestamp: string;
}

const FAVOURITES_KEY = 'wimt_favourites_v1';
const HISTORY_KEY = 'wimt_search_history_v1';

export const storage = {
  getFavourites(): FavouriteItem[] {
    try {
      const data = localStorage.getItem(FAVOURITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addFavourite(item: Omit<FavouriteItem, 'id' | 'savedAt'>): FavouriteItem {
    const current = this.getFavourites();
    const existing = current.find(
      (f) => f.type === item.type && f.codeOrNumber === item.codeOrNumber
    );
    if (existing) return existing;

    const newItem: FavouriteItem = {
      ...item,
      id: `${item.type}_${item.codeOrNumber}_${Date.now()}`,
      savedAt: new Date().toISOString(),
    };

    const updated = [newItem, ...current];
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(updated));
    return newItem;
  },

  removeFavourite(type: 'TRAIN' | 'STATION', codeOrNumber: string): void {
    const current = this.getFavourites();
    const updated = current.filter(
      (f) => !(f.type === type && f.codeOrNumber === codeOrNumber)
    );
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(updated));
  },

  isFavourite(type: 'TRAIN' | 'STATION', codeOrNumber: string): boolean {
    const current = this.getFavourites();
    return current.some(
      (f) => f.type === type && f.codeOrNumber === codeOrNumber
    );
  },

  getSearchHistory(): SearchHistoryItem[] {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addSearchHistory(item: Omit<SearchHistoryItem, 'id' | 'timestamp'>): void {
    const current = this.getSearchHistory().filter(
      (h) => h.query.toLowerCase() !== item.query.toLowerCase()
    );

    const newItem: SearchHistoryItem = {
      ...item,
      id: `hist_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    const updated = [newItem, ...current].slice(0, 10);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  },

  clearSearchHistory(): void {
    localStorage.removeItem(HISTORY_KEY);
  },
};
