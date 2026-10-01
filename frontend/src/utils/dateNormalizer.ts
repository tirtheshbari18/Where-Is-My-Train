// Date Normalizer for Frontend
// Normalizes user input (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD) into standard ISO (YYYY-MM-DD)
// using Indian Standard Time (Asia/Kolkata) to eliminate timezone drift.

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

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
    const d = new Date();
    const ist = new Date(d.getTime() + (d.getTimezoneOffset() * 60000) + 19800000);
    return ist.toISOString().split('T')[0];
  }
}

/**
 * Parses a time string (e.g. "10:32 AM", "23:50", "08:15") to minutes from midnight.
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
 * Checks if a train journey is overnight (arrival time is next day).
 */
export function isOvernight(departureTime: string, arrivalTime: string, dayCount?: number): boolean {
  if (dayCount && dayCount > 1) return true;
  const depM = parseTimeToMinutes(departureTime);
  const arrM = parseTimeToMinutes(arrivalTime);
  return arrM < depM;
}

/**
 * Calculates duration in minutes correctly handling overnight trains.
 */
export function calculateDurationMinutes(departureTime: string, arrivalTime: string, dayCount?: number): number {
  const depM = parseTimeToMinutes(departureTime);
  const arrM = parseTimeToMinutes(arrivalTime);
  if (dayCount && dayCount > 1) {
    return (dayCount - 1) * 1440 + arrM - depM;
  }
  if (arrM < depM) {
    return 1440 - depM + arrM;
  }
  return arrM - depM;
}

export function normalizeDate(inputDate?: string): {
  isoDate: string;
  dayOfWeekShort: string;
  dayOfWeekLong: string;
  formattedDisplay: string;
  formattedDisplayLong: string;
  isValid: boolean;
} {
  const todayIso = getTodayInKolkata();

  if (!inputDate || !inputDate.trim()) {
    const [y, m, d] = todayIso.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const dIndex = dateObj.getUTCDay();
    const mIndex = m - 1;
    return {
      isoDate: todayIso,
      dayOfWeekShort: DAY_NAMES_SHORT[dIndex],
      dayOfWeekLong: DAY_NAMES_LONG[dIndex],
      formattedDisplay: `${DAY_NAMES_SHORT[dIndex]}, ${d} ${MONTH_NAMES[mIndex]} ${y}`,
      formattedDisplayLong: `${d} ${MONTH_NAMES_LONG[mIndex]} ${y}`,
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
      const dIndex = dateObj.getUTCDay();
      const mIndex = m - 1;
      return {
        isoDate: iso,
        dayOfWeekShort: DAY_NAMES_SHORT[dIndex],
        dayOfWeekLong: DAY_NAMES_LONG[dIndex],
        formattedDisplay: `${DAY_NAMES_SHORT[dIndex]}, ${d} ${MONTH_NAMES[mIndex]} ${y}`,
        formattedDisplayLong: `${d} ${MONTH_NAMES_LONG[mIndex]} ${y}`,
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
      const dIndex = dateObj.getUTCDay();
      const mIndex = m - 1;
      return {
        isoDate: iso,
        dayOfWeekShort: DAY_NAMES_SHORT[dIndex],
        dayOfWeekLong: DAY_NAMES_LONG[dIndex],
        formattedDisplay: `${DAY_NAMES_SHORT[dIndex]}, ${d} ${MONTH_NAMES[mIndex]} ${y}`,
        formattedDisplayLong: `${d} ${MONTH_NAMES_LONG[mIndex]} ${y}`,
        isValid: true,
      };
    }
  }

  // Fallback to today in IST
  const [y, m, d] = todayIso.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dIndex = dateObj.getUTCDay();
  const mIndex = m - 1;
  return {
    isoDate: todayIso,
    dayOfWeekShort: DAY_NAMES_SHORT[dIndex],
    dayOfWeekLong: DAY_NAMES_LONG[dIndex],
    formattedDisplay: `${DAY_NAMES_SHORT[dIndex]}, ${d} ${MONTH_NAMES[mIndex]} ${y}`,
    formattedDisplayLong: `${d} ${MONTH_NAMES_LONG[mIndex]} ${y}`,
    isValid: false,
  };
}
