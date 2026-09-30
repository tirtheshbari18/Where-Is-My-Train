// frontend/src/services/ticketService.ts
export interface SavedTicket {
  id: string;
  ticketNumber: string;
  pnrNumber?: string;
  trainNumber: string;
  trainName: string;
  sourceCode: string;
  sourceName: string;
  destinationCode: string;
  destinationName: string;
  journeyDate: string;
  /** Optional: only present when the source actually supplied a time */
  departureTime?: string;
  arrivalTime?: string;
  passengerCount: number;
  passengers: Array<{
    name: string;
    age?: number;
    gender?: 'M' | 'F';
    coach?: string;
    berth?: string;
    status: string;
  }>;
  /** Optional: only present when the source actually supplied a fare */
  fare?: number;
  classType: string;
  status: 'CONFIRMED' | 'RAC' | 'WAITLISTED';
  bookedAt: string;
  /** true for the bundled sample tickets so they are never mistaken for real bookings */
  isDemo?: boolean;
}

const STORAGE_KEY = 'wimt_saved_tickets';

const DEFAULT_TICKETS: SavedTicket[] = [
  {
    id: 'tkt_001',
    ticketNumber: 'IR-7892140',
    pnrNumber: '8429104821',
    trainNumber: '19417',
    trainName: 'Borivali - Vatva Express',
    sourceCode: 'BVI',
    sourceName: 'Borivali',
    destinationCode: 'VTA',
    destinationName: 'Vatva',
    journeyDate: 'Tomorrow, 01:25 PM',
    departureTime: '01:25 PM',
    arrivalTime: '02:45 AM',
    passengerCount: 2,
    passengers: [
      { name: 'Tirthesh Sharma', age: 28, gender: 'M', coach: 'S3', berth: '42 (MB)', status: 'CNF' },
      { name: 'Pooja Sharma', age: 26, gender: 'F', coach: 'S3', berth: '43 (UB)', status: 'CNF' },
    ],
    fare: 540,
    classType: 'Sleeper (SL)',
    status: 'CONFIRMED',
    isDemo: true,
    bookedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'tkt_002',
    ticketNumber: 'IR-3920194',
    pnrNumber: '4528193021',
    trainNumber: '93011',
    trainName: 'Churchgate - Dahanu Road Fast Local',
    sourceCode: 'BOR',
    sourceName: 'Boisar',
    destinationCode: 'DRD',
    destinationName: 'Dahanu Road',
    journeyDate: 'Today, 09:44 AM',
    departureTime: '09:44 AM',
    arrivalTime: '10:15 AM',
    passengerCount: 1,
    passengers: [
      { name: 'Self', age: 25, gender: 'M', coach: 'GEN', berth: 'Unreserved', status: 'CNF' },
    ],
    fare: 10,
    classType: 'Second Class (II)',
    status: 'CONFIRMED',
    isDemo: true,
    bookedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'tkt_003',
    ticketNumber: 'IR-9182301',
    pnrNumber: '2819405829',
    trainNumber: '12922',
    trainName: 'Flying Ranee Superfast',
    sourceCode: 'ST',
    sourceName: 'Surat',
    destinationCode: 'MMCT',
    destinationName: 'Mumbai Central',
    journeyDate: '28 Sep 2026, 05:10 AM',
    departureTime: '05:10 AM',
    arrivalTime: '10:10 AM',
    passengerCount: 1,
    passengers: [
      { name: 'R. K. Patel', age: 45, gender: 'M', coach: 'C1', berth: '18 (WS)', status: 'CNF' },
    ],
    fare: 285,
    classType: 'AC Chair Car (CC)',
    status: 'CONFIRMED',
    isDemo: true,
    bookedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export const ticketService = {
  getTickets(): SavedTicket[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TICKETS));
        return DEFAULT_TICKETS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_TICKETS;
    }
  },

  saveTicket(ticket: Omit<SavedTicket, 'id' | 'bookedAt'>): SavedTicket {
    const list = this.getTickets();
    const newTicket: SavedTicket = {
      ...ticket,
      id: 'tkt_' + Math.random().toString(36).substring(2, 9),
      bookedAt: new Date().toISOString(),
    };
    const updated = [newTicket, ...list];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save ticket to localStorage', e);
    }
    return newTicket;
  },

  deleteTicket(id: string): void {
    const list = this.getTickets();
    const updated = list.filter((t) => t.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete ticket', e);
    }
  },

  clearAllTickets(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear tickets', e);
    }
  },
};
