import { startOfWeek, endOfWeek, addWeeks, format } from "date-fns";

/**
 * Get the Monday at the start of the week containing the given date.
 */
export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/**
 * Get the Sunday at the end of the week containing the given date.
 */
export function getWeekEnd(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 1 });
}

/**
 * Move forward or backward by a number of weeks from a given date.
 */
export function shiftWeek(date: Date, weeks: number): Date {
  return addWeeks(date, weeks);
}

/**
 * Format a week start date as an ISO date string (YYYY-MM-DD) for storage.
 */
export function formatWeekKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Format a date range for display, e.g. "Feb 10 - Feb 16, 2026"
 */
export function formatWeekRange(weekStart: Date): string {
  const weekEndDate = getWeekEnd(weekStart);
  const startStr = format(weekStart, "MMM d");
  const endStr = format(weekEndDate, "MMM d, yyyy");
  return `${startStr} - ${endStr}`;
}
