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
  push_notifications_enabled: z.boolean().default(true),
  referral_code: z.string().nullable(),
  referred_by_code: z.string().nullable(),
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
  verified_at: z.string().datetime().nullable(),
  suspended_at: z.string().datetime().nullable(),
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

export const createLocationSchema = z
  .object({
    name: z.string().min(1).max(200),
    address_text: z.string().min(1),
    lat: z.number().min(5).max(21),
    lng: z.number().min(97).max(106),
    hours: hoursSchema.optional(),
  })
  .transform(({ lat, lng, ...rest }) => ({
    ...rest,
    location: `SRID=4326;POINT(${lng} ${lat})`,
  }));
export type CreateLocationInput = z.input<typeof createLocationSchema>;

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

// ─── Listing Items ────────────────────────────────────────────────────────────

export const listingItemSchema = z.object({
  id: z.string().uuid(),
  listing_id: z.string().uuid(),
  name: z.string().min(1),
  photo_url: z.string().url().nullable(),
  available_qty: z.number().int().min(0),
  reserved_qty: z.number().int().min(0),
  price_thb: z.number().positive(),
  original_price_thb: z.number().positive(),
});
export type ListingItem = z.infer<typeof listingItemSchema>;

export const createListingItemSchema = z.object({
  listing_id: z.string().uuid(),
  name: z.string().min(1),
  photo_url: z.string().url().optional(),
  available_qty: z.number().int().min(0),
  price_thb: z.number().positive(),
  original_price_thb: z.number().positive(),
});

// ─── Pickup Slots ──────────────────────────────────────────────────────────────

export const pickupSlotSchema = z.object({
  id: z.string().uuid(),
  listing_id: z.string().uuid(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  capacity: z.number().int().positive(),
  reserved_count: z.number().int().min(0),
});
export type PickupSlot = z.infer<typeof pickupSlotSchema>;

export const createPickupSlotSchema = z.object({
  listing_id: z.string().uuid(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  capacity: z.number().int().positive(),
});

// ─── Orders ───────────────────────────────────────────────────────────────────

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

export const orderItemRowSchema = z.object({
  id: z.string().uuid(),
  listing_item_id: z.string().uuid(),
  name_snapshot: z.string(),
  order_id: z.string().uuid(),
  qty: z.number().int().positive(),
  unit_price_thb: z.number().positive(),
});
export type OrderItemRow = z.infer<typeof orderItemRowSchema>;

export const orderSchema = z.object({
  id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  listing_id: z.string().uuid(),
  location_id: z.string().uuid(),
  pickup_slot_id: z.string().uuid(),
  qty: z.number().int().positive(),
  amount_thb: z.number().positive(),
  platform_fee_thb: z.number().positive(),
  status: orderStatusSchema,
  pickup_code: z.string(),
  qr_payload: z.string(),
  stripe_payment_intent_id: z.string().nullable(),
  created_at: z.string().datetime(),
  collected_at: z.string().datetime().nullable(),
  cancelled_at: z.string().datetime().nullable(),
});
export type Order = z.infer<typeof orderSchema>;

export const reserveOrderSchema = z.object({
  listing_id: z.string().uuid(),
  slot_id: z.string().uuid(),
  items: z.array(orderItemSchema).optional(),
});

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  order_id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  location_id: z.string().uuid(),
  overall_rating: z.number().int().min(1).max(5),
  value_rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  photo_urls: z.array(z.string().url()).optional(),
});

// ─── Issue Reports ───────────────────────────────────────────────────────────

export const issueReasonSchema = z.enum([
  'missing_items',
  'wrong_items',
  'food_quality',
  'store_closed',
  'other',
]);

export const issueStatusSchema = z.enum(['open', 'auto_refunded', 'resolved', 'rejected']);

export const createIssueReportSchema = z.object({
  order_id: z.string().uuid(),
  reason: issueReasonSchema,
  detail: z.string().max(1000).optional(),
  photo_urls: z.array(z.string().url()).optional(),
  status: issueStatusSchema.optional(),
});

// ─── Chat ────────────────────────────────────────────────────────────────────

export const chatThreadSchema = z.object({
  id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  location_id: z.string().uuid(),
  order_id: z.string().uuid().nullable(),
  last_message_at: z.string().datetime(),
});
export type ChatThread = z.infer<typeof chatThreadSchema>;

export const createChatThreadSchema = z.object({
  buyer_id: z.string().uuid(),
  location_id: z.string().uuid(),
  order_id: z.string().uuid().optional(),
});

export const chatMessageSchema = z.object({
  id: z.string().uuid(),
  thread_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  body: z.string().min(1),
  read_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const createChatMessageSchema = z.object({
  thread_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  body: z.string().min(1),
});

// ─── Favorites ─────────────────────────────────────────────────────────────────

export const favoriteSchema = z.object({
  buyer_id: z.string().uuid(),
  location_id: z.string().uuid(),
  created_at: z.string().datetime(),
});
export type Favorite = z.infer<typeof favoriteSchema>;

export const createFavoriteSchema = z.object({
  buyer_id: z.string().uuid(),
  location_id: z.string().uuid(),
});

// ─── Device Tokens ───────────────────────────────────────────────────────────

export const deviceTokenSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  expo_push_token: z.string().min(1),
  created_at: z.string().datetime(),
});
export type DeviceToken = z.infer<typeof deviceTokenSchema>;

export const createDeviceTokenSchema = z.object({
  profile_id: z.string().uuid(),
  expo_push_token: z.string().min(1),
});

// ─── Referrals ─────────────────────────────────────────────────────────────────

export const referralSchema = z.object({
  id: z.string().uuid(),
  referrer_id: z.string().uuid(),
  referred_id: z.string().uuid().nullable(),
  code: z.string().min(1),
  reward_status: z.string(),
  created_at: z.string().datetime(),
});
export type Referral = z.infer<typeof referralSchema>;

export const createReferralSchema = z.object({
  referrer_id: z.string().uuid(),
  code: z.string().min(1),
});

// ─── Subscriptions ───────────────────────────────────────────────────────────

export const subscriptionSchema = z.object({
  id: z.string().uuid(),
  subscriber_id: z.string().uuid(),
  subscriber_type: z.string(),
  stripe_subscription_id: z.string().nullable(),
  tier: subscriptionTierSchema,
  status: z.string(),
  current_period_end: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});
export type Subscription = z.infer<typeof subscriptionSchema>;

export const createSubscriptionSchema = z.object({
  subscriber_id: z.string().uuid(),
  subscriber_type: z.string().min(1),
  stripe_subscription_id: z.string().optional(),
  tier: subscriptionTierSchema,
  status: z.string().optional(),
  current_period_end: z.string().datetime().optional(),
});

// ─── Demand Signals ──────────────────────────────────────────────────────────

export const demandSignalSchema = z.object({
  id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  geohash: z.string().min(1),
  category: z.string().nullable(),
  created_at: z.string().datetime(),
});
export type DemandSignal = z.infer<typeof demandSignalSchema>;

export const createDemandSignalSchema = z.object({
  buyer_id: z.string().uuid(),
  geohash: z.string().min(1),
  category: z.string().optional(),
});

// ─── Map / discovery ───────────────────────────────────────────────────────────

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
