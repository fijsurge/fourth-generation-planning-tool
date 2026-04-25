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

// Timestamp comparison avoids ISO string bugs with mixed UTC/offset formats.
export function areIntervalsOverlapping(start1: string | Date, end1: string | Date, start2: string | Date, end2: string | Date): boolean {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  
  return s1 < e2 && s2 < e1;
}
