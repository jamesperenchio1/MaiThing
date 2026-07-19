import { describe, expect, it } from 'vitest';
import {
  boundsSchema,
  createLocationSchema,
  createReviewSchema,
  discountPercent,
  formatThb,
  platformFee,
  reserveOrderSchema,
} from '../index';

describe('reserveOrderSchema', () => {
  it('validates a surprise bag reservation', () => {
    const result = reserveOrderSchema.safeParse({
      listing_id: 'cccccccc-0001-0001-0001-000000000001',
      slot_id: 'bbbbbbbb-0001-0001-0001-000000000001',
      qty: 1,
    });
    expect(result.success).toBe(true);
  });

  it('validates a pick-your-own reservation', () => {
    const result = reserveOrderSchema.safeParse({
      listing_id: 'cccccccc-0001-0001-0001-000000000001',
      slot_id: 'bbbbbbbb-0001-0001-0001-000000000001',
      items: [{ listing_item_id: 'dddddddd-0001-0001-0001-000000000001', qty: 2 }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid item qty', () => {
    const result = reserveOrderSchema.safeParse({
      listing_id: 'cccccccc-0001-0001-0001-000000000001',
      slot_id: 'bbbbbbbb-0001-0001-0001-000000000001',
      items: [{ listing_item_id: 'dddddddd-0001-0001-0001-000000000001', qty: -1 }],
    });
    expect(result.success).toBe(false);
  });
});

describe('createLocationSchema', () => {
  it('transforms lat/lng into PostGIS WKT', () => {
    const parsed = createLocationSchema.parse({
      name: 'Test Location',
      address_text: '123 Test St',
      lat: 13.7367,
      lng: 100.5231,
    });
    expect(parsed.location).toBe('SRID=4326;POINT(100.5231 13.7367)');
  });

  it('rejects out-of-bounds coordinates', () => {
    const result = createLocationSchema.safeParse({
      name: 'Test Location',
      address_text: '123 Test St',
      lat: 50,
      lng: 100,
    });
    expect(result.success).toBe(false);
  });
});

describe('createReviewSchema', () => {
  it('requires dual ratings and ownership fields', () => {
    const result = createReviewSchema.safeParse({
      order_id: 'aaaaaaaa-0001-0001-0001-000000000001',
      buyer_id: '00000000-0000-0000-0000-000000000001',
      location_id: 'bbbbbbbb-0001-0001-0001-000000000001',
      overall_rating: 5,
      value_rating: 4,
      comment: 'Great bag!',
    });
    expect(result.success).toBe(true);
  });
});

describe('boundsSchema', () => {
  it('validates map bounds', () => {
    const result = boundsSchema.safeParse({
      min_lat: 13.7,
      max_lat: 13.8,
      min_lng: 100.5,
      max_lng: 100.6,
    });
    expect(result.success).toBe(true);
  });
});

describe('cross-package imports', () => {
  it('re-exports utils and schemas from the shared package', () => {
    expect(formatThb(100)).toBe('฿100');
    expect(discountPercent(250, 89)).toBe(64);
    expect(platformFee(1000, 50)).toBe(5);
  });
});
