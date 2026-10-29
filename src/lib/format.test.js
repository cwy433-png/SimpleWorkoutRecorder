import { describe, it, expect } from 'vitest';
import { formatDayLabel, formatMonthDay, formatClock } from './format';

describe('format helpers', () => {
  it('formatDayLabel gives MON DD · DOW', () => {
    expect(formatDayLabel(Date.parse('2026-10-27T18:42:00+08:00'))).toBe('OCT 27 · TUE');
    expect(formatDayLabel(Date.parse('2026-10-28T00:00:00+08:00'))).toBe('OCT 28 · WED');
  });

  it('formatMonthDay gives MON DD', () => {
    expect(formatMonthDay(Date.parse('2026-10-28T12:00:00+08:00'))).toBe('OCT 28');
    expect(formatMonthDay(Date.parse('2026-01-05T12:00:00+08:00'))).toBe('JAN 5');
  });

  it('formatClock is 24-hour and zero padded', () => {
    expect(formatClock(Date.parse('2026-10-27T08:05:00+08:00'))).toBe('08:05');
    expect(formatClock(Date.parse('2026-10-27T18:42:00+08:00'))).toBe('18:42');
    expect(formatClock(Date.parse('2026-10-27T00:00:00+08:00'))).toBe('00:00');
  });
});
