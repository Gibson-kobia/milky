import { describe, expect, it } from 'vitest';
import { getDateOffsetString } from '../lib/utils';

describe('getDateOffsetString', () => {
  it('moves one calendar day backward and forward', () => {
    expect(getDateOffsetString('2026-07-02', -1)).toBe('2026-07-01');
    expect(getDateOffsetString('2026-07-01', -1)).toBe('2026-06-30');
    expect(getDateOffsetString('2026-06-30', -1)).toBe('2026-06-29');

    expect(getDateOffsetString('2026-06-28', 1)).toBe('2026-06-29');
    expect(getDateOffsetString('2026-06-30', 1)).toBe('2026-07-01');
  });
});
