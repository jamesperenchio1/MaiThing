/**
 * Supabase repository implementation.
 * Activated by setting EXPO_PUBLIC_REPOSITORY_MODE=supabase.
 * Maps between the Supabase schema (locations, listings, orders, etc.)
 * and the app's domain types (Merchant, Listing, Order, etc.).
 *
 * Expected tables (create these in your Supabase project):
 *   profiles, locations, merchant_orgs, listings, orders, reviews,
 *   wallets, wallet_transactions, wallet_rewards, notifications,
 *   user_impact, merchant_wallets, payout_transactions, merchant_bank_accounts,
 *   coupons, merchant_messages, merchant_staff, merchant_business_hours,
 *   merchant_notification_preferences, merchant_onboarding, merchant_broadcasts,
 *   merchant_follows, merchant_follower_history, user_favorites, user_saved_listings,
 *   saved_addresses, restock_alerts, followed_merchant_notifications, listing_templates
 */
import { supabase } from '@/src/lib/supabase';
import { generatePickupCode, calculateDistance } from '@/src/lib/utils';
import { Platform } from 'react-native';
import type {
  AnalyticsRepository,
  AuthRepository,
  CouponRepository,
  ListingRepository,
  MerchantRepository,
  MessageRepository,
  NotificationRepository,
  OrderRepository,
  PayoutRepository,
  Repositories,
  UserRepository,
  WalletRepository,
} from './interfaces';
import type {
  BankAccount,
  BroadcastMessage,
  BusinessHours,
  Category,
  Coupon,
  CouponValidationResult,
  CustomerImpact,
  CustomerProfile,
  Listing,
  ListingTemplate,
  ListingType,
  Merchant,
  MerchantAnalytics,
  MerchantMessage,
  MerchantNotificationPreferences,
  MerchantOnboarding,
  MerchantWallet,
  MysteryBoxListing,
  OnboardingStep,
  Notification,
  NotificationPreferences,
  Order,
  OrderItem,
  PayoutTransaction,
  Review,
  StaffMember,
  User,
  UserRole,
  Wallet,
  WalletReward,
  WalletTransaction,
  UserPersonality,
  MerchantPersonality,
} from '@/src/types';

// ─── helpers ────────────────────────────────────────────────────────────────

function notNull<T>(v: T | null | undefined, label: string): T {
  if (v == null) throw new Error(`${label} not found`);
  return v;
}

function stub<T>(name: string): T {
  throw new Error(`Supabase: ${name} not yet implemented`);
}

// Bangkok lat/lng used as fallback when PostGIS data isn't parseable client-side.
const BANGKOK_CENTER = { latitude: 13.7563, longitude: 100.5018 };

function coordsFromIndex(index: number) {
  return {
    latitude: BANGKOK_CENTER.latitude + (index % 5) * 0.01,
    longitude: BANGKOK_CENTER.longitude + Math.floor(index / 5) * 0.01,
  };
}

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ─── type mappers ────────────────────────────────────────────────────────────

function mapProfile(row: Record<string, unknown>): User {
  const role = row.role === 'merchant' ? 'merchant' : 'customer';
  return {
    id: row.id as string,
    email: (row.email as string) ?? '',
    phone: row.phone as string | undefined,
    name: (row.display_name as string) ?? '',
    avatarUrl: row.avatar_url as string | undefined,
    roles: [role] as UserRole[],
    preferredLanguage: ((row.locale as string) ?? 'en') === 'th' ? 'th' : 'en',
    createdAt: row.created_at as string,
  };
}

function mapLocation(
  row: Record<string, unknown>,
  index = 0,
  userCoords?: { latitude: number; longitude: number }
): Merchant {
  const org = (row.merchant_orgs as Record<string, unknown> | null) ?? {};

  // Parse coordinates from geo_point (GeoJSON) or coordinates JSONB, fallback to seeded coords
  let coordinates = coordsFromIndex(index);
  if (row.geo_point) {
    const gp = row.geo_point as Record<string, unknown>;
    if (gp.type === 'Point' && Array.isArray(gp.coordinates)) {
      const [lng, lat] = gp.coordinates as number[];
      coordinates = { latitude: lat, longitude: lng };
    }
  } else if (row.coordinates) {
    const coords = row.coordinates as Record<string, unknown>;
    if (typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
      coordinates = { latitude: coords.latitude, longitude: coords.longitude };
    }
  }

  // Distance: prefer PostGIS distance_meters from RPC, else compute client-side
  let distance: number | undefined;
  if (typeof row.distance_meters === 'number') {
    distance = row.distance_meters;
  } else if (userCoords) {
    distance = calculateDistance(userCoords, coordinates);
  }

  return {
    id: row.id as string,
    ownerId: (org.owner_id as string) ?? '',
    name: (row.name as string) ?? '',
    slug: ((row.name as string) ?? '').toLowerCase().replace(/\s+/g, '-'),
    description: (row.description as string) ?? '',
    logoUrl: (org.logo_url as string) ?? undefined,
    coverUrl: (row.cover_photo_url as string) ?? undefined,
    address: {
      street: (row.address_line1 as string) ?? '',
      subDistrict: (row.subdistrict as string) ?? '',
      district: (row.district as string) ?? '',
      province: (row.province as string) ?? 'Bangkok',
      postalCode: (row.postal_code as string) ?? '',
      country: 'Thailand',
    },
    coordinates,
    distance,
    phone: (row.phone as string) ?? '',
    categories: Array.isArray(row.cuisine_types) ? (row.cuisine_types as string[]) : [],
    rating: typeof row.avg_rating === 'number' ? row.avg_rating : 4.5,
    reviewCount: typeof row.total_reviews === 'number' ? row.total_reviews : 0,
    businessHours: (row.business_hours as BusinessHours[]) ?? [],
    isOpen: row.closed_until == null || new Date(row.closed_until as string) < new Date(),
    closedUntil: (row.closed_until as string) ?? undefined,
    pickupInstructions: (row.pickup_instructions as string) ?? undefined,
    followers: typeof row.follower_count === 'number' ? row.follower_count : 0,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    joinedAt: (row.created_at as string) ?? undefined,
    isVerified: row.is_verified === true,
    verificationStatus: (row.verification_status as Merchant['verificationStatus']) ?? 'unverified',
    completedOrders: typeof row.completed_orders === 'number' ? row.completed_orders : 0,
    refundDisputes: typeof row.refund_disputes === 'number' ? row.refund_disputes : 0,
    foodSafetyCertUrl: (row.food_safety_cert_url as string) ?? undefined,
    hygieneRating: typeof row.hygiene_rating === 'number' ? row.hygiene_rating : undefined,
  };
}

const FULFILLMENT_TO_APP: Record<string, 'mystery_box' | 'fixed_item'> = {
  surprise_bag: 'mystery_box',
  pick_your_own: 'fixed_item',
};

