// PNR Service for Indian Railway Passenger Name Record lookup

import { PnrStatus, railwayApi } from '../api/railwayApi.js';

const FALLBACK_PNR_RECORDS: Record<string, PnrStatus> = {
  '2451234567': {
    pnr: '2451234567',
    trainNumber: '19417',
    trainName: 'Borivali - Vatva Express',
    dateOfJourney: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    fromStation: 'Borivali (BVI)',
    toStation: 'Vatva (VTA)',
    boardingPoint: 'Borivali (BVI)',
    reservationClass: 'SL',
    chartStatus: 'CHART NOT PREPARED',
    passengers: [
      {
        passengerNumber: 1,
        bookingStatus: 'CNF / S2 / 45',
        currentStatus: 'CNF',
        coach: 'S2',
        berth: 45,
        berthType: 'Lower Berth (LB)',
      },
      {
        passengerNumber: 2,
        bookingStatus: 'CNF / S2 / 46',
        currentStatus: 'CNF',
        coach: 'S2',
        berth: 46,
        berthType: 'Middle Berth (MB)',
      },
    ],
    isAuthorizedProvider: false,
    notice: 'DEMO / SIMULATION DATA FOR DEVELOPMENT & TESTING. To verify real PNR status, visit official Indian Railways portal (indianrail.gov.in) or dial 139.',
  },
  '4829104821': {
    pnr: '4829104821',
    trainNumber: '22956',
    trainName: 'Kutch SF Express',
    dateOfJourney: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    fromStation: 'Bhuj (BHUJ)',
    toStation: 'Bandra Terminus (BDTS)',
    boardingPoint: 'Bhuj (BHUJ)',
    reservationClass: '3A',
    chartStatus: 'CHART NOT PREPARED',
    passengers: [
      {
        passengerNumber: 1,
        bookingStatus: 'RAC 4',
        currentStatus: 'CNF / B3 / 21',
        coach: 'B3',
        berth: 21,
        berthType: 'Side Lower (SL)',
      },
    ],
    isAuthorizedProvider: false,
    notice: 'DEMO / SIMULATION DATA FOR DEVELOPMENT & TESTING. To verify real PNR status, visit official Indian Railways portal (indianrail.gov.in) or dial 139.',
  },
  '9876543210': {
    pnr: '9876543210',
    trainNumber: '20901',
    trainName: 'Mumbai Central - Gandhinagar Capital Vande Bharat Express',
    dateOfJourney: new Date().toISOString().split('T')[0],
    fromStation: 'Mumbai Central (MMCT)',
    toStation: 'Gandhinagar Capital (GNC)',
    boardingPoint: 'Mumbai Central (MMCT)',
    reservationClass: 'CC',
    chartStatus: 'CHART PREPARED',
    passengers: [
      {
        passengerNumber: 1,
        bookingStatus: 'CNF / C4 / 12',
        currentStatus: 'CNF',
        coach: 'C4',
        berth: 12,
        berthType: 'Window (W)',
      },
    ],
    isAuthorizedProvider: false,
    notice: 'DEMO / SIMULATION DATA FOR DEVELOPMENT & TESTING. To verify real PNR status, visit official Indian Railways portal (indianrail.gov.in) or dial 139.',
  },
};

export const pnrService = {
  async getStatus(pnr: string): Promise<PnrStatus> {
    const cleaned = pnr.trim();
    if (!/^\d{10}$/.test(cleaned)) {
      throw new Error('PNR must be a valid 10-digit number.');
    }

    try {
      const res = await railwayApi.getPnrStatus(cleaned);
      if (res && res.data) return res.data;
    } catch {
      // Fallback
    }

    if (FALLBACK_PNR_RECORDS[cleaned]) {
      return FALLBACK_PNR_RECORDS[cleaned];
    }

    // Dynamic clean fallback
    return {
      pnr: cleaned,
      trainNumber: '19417',
      trainName: 'Borivali - Vatva Express',
      dateOfJourney: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      fromStation: 'Borivali (BVI)',
      toStation: 'Vatva (VTA)',
      boardingPoint: 'Borivali (BVI)',
      reservationClass: 'Sleeper (SL)',
      chartStatus: 'CHART NOT PREPARED',
      passengers: [
        {
          passengerNumber: 1,
          bookingStatus: 'CNF / S3 / 34',
          currentStatus: 'CNF / S3 / 34 (Lower Berth)',
          coach: 'S3',
          berth: 34,
          berthType: 'Lower Berth (LB)',
        },
      ],
      isAuthorizedProvider: false,
      notice: 'DEMO / SIMULATION DATA FOR DEVELOPMENT & TESTING. To verify real PNR status, visit official Indian Railways portal (indianrail.gov.in) or dial 139.',
    };
  },
};
