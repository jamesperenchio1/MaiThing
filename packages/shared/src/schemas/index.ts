import { z } from 'zod';

// ─── Profiles ────────────────────────────────────────────────────────────────

export const userRoleSchema = z.enum(['buyer', 'merchant', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const profileSchema = z.object({
  id: z.string().uuid(),
  role: userRoleSchema,
  display_name: z.string().min(1).max(100).nullable(),
  phone: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  locale: z.string().default('th'),
  home_lat: z.number().min(-90).max(90).nullable(),
  home_lng: z.number().min(-180).max(180).nullable(),
  reliability_score: z.number().min(0).max(100),
  created_at: z.string().datetime(),
});
export type Profile = z.infer<typeof profileSchema>;

// ─── Merchant Orgs ───────────────────────────────────────────────────────────

export const subscriptionTierSchema = z.enum(['free', 'pro']);
export type SubscriptionTier = z.infer<typeof subscriptionTierSchema>;

export const merchantOrgSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable(),
  logo_url: z.string().url().nullable(),
  category: z.string(),
  stripe_connect_account_id: z.string().nullable(),
  subscription_tier: subscriptionTierSchema,
  subscription_status: z.string(),
  created_at: z.string().datetime(),
});
export type MerchantOrg = z.infer<typeof merchantOrgSchema>;

export const createMerchantOrgSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.string().min(1),
});

// ─── Locations ───────────────────────────────────────────────────────────────

export const locationStatusSchema = z.enum(['pending', 'active', 'paused']);
export type LocationStatus = z.infer<typeof locationStatusSchema>;

export const hoursSchema = z.record(
  z.string(),
  z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }),
);

export const locationSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  address_text: z.string().min(1),
  cover_url: z.string().url().nullable(),
  photo_urls: z.array(z.string().url()),
  hours: hoursSchema,
  status: locationStatusSchema,
  rating_avg: z.number().min(0).max(5),
  value_rating_avg: z.number().min(0).max(5),
  rating_count: z.number().int().min(0),
});
export type Location = z.infer<typeof locationSchema>;

export const createLocationSchema = z.object({
  name: z.string().min(1).max(200),
  address_text: z.string().min(1),
  lat: z.number().min(5).max(21),
  lng: z.number().min(97).max(106),
  hours: hoursSchema.optional(),
});

// ─── Listings ────────────────────────────────────────────────────────────────

export const fulfillmentTypeSchema = z.enum(['surprise_bag', 'pick_your_own']);
export type FulfillmentType = z.infer<typeof fulfillmentTypeSchema>;

export const listingStatusSchema = z.enum(['draft', 'active', 'sold_out', 'expired', 'cancelled']);
export type ListingStatus = z.infer<typeof listingStatusSchema>;

export const listingSchema = z.object({
  id: z.string().uuid(),
  location_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  category: z.string(),
  description: z.string().max(2000).nullable(),
  fulfillment_type: fulfillmentTypeSchema,
  photo_urls: z.array(z.string().url()),
  original_value_thb: z.number().positive(),
  price_thb: z.number().positive(),
  qty_total: z.number().int().positive(),
  qty_remaining: z.number().int().min(0),
  allergens: z.array(z.string()),
  best_before_note: z.string().nullable(),
  status: listingStatusSchema,
  auto_repeat: z.boolean(),
  created_at: z.string().datetime(),
});
export type Listing = z.infer<typeof listingSchema>;

export const createListingSchema = z.object({
  location_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  category: z.string().min(1),
  description: z.string().max(2000).optional(),
  fulfillment_type: fulfillmentTypeSchema,
  original_value_thb: z.number().positive(),
  price_thb: z.number().positive(),
  qty_total: z.number().int().positive(),
  allergens: z.array(z.string()).optional(),
  best_before_note: z.string().optional(),
  auto_repeat: z.boolean().optional(),
});

// ─── Orders ──────────────────────────────────────────────────────────────────

export const orderStatusSchema = z.enum([
  'reserved',
  'paid',
  'collected',
  'cancelled',
  'refunded',
  'no_show',
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderItemSchema = z.object({
  listing_item_id: z.string().uuid(),
  qty: z.number().int().positive(),
});
export type OrderItem = z.infer<typeof orderItemSchema>;

export const reserveOrderSchema = z.object({
  listing_id: z.string().uuid(),
  slot_id: z.string().uuid(),
  items: z.array(orderItemSchema).optional(),
});

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  order_id: z.string().uuid(),
  overall_rating: z.number().int().min(1).max(5),
  value_rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// ─── Issue reports ───────────────────────────────────────────────────────────

export const issueReasonSchema = z.enum([
  'missing_items',
  'wrong_items',
  'food_quality',
  'store_closed',
  'other',
]);

export const createIssueReportSchema = z.object({
  order_id: z.string().uuid(),
  reason: issueReasonSchema,
  detail: z.string().max(1000).optional(),
});

// ─── Map / discovery ─────────────────────────────────────────────────────────

export const boundsSchema = z.object({
  min_lat: z.number().min(-90).max(90),
  min_lng: z.number().min(-180).max(180),
  max_lat: z.number().min(-90).max(90),
  max_lng: z.number().min(-180).max(180),
});
export type Bounds = z.infer<typeof boundsSchema>;

export const listingFiltersSchema = z.object({
  category: z.string().optional(),
  max_price_thb: z.number().positive().optional(),
  fulfillment_type: fulfillmentTypeSchema.optional(),
  available_now: z.boolean().optional(),
});
export type ListingFilters = z.infer<typeof listingFiltersSchema>;

// ─── Listing map pin (lightweight, for clustering) ───────────────────────────

export const listingPinSchema = z.object({
  id: z.string().uuid(),
  location_id: z.string().uuid(),
  title: z.string(),
  category: z.string(),
  fulfillment_type: fulfillmentTypeSchema,
  price_thb: z.number(),
  original_value_thb: z.number(),
  qty_remaining: z.number().int(),
  location_lat: z.number(),
  location_lng: z.number(),
  location_name: z.string(),
  rating_avg: z.number(),
  value_rating_avg: z.number(),
});
export type ListingPin = z.infer<typeof listingPinSchema>;
