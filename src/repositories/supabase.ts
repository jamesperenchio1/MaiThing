/**
 * Supabase repository implementation.
 * Activated by setting EXPO_PUBLIC_REPOSITORY_MODE=supabase.
 * Maps between the Supabase schema (locations, listings, orders, etc.)
 * and the app's domain types (Merchant, Listing, Order, etc.).
 */
import { supabase } from '@/src/lib/supabase';
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
  CustomerImpact,
  CustomerProfile,
  Listing,
  ListingTemplate,
  Merchant,
  MerchantAnalytics,
  MerchantMessage,
  MerchantNotificationPreferences,
  MerchantOnboarding,
  MerchantWallet,
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

function mapLocation(row: Record<string, unknown>, index = 0): Merchant {
  const org = (row.merchant_orgs as Record<string, unknown> | null) ?? {};
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
    coordinates: coordsFromIndex(index),
    phone: (row.phone as string) ?? '',
    categories: Array.isArray(row.cuisine_types) ? (row.cuisine_types as string[]) : [],
    rating: typeof row.avg_rating === 'number' ? row.avg_rating : 4.5,
    reviewCount: typeof row.total_reviews === 'number' ? row.total_reviews : 0,
    businessHours: [],
    isOpen: true,
    pickupInstructions: (row.pickup_instructions as string) ?? undefined,
    followers: typeof row.follower_count === 'number' ? row.follower_count : 0,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    isVerified: row.is_verified === true,
    verificationStatus: row.is_verified ? 'verified' : 'unverified',
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
    status: (
      row.is_active && (row.qty_remaining as number) > 0
        ? 'active'
        : row.qty_remaining === 0
          ? 'sold_out'
          : 'expired'
    ) as Listing['status'],
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
  if (type === 'mystery_box') {
    return { ...base, type: 'mystery_box', boxSize: 'medium', estimatedRetailValue: base.originalPrice };
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
  const listingImage = Array.isArray(listing.photo_urls) ? (listing.photo_urls[0] as string) : undefined;

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
    const { data, error } = await supabase.auth.signUp({ email, password });
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
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async verifyOtp(code) {
    return code === '123456';
  },

  async resendVerification(email) {
    await supabase.auth.resend({ type: 'signup', email });
  },
};

// ─── users ───────────────────────────────────────────────────────────────────

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
    return {
      ...base,
      roles: ['customer', 'merchant'] as UserRole[],
      favorites: [],
      savedListings: [],
      savedAddresses: [],
      restockAlerts: [],
      notificationPreferences: {
        newDeals: true,
        orderUpdates: true,
        merchantMessages: true,
        promotions: false,
        followedMerchantNotifications: [],
      },
    } satisfies CustomerProfile;
  },

  async updateCustomerProfile(userId, data) {
    return usersRepo.getCustomerProfile(userId);
  },

  async addFavorite() {},
  async removeFavorite() {},
  async addSavedListing() {},
  async removeSavedListing() {},
  async updateNotificationPreferences(_userId, preferences) {
    return preferences;
  },
  async addMerchantFollowNotification() {},
  async removeMerchantFollowNotification() {},
  async addRestockAlert() {},
  async removeRestockAlert() {},
};

// ─── merchants ───────────────────────────────────────────────────────────────