function mapListing(row: Record<string, unknown>): Listing {
  const type = FULFILLMENT_TO_APP[row.fulfillment_type as string] ?? 'fixed_item';
  const base = {
    id: row.id as string,
    merchantId: row.location_id as string,
    type,
    title: (row.name as string) ?? '',
    description: (row.description as string) ?? '',
    images: Array.isArray(row.photo_urls) ? (row.photo_urls as string[]) : [],
    category: ((row.cuisine_types as string[]) ?? [])[0] ?? 'other',
    originalPrice: typeof row.original_value_thb === 'number' ? row.original_value_thb : 0,
    salePrice: typeof row.price_thb === 'number' ? row.price_thb : 0,
    quantity: typeof row.qty_total === 'number' ? row.qty_total : 1,
    quantityRemaining: typeof row.qty_remaining === 'number' ? row.qty_remaining : 1,
    pickupWindowStart: (row.pickup_start as string) ?? new Date().toISOString(),
    pickupWindowEnd: (row.pickup_end as string) ?? new Date().toISOString(),
    dietaryTags: Array.isArray(row.dietary_tags) ? (row.dietary_tags as string[]) : [],
    allergens: Array.isArray(row.allergens) ? (row.allergens as string[]) : [],
    status: (row.is_active && (row.qty_remaining as number) > 0
      ? 'active'
      : row.qty_remaining === 0
        ? 'sold_out'
        : 'expired') as Listing['status'],
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
  if (type === 'mystery_box') {
    return {
      ...base,
      type: 'mystery_box',
      boxSize: (row.box_size as MysteryBoxListing['boxSize']) ?? 'medium',
      estimatedRetailValue: base.originalPrice,
    };
  }
  return { ...base, type: 'fixed_item' };
}

const STATUS_DB_TO_APP: Record<string, Order['status']> = {
  reserved: 'pending',
  paid: 'confirmed',
  collected: 'completed',
  cancelled: 'cancelled',
  refunded: 'cancelled',
  no_show: 'cancelled',
  pending: 'pending',
  confirmed: 'confirmed',
  preparing: 'preparing',
  ready: 'ready',
  picked_up: 'picked_up',
  completed: 'completed',
};

const STATUS_APP_TO_DB: Record<string, string> = {
  pending: 'reserved',
  confirmed: 'paid',
  preparing: 'paid',
  ready: 'paid',
  picked_up: 'collected',
  completed: 'collected',
  cancelled: 'cancelled',
};

function mapOrder(row: Record<string, unknown>): Order {
  const listing = (row.listings as Record<string, unknown> | null) ?? {};
  const location = (row.locations as Record<string, unknown> | null) ?? {};
  const profile = (row.profiles as Record<string, unknown> | null) ?? {};
  const orgRow = (location.merchant_orgs as Record<string, unknown> | null) ?? {};

  const qrPayload = (() => {
    try {
      const p = typeof row.qr_payload === 'string' ? JSON.parse(row.qr_payload) : row.qr_payload;
      return (p?.code as string) ?? String(row.id).slice(0, 6).toUpperCase();
    } catch {
      return String(row.id).slice(0, 6).toUpperCase();
    }
  })();

  const total = typeof row.amount_thb === 'number' ? row.amount_thb : 0;
  const listingTitle = (listing.name as string) ?? 'Order item';
  const listingPrice = typeof listing.price_thb === 'number' ? listing.price_thb : total;
  const listingImage = Array.isArray(listing.photo_urls)
    ? (listing.photo_urls[0] as string)
    : undefined;

  const items: OrderItem[] = listing.id
    ? [
        {
          listingId: listing.id as string,
          title: listingTitle,
          quantity: 1,
          unitPrice: listingPrice,
          totalPrice: listingPrice,
          imageUrl: listingImage,
        },
      ]
    : [];

  return {
    id: row.id as string,
    customerId: row.buyer_id as string,
    customerName: (profile.display_name as string) ?? undefined,
    merchantId: row.location_id as string,
    merchantName: (location.name as string) ?? '',
    merchantLogoUrl: (orgRow.logo_url as string) ?? undefined,
    merchantCoordinates: BANGKOK_CENTER,
    items,
    subtotal: total,
    discount: 0,
    couponId: (row.coupon_id as string) ?? undefined,
    couponCode: (row.coupon_code as string) ?? undefined,
    couponDiscount: typeof row.coupon_discount_thb === 'number' ? row.coupon_discount_thb : 0,
    total,
    status: STATUS_DB_TO_APP[row.status as string] ?? 'pending',
    pickupCode: qrPayload,
    pickupWindowStart: (row.pickup_start as string) ?? new Date().toISOString(),
    pickupWindowEnd: (row.pickup_end as string) ?? new Date().toISOString(),
    notes: (row.customer_note as string) ?? undefined,
    cancellationReason: (row.cancellation_reason as string) ?? undefined,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

function mapCoupon(row: Record<string, unknown>): Coupon {
  const now = new Date().toISOString();
  let status: Coupon['status'] = (row.status as Coupon['status']) ?? 'active';
  if (status === 'active' && (row.valid_until as string) < now) status = 'expired';
  const categories = row.applicable_categories;
  const listingTypes = row.applicable_listing_types;
  return {
    id: row.id as string,
    merchantId: row.merchant_id as string,
    code: (row.code as string) ?? '',
    description: (row.description as string) ?? '',
    discountType: (row.discount_type as Coupon['discountType']) ?? 'percentage',
    discountValue: typeof row.discount_value === 'number' ? row.discount_value : 0,
    maxDiscountAmount:
      typeof row.max_discount_amount_thb === 'number' ? row.max_discount_amount_thb : undefined,
    minOrderAmount: typeof row.min_order_amount === 'number' ? row.min_order_amount : undefined,
    maxUses: typeof row.max_uses === 'number' ? row.max_uses : undefined,
    perCustomerMaxUses:
      typeof row.per_customer_max_uses === 'number' ? row.per_customer_max_uses : undefined,
    firstTimeCustomerOnly: !!row.first_time_customer_only,
    applicableCategories: Array.isArray(categories) ? (categories as string[]) : undefined,
    applicableListingTypes: Array.isArray(listingTypes)
      ? (listingTypes as ListingType[])
      : undefined,
    usesCount: typeof row.uses_count === 'number' ? row.uses_count : 0,
    status,
    validFrom: (row.valid_from as string) ?? now,
    validUntil: (row.valid_until as string) ?? now,
    createdAt: (row.created_at as string) ?? now,
  };
}

function mapPayout(row: Record<string, unknown>): PayoutTransaction {
  return {
    id: row.id as string,
    merchantId: row.merchant_id as string,
    amount: typeof row.amount_thb === 'number' ? row.amount_thb : 0,
    status: (row.status as PayoutTransaction['status']) ?? 'pending',
    method: 'bank_transfer',
    bankAccountId: (row.bank_account_id as string) ?? '',
    bankAccountName: (row.bank_account_name as string) ?? undefined,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    completedAt: (row.completed_at as string) ?? undefined,
  };
}

function mapBankAccount(row: Record<string, unknown>): BankAccount {
  return {
    id: row.id as string,
    merchantId: row.merchant_id as string,
    bankName: (row.bank_name as string) ?? '',
    accountName: (row.account_name as string) ?? '',
    accountNumber: (row.account_number as string) ?? '',
    branch: (row.branch as string) ?? undefined,
    isDefault: row.is_default === true,
  };
}

function mapStaff(row: Record<string, unknown>): StaffMember {
  return {
    id: row.id as string,
    merchantId: row.merchant_id as string,
    userId: (row.user_id as string) ?? undefined,
    name: (row.name as string) ?? '',
    email: (row.email as string) ?? '',
    phone: (row.phone as string) ?? undefined,
    role: (row.role as StaffMember['role']) ?? 'staff',
    isActive: row.is_active === true,
    lastActiveAt: (row.last_active_at as string) ?? undefined,
    permissions: Array.isArray(row.permissions) ? (row.permissions as string[]) : [],
    avatarUrl: (row.avatar_url as string) ?? undefined,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
}

function mapMessage(row: Record<string, unknown>): MerchantMessage {
  const profile = (row.profiles as Record<string, unknown> | null) ?? {};
  return {
    id: row.id as string,
    merchantId: row.merchant_id as string,
    customerId: row.customer_id as string,
    customerName: (profile.display_name as string) ?? 'Customer',
    customerAvatarUrl: (profile.avatar_url as string) ?? undefined,
    orderId: (row.order_id as string) ?? undefined,
    content: (row.content as string) ?? '',
    sentBy: (row.sent_by as MerchantMessage['sentBy']) ?? 'merchant',
    read: row.read === true,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
}

function mapTemplate(row: Record<string, unknown>): ListingTemplate {
  return {
    id: row.id as string,
    merchantId: row.merchant_id as string,
    name: (row.name as string) ?? '',
    type: (row.type as ListingTemplate['type']) ?? 'fixed_item',
    title: (row.title as string) ?? '',
    description: (row.description as string) ?? '',
    category: (row.category as string) ?? 'other',
    originalPrice: typeof row.original_price === 'number' ? row.original_price : 0,
    salePrice: typeof row.sale_price === 'number' ? row.sale_price : 0,
    quantity: typeof row.quantity === 'number' ? row.quantity : 1,
    boxSize: (row.box_size as ListingTemplate['boxSize']) ?? undefined,
    estimatedRetailValue:
      typeof row.estimated_retail_value === 'number' ? row.estimated_retail_value : undefined,
    dietaryTags: Array.isArray(row.dietary_tags) ? (row.dietary_tags as string[]) : [],
    allergens: Array.isArray(row.allergens) ? (row.allergens as string[]) : [],
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    pickupWindowDurationHours:
      typeof row.pickup_window_duration_hours === 'number' ? row.pickup_window_duration_hours : 2,
    autoExpiry: row.auto_expiry === true,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    expiresAt: (row.expires_at as string) ?? undefined,
  };
}

// ─── auth helpers ───────────────────────────────────────────────────────────

let pendingOtpEmail = '';

function getAuthRedirectUrl(): string {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  return 'maithing://';
}

// ─── auth ────────────────────────────────────────────────────────────────────

const authRepo: AuthRepository = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const userId = notNull(data.user?.id, 'user');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (profileError) throw profileError;
    return { ...mapProfile(profile as Record<string, unknown>), roles: ['customer', 'merchant'] };
  },

  async signUp(email, password, name) {
    pendingOtpEmail = email;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: getAuthRedirectUrl() },
    });
    if (error) throw error;
    const userId = notNull(data.user?.id, 'user');
    await supabase.from('profiles').upsert({ id: userId, display_name: name, role: 'buyer' });
    return {
      id: userId,
      email,
      name,
      roles: ['customer'] as UserRole[],
      preferredLanguage: 'en' as const,
      createdAt: new Date().toISOString(),
    };
  },

  async registerMerchant(data) {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { emailRedirectTo: getAuthRedirectUrl() },
    });
    if (error) throw error;
    const userId = notNull(authData.user?.id, 'user');
    await supabase
      .from('profiles')
      .upsert({ id: userId, display_name: data.name, role: 'merchant' });
    return {
      id: userId,
      email: data.email,
      name: data.name,
      roles: ['merchant'] as UserRole[],
      preferredLanguage: 'en' as const,
      createdAt: new Date().toISOString(),
    };
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUrl(),
    });
    if (error) throw error;
  },

  async verifyOtp(code) {
    if (!pendingOtpEmail) return false;
    const { error } = await supabase.auth.verifyOtp({
      type: 'email',
      token: code,
      email: pendingOtpEmail,
    });
    return !error;
  },

  async resendVerification(email) {
    pendingOtpEmail = email;
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  },
};

