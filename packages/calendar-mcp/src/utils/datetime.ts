/**
 * Validate that a string is a valid IANA timezone name
 */
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the user's local timezone
 */
export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format a date as ISO 8601 string in a specific timezone
 */
export function formatInTimezone(date: Date, timeZone: string): string {
  return date.toLocaleString('sv-SE', { timeZone }).replace(' ', 'T') + ':00';
}

/**
 * Parse an ISO date string and return a Date object
 */
export function parseISODate(dateStr: string): Date {
  return new Date(dateStr);
}

/**
 * Format a date range for display
 */
export function formatDateRange(
  start: string | undefined,
  end: string | undefined,
  timeZone?: string
): string {
  if (!start || !end) return '';

  const tz = timeZone ?? getLocalTimezone();
  const startDate = new Date(start);
  const endDate = new Date(end);

  const options: Intl.DateTimeFormatOptions = {
    timeZone: tz,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };

  return `${startDate.toLocaleString(undefined, options)} - ${endDate.toLocaleTimeString(undefined, { timeZone: tz, hour: 'numeric', minute: '2-digit' })}`;
}
