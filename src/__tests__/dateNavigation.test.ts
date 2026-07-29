import { describe, expect, it } from 'vitest';
import { getDateOffsetString, normalizeDateString } from '../lib/utils';

describe('getDateOffsetString', () => {
  it('moves one calendar day backward and forward', () => {
    expect(getDateOffsetString('2026-07-02', -1)).toBe('2026-07-01');
    expect(getDateOffsetString('2026-07-01', -1)).toBe('2026-06-30');
    expect(getDateOffsetString('2026-06-30', -1)).toBe('2026-06-29');

    expect(getDateOffsetString('2026-06-28', 1)).toBe('2026-06-29');
    expect(getDateOffsetString('2026-06-30', 1)).toBe('2026-07-01');
  });
});

describe('normalizeDateString', () => {
  it('normalizes date-like values to yyyy-mm-dd', () => {
    expect(normalizeDateString('2026-07-27')).toBe('2026-07-27');
    expect(normalizeDateString('2026-07-27T10:00:00.000Z')).toBe('2026-07-27');
    expect(normalizeDateString(new Date('2026-07-27T10:00:00.000Z'))).toBe('2026-07-27');
  });
});