// ─── users ───────────────────────────────────────────────────────────────────

const defaultNotificationPreferences: NotificationPreferences = {
  newDeals: true,
  orderUpdates: true,
  merchantMessages: true,
  promotions: false,
  followedMerchantNotifications: [],
};

const usersRepo: UserRepository = {
  async getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    if (!profile) return null;
    return { ...mapProfile(profile as Record<string, unknown>), roles: ['customer', 'merchant'] };
  },

  async updateProfile(userId, update) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ display_name: update.name, avatar_url: update.avatarUrl, phone: update.phone })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return mapProfile(data as Record<string, unknown>);
  },

  async getCustomerProfile(userId) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    const base = mapProfile(profile as Record<string, unknown>);

    const [{ data: favorites }, { data: saved }, { data: addresses }, { data: restock }] =
      await Promise.all([
        supabase.from('user_favorites').select('merchant_id').eq('user_id', userId),
        supabase.from('user_saved_listings').select('listing_id').eq('user_id', userId),
        supabase.from('saved_addresses').select('*').eq('user_id', userId),
        supabase.from('restock_alerts').select('listing_id').eq('user_id', userId),
      ]);

    const stored =
      (profile.notification_preferences as Partial<NotificationPreferences> | null) ?? {};
    const prefs: NotificationPreferences = {
      newDeals: stored.newDeals ?? defaultNotificationPreferences.newDeals,
      orderUpdates: stored.orderUpdates ?? defaultNotificationPreferences.orderUpdates,
      merchantMessages: stored.merchantMessages ?? defaultNotificationPreferences.merchantMessages,
      promotions: stored.promotions ?? defaultNotificationPreferences.promotions,
      followedMerchantNotifications:
        (profile.followed_merchant_notifications as string[]) ??
        defaultNotificationPreferences.followedMerchantNotifications,
    };

    return {
      ...base,
      roles: ['customer', 'merchant'] as UserRole[],
      favorites: (favorites ?? []).map((r) => r.merchant_id as string),
      savedListings: (saved ?? []).map((r) => r.listing_id as string),
      savedAddresses: (addresses ?? []).map((a) => ({
        street: (a.address_line1 as string) ?? '',
        subDistrict: (a.subdistrict as string) ?? '',
        district: (a.district as string) ?? '',
        province: (a.province as string) ?? 'Bangkok',
        postalCode: (a.postal_code as string) ?? '',
        country: 'Thailand',
      })),
      restockAlerts: (restock ?? []).map((r) => r.listing_id as string),
      notificationPreferences: prefs,
    } satisfies CustomerProfile;
  },

  async updateCustomerProfile(userId, data) {
    const update: Record<string, unknown> = {};
    if (data.name != null) update.display_name = data.name;
    if (data.avatarUrl != null) update.avatar_url = data.avatarUrl;
    if (data.phone != null) update.phone = data.phone;
    if (data.notificationPreferences != null) {
      update.notification_preferences = data.notificationPreferences;
      update.followed_merchant_notifications =
        data.notificationPreferences.followedMerchantNotifications;
    }
    if (Object.keys(update).length > 0) {
      const { error } = await supabase.from('profiles').update(update).eq('id', userId);
      if (error) throw error;
    }
    return usersRepo.getCustomerProfile(userId);
  },

  async addFavorite(userId, merchantId) {
    await supabase.from('user_favorites').upsert({ user_id: userId, merchant_id: merchantId });
  },
  async removeFavorite(userId, merchantId) {
    await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('merchant_id', merchantId);
  },
  async addSavedListing(userId, listingId) {
    await supabase.from('user_saved_listings').upsert({ user_id: userId, listing_id: listingId });
  },
  async removeSavedListing(userId, listingId) {
    await supabase
      .from('user_saved_listings')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);
  },
  async updateNotificationPreferences(_userId, preferences) {
    const { error } = await supabase
      .from('profiles')
      .update({
        notification_preferences: preferences,
        followed_merchant_notifications: preferences.followedMerchantNotifications,
      })
      .eq('id', _userId);
    if (error) throw error;
    return preferences;
  },
  async addMerchantFollowNotification(userId, merchantId) {
    const { data } = await supabase
      .from('profiles')
      .select('followed_merchant_notifications')
      .eq('id', userId)
      .single();
    const existing = Array.isArray(data?.followed_merchant_notifications)
      ? (data.followed_merchant_notifications as string[])
      : [];
    if (existing.includes(merchantId)) return;
    await supabase
      .from('profiles')
      .update({ followed_merchant_notifications: [...existing, merchantId] })
      .eq('id', userId);
    await supabase
      .from('followed_merchant_notifications')
      .upsert({ user_id: userId, merchant_id: merchantId });
  },
  async removeMerchantFollowNotification(userId, merchantId) {
    const { data } = await supabase
      .from('profiles')
      .select('followed_merchant_notifications')
      .eq('id', userId)
      .single();
    const existing = Array.isArray(data?.followed_merchant_notifications)
      ? (data.followed_merchant_notifications as string[])
      : [];
    await supabase
      .from('profiles')
      .update({ followed_merchant_notifications: existing.filter((id) => id !== merchantId) })
      .eq('id', userId);
    await supabase
      .from('followed_merchant_notifications')
      .delete()
      .eq('user_id', userId)
      .eq('merchant_id', merchantId);
  },
  async addRestockAlert(userId, listingId) {
    await supabase.from('restock_alerts').upsert({ user_id: userId, listing_id: listingId });
  },
  async removeRestockAlert(userId, listingId) {
    await supabase
      .from('restock_alerts')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);
  },

  /* ─── personality ─────────────────────────────────────────────────────── */

  async getUserPersonality(userId): Promise<UserPersonality | null> {
    const { data, error } = await supabase
      .from('user_personality')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error || !data) return null;
    return {
      userId: data.user_id as string,
      dietaryPreferences: Array.isArray(data.dietary_preferences) ? (data.dietary_preferences as string[]) : [],
      priceRange: (data.price_range as UserPersonality['priceRange']) ?? 'any',
      preferredCategories: Array.isArray(data.preferred_categories) ? (data.preferred_categories as string[]) : [],
      discoveryStyle: (data.discovery_style as UserPersonality['discoveryStyle']) ?? 'explore',
      environmentalMotivation: (data.environmental_motivation as UserPersonality['environmentalMotivation']) ?? 'medium',
      pickupTimePreference: (data.pickup_time_preference as UserPersonality['pickupTimePreference']) ?? 'any',
      maxDistanceKm: typeof data.max_distance_km === 'number' ? data.max_distance_km : 10,
      notificationStyle: (data.notification_style as UserPersonality['notificationStyle']) ?? 'all',
      favoriteMerchants: Array.isArray(data.favorite_merchants) ? (data.favorite_merchants as string[]) : [],
      orderPatterns: (data.order_patterns as Record<string, unknown>) ?? {},
      onboardingCompleted: data.onboarding_completed === true,
      createdAt: (data.created_at as string) ?? new Date().toISOString(),
      updatedAt: (data.updated_at as string) ?? new Date().toISOString(),
    };
  },

  async upsertUserPersonality(userId, data): Promise<UserPersonality> {
    const payload: Record<string, unknown> = {};
    if (data.dietaryPreferences !== undefined) payload.dietary_preferences = data.dietaryPreferences;
    if (data.priceRange !== undefined) payload.price_range = data.priceRange;
    if (data.preferredCategories !== undefined) payload.preferred_categories = data.preferredCategories;
    if (data.discoveryStyle !== undefined) payload.discovery_style = data.discoveryStyle;
    if (data.environmentalMotivation !== undefined) payload.environmental_motivation = data.environmentalMotivation;
    if (data.pickupTimePreference !== undefined) payload.pickup_time_preference = data.pickupTimePreference;
    if (data.maxDistanceKm !== undefined) payload.max_distance_km = data.maxDistanceKm;
    if (data.notificationStyle !== undefined) payload.notification_style = data.notificationStyle;
    if (data.favoriteMerchants !== undefined) payload.favorite_merchants = data.favoriteMerchants;
    if (data.orderPatterns !== undefined) payload.order_patterns = data.orderPatterns;
    if (data.onboardingCompleted !== undefined) payload.onboarding_completed = data.onboardingCompleted;

    const { data: row, error } = await supabase
      .from('user_personality')
      .upsert({ user_id: userId, ...payload })
      .select()
      .single();
    if (error) throw error;
    return usersRepo.getUserPersonality(userId).then((p) => p ?? (row as unknown as UserPersonality));
  },
};

