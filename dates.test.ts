/**
 * @jest-environment node
 */
import { getWeekStart, shiftWeek, formatWeekKey, areIntervalsOverlapping } from './src/utils/dates';

describe('Date Utilities', () => {
  it('should return Monday as the start of the week', () => {
    // Feb 19, 2026 is a Thursday
    const date = new Date('2026-02-19T12:00:00Z');
    const start = getWeekStart(date);

    expect(start.getDay()).toBe(1); // 1 = Monday
    expect(formatWeekKey(start)).toBe('2026-02-16');
  });

  it('should shift weeks forward correctly', () => {
    const start = new Date('2026-02-16T12:00:00Z');
    const nextWeek = shiftWeek(start, 1);
    expect(formatWeekKey(nextWeek)).toBe('2026-02-23');
  });

  it('should shift weeks backward correctly', () => {
    const start = new Date('2026-02-16T12:00:00Z');
    const prevWeek = shiftWeek(start, -1);
    expect(formatWeekKey(prevWeek)).toBe('2026-02-09');
  });

  it('should correctly detect overlaps regardless of ISO string format (UTC vs Offset)', () => {
    // event1: 10:00–11:00 UTC
    const event1 = { start: '2026-02-19T10:00:00Z', end: '2026-02-19T11:00:00Z' };
    // event2: 13:30+02:00 = 11:30 UTC — no overlap with event1
    const event2 = { start: '2026-02-19T13:30:00+02:00', end: '2026-02-19T14:30:00+02:00' };
    // event3: 10:30–11:30 UTC — overlaps with event1
    const event3 = { start: '2026-02-19T10:30:00Z', end: '2026-02-19T11:30:00Z' };

    expect(areIntervalsOverlapping(event1.start, event1.end, event2.start, event2.end)).toBe(false);
    expect(areIntervalsOverlapping(event1.start, event1.end, event3.start, event3.end)).toBe(true);
  });
});
