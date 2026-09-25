// Station Alarm Service for WHERE IS MY TRAIN
// Enables arrival alarms, departure alarms, and pre-station reminders

export interface StationAlarm {
  id: string;
  trainNumber: string;
  trainName: string;
  stationCode: string;
  stationName: string;
  alarmType: 'arrival' | 'departure';
  leadMinutes: number; // 0, 5, 10, 15
  isEnabled: boolean;
  scheduledTime: string;
  createdAt: string;
}

const STORAGE_KEY = 'wimt_alarms_v1';

export class AlarmService {
  private alarms: StationAlarm[] = [];

  constructor() {
    this.loadAlarms();
  }

  private loadAlarms(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.alarms = raw ? JSON.parse(raw) : [];
    } catch {
      this.alarms = [];
    }
  }

  private saveAlarms(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.alarms));
    } catch (e) {
      console.warn('Failed to save alarms:', e);
    }
  }

  getAlarms(trainNumber?: string): StationAlarm[] {
    if (trainNumber) {
      return this.alarms.filter((a) => a.trainNumber === trainNumber);
    }
    return this.alarms;
  }

  getAlarmForStation(trainNumber: string, stationCode: string): StationAlarm | undefined {
    return this.alarms.find(
      (a) =>
        a.trainNumber === trainNumber &&
        a.stationCode.toUpperCase() === stationCode.toUpperCase()
    );
  }

  setAlarm(alarm: Omit<StationAlarm, 'id' | 'createdAt'>): StationAlarm {
    // Remove existing alarm for this train/station if exists
    this.alarms = this.alarms.filter(
      (a) =>
        !(
          a.trainNumber === alarm.trainNumber &&
          a.stationCode.toUpperCase() === alarm.stationCode.toUpperCase()
        )
    );

    const newAlarm: StationAlarm = {
      ...alarm,
      id: `alarm_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    this.alarms.push(newAlarm);
    this.saveAlarms();
    return newAlarm;
  }

  toggleAlarm(id: string): boolean {
    const alarm = this.alarms.find((a) => a.id === id);
    if (alarm) {
      alarm.isEnabled = !alarm.isEnabled;
      this.saveAlarms();
      return alarm.isEnabled;
    }
    return false;
  }

  deleteAlarm(id: string): void {
    this.alarms = this.alarms.filter((a) => a.id !== id);
    this.saveAlarms();
  }

  // Synthesize soft railway chime using Web Audio API
  playRailwayChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Dual-tone traditional railway chime: C5 -> E5 -> G5
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.22);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.22);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.22 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.22);
        osc.stop(ctx.currentTime + idx * 0.22 + 0.45);
      });
    } catch (e) {
      console.warn('Audio chime playback note:', e);
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }

  triggerNotification(alarm: StationAlarm): void {
    this.playRailwayChime();
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const typeText = alarm.alarmType === 'arrival' ? 'Arriving' : 'Departing';
      const leadText =
        alarm.leadMinutes > 0
          ? `in ${alarm.leadMinutes} minutes`
          : 'now';
      new Notification(`🚂 Station Alarm: ${alarm.stationName}`, {
        body: `Train ${alarm.trainNumber} (${alarm.trainName}) is ${typeText} ${alarm.stationName} (${alarm.stationCode}) ${leadText}! Scheduled: ${alarm.scheduledTime}`,
        icon: '/train-icon.svg',
      });
    }
  }
}

export const alarmService = new AlarmService();