// ─── merchants ───────────────────────────────────────────────────────────────

const merchantsRepo: MerchantRepository = {
  async getMerchants(params) {
    // Use PostGIS nearby_locations RPC when lat/lng are provided
    if (params?.lat != null && params?.lng != null) {
      const { data, error } = await supabase.rpc('nearby_locations', {
        lat: params.lat,
        lng: params.lng,
        radius_meters: params.radius ?? 10000,
      });
      if (error) throw error;
      return (data ?? []).map((row: Record<string, unknown>) => mapLocation(row));
    }

    let query = supabase
      .from('locations')
      .select('*, merchant_orgs(*)')
      .eq('is_active', true)
      .limit(50);

    if (params?.query) {
      query = query.ilike('name', `%${params.query}%`);
    }
    if (params?.category) {
      query = query.contains('cuisine_types', [params.category]);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row, i) => mapLocation(row as Record<string, unknown>, i));
  },

  async getMerchant(id) {
    const { data, error } = await supabase
      .from('locations')
      .select('*, merchant_orgs(*), merchant_business_hours(*)')
      .eq('id', id)
      .single();
    if (error) return null;
    return mapLocation(data as Record<string, unknown>);
  },

  async getMerchantByOwnerId(ownerId) {
    const { data: org, error: orgErr } = await supabase
      .from('merchant_orgs')
      .select('id')
      .eq('owner_id', ownerId)
      .limit(1)
      .maybeSingle();
    if (orgErr || !org) return null;

    const { data, error } = await supabase
      .from('locations')
      .select('*, merchant_orgs(*), merchant_business_hours(*)')
      .eq('merchant_org_id', org.id)
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return mapLocation(data as Record<string, unknown>);
  },

  async getCategories(): Promise<Category[]> {
    return [
      { id: 'thai', name: 'Thai', nameTh: 'ไทย', icon: 'utensils' },
      { id: 'bakery', name: 'Bakery', nameTh: 'เบเกอรี่', icon: 'cake' },
      { id: 'japanese', name: 'Japanese', nameTh: 'ญี่ปุ่น', icon: 'utensils' },
      { id: 'coffee', name: 'Coffee', nameTh: 'กาแฟ', icon: 'coffee' },
      { id: 'dessert', name: 'Dessert', nameTh: 'ของหวาน', icon: 'ice-cream' },
      { id: 'healthy', name: 'Healthy', nameTh: 'เพื่อสุขภาพ', icon: 'leaf' },
    ];
  },

  async followMerchant(userId, merchantId) {
    await supabase.from('merchant_follows').upsert({ user_id: userId, merchant_id: merchantId });
    await supabase.rpc('increment_follower_count', { merchant_id: merchantId });
  },
  async unfollowMerchant(userId, merchantId) {
    await supabase
      .from('merchant_follows')
      .delete()
      .eq('user_id', userId)
      .eq('merchant_id', merchantId);
    await supabase.rpc('decrement_follower_count', { merchant_id: merchantId });
  },

  async updateMerchant(id, data) {
    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
    if (data.phone) updateData.phone = data.phone;
    if (data.categories) updateData.cuisine_types = data.categories;
    if (data.coordinates) updateData.coordinates = data.coordinates;
    const { data: row, error } = await supabase
      .from('locations')
      .update(updateData)
      .eq('id', id)
      .select('*, merchant_orgs(*)')
      .single();
    if (error) throw error;
    return mapLocation(row as Record<string, unknown>);
  },

  async updateBusinessHours(id, hours) {
    await supabase.from('merchant_business_hours').delete().eq('merchant_id', id);
    if (hours.length > 0) {
      await supabase.from('merchant_business_hours').insert(
        hours.map((h) => ({
          merchant_id: id,
          day: h.day,
          open: h.open,
          close: h.close,
        }))
      );
    }
    return notNull(await merchantsRepo.getMerchant(id), 'merchant');
  },

  async updatePickupInstructions(id, instructions) {
    const { data, error } = await supabase
      .from('locations')
      .update({ pickup_instructions: instructions })
      .eq('id', id)
      .select('*, merchant_orgs(*)')
      .single();
    if (error) throw error;
    return mapLocation(data as Record<string, unknown>);
  },

  async getReviews(merchantId): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(display_name, avatar_url)')
      .eq('location_id', merchantId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data ?? []).map((r) => {
      const profile = (r.profiles as Record<string, unknown> | null) ?? {};
      return {
        id: r.id as string,
        orderId: (r.order_id as string) ?? '',
        customerId: (r.buyer_id as string) ?? '',
        customerName: (profile.display_name as string) ?? 'Customer',
        merchantId,
        rating: typeof r.rating === 'number' ? r.rating : 5,
        comment: (r.comment as string) ?? '',
        images: Array.isArray(r.images) ? (r.images as string[]) : undefined,
        merchantReply: (r.merchant_reply as string) ?? undefined,
        merchantRepliedAt: (r.merchant_replied_at as string) ?? undefined,
        createdAt: (r.created_at as string) ?? new Date().toISOString(),
      } satisfies Review;
    });
  },

  async replyToReview(reviewId, reply) {
    const { data, error } = await supabase
      .from('reviews')
      .update({ merchant_reply: reply, merchant_replied_at: new Date().toISOString() })
      .eq('id', reviewId)
      .select('*, profiles(display_name)')
      .single();
    if (error) throw error;
    const profile = ((data as Record<string, unknown>).profiles as Record<string, unknown>) ?? {};
    return {
      id: data.id as string,
      orderId: (data.order_id as string) ?? '',
      customerId: (data.buyer_id as string) ?? '',
      customerName: (profile.display_name as string) ?? 'Customer',
      merchantId: (data.location_id as string) ?? '',
      rating: typeof data.rating === 'number' ? data.rating : 5,
      comment: (data.comment as string) ?? '',
      merchantReply: reply,
      merchantRepliedAt: new Date().toISOString(),
      createdAt: (data.created_at as string) ?? new Date().toISOString(),
    };
  },

  async submitReview(data) {
    const { data: row, error } = await supabase
      .from('reviews')
      .insert({
        location_id: data.merchantId,
        buyer_id: data.customerId,
        order_id: data.orderId || null,
        rating: data.rating,
        comment: data.comment,
        images: data.images ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      ...data,
      id: row.id as string,
      createdAt: (row.created_at as string) ?? new Date().toISOString(),
    };
  },

  async getStaff(merchantId): Promise<StaffMember[]> {
    const { data, error } = await supabase
      .from('merchant_staff')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data ?? []).map((r) => mapStaff(r as Record<string, unknown>));
  },
  async addStaff(merchantId, data) {
    const { data: row, error } = await supabase
      .from('merchant_staff')
      .insert({
        merchant_id: merchantId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        user_id: data.userId,
        is_active: data.isActive,
        permissions: data.permissions,
      })
      .select()
      .single();
    if (error) throw error;
    return mapStaff(row as Record<string, unknown>);
  },
  async updateStaff(merchantId, staffId, data) {
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.email !== undefined) update.email = data.email;
    if (data.phone !== undefined) update.phone = data.phone;
    if (data.role !== undefined) update.role = data.role;
    if (data.isActive !== undefined) update.is_active = data.isActive;
    if (data.lastActiveAt !== undefined) update.last_active_at = data.lastActiveAt;
    if (data.permissions !== undefined) update.permissions = data.permissions;
    if (data.avatarUrl !== undefined) update.avatar_url = data.avatarUrl;

    const { data: row, error } = await supabase
      .from('merchant_staff')
      .update(update)
      .eq('merchant_id', merchantId)
      .eq('id', staffId)
      .select()
      .single();
    if (error) throw error;
    return mapStaff(row as Record<string, unknown>);
  },
  async removeStaff(merchantId, staffId) {
    await supabase.from('merchant_staff').delete().eq('merchant_id', merchantId).eq('id', staffId);
  },
  async setStoreClosure(merchantId, closedUntil) {
    const { data, error } = await supabase
      .from('locations')
      .update({ closed_until: closedUntil })
      .eq('id', merchantId)
      .select('*, merchant_orgs(*)')
      .single();
    if (error) throw error;
    return mapLocation(data as Record<string, unknown>);
  },
  async getMerchantNotificationPreferences(merchantId): Promise<MerchantNotificationPreferences> {
    const { data } = await supabase
      .from('merchant_notification_preferences')
      .select('*')
      .eq('merchant_id', merchantId)
      .maybeSingle();
    return {
      newOrders: (data?.new_orders as boolean) ?? true,
      lowStock: (data?.low_stock as boolean) ?? true,
      payoutUpdates: (data?.payout_updates as boolean) ?? true,
      customerReviews: (data?.customer_reviews as boolean) ?? true,
      pickupReminders: (data?.pickup_reminders as boolean) ?? true,
      autoConfirmOrders: (data?.auto_confirm_orders as boolean) ?? false,
    };
  },
  async updateMerchantNotificationPreferences(merchantId, preferences) {
    const { error } = await supabase.from('merchant_notification_preferences').upsert({
      merchant_id: merchantId,
      new_orders: preferences.newOrders,
      low_stock: preferences.lowStock,
      payout_updates: preferences.payoutUpdates,
      customer_reviews: preferences.customerReviews,
      pickup_reminders: preferences.pickupReminders,
      auto_confirm_orders: preferences.autoConfirmOrders,
    });
    if (error) throw error;
    return preferences;
  },
  async getOnboarding(merchantId): Promise<MerchantOnboarding> {
    const { data } = await supabase
      .from('merchant_onboarding')
      .select('*')
      .eq('merchant_id', merchantId)
      .maybeSingle();
    return {
      merchantId,
      completedSteps: (data?.completed_steps as MerchantOnboarding['completedSteps']) ?? [],
      currentStep: (data?.current_step as MerchantOnboarding['currentStep']) ?? 'welcome',
    };
  },
  async updateOnboarding(merchantId, step) {
    const onboardingStep = step as OnboardingStep;
    const current = await merchantsRepo.getOnboarding(merchantId);
    const completed = new Set([...current.completedSteps, onboardingStep]);
    let nextStep: OnboardingStep = onboardingStep;
    const order: OnboardingStep[] = [
      'welcome',
      'business_info',
      'verification',
      'bank_account',
      'first_listing',
      'complete',
    ];
    const idx = order.indexOf(onboardingStep);
    if (idx >= 0 && idx < order.length - 1) nextStep = order[idx + 1];

    await supabase.from('merchant_onboarding').upsert({
      merchant_id: merchantId,
      completed_steps: Array.from(completed),
      current_step: nextStep,
    });
    return {
      merchantId,
      completedSteps: Array.from(completed) as OnboardingStep[],
      currentStep: nextStep,
    };
  },
  async sendBroadcast(merchantId, content): Promise<BroadcastMessage> {
    const { data, error } = await supabase
      .from('merchant_broadcasts')
      .insert({ merchant_id: merchantId, content })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id as string,
      merchantId,
      content,
      sentAt: (data.created_at as string) ?? new Date().toISOString(),
      recipientCount: typeof data.recipient_count === 'number' ? data.recipient_count : 0,
    };
  },
  async getRecentBroadcasts(merchantId): Promise<BroadcastMessage[]> {
    const { data, error } = await supabase
      .from('merchant_broadcasts')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) return [];
    return (data ?? []).map((r) => ({
      id: r.id as string,
      merchantId,
      content: (r.content as string) ?? '',
      sentAt: (r.created_at as string) ?? new Date().toISOString(),
      recipientCount: typeof r.recipient_count === 'number' ? r.recipient_count : 0,
    }));
  },
  async verifyMerchant(merchantId, override = false) {
    const { data, error } = await supabase
      .from('locations')
      .update({
        is_verified: override ? true : false,
        verification_status: override ? 'verified' : 'pending',
      })
      .eq('id', merchantId)
      .select('*, merchant_orgs(*)')
      .single();
    if (error) throw error;
    return mapLocation(data as Record<string, unknown>);
  },
  async uploadFoodSafetyCert(merchantId, certUrl) {
    const { data, error } = await supabase
      .from('locations')
      .update({ food_safety_cert_url: certUrl })
      .eq('id', merchantId)
      .select('*, merchant_orgs(*)')
      .single();
    if (error) throw error;
    return mapLocation(data as Record<string, unknown>);
  },

  /* ─── personality ─────────────────────────────────────────────────────── */

  async getMerchantPersonality(merchantId): Promise<MerchantPersonality | null> {
    const { data, error } = await supabase
      .from('merchant_personality')
      .select('*')
      .eq('merchant_id', merchantId)
      .single();
    if (error || !data) return null;
    return {
      merchantId: data.merchant_id as string,
      brandVoice: (data.brand_voice as MerchantPersonality['brandVoice']) ?? 'friendly',
      sustainabilityFocus: (data.sustainability_focus as MerchantPersonality['sustainabilityFocus']) ?? 'medium',
      communityEngagement: (data.community_engagement as MerchantPersonality['communityEngagement']) ?? 'medium',
      customerCommunication: (data.customer_communication as MerchantPersonality['customerCommunication']) ?? 'responsive',
      story: (data.story as string) ?? undefined,
      values: Array.isArray(data.values) ? (data.values as string[]) : [],
      autoWelcomeMessage: (data.auto_welcome_message as string) ?? undefined,
      pickupPersonality: (data.pickup_personality as MerchantPersonality['pickupPersonality']) ?? 'standard',
      packagingStyle: (data.packaging_style as MerchantPersonality['packagingStyle']) ?? 'standard',
      socialLinks: (data.social_links as Record<string, string>) ?? {},
      onboardingCompleted: data.onboarding_completed === true,
      createdAt: (data.created_at as string) ?? new Date().toISOString(),
      updatedAt: (data.updated_at as string) ?? new Date().toISOString(),
    };
  },

  async upsertMerchantPersonality(merchantId, data): Promise<MerchantPersonality> {
    const payload: Record<string, unknown> = {};
    if (data.brandVoice !== undefined) payload.brand_voice = data.brandVoice;
    if (data.sustainabilityFocus !== undefined) payload.sustainability_focus = data.sustainabilityFocus;
    if (data.communityEngagement !== undefined) payload.community_engagement = data.communityEngagement;
    if (data.customerCommunication !== undefined) payload.customer_communication = data.customerCommunication;
    if (data.story !== undefined) payload.story = data.story;
    if (data.values !== undefined) payload.values = data.values;
    if (data.autoWelcomeMessage !== undefined) payload.auto_welcome_message = data.autoWelcomeMessage;
    if (data.pickupPersonality !== undefined) payload.pickup_personality = data.pickupPersonality;
    if (data.packagingStyle !== undefined) payload.packaging_style = data.packagingStyle;
    if (data.socialLinks !== undefined) payload.social_links = data.socialLinks;
    if (data.onboardingCompleted !== undefined) payload.onboarding_completed = data.onboardingCompleted;

    const { data: row, error } = await supabase
      .from('merchant_personality')
      .upsert({ merchant_id: merchantId, ...payload })
      .select()
      .single();
    if (error) throw error;
    return merchantsRepo.getMerchantPersonality(merchantId).then((p) => p ?? (row as unknown as MerchantPersonality));
  },
};

