import { describe, it, expect } from 'vitest';
import { validateMilkQuantity } from '@/lib/utils';

describe('validateMilkQuantity', () => {
  it('accepts valid quarter increments', () => {
    expect(validateMilkQuantity(4)).toBe(true);
    expect(validateMilkQuantity(4.25)).toBe(true);
    expect(validateMilkQuantity(4.5)).toBe(true);
    expect(validateMilkQuantity(4.75)).toBe(true);
  });

  it('rejects invalid fractional values', () => {
    expect(validateMilkQuantity(4.1)).toBe(false);
    expect(validateMilkQuantity(4.2)).toBe(false);
    expect(validateMilkQuantity(4.3)).toBe(false);
    expect(validateMilkQuantity(4.8)).toBe(false);
  });
});
