// Date Normalizer for Indian Railway Operations
// Normalizes user input (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD) into standard ISO (YYYY-MM-DD)
// using Indian Standard Time (Asia/Kolkata) to eliminate timezone drift.

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Returns today's date in Indian Standard Time (Asia/Kolkata) as YYYY-MM-DD.
 */
export function getTodayInKolkata(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    // Fallback if Intl timeZone is not available
    const d = new Date();
    // Offset for UTC+5:30 in ms = 5.5 * 60 * 60 * 1000 = 19800000
    const ist = new Date(d.getTime() + (d.getTimezoneOffset() * 60000) + 19800000);
    return ist.toISOString().split('T')[0];
  }
}

/**
 * Parses time string (e.g., "10:32", "10:32 AM", "23:50") to minutes past midnight.
 */
export function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr || timeStr === 'START' || timeStr === 'END' || timeStr === '--') return 0;
  const clean = timeStr.trim().toUpperCase();
  const isPm = clean.includes('PM');
  const isAm = clean.includes('AM');
  const parts = clean.replace(/[APM ]/g, '').split(':');
  let h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  if (isPm && h < 12) h += 12;
  if (isAm && h === 12) h = 0;
  return h * 60 + m;
}

/**
 * Detects whether a train journey runs overnight (arrival time earlier in clock or spans next calendar day).
 */
export function isOvernight(departureTime: string, arrivalTime: string, dayCount?: number): boolean {
  if (dayCount && dayCount > 1) return true;
  const depM = parseTimeToMinutes(departureTime);
  const arrM = parseTimeToMinutes(arrivalTime);
  return arrM < depM;
}

/**
 * Accurately calculates duration in minutes taking into account overnight journeys.
 */
export function calculateDurationMinutes(
  departureTime: string,
  arrivalTime: string,
  depDayOrDayCount?: number,
  arrDay?: number
): number {
  const depM = parseTimeToMinutes(departureTime);
  const arrM = parseTimeToMinutes(arrivalTime);
  if (arrDay !== undefined && depDayOrDayCount !== undefined) {
    const daysDiff = Math.max(0, arrDay - depDayOrDayCount);
    return daysDiff * 1440 + arrM - depM;
  }
  if (depDayOrDayCount && depDayOrDayCount > 1) {
    return (depDayOrDayCount - 1) * 1440 + arrM - depM;
  }
  if (arrM < depM) {
    // Overnight next-day arrival
    return 1440 - depM + arrM;
  }
  return arrM - depM;
}

export function normalizeDate(inputDate?: string): {
  isoDate: string;
  dayOfWeek: string;
  formattedDisplay?: string;
  isValid: boolean;
} {
  const todayIso = getTodayInKolkata();

  if (!inputDate || !inputDate.trim()) {
    const [y, m, d] = todayIso.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return {
      isoDate: todayIso,
      dayOfWeek: DAY_NAMES_SHORT[dateObj.getUTCDay()],
      formattedDisplay: `${DAY_NAMES_SHORT[dateObj.getUTCDay()]}, ${d} ${MONTH_NAMES[m - 1]} ${y}`,
      isValid: true,
    };
  }

  const clean = inputDate.trim();

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    const iso = `${year}-${month}-${day}`;
    const [y, m, d] = [parseInt(year, 10), parseInt(month, 10), parseInt(day, 10)];
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      return {
        isoDate: iso,
        dayOfWeek: DAY_NAMES_SHORT[dateObj.getUTCDay()],
        formattedDisplay: `${DAY_NAMES_SHORT[dateObj.getUTCDay()]}, ${d} ${MONTH_NAMES[m - 1]} ${y}`,
        isValid: true,
      };
    }
  }

  // Match YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = clean.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    const iso = `${year}-${month}-${day}`;
    const [y, m, d] = [parseInt(year, 10), parseInt(month, 10), parseInt(day, 10)];
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      return {
        isoDate: iso,
        dayOfWeek: DAY_NAMES_SHORT[dateObj.getUTCDay()],
        formattedDisplay: `${DAY_NAMES_SHORT[dateObj.getUTCDay()]}, ${d} ${MONTH_NAMES[m - 1]} ${y}`,
        isValid: true,
      };
    }
  }

  // Fallback: today in IST
  const [y, m, d] = todayIso.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return {
    isoDate: todayIso,
    dayOfWeek: DAY_NAMES_SHORT[dateObj.getUTCDay()],
    formattedDisplay: `${DAY_NAMES_SHORT[dateObj.getUTCDay()]}, ${d} ${MONTH_NAMES[m - 1]} ${y}`,
    isValid: false,
  };
}

export function isTrainRunningOnDate(
  train: { runningDays?: string[]; exceptionDates?: string[]; trainNumber?: string },
  dateStr: string,
  boardingDayCount: number = 1
): boolean {
  if (!train.runningDays || train.runningDays.length === 0) return true;
  const normalized = normalizeDate(dateStr);
  if (!normalized.isValid && !dateStr) return true;

  // If train reaches boarding station on day > 1, determine date when train departed origin
  let checkDateStr = normalized.isoDate;
  if (boardingDayCount > 1) {
    const [y, m, d] = normalized.isoDate.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    dateObj.setUTCDate(dateObj.getUTCDate() - (boardingDayCount - 1));
    const originNormalized = normalizeDate(dateObj.toISOString().split('T')[0]);
    checkDateStr = originNormalized.isoDate;
  }

  const originDateNormalized = normalizeDate(checkDateStr);
  const day3 = originDateNormalized.dayOfWeek.toLowerCase().slice(0, 3);
  const runsOnDay = train.runningDays.some((d) => d.toLowerCase().startsWith(day3));
  if (!runsOnDay) return false;

  // Check exception dates if present
  if (train.exceptionDates && train.exceptionDates.includes(checkDateStr)) {
    return false;
  }

  return true;
}