// ─── listings ────────────────────────────────────────────────────────────────

const listingsRepo: ListingRepository = {
  async getListings(params) {
    // Use PostGIS to find nearby merchant IDs when lat/lng are provided
    let nearbyMerchantIds: string[] | undefined;
    const merchantDistances = new Map<string, number>();

    if (params?.lat != null && params?.lng != null) {
      const { data: nearbyData, error: nearbyError } = await supabase.rpc('nearby_locations', {
        lat: params.lat,
        lng: params.lng,
        radius_meters: params.radius ?? 10000,
      });
      if (!nearbyError && nearbyData) {
        nearbyMerchantIds = nearbyData.map((row: Record<string, unknown>) => row.id as string);
        nearbyData.forEach((row: Record<string, unknown>) => {
          merchantDistances.set(row.id as string, (row.distance_meters as number) ?? 0);
        });
      }
    }

    let query = supabase
      .from('listings')
      .select('*')
      .gt('qty_remaining', 0)
      .eq('is_active', true)
      .limit(100);

    if (nearbyMerchantIds) {
      query = query.in('location_id', nearbyMerchantIds);
    }
    if (params?.merchantId) {
      query = query.eq('location_id', params.merchantId);
    }
    if (params?.query) {
      query = query.ilike('name', `%${params.query}%`);
    }
    if (params?.status === 'active') {
      // already filtered above
    } else if (params?.status) {
      // ignore complex status for now
    }

    const { data, error } = await query;
    if (error) throw error;
    const listings = (data ?? []).map((row) => mapListing(row as Record<string, unknown>));

    // Attach distances from PostGIS results
    listings.forEach((l) => {
      const d = merchantDistances.get(l.merchantId);
      if (d != null) {
        (l as Listing & { distance?: number }).distance = d;
      }
    });

    // Sort listings
    switch (params?.sortBy) {
      case 'distance':
        listings.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
        break;
      case 'price_asc':
        listings.sort((a, b) => a.salePrice - b.salePrice);
        break;
      case 'price_desc':
        listings.sort((a, b) => b.salePrice - a.salePrice);
        break;
      case 'discount':
        listings.sort((a, b) => b.originalPrice - b.salePrice - (a.originalPrice - a.salePrice));
        break;
      case 'newest':
        listings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'going_fast':
        listings.sort((a, b) => a.quantityRemaining - b.quantityRemaining);
        break;
      default:
        if (params?.lat != null && params?.lng != null) {
          listings.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
        }
        break;
    }

    return listings;
  },

  async getListing(id) {
    const { data, error } = await supabase.from('listings').select('*').eq('id', id).single();
    if (error) return null;
    return mapListing(data as Record<string, unknown>);
  },

  async createListing(data) {
    const fulfillmentType = data.type === 'mystery_box' ? 'surprise_bag' : 'pick_your_own';
    const { data: row, error } = await supabase
      .from('listings')
      .insert({
        location_id: data.merchantId,
        name: data.title,
        description: data.description,
        fulfillment_type: fulfillmentType,
        price_thb: data.salePrice,
        original_value_thb: data.originalPrice,
        qty_total: data.quantity,
        qty_remaining: data.quantityRemaining,
        pickup_start: data.pickupWindowStart,
        pickup_end: data.pickupWindowEnd,
        photo_urls: data.images,
        dietary_tags: data.dietaryTags,
        allergens: data.allergens,
        is_active: data.status === 'active',
      })
      .select()
      .single();
    if (error) throw error;
    return mapListing(row as Record<string, unknown>);
  },

  async updateListing(id, data) {
    const updateData: Record<string, unknown> = {};
    if (data.title) updateData.name = data.title;
    if (data.salePrice !== undefined) updateData.price_thb = data.salePrice;
    if (data.originalPrice !== undefined) updateData.original_value_thb = data.originalPrice;
    if (data.quantity !== undefined) updateData.qty_total = data.quantity;
    if (data.quantityRemaining !== undefined) updateData.qty_remaining = data.quantityRemaining;
    if (data.pickupWindowStart) updateData.pickup_start = data.pickupWindowStart;
    if (data.pickupWindowEnd) updateData.pickup_end = data.pickupWindowEnd;
    if (data.images) updateData.photo_urls = data.images;
    if (data.status) updateData.is_active = data.status === 'active';

    const { data: row, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapListing(row as Record<string, unknown>);
  },

  async deleteListing(id) {
    const { error } = await supabase.from('listings').update({ is_active: false }).eq('id', id);
    if (error) throw error;
  },

  async getListingTemplates(merchantId): Promise<ListingTemplate[]> {
    const { data, error } = await supabase
      .from('listing_templates')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data ?? []).map((r) => mapTemplate(r as Record<string, unknown>));
  },
  async createListingTemplate(data): Promise<ListingTemplate> {
    const { data: row, error } = await supabase
      .from('listing_templates')
      .insert({
        merchant_id: data.merchantId,
        name: data.name,
        type: data.type,
        title: data.title,
        description: data.description,
        category: data.category,
        original_price: data.originalPrice,
        sale_price: data.salePrice,
        quantity: data.quantity,
        box_size: data.boxSize,
        estimated_retail_value: data.estimatedRetailValue,
        dietary_tags: data.dietaryTags,
        allergens: data.allergens,
        images: data.images,
        pickup_window_duration_hours: data.pickupWindowDurationHours,
        auto_expiry: data.autoExpiry,
      })
      .select()
      .single();
    if (error) throw error;
    return mapTemplate(row as Record<string, unknown>);
  },
  async deleteListingTemplate(id) {
    await supabase.from('listing_templates').delete().eq('id', id);
  },
};

