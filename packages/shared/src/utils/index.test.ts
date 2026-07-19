import { describe, expect, it } from 'vitest';
import {
  discountPercent,
  formatDistance,
  formatThb,
  generatePickupCode,
  platformFee,
} from './index';

describe('formatThb', () => {
  it('formats whole baht with ฿ symbol', () => {
    expect(formatThb(100)).toBe('฿100');
  });

  it('formats decimals', () => {
    const formatted = formatThb(99.9);
    expect(formatted.startsWith('฿')).toBe(true);
    expect(formatted).toContain('99');
  });
});

describe('discountPercent', () => {
  it('returns 0 when original is 0 or negative', () => {
    expect(discountPercent(0, 100)).toBe(0);
    expect(discountPercent(-10, 5)).toBe(0);
  });

  it('returns rounded percent saved', () => {
    expect(discountPercent(250, 89)).toBe(64);
    expect(discountPercent(100, 75)).toBe(25);
  });
});

describe('platformFee', () => {
  it('calculates fee from basis points', () => {
    expect(platformFee(1000, 50)).toBe(5);
  });

  it('rounds to nearest satang', () => {
    expect(platformFee(999, 100)).toBe(10);
  });
});

describe('generatePickupCode', () => {
  it('produces a 6-character uppercase alphanumeric code', () => {
    const code = generatePickupCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('produces different codes on repeated calls', () => {
    const codes = new Set(Array.from({ length: 20 }, generatePickupCode));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe('formatDistance', () => {
  it('formats meters', () => {
    expect(formatDistance(450)).toBe('450 m');
  });

  it('formats kilometers', () => {
    expect(formatDistance(1500)).toBe('1.5 km');
  });
});
