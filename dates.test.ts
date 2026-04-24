import { getWeekStart, shiftWeek, formatWeekKey } from './src/utils/dates';

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
});