// ─── orders ──────────────────────────────────────────────────────────────────

const ordersRepo: OrderRepository = {
  async getOrders(userId, role) {
    const column = role === 'customer' ? 'buyer_id' : 'location_id';
    let locationId = userId;

    if (role === 'merchant') {
      const { data: loc } = await supabase
        .from('locations')
        .select('id, merchant_org_id')
        .limit(1)
        .maybeSingle();
      if (loc) locationId = loc.id as string;
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*, listings(*), locations(*, merchant_orgs(*)), profiles(*)')
      .eq(column, role === 'merchant' ? locationId : userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return (data ?? []).map((row) => mapOrder(row as Record<string, unknown>));
  },

  async getOrder(id) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, listings(*), locations(*, merchant_orgs(*)), profiles(*)')
      .eq('id', id)
      .single();
    if (error) return null;
    return mapOrder(data as Record<string, unknown>);
  },

  async getOrderByPickupCode(merchantId, code) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, listings(*), locations(*, merchant_orgs(*)), profiles(*)')
      .eq('location_id', merchantId)
      .ilike('qr_payload', `%${code}%`)
      .maybeSingle();
    if (error || !data) return null;
    return mapOrder(data as Record<string, unknown>);
  },

  async createOrder(data) {
    const listing = await listingsRepo.getListing(data.items[0]?.listingId ?? '');
    const pickupCode = generatePickupCode();
    const { data: row, error } = await supabase
      .from('orders')
      .insert({
        buyer_id: data.customerId,
        location_id: data.merchantId,
        listing_id: data.items[0]?.listingId ?? null,
        amount_thb: data.total,
        platform_fee_thb: Math.round(data.total * 0.15),
        status: STATUS_APP_TO_DB[data.status] ?? 'reserved',
        qr_payload: JSON.stringify({ code: pickupCode }),
        pickup_start: data.pickupWindowStart,
        pickup_end: data.pickupWindowEnd,
        customer_note: data.notes ?? null,
        coupon_id: data.couponId ?? null,
        coupon_discount_thb: data.couponDiscount ?? 0,
      })
      .select('*, listings(*), locations(*, merchant_orgs(*)), profiles(*)')
      .single();
    if (error) throw error;

    if (data.couponId) {
      await couponsRepo.recordCouponUse(data.couponId, data.customerId, row.id as string).catch(() => {
        // Don't fail the order if coupon-use tracking fails; log is ignored here.
      });
    }

    return mapOrder(row as Record<string, unknown>);
  },

  async updateOrderStatus(id, status) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: STATUS_APP_TO_DB[status] ?? status })
      .eq('id', id)
      .select('*, listings(*), locations(*, merchant_orgs(*)), profiles(*)')
      .single();
    if (error) throw error;
    return mapOrder(data as Record<string, unknown>);
  },

  async cancelOrder(id, reason) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', cancellation_reason: reason })
      .eq('id', id)
      .select('*, listings(*), locations(*, merchant_orgs(*)), profiles(*)')
      .single();
    if (error) throw error;
    return mapOrder(data as Record<string, unknown>);
  },

  async refundOrder(id, reason) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'refunded', cancellation_reason: reason })
      .eq('id', id)
      .select('*, listings(*), locations(*, merchant_orgs(*)), profiles(*)')
      .single();
    if (error) throw error;
    return mapOrder(data as Record<string, unknown>);
  },
};

// ─── wallet ──────────────────────────────────────────────────────────────────

const walletRepo: WalletRepository = {
  async getWallet(userId): Promise<Wallet> {
    const { data, error } = await supabase
      .from('wallets')
      .select('balance_thb, currency')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return {
      userId,
      balance: typeof data.balance_thb === 'number' ? data.balance_thb : 0,
      currency: (data.currency as string) ?? 'THB',
    };
  },

  async getTransactions(userId): Promise<WalletTransaction[]> {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id as string,
      userId,
      type: (row.type as WalletTransaction['type']) ?? 'purchase',
      amount: Math.abs(typeof row.amount_thb === 'number' ? row.amount_thb : 0),
      description: (row.description as string) ?? '',
      orderId: (row.order_id as string) ?? undefined,
      createdAt: (row.created_at as string) ?? new Date().toISOString(),
    }));
  },

  async topUp(userId, amount): Promise<Wallet> {
    const current = await walletRepo.getWallet(userId);
    const newBalance = current.balance + amount;
    await supabase.from('wallets').update({ balance_thb: newBalance }).eq('user_id', userId);
    await supabase.from('wallet_transactions').insert({
      user_id: userId,
      type: 'top_up',
      amount_thb: amount,
      description: `Top-up ฿${amount}`,
    });
    return { userId, balance: newBalance, currency: 'THB' };
  },

  async spend(userId, amount, description): Promise<Wallet> {
    const current = await walletRepo.getWallet(userId);
    const newBalance = current.balance - amount;
    await supabase.from('wallets').update({ balance_thb: newBalance }).eq('user_id', userId);
    await supabase.from('wallet_transactions').insert({
      user_id: userId,
      type: 'purchase',
      amount_thb: -amount,
      description,
    });
    return { userId, balance: newBalance, currency: 'THB' };
  },

  async refund(userId, amount, description): Promise<Wallet> {
    const current = await walletRepo.getWallet(userId);
    const newBalance = current.balance + amount;
    await supabase.from('wallets').update({ balance_thb: newBalance }).eq('user_id', userId);
    await supabase.from('wallet_transactions').insert({
      user_id: userId,
      type: 'refund',
      amount_thb: amount,
      description,
    });
    return { userId, balance: newBalance, currency: 'THB' };
  },

  async getRewards(userId): Promise<WalletReward> {
    const { data } = await supabase
      .from('wallet_rewards')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (!data) return { userId, points: 0, bonusBalance: 0, lifetimePoints: 0 };
    return {
      userId,
      points: typeof data.points === 'number' ? data.points : 0,
      bonusBalance: typeof data.bonus_balance_thb === 'number' ? data.bonus_balance_thb : 0,
      lifetimePoints: typeof data.lifetime_points === 'number' ? data.lifetime_points : 0,
    };
  },

  async addTopUpBonus(userId, topUpAmount): Promise<WalletReward> {
    const bonus = Math.floor(topUpAmount * 0.05);
    if (bonus <= 0) return walletRepo.getRewards(userId);
    const current = await walletRepo.getRewards(userId);
    const { error } = await supabase.from('wallet_rewards').upsert({
      user_id: userId,
      bonus_balance_thb: current.bonusBalance + bonus,
    });
    if (error) throw error;
    await supabase.from('wallet_transactions').insert({
      user_id: userId,
      type: 'top_up_bonus',
      amount_thb: bonus,
      description: `Top-up bonus ฿${bonus}`,
    });
    return walletRepo.getRewards(userId);
  },

  async addPurchasePoints(userId, amountSpent): Promise<WalletReward> {
    const points = Math.floor(amountSpent);
    if (points <= 0) return walletRepo.getRewards(userId);
    const current = await walletRepo.getRewards(userId);
    const { error } = await supabase.from('wallet_rewards').upsert({
      user_id: userId,
      points: current.points + points,
      lifetime_points: current.lifetimePoints + points,
    });
    if (error) throw error;
    await supabase.from('wallet_transactions').insert({
      user_id: userId,
      type: 'points_earned',
      amount_thb: 0,
      description: `Earned ${points} points`,
    });
    return walletRepo.getRewards(userId);
  },
};

