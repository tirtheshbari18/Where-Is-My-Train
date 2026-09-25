/**
 * Indian Railway Time Formatting Utility
 * Standardizes all time representations to 12-hour AM/PM format (e.g., '01:22 AM', '02:14 PM')
 */

export function formatTimeWithAmPm(timeStr?: string | null): string {
  if (!timeStr) return '--:--';
  const clean = timeStr.trim();
  if (clean === '--' || clean === '--:--' || clean === 'START' || clean === 'END') {
    return clean;
  }

  // If already contains AM or PM
  if (/am|pm/i.test(clean)) {
    return clean.toUpperCase();
  }

  // Parse HH:mm or HH:mm:ss
  const parts = clean.split(':');
  if (parts.length < 2) return clean;

  const hoursRaw = parseInt(parts[0], 10);
  const minutesRaw = parseInt(parts[1], 10);

  if (isNaN(hoursRaw) || isNaN(minutesRaw)) return clean;

  const ampm = hoursRaw >= 12 ? 'PM' : 'AM';
  const hours = hoursRaw % 12 || 12; // 0 becomes 12
  const formattedMinutes = minutesRaw < 10 ? `0${minutesRaw}` : `${minutesRaw}`;

  return `${hours}:${formattedMinutes} ${ampm}`;
}

/**
 * Calculates arrival/departure time after adding delay minutes, returning formatted AM/PM time
 */
export function getDelayedTimeWithAmPm(timeStr: string | undefined | null, delayMinutes: number = 0): string {
  if (!timeStr || timeStr === '--' || timeStr === '--:--' || timeStr === 'START' || timeStr === 'END') {
    return '--:--';
  }

  // Remove existing AM/PM if any to calculate numeric time
  let clean = timeStr.trim();
  let isPm = false;
  let isAm = false;

  if (/pm/i.test(clean)) {
    isPm = true;
    clean = clean.replace(/pm/i, '').trim();
  } else if (/am/i.test(clean)) {
    isAm = true;
    clean = clean.replace(/am/i, '').trim();
  }

  const parts = clean.split(':');
  if (parts.length < 2) return formatTimeWithAmPm(timeStr);

  let hours = parseInt(parts[0], 10);
  let minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return formatTimeWithAmPm(timeStr);

  if (isPm && hours < 12) hours += 12;
  if (isAm && hours === 12) hours = 0;

  const totalMinutes = (hours * 60 + minutes + delayMinutes) % (24 * 60);
  const adjustedTotal = totalMinutes < 0 ? totalMinutes + 24 * 60 : totalMinutes;
  const newHours = Math.floor(adjustedTotal / 60);
  const newMinutes = adjustedTotal % 60;
  const paddedMinutes = newMinutes < 10 ? `0${newMinutes}` : `${newMinutes}`;

  return formatTimeWithAmPm(`${newHours}:${paddedMinutes}`);
}
