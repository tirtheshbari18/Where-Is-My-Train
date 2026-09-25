// Notification & Station Alarm Service

export interface StationAlarmConfig {
  id: string;
  trainNumber: string;
  trainName: string;
  stationName: string;
  stationCode: string;
  distanceKmBefore: number; // 1, 2, 5, 10, or 0 (on arrival)
  createdAt: string;
  isActive: boolean;
}

const ALARMS_KEY = 'wimt_user_station_alarms';

export const notificationService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    return await Notification.requestPermission();
  },

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  playAlertSound() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch {
      // Audio context might be restricted before user gesture
    }
  },

  notify(title: string, options?: NotificationOptions) {
    this.playAlertSound();

    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
        return;
      } catch {
        // Fallback to in-app
      }
    }

    // In-app visual alert
    console.log(`[WIMT Alert] ${title}:`, options?.body);
  },

  getAlarms(): StationAlarmConfig[] {
    try {
      const raw = localStorage.getItem(ALARMS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveAlarm(alarm: Omit<StationAlarmConfig, 'id' | 'createdAt' | 'isActive'>): StationAlarmConfig {
    const alarms = this.getAlarms();
    const newAlarm: StationAlarmConfig = {
      ...alarm,
      id: `alarm_${Date.now()}`,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    alarms.push(newAlarm);
    localStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
    return newAlarm;
  },

  deleteAlarm(id: string) {
    const alarms = this.getAlarms().filter((a) => a.id !== id);
    localStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
  },
};