// ─── notifications ───────────────────────────────────────────────────────────

const notificationsRepo: NotificationRepository = {
  async getNotifications(userId): Promise<Notification[]> {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    return (data ?? []).map((row) => ({
      id: row.id as string,
      userId,
      title: (row.title as string) ?? '',
      body: (row.body as string) ?? '',
      data: (row.data as Record<string, unknown>) ?? undefined,
      read: row.read === true,
      createdAt: (row.created_at as string) ?? new Date().toISOString(),
    }));
  },

  async markAsRead(userId, notificationId) {
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
  },

  async markAllAsRead(userId) {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
  },
};

// ─── analytics ───────────────────────────────────────────────────────────────

const analyticsRepo: AnalyticsRepository = {
  async getMerchantAnalytics(merchantId): Promise<MerchantAnalytics> {
    const { data: orders } = await supabase
      .from('orders')
      .select('amount_thb, created_at, status, listing_id, listings(name)')
      .eq('location_id', merchantId);

    const completedStatuses = ['collected', 'paid', 'completed'];
    const completed = (orders ?? []).filter((o) => completedStatuses.includes(o.status as string));
    const totalRevenue = completed.reduce((s, o) => s + ((o.amount_thb as number) ?? 0), 0);
    const totalOrders = completed.length;

    const todayStart = startOfDay();
    const todayCompleted = completed.filter((o) => (o.created_at as string) >= todayStart);
    const todayRevenue = todayCompleted.reduce((s, o) => s + ((o.amount_thb as number) ?? 0), 0);

    const weekStart = startOfWeek();
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
    const weeklyRevenue = weekDays.map((day) =>
      completed
        .filter((o) => (o.created_at as string).slice(0, 10) === day)
        .reduce((s, o) => s + ((o.amount_thb as number) ?? 0), 0)
    );
    const weeklyOrders = weekDays.map(
      (day) => completed.filter((o) => (o.created_at as string).slice(0, 10) === day).length
    );
    const weeklyItemsSaved = weeklyOrders;

    const hourlyRevenue = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      revenue: completed
        .filter((o) => new Date(o.created_at as string).getHours() === hour)
        .reduce((s, o) => s + ((o.amount_thb as number) ?? 0), 0),
    }));

    const listingRevenue: Record<string, { title: string; revenue: number; orders: number }> = {};
    completed.forEach((o) => {
      const id = (o.listing_id as string) ?? 'unknown';
      const listingsArray = (o.listings as { name?: string }[] | null) ?? [];
      const listing = listingsArray[0] ?? {};
      if (!listingRevenue[id]) {
        listingRevenue[id] = {
          title: listing.name ?? 'Unknown',
          revenue: 0,
          orders: 0,
        };
      }
      listingRevenue[id].revenue += (o.amount_thb as number) ?? 0;
      listingRevenue[id].orders += 1;
    });
    const topListings = Object.entries(listingRevenue)
      .map(([listingId, v]) => ({
        listingId,
        title: v.title,
        revenue: v.revenue,
        orders: v.orders,
        views: 0,
        clicks: 0,
        searchAppearances: 0,
        conversionRate: 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      merchantId,
      totalRevenue,
      totalOrders,
      totalItemsSaved: totalOrders,
      todayRevenue,
      todayOrders: todayCompleted.length,
      weeklyRevenue,
      weeklyOrders,
      weeklyItemsSaved,
      views: 0,
      conversionRate: totalOrders > 0 ? 0.15 : 0,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      topListings,
      hourlyRevenue,
      weeklyAOV: [0, 0, 0, 0],
      followerHistory: [],
    };
  },

  async getCustomerImpact(userId): Promise<CustomerImpact> {
    const { data } = await supabase
      .from('user_impact')
      .select('meals_saved, money_saved_thb, co2_saved_kg, orders_count')
      .eq('user_id', userId)
      .maybeSingle();
    if (!data) return { mealsSaved: 0, moneySaved: 0, co2SavedKg: 0, ordersCount: 0 };
    return {
      mealsSaved: typeof data.meals_saved === 'number' ? data.meals_saved : 0,
      moneySaved: typeof data.money_saved_thb === 'number' ? data.money_saved_thb : 0,
      co2SavedKg: typeof data.co2_saved_kg === 'number' ? data.co2_saved_kg : 0,
      ordersCount: typeof data.orders_count === 'number' ? data.orders_count : 0,
    };
  },

  async getFollowerHistory(merchantId): Promise<{ date: string; count: number }[]> {
    const { data, error } = await supabase
      .from('merchant_follower_history')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('date', { ascending: true })
      .limit(90);
    if (error) return [];
    return (data ?? []).map((r) => ({
      date: (r.date as string) ?? new Date().toISOString(),
      count: typeof r.count === 'number' ? r.count : 0,
    }));
  },
};

// ─── payouts ─────────────────────────────────────────────────────────────────

const payoutsRepo: PayoutRepository = {
  async getMerchantWallet(merchantId): Promise<MerchantWallet> {
    const { data: wallet, error } = await supabase
      .from('merchant_wallets')
      .select('*')
      .eq('merchant_id', merchantId)
      .maybeSingle();
    if (error || !wallet) {
      return {
        merchantId,
        balance: 0,
        currency: 'THB',
        totalEarnings: 0,
        pendingPayout: 0,
        commissionRate: 0.15,
      };
    }
    return {
      merchantId,
      balance: typeof wallet.balance_thb === 'number' ? wallet.balance_thb : 0,
      currency: (wallet.currency as string) ?? 'THB',
      totalEarnings: typeof wallet.total_earnings === 'number' ? wallet.total_earnings : 0,
      pendingPayout: typeof wallet.pending_payout === 'number' ? wallet.pending_payout : 0,
      commissionRate: typeof wallet.commission_rate === 'number' ? wallet.commission_rate : 0.15,
      lastPayoutDate: (wallet.last_payout_date as string) ?? undefined,
      nextPayoutDate: (wallet.next_payout_date as string) ?? undefined,
    };
  },
  async getPayoutTransactions(merchantId): Promise<PayoutTransaction[]> {
    const { data, error } = await supabase
      .from('payout_transactions')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data ?? []).map((r) => mapPayout(r as Record<string, unknown>));
  },
  async getBankAccounts(merchantId): Promise<BankAccount[]> {
    const { data, error } = await supabase
      .from('merchant_bank_accounts')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('is_default', { ascending: false });
    if (error) return [];
    return (data ?? []).map((r) => mapBankAccount(r as Record<string, unknown>));
  },
  async addBankAccount(merchantId, data): Promise<BankAccount> {
    const { data: row, error } = await supabase
      .from('merchant_bank_accounts')
      .insert({
        merchant_id: merchantId,
        bank_name: data.bankName,
        account_name: data.accountName,
        account_number: data.accountNumber,
        branch: data.branch,
        is_default: data.isDefault,
      })
      .select()
      .single();
    if (error) throw error;
    return mapBankAccount(row as Record<string, unknown>);
  },
  async setDefaultBankAccount(merchantId, accountId) {
    await supabase
      .from('merchant_bank_accounts')
      .update({ is_default: false })
      .eq('merchant_id', merchantId);
    await supabase
      .from('merchant_bank_accounts')
      .update({ is_default: true })
      .eq('id', accountId)
      .eq('merchant_id', merchantId);
  },
  async requestPayout(merchantId, amount): Promise<PayoutTransaction> {
    const accounts = await payoutsRepo.getBankAccounts(merchantId);
    const defaultAccount = accounts.find((a) => a.isDefault) ?? accounts[0];
    const { data: row, error } = await supabase
      .from('payout_transactions')
      .insert({
        merchant_id: merchantId,
        amount_thb: amount,
        status: 'pending',
        method: 'bank_transfer',
        bank_account_id: defaultAccount?.id ?? '',
        bank_account_name: defaultAccount
          ? `${defaultAccount.bankName} - ${defaultAccount.accountName}`
          : undefined,
      })
      .select()
      .single();
    if (error) throw error;
    return mapPayout(row as Record<string, unknown>);
  },
};

