import { describe, expect, it } from 'vitest';
import { getAdjacentDateWithRecords } from '../lib/utils';

describe('getAdjacentDateWithRecords', () => {
  it('moves backward across month and year boundaries to the nearest recorded date', () => {
    const availableDates = ['2026-07-02', '2026-07-01', '2026-06-30', '2025-12-31'];

    expect(getAdjacentDateWithRecords('2026-07-02', 'previous', availableDates)).toBe('2026-07-01');
    expect(getAdjacentDateWithRecords('2026-07-01', 'previous', availableDates)).toBe('2026-06-30');
    expect(getAdjacentDateWithRecords('2026-06-30', 'previous', availableDates)).toBe('2025-12-31');
  });

  it('moves forward to the next recorded date when the immediate next day has no entries', () => {
    const availableDates = ['2026-06-28', '2026-06-30', '2026-07-02'];

    expect(getAdjacentDateWithRecords('2026-06-28', 'next', availableDates)).toBe('2026-06-30');
    expect(getAdjacentDateWithRecords('2026-06-30', 'next', availableDates)).toBe('2026-07-02');
  });
});
