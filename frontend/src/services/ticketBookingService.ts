// Ticket Booking Service & Deep-link Abstraction for WHERE IS MY TRAIN
// Supports external booking integrations (Confirmtkt, IRCTC) per Requirements 20 & 21.

export interface BookingQuotaOption {
  code: string;
  name: string;
  description: string;
}

export const SUPPORTED_QUOTAS: BookingQuotaOption[] = [
  { code: 'GN', name: 'General Quota', description: 'Standard reservation quota for all travellers' },
  { code: 'TQ', name: 'Tatkal Quota', description: 'Urgent booking opening 1 day prior to departure' },
  { code: 'PT', name: 'Premium Tatkal', description: 'Dynamic pricing tatkal tickets' },
  { code: 'LD', name: 'Ladies Quota', description: 'Reserved berths for solo female passengers' },
  { code: 'SS', name: 'Senior Citizen', description: 'Lower berths reserved for senior citizens' },
];

export class TicketBookingService {
  /**
   * Generates a safe deep link to Confirmtkt / IRCTC booking platform.
   */
  getBookingUrl(
    fromStationCode: string,
    toStationCode: string,
    journeyDateIso: string,
    quota: string = 'GN'
  ): string {
    const formattedDate = journeyDateIso.replace(/-/g, '');
    const cleanFrom = encodeURIComponent(fromStationCode.trim().toUpperCase());
    const cleanTo = encodeURIComponent(toStationCode.trim().toUpperCase());
    const cleanQuota = encodeURIComponent(quota.trim().toUpperCase());

    return `https://www.confirmtkt.com/rbooking/?source=${cleanFrom}&destination=${cleanTo}&date=${formattedDate}&quota=${cleanQuota}`;
  }

  /**
   * Generates deep link to view existing bookings on Confirmtkt.
   */
  getMyBookingsUrl(): string {
    return 'https://www.confirmtkt.com/rbooking/my-trips';
  }

  /**
   * Safely opens the external booking link in a secure new tab.
   */
  openBooking(
    fromStationCode: string,
    toStationCode: string,
    journeyDateIso: string,
    quota: string = 'GN'
  ): void {
    const url = this.getBookingUrl(fromStationCode, toStationCode, journeyDateIso, quota);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Safely opens the user's booking trips page.
   */
  openMyBookings(): void {
    const url = this.getMyBookingsUrl();
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}

export const ticketBookingService = new TicketBookingService();