// ─── coupons ─────────────────────────────────────────────────────────────────

const couponsRepo: CouponRepository = {
  async getCoupons(merchantId): Promise<Coupon[]> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data ?? []).map((r) => mapCoupon(r as Record<string, unknown>));
  },
  async getCouponByCode(code, merchantId): Promise<Coupon | null> {
    const normalized = code.trim().toUpperCase();
    let query = supabase.from('coupons').select('*').ilike('code', normalized);
    if (merchantId) query = query.eq('merchant_id', merchantId);
    const { data, error } = await query.maybeSingle();
    if (error || !data) return null;
    return mapCoupon(data as Record<string, unknown>);
  },
  async createCoupon(merchantId, data): Promise<Coupon> {
    const { data: row, error } = await supabase
      .from('coupons')
      .insert({
        merchant_id: merchantId,
        code: data.code,
        description: data.description,
        discount_type: data.discountType,
        discount_value: data.discountValue,
        max_discount_amount_thb: data.maxDiscountAmount,
        min_order_amount: data.minOrderAmount,
        max_uses: data.maxUses,
        per_customer_max_uses: data.perCustomerMaxUses,
        first_time_customer_only: data.firstTimeCustomerOnly,
        applicable_categories: data.applicableCategories,
        applicable_listing_types: data.applicableListingTypes,
        valid_from: data.validFrom,
        valid_until: data.validUntil,
        status: data.status,
      })
      .select()
      .single();
    if (error) throw error;
    return mapCoupon(row as Record<string, unknown>);
  },
  async updateCoupon(id, data): Promise<Coupon> {
    const update: Record<string, unknown> = {};
    if (data.code) update.code = data.code;
    if (data.description) update.description = data.description;
    if (data.discountType) update.discount_type = data.discountType;
    if (data.discountValue !== undefined) update.discount_value = data.discountValue;
    if (data.maxDiscountAmount !== undefined) update.max_discount_amount_thb = data.maxDiscountAmount;
    if (data.minOrderAmount !== undefined) update.min_order_amount = data.minOrderAmount;
    if (data.maxUses !== undefined) update.max_uses = data.maxUses;
    if (data.perCustomerMaxUses !== undefined) update.per_customer_max_uses = data.perCustomerMaxUses;
    if (data.firstTimeCustomerOnly !== undefined) update.first_time_customer_only = data.firstTimeCustomerOnly;
    if (data.applicableCategories !== undefined) update.applicable_categories = data.applicableCategories;
    if (data.applicableListingTypes !== undefined)
      update.applicable_listing_types = data.applicableListingTypes;
    if (data.validFrom) update.valid_from = data.validFrom;
    if (data.validUntil) update.valid_until = data.validUntil;
    if (data.status) update.status = data.status;
    const { data: row, error } = await supabase
      .from('coupons')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapCoupon(row as Record<string, unknown>);
  },
  async deleteCoupon(id) {
    await supabase.from('coupons').delete().eq('id', id);
  },
  async validateCoupon(input): Promise<CouponValidationResult> {
    const coupon = await this.getCouponByCode(input.code, input.merchantId);
    if (!coupon) return { valid: false, discountAmount: 0, message: 'Coupon not found' };

    const now = new Date();
    if (coupon.status !== 'active') return { valid: false, discountAmount: 0, message: 'Coupon is inactive' };
    if (new Date(coupon.validFrom) > now)
      return { valid: false, discountAmount: 0, message: 'Coupon not yet valid' };
    if (new Date(coupon.validUntil) < now)
      return { valid: false, discountAmount: 0, message: 'Coupon expired' };

    const { data: totalUsesData, error: totalError } = await supabase.rpc('count_coupon_uses', {
      p_coupon_id: coupon.id,
    });
    if (totalError) throw totalError;
    const totalUses = typeof totalUsesData === 'number' ? totalUsesData : 0;
    if (coupon.maxUses != null && totalUses >= coupon.maxUses) {
      return { valid: false, discountAmount: 0, message: 'Coupon fully redeemed' };
    }

    const { data: customerUsesData, error: customerError } = await supabase.rpc(
      'count_customer_coupon_uses',
      { p_coupon_id: coupon.id, p_customer_id: input.customerId }
    );
    if (customerError) throw customerError;
    const customerUses = typeof customerUsesData === 'number' ? customerUsesData : 0;
    if (coupon.perCustomerMaxUses != null && customerUses >= coupon.perCustomerMaxUses) {
      return { valid: false, discountAmount: 0, message: 'You already used this coupon' };
    }

    if (coupon.firstTimeCustomerOnly) {
      const { data: hasOrders, error: firstError } = await supabase.rpc(
        'customer_has_completed_orders',
        { p_customer_id: input.customerId }
      );
      if (firstError) throw firstError;
      if (hasOrders) {
        return { valid: false, discountAmount: 0, message: 'First-time customers only' };
      }
    }

    if (input.subtotal < (coupon.minOrderAmount ?? 0)) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Minimum order ${coupon.minOrderAmount} THB required`,
      };
    }

    if (
      coupon.applicableCategories &&
      coupon.applicableCategories.length > 0 &&
      !coupon.applicableCategories.includes(input.listing.category)
    ) {
      return { valid: false, discountAmount: 0, message: 'Coupon not valid for this category' };
    }

    if (
      coupon.applicableListingTypes &&
      coupon.applicableListingTypes.length > 0 &&
      !coupon.applicableListingTypes.includes(input.listing.type)
    ) {
      return { valid: false, discountAmount: 0, message: 'Coupon not valid for this item type' };
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((input.subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    } else {
      discountAmount = Math.round(coupon.discountValue);
    }
    discountAmount = Math.min(discountAmount, input.subtotal);

    return { valid: true, coupon, discountAmount };
  },
  async recordCouponUse(couponId, customerId, orderId): Promise<void> {
    await supabase.from('coupon_uses').insert({
      coupon_id: couponId,
      customer_id: customerId,
      order_id: orderId,
    });
  },
};

// ─── messages ────────────────────────────────────────────────────────────────

const messagesRepo: MessageRepository = {
  async getConversations(merchantId): Promise<MerchantMessage[]> {
    const { data, error } = await supabase
      .from('merchant_messages')
      .select('*, profiles(display_name, avatar_url)')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });
    if (error) return [];

    const latestByCustomer = new Map<string, Record<string, unknown>>();
    (data ?? []).forEach((r) => {
      const customerId = r.customer_id as string;
      if (!latestByCustomer.has(customerId)) latestByCustomer.set(customerId, r);
    });

    return Array.from(latestByCustomer.values()).map((r) =>
      mapMessage(r as Record<string, unknown>)
    );
  },
  async getMessages(merchantId, customerId): Promise<MerchantMessage[]> {
    const { data, error } = await supabase
      .from('merchant_messages')
      .select('*, profiles(display_name, avatar_url)')
      .eq('merchant_id', merchantId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true });
    if (error) return [];
    return (data ?? []).map((r) => mapMessage(r as Record<string, unknown>));
  },
  async sendMessage(merchantId, customerId, content, sentBy): Promise<MerchantMessage> {
    const { data: row, error } = await supabase
      .from('merchant_messages')
      .insert({ merchant_id: merchantId, customer_id: customerId, content, sent_by: sentBy })
      .select('*, profiles(display_name, avatar_url)')
      .single();
    if (error) throw error;
    return mapMessage(row as Record<string, unknown>);
  },
  async sendWelcomeMessage(
    merchantId,
    customerId,
    customerName,
    orderId
  ): Promise<MerchantMessage> {
    const content = `Welcome, ${customerName}! Your order is confirmed.`;
    return messagesRepo.sendMessage(merchantId, customerId, content, 'merchant');
  },
  async markConversationAsRead(merchantId, customerId) {
    await supabase
      .from('merchant_messages')
      .update({ read: true })
      .eq('merchant_id', merchantId)
      .eq('customer_id', customerId)
      .neq('sent_by', 'merchant');
  },
};

// ─── export ──────────────────────────────────────────────────────────────────

export const supabaseRepositories: Repositories = {
  auth: authRepo,
  users: usersRepo,
  merchants: merchantsRepo,
  listings: listingsRepo,
  orders: ordersRepo,
  wallet: walletRepo,
  payouts: payoutsRepo,
  coupons: couponsRepo,
  messages: messagesRepo,
  notifications: notificationsRepo,
  analytics: analyticsRepo,
};
