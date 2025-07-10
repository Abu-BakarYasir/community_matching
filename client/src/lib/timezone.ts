import { format, formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';

// Eastern Time Zone
export const EASTERN_TIMEZONE = 'America/New_York';

// Format date with Eastern timezone
export function formatDateET(date: Date | string, formatStr: string = 'MMM d, yyyy h:mm a'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, EASTERN_TIMEZONE, formatStr);
}

// Format date for display (without time)
export function formatDateOnlyET(date: Date | string): string {
  return formatDateET(date, 'EEEE, MMMM d, yyyy');
}

// Format time only
export function formatTimeET(date: Date | string): string {
  return formatDateET(date, 'h:mm a');
}

// Format date and time for meetings
export function formatMeetingDateTime(date: Date | string): string {
  return formatDateET(date, 'EEEE, MMM d \'at\' h:mm a');
}

// Format short date and time
export function formatShortDateTime(date: Date | string): string {
  return formatDateET(date, 'MMM d, h:mm a');
}

// Get timezone abbreviation
export function getTimezoneAbbreviation(): string {
  const now = new Date();
  const easternTime = formatInTimeZone(now, EASTERN_TIMEZONE, 'zzz');
  return easternTime;
}

// Convert date to Eastern timezone for calendar events
export function toEasternTime(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  // Return the date object but format it properly when needed
  return dateObj;
}