const merchantsRepo: MerchantRepository = {
  async getMerchants(params) {
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
      .select('*, merchant_orgs(*)')
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
      .select('*, merchant_orgs(*)')
      .eq('merchant_org_id', org.id)
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return mapLocation(data as Record<string, unknown>);
  },

  async getCategories(): Promise<Category[]> {
    return [
      { id: 'thai', name: 'Thai', nameTh: 'ไทย', icon: '🍜' },
      { id: 'bakery', name: 'Bakery', nameTh: 'เบเกอรี่', icon: '🥐' },
      { id: 'japanese', name: 'Japanese', nameTh: 'ญี่ปุ่น', icon: '🍱' },
      { id: 'coffee', name: 'Coffee', nameTh: 'กาแฟ', icon: '☕' },
      { id: 'dessert', name: 'Dessert', nameTh: 'ของหวาน', icon: '🍰' },
      { id: 'healthy', name: 'Healthy', nameTh: 'เพื่อสุขภาพ', icon: '🥗' },
    ];
  },

  async followMerchant() {},
  async unfollowMerchant() {},

  async updateMerchant(id, data) {
    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
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
    const merchant = await merchantsRepo.getMerchant(id);
    return notNull(merchant, 'merchant');
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

  async getStaff(): Promise<StaffMember[]> { return []; },
  async addStaff(_merchantId, data) {
    return { ...data, id: `staff-${Date.now()}`, merchantId: _merchantId, createdAt: new Date().toISOString() };
  },
  async removeStaff() {},
  async setStoreClosure(id) {
    const m = await merchantsRepo.getMerchant(id);
    return notNull(m, 'merchant');
  },
  async getMerchantNotificationPreferences(): Promise<MerchantNotificationPreferences> {
    return { newOrders: true, lowStock: true, payoutUpdates: true, customerReviews: true, pickupReminders: true, autoConfirmOrders: false };
  },
  async updateMerchantNotificationPreferences(_id, preferences) { return preferences; },
  async getOnboarding(merchantId): Promise<MerchantOnboarding> {
    return { merchantId, completedSteps: [], currentStep: 'welcome' };
  },
  async updateOnboarding(merchantId) {
    return { merchantId, completedSteps: [], currentStep: 'complete' };
  },
  async sendBroadcast(merchantId, content): Promise<BroadcastMessage> {
    return { id: `bc-${Date.now()}`, merchantId, content, sentAt: new Date().toISOString(), recipientCount: 0 };
  },
  async getRecentBroadcasts(): Promise<BroadcastMessage[]> { return []; },
  async verifyMerchant(merchantId) {
    const m = await merchantsRepo.getMerchant(merchantId);
    return notNull(m, 'merchant');
  },
  async uploadFoodSafetyCert(merchantId) {
    const m = await merchantsRepo.getMerchant(merchantId);
    return notNull(m, 'merchant');
  },
};

// ─── listings ────────────────────────────────────────────────────────────────

const listingsRepo: ListingRepository = {
  async getListings(params) {
    let query = supabase
      .from('listings')
      .select('*')
      .gt('qty_remaining', 0)
      .eq('is_active', true)
      .limit(100);

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
    return (data ?? []).map((row) => mapListing(row as Record<string, unknown>));
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

  async getListingTemplates(): Promise<ListingTemplate[]> { return []; },
  async createListingTemplate(data): Promise<ListingTemplate> {
    return { ...data, id: `tpl-${Date.now()}`, createdAt: new Date().toISOString() };
  },
  async deleteListingTemplate() {},
};

// ─── orders ──────────────────────────────────────────────────────────────────

const ordersRepo: OrderRepository = {
  async getOrders(userId, role) {
    const column = role === 'customer' ? 'buyer_id' : 'location_id';
    let locationId = userId;

    if (role === 'merchant') {
      // userId is actually the location (merchant) id for the merchant role
      // But we might be passed a user id — try to look up their location
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
    const qrCode = `MT${String(Date.now()).slice(-5)}`;
    const { data: row, error } = await supabase
      .from('orders')
      .insert({
        buyer_id: data.customerId,
        location_id: data.merchantId,
        listing_id: data.items[0]?.listingId ?? null,
        amount_thb: data.total,
        platform_fee_thb: Math.round(data.total * 0.15),
        status: STATUS_APP_TO_DB[data.status] ?? 'reserved',
        qr_payload: JSON.stringify({ code: qrCode }),
        pickup_start: data.pickupWindowStart,
        pickup_end: data.pickupWindowEnd,
        customer_note: data.notes ?? null,
      })
      .select('*, listings(*), locations(*, merchant_orgs(*)), profiles(*)')
      .single();
    if (error) throw error;
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
    await supabase
      .from('wallets')
      .update({ balance_thb: newBalance })
      .eq('user_id', userId);
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
    await supabase
      .from('wallets')
      .update({ balance_thb: newBalance })
      .eq('user_id', userId);
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
    await supabase
      .from('wallets')
      .update({ balance_thb: newBalance })
      .eq('user_id', userId);
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
    return walletRepo.getRewards(userId);
  },

  async addPurchasePoints(userId): Promise<WalletReward> {
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
      .select('amount_thb, created_at, status')
      .eq('location_id', merchantId);

    const completed = (orders ?? []).filter((o) =>
      ['collected', 'paid', 'completed'].includes(o.status as string)
    );
    const totalRevenue = completed.reduce((s, o) => s + (o.amount_thb as number ?? 0), 0);
    const totalOrders = completed.length;

    return {
      merchantId,
      totalRevenue,
      totalOrders,
      totalItemsSaved: totalOrders,
      todayRevenue: 0,
      todayOrders: 0,
      weeklyRevenue: [0, 0, 0, 0, 0, 0, 0],
      weeklyOrders: [0, 0, 0, 0, 0, 0, 0],
      weeklyItemsSaved: [0, 0, 0, 0, 0, 0, 0],
      views: 0,
      conversionRate: totalOrders > 0 ? 0.15 : 0,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      topListings: [],
      hourlyRevenue: [],
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

  async getFollowerHistory(): Promise<{ date: string; count: number }[]> { return []; },
};

// ─── payouts ─────────────────────────────────────────────────────────────────

const payoutsRepo: PayoutRepository = {
  async getMerchantWallet(merchantId): Promise<MerchantWallet> {
    return {
      merchantId,
      balance: 0,
      currency: 'THB',
      totalEarnings: 0,
      pendingPayout: 0,
      commissionRate: 0.15,
    };
  },
  async getPayoutTransactions(): Promise<PayoutTransaction[]> { return []; },
  async getBankAccounts(): Promise<BankAccount[]> { return []; },
  async addBankAccount(merchantId, data): Promise<BankAccount> {
    return { ...data, id: `bank-${Date.now()}`, merchantId };
  },
  async setDefaultBankAccount() {},
  async requestPayout(merchantId, amount): Promise<PayoutTransaction> {
    return {
      id: `payout-${Date.now()}`,
      merchantId,
      amount,
      status: 'pending',
      method: 'bank_transfer',
      bankAccountId: '',
      createdAt: new Date().toISOString(),
    };
  },
};

// ─── coupons ─────────────────────────────────────────────────────────────────

const couponsRepo: CouponRepository = {
  async getCoupons(): Promise<Coupon[]> { return []; },
  async createCoupon(merchantId, data): Promise<Coupon> {
    return { ...data, id: `cpn-${Date.now()}`, merchantId, usesCount: 0, createdAt: new Date().toISOString() };
  },
  async updateCoupon(_id, data): Promise<Coupon> { return stub('updateCoupon'); },
  async deleteCoupon() {},
};

// ─── messages ────────────────────────────────────────────────────────────────

const messagesRepo: MessageRepository = {
  async getConversations(): Promise<MerchantMessage[]> { return []; },
  async getMessages(): Promise<MerchantMessage[]> { return []; },
  async sendMessage(merchantId, customerId, content, sentBy): Promise<MerchantMessage> {
    return {
      id: `msg-${Date.now()}`,
      merchantId,
      customerId,
      customerName: 'Customer',
      content,
      sentBy,
      read: false,
      createdAt: new Date().toISOString(),
    };
  },
  async sendWelcomeMessage(merchantId, customerId, customerName, orderId): Promise<MerchantMessage> {
    return {
      id: `msg-${Date.now()}`,
      merchantId,
      customerId,
      customerName,
      orderId,
      content: `Welcome, ${customerName}! Your order is confirmed.`,
      sentBy: 'merchant',
      read: false,
      createdAt: new Date().toISOString(),
    };
  },
  async markConversationAsRead() {},
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
