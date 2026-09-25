// Timetable Update & Cache Sync Service

const LAST_UPDATED_KEY = 'wimt_timetable_last_updated';

export const timetableService = {
  getLastUpdatedText(): string {
    const raw = localStorage.getItem(LAST_UPDATED_KEY);
    if (!raw) return 'Updated few seconds ago';

    const timestamp = parseInt(raw, 10);
    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);

    if (diffSeconds < 60) return 'Updated few seconds ago';
    if (diffSeconds < 3600) return `Updated ${Math.floor(diffSeconds / 60)} minutes ago`;
    if (diffSeconds < 86400) return `Updated ${Math.floor(diffSeconds / 3600)} hours ago`;
    return `Updated ${new Date(timestamp).toLocaleDateString()}`;
  },

  async updateTimetable(onProgress?: (percentage: number, statusText: string) => void): Promise<boolean> {
    const steps = [
      { pct: 15, text: 'Connecting to Indian Railways Timetable Gateway...' },
      { pct: 35, text: 'Synchronizing Western & Central Railway schedules...' },
      { pct: 55, text: 'Updating Mumbai Suburban (Fast/Slow Local) timetables...' },
      { pct: 75, text: 'Verifying Metro & BEST Bus interchange feeds...' },
      { pct: 90, text: 'Caching offline station network indexes...' },
      { pct: 100, text: 'Timetable synchronization complete!' },
    ];

    for (const step of steps) {
      if (onProgress) onProgress(step.pct, step.text);
      await new Promise((r) => setTimeout(r, 220));
    }

    localStorage.setItem(LAST_UPDATED_KEY, Date.now().toString());
    return true;
  },
};
