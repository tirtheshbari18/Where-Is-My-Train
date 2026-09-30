// Date Normalizer for Frontend
// Normalizes user input (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD) into standard ISO (YYYY-MM-DD)
// and handles formatting for UI displays.

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function normalizeDate(inputDate?: string): {
  isoDate: string;
  dayOfWeekShort: string;
  dayOfWeekLong: string;
  formattedDisplay: string;
  isValid: boolean;
} {
  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];

  if (!inputDate || !inputDate.trim()) {
    const day = today.getDate();
    const month = MONTH_NAMES[today.getMonth()];
    const year = today.getFullYear();
    return {
      isoDate: todayIso,
      dayOfWeekShort: DAY_NAMES_SHORT[today.getDay()],
      dayOfWeekLong: DAY_NAMES_LONG[today.getDay()],
      formattedDisplay: `${DAY_NAMES_SHORT[today.getDay()]}, ${day} ${month} ${year}`,
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
    const parsed = new Date(`${iso}T12:00:00Z`);
    if (!isNaN(parsed.getTime())) {
      const dIndex = parsed.getUTCDay();
      const mIndex = parseInt(month, 10) - 1;
      return {
        isoDate: iso,
        dayOfWeekShort: DAY_NAMES_SHORT[dIndex],
        dayOfWeekLong: DAY_NAMES_LONG[dIndex],
        formattedDisplay: `${DAY_NAMES_SHORT[dIndex]}, ${parseInt(day, 10)} ${MONTH_NAMES[mIndex]} ${year}`,
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
    const parsed = new Date(`${iso}T12:00:00Z`);
    if (!isNaN(parsed.getTime())) {
      const dIndex = parsed.getUTCDay();
      const mIndex = parseInt(month, 10) - 1;
      return {
        isoDate: iso,
        dayOfWeekShort: DAY_NAMES_SHORT[dIndex],
        dayOfWeekLong: DAY_NAMES_LONG[dIndex],
        formattedDisplay: `${DAY_NAMES_SHORT[dIndex]}, ${parseInt(day, 10)} ${MONTH_NAMES[mIndex]} ${year}`,
        isValid: true,
      };
    }
  }

  // Try standard parse
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const iso = parsed.toISOString().split('T')[0];
    const dIndex = parsed.getDay();
    const mIndex = parsed.getMonth();
    return {
      isoDate: iso,
      dayOfWeekShort: DAY_NAMES_SHORT[dIndex],
      dayOfWeekLong: DAY_NAMES_LONG[dIndex],
      formattedDisplay: `${DAY_NAMES_SHORT[dIndex]}, ${parsed.getDate()} ${MONTH_NAMES[mIndex]} ${parsed.getFullYear()}`,
      isValid: true,
    };
  }

  const dIndex = today.getDay();
  const mIndex = today.getMonth();
  return {
    isoDate: todayIso,
    dayOfWeekShort: DAY_NAMES_SHORT[dIndex],
    dayOfWeekLong: DAY_NAMES_LONG[dIndex],
    formattedDisplay: `${DAY_NAMES_SHORT[dIndex]}, ${today.getDate()} ${MONTH_NAMES[mIndex]} ${today.getFullYear()}`,
    isValid: false,
  };
}
