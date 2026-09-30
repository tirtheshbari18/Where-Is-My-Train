// Date Normalizer
// Normalizes any incoming date string (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD) into standard ISO (YYYY-MM-DD).

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function normalizeDate(inputDate?: string): { isoDate: string; dayOfWeek: string; isValid: boolean } {
  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];

  if (!inputDate || !inputDate.trim()) {
    return {
      isoDate: todayIso,
      dayOfWeek: DAY_NAMES_SHORT[today.getDay()],
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
      return {
        isoDate: iso,
        dayOfWeek: DAY_NAMES_SHORT[parsed.getUTCDay()],
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
      return {
        isoDate: iso,
        dayOfWeek: DAY_NAMES_SHORT[parsed.getUTCDay()],
        isValid: true,
      };
    }
  }

  // Try standard Date parse
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const iso = parsed.toISOString().split('T')[0];
    return {
      isoDate: iso,
      dayOfWeek: DAY_NAMES_SHORT[parsed.getDay()],
      isValid: true,
    };
  }

  return {
    isoDate: todayIso,
    dayOfWeek: DAY_NAMES_SHORT[today.getDay()],
    isValid: false,
  };
}
