import {
  formatCurrency,
  formatDistance,
  formatCompactNumber,
  getListingUrgency,
} from '@/src/lib/utils';

// Intl's THB currency glyph (the "฿" symbol vs. the "THB" code) and the whitespace
// between it and the number vary with the ICU data bundled by the JS engine running
// the tests, so collapse all whitespace before asserting on the formatted string.
const normalizeCurrency = (value: string) => value.replace(/\s+/g, ' ');

describe('formatCurrency', () => {
  it('formats a whole-number amount with the default THB currency', () => {
    expect(normalizeCurrency(formatCurrency(120))).toMatch(/^(THB ?|฿)120$/);
  });

  it('formats zero', () => {
    expect(normalizeCurrency(formatCurrency(0))).toMatch(/^(THB ?|฿)0$/);
  });

  it('rounds to zero decimal places', () => {
    expect(normalizeCurrency(formatCurrency(99.5))).toMatch(/^(THB ?|฿)100$/);
  });

  it('formats large amounts with thousands separators', () => {
    expect(normalizeCurrency(formatCurrency(125000))).toMatch(/^(THB ?|฿)125,000$/);
  });

  it('supports a different currency code', () => {
    expect(formatCurrency(50, 'USD', 'en-US')).toBe('$50');
  });

  it('formats negative amounts', () => {
    expect(normalizeCurrency(formatCurrency(-20))).toMatch(/^-(THB ?|฿)20$/);
  });
});

describe('formatDistance', () => {
  it('formats distances under 1000m in meters, rounded', () => {
    expect(formatDistance(250)).toBe('250m');
    expect(formatDistance(499.6)).toBe('500m');
  });

  it('formats exactly 0m', () => {
    expect(formatDistance(0)).toBe('0m');
  });

  it('formats distances at the 1000m boundary in kilometers', () => {
    expect(formatDistance(1000)).toBe('1.0km');
  });

  it('formats distances over 1000m in kilometers with one decimal', () => {
    expect(formatDistance(1500)).toBe('1.5km');
    expect(formatDistance(12345)).toBe('12.3km');
  });

  it('rounds meters just under the km boundary to the nearest whole meter', () => {
    expect(formatDistance(999.4)).toBe('999m');
  });
});

describe('formatCompactNumber', () => {
  it('leaves small numbers unformatted', () => {
    expect(formatCompactNumber(5)).toBe('5');
    expect(formatCompactNumber(0)).toBe('0');
  });

  it('compacts thousands with a K suffix', () => {
    expect(formatCompactNumber(1500)).toBe('1.5K');
  });

  it('compacts millions with an M suffix', () => {
    expect(formatCompactNumber(2500000)).toBe('2.5M');
  });

  it('does not add unnecessary trailing zeros', () => {
    expect(formatCompactNumber(2000)).toBe('2K');
  });
});

describe('getListingUrgency', () => {
  const inMinutes = (mins: number) => new Date(Date.now() + mins * 60000).toISOString();

  it('returns null when there is no remaining quantity', () => {
    const result = getListingUrgency({
      quantityRemaining: 0,
      pickupWindowEnd: inMinutes(120),
    });
    expect(result).toBeNull();
  });

  it('returns critical urgency when 2 or fewer items remain', () => {
    const result = getListingUrgency({
      quantityRemaining: 2,
      pickupWindowEnd: inMinutes(120),
    });
    expect(result).toEqual({
      level: 'critical',
      label: 'Only 2 left',
      color: 'danger',
    });
  });

  it('returns critical urgency when the pickup window ends within 30 minutes', () => {
    const result = getListingUrgency({
      quantityRemaining: 20,
      pickupWindowEnd: inMinutes(15),
    });
    expect(result?.level).toBe('critical');
    expect(result?.label).toBe('Ends in 30 min');
  });

  it('returns high urgency when 5 or fewer items remain', () => {
    const result = getListingUrgency({
      quantityRemaining: 5,
      pickupWindowEnd: inMinutes(120),
    });
    expect(result).toEqual({
      level: 'high',
      label: 'Only 5 left',
      color: 'warning',
    });
  });

  it('returns medium urgency when the pickup window ends within 4 hours', () => {
    const result = getListingUrgency({
      quantityRemaining: 20,
      pickupWindowEnd: inMinutes(200),
    });
    expect(result).toEqual({
      level: 'medium',
      label: 'Selling fast',
      color: 'warning',
    });
  });

  it('returns null when plenty of stock and time remain', () => {
    const result = getListingUrgency({
      quantityRemaining: 50,
      pickupWindowEnd: inMinutes(600),
    });
    expect(result).toBeNull();
  });

  it('returns localized Thai labels when locale is "th"', () => {
    const result = getListingUrgency(
      {
        quantityRemaining: 1,
        pickupWindowEnd: inMinutes(120),
      },
      'th'
    );
    expect(result?.label).toBe('เหลือ 1');
  });
});
