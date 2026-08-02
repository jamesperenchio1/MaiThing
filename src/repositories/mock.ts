import { calculateDistance } from '@/src/lib/utils';
import { syncFollowNotification, syncRestockAlert } from '@/src/services/pushToken';
import { triggerPushEvent } from '@/src/lib/supabase';
import type {
  AuthRepository,
  UserRepository,
  MerchantRepository,
  ListingRepository,
  OrderRepository,
  WalletRepository,
  PayoutRepository,
  CouponRepository,
  MessageRepository,
  NotificationRepository,
  AnalyticsRepository,
} from './interfaces';
import {
  ALL_USERS,
  BANK_ACCOUNTS,
  CATEGORIES,
  COUPONS,
  CUSTOMER_WALLET,
  LISTINGS,
  LISTING_TEMPLATES,
  MERCHANTS,
  MERCHANT_ANALYTICS,
  MERCHANT_MESSAGES,
  MERCHANT_NOTIFICATION_PREFS,
  MERCHANT_ONBOARDING,
  MERCHANT_WALLET,
  NOTIFICATIONS,
  ORDERS,
  PAYOUT_TRANSACTIONS,
  REVIEWS,
  STAFF_MEMBERS,
  TEST_CUSTOMER,
  TEST_CUSTOMER_PROFILE,
  TEST_MERCHANT_ID,
  TEST_MERCHANT_USER,
  WALLET_TRANSACTIONS,
} from './seed';
import type {
  BankAccount,
  BroadcastMessage,
  BusinessHours,
  Coupon,
  CustomerImpact,
  CustomerProfile,
  Listing,
  ListingStatus,
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
  PayoutTransaction,
  Review,
  StaffMember,
  User,
  Wallet,
  WalletReward,
  WalletTransaction,
} from '@/src/types';

// In-memory store for broadcast messages
const BROADCAST_MESSAGES: BroadcastMessage[] = [];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class MockAuthRepository implements AuthRepository {
  async signIn(email: string, password: string): Promise<User> {
    await sleep(50);
    if (email === TEST_CUSTOMER.email && password === 'password') {
      return TEST_CUSTOMER;
    }
    if (email === TEST_MERCHANT_USER.email && password === 'password') {
      return TEST_MERCHANT_USER;
    }
    const user = ALL_USERS.find((u) => u.email === email);
    if (user) return user;
    throw new Error('Invalid email or password');
  }

  async signUp(email: string, password: string, name: string): Promise<User> {
    await sleep(50);
    const user: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      roles: ['customer'],
      preferredLanguage: 'en',
      createdAt: new Date().toISOString(),
    };
    ALL_USERS.push(user);
    return user;
  }

  async registerMerchant(data: {
    email: string;
    password: string;
    name: string;
    businessName: string;
    phone: string;
  }): Promise<User> {
    await sleep(50);
    const userId = `user-${Date.now()}`;
    const merchantId = `merchant-${Date.now()}`;
    const user: User = {
      id: userId,
      email: data.email,
      name: data.name,
      phone: data.phone,
      roles: ['merchant'],
      preferredLanguage: 'en',
      createdAt: new Date().toISOString(),
    };
    const merchant: Merchant = {
      id: merchantId,
      ownerId: userId,
      name: data.businessName,
      slug: data.businessName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, ''),
      description: '',
      address: {
        street: '',
        subDistrict: '',
        district: '',
        province: 'Bangkok',
        postalCode: '',
        country: 'Thailand',
      },
      coordinates: { latitude: 13.7563, longitude: 100.5018 },
      phone: data.phone,
      categories: [],
      rating: 0,
      reviewCount: 0,
      businessHours: [
        { day: 1, open: '08:00', close: '20:00' },
        { day: 2, open: '08:00', close: '20:00' },
        { day: 3, open: '08:00', close: '20:00' },
        { day: 4, open: '08:00', close: '20:00' },
        { day: 5, open: '08:00', close: '20:00' },
      ],
      isOpen: false,
      pickupInstructions: '',
      followers: 0,
      createdAt: new Date().toISOString(),
      isVerified: false,
      joinedAt: new Date().toISOString(),
      hygieneRating: 5,
    };
    ALL_USERS.push(user);
    MERCHANTS.push(merchant);
    return user;
  }

  async signOut(): Promise<void> {
    await sleep(20);
  }

  async resetPassword(email: string): Promise<void> {
    await sleep(30);
  }

  async verifyOtp(code: string): Promise<boolean> {
    await sleep(30);
    return code === '123456';
  }

  async resendVerification(email: string): Promise<void> {
    await sleep(30);
  }
}

class MockUserRepository implements UserRepository {
  async getCurrentUser(): Promise<User | null> {
    await sleep(30);
    return null;
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    await sleep(30);
    const user = ALL_USERS.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    Object.assign(user, data);
    return user;
  }

  async updateCustomerProfile(
    userId: string,
    data: Partial<CustomerProfile>
  ): Promise<CustomerProfile> {
    await sleep(30);
    Object.assign(TEST_CUSTOMER_PROFILE, data);
    return TEST_CUSTOMER_PROFILE;
  }

  async getCustomerProfile(userId: string): Promise<CustomerProfile> {
    await sleep(30);
    return TEST_CUSTOMER_PROFILE;
  }

  async addFavorite(userId: string, merchantId: string): Promise<void> {
    await sleep(20);
    if (!TEST_CUSTOMER_PROFILE.favorites.includes(merchantId)) {
      TEST_CUSTOMER_PROFILE.favorites.push(merchantId);
    }
  }

  async removeFavorite(userId: string, merchantId: string): Promise<void> {
    await sleep(20);
    TEST_CUSTOMER_PROFILE.favorites = TEST_CUSTOMER_PROFILE.favorites.filter(
      (id) => id !== merchantId
    );
  }

  async addSavedListing(userId: string, listingId: string): Promise<void> {
    await sleep(20);
    if (!TEST_CUSTOMER_PROFILE.savedListings) {
      TEST_CUSTOMER_PROFILE.savedListings = [];
    }
    if (!TEST_CUSTOMER_PROFILE.savedListings.includes(listingId)) {
      TEST_CUSTOMER_PROFILE.savedListings.push(listingId);
    }
  }

  async removeSavedListing(userId: string, listingId: string): Promise<void> {
    await sleep(20);
    TEST_CUSTOMER_PROFILE.savedListings = (TEST_CUSTOMER_PROFILE.savedListings ?? []).filter(
      (id) => id !== listingId
    );
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences> {
    await sleep(20);
    TEST_CUSTOMER_PROFILE.notificationPreferences = { ...preferences };
    return TEST_CUSTOMER_PROFILE.notificationPreferences;
  }

  async addMerchantFollowNotification(userId: string, merchantId: string): Promise<void> {
    await sleep(15);
    const prefs = TEST_CUSTOMER_PROFILE.notificationPreferences;
    if (!prefs.followedMerchantNotifications.includes(merchantId)) {
      prefs.followedMerchantNotifications = [...prefs.followedMerchantNotifications, merchantId];
    }
    syncFollowNotification(userId, merchantId, true).catch(() => {});
  }

  async removeMerchantFollowNotification(userId: string, merchantId: string): Promise<void> {
    await sleep(15);
    const prefs = TEST_CUSTOMER_PROFILE.notificationPreferences;
    prefs.followedMerchantNotifications = prefs.followedMerchantNotifications.filter(
      (id) => id !== merchantId
    );
    syncFollowNotification(userId, merchantId, false).catch(() => {});
  }

  async addRestockAlert(userId: string, listingId: string): Promise<void> {
    await sleep(15);
    if (!TEST_CUSTOMER_PROFILE.restockAlerts) TEST_CUSTOMER_PROFILE.restockAlerts = [];
    if (!TEST_CUSTOMER_PROFILE.restockAlerts.includes(listingId)) {
      TEST_CUSTOMER_PROFILE.restockAlerts = [...TEST_CUSTOMER_PROFILE.restockAlerts, listingId];
    }
    syncRestockAlert(userId, listingId, true).catch(() => {});
  }

  async removeRestockAlert(userId: string, listingId: string): Promise<void> {
    await sleep(15);
    TEST_CUSTOMER_PROFILE.restockAlerts = (TEST_CUSTOMER_PROFILE.restockAlerts ?? []).filter(
      (id) => id !== listingId
    );
    syncRestockAlert(userId, listingId, false).catch(() => {});
  }
}

class MockMerchantRepository implements MerchantRepository {
  async getMerchants(params?: {
    lat?: number;
    lng?: number;
    radius?: number;
    category?: string;
    query?: string;
  }): Promise<Merchant[]> {
    await sleep(30);
    let result = [...MERCHANTS];

    if (params?.query) {
      const q = params.query.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.categories.some((c) => c.toLowerCase().includes(q))
      );
    }

    if (params?.category && params.category !== 'all') {
      result = result.filter((m) => m.categories.includes(params.category!));
    }

    if (params?.lat != null && params?.lng != null) {
      const center = { latitude: params.lat, longitude: params.lng };
      result = result.map((m) => ({
        ...m,
        distance: calculateDistance(center, m.coordinates),
      }));
      if (params?.radius != null) {
        result = result.filter((m) => m.distance! <= params.radius!);
      }
      result.sort((a, b) => a.distance! - b.distance!);
    }

    return result;
  }

  async getMerchant(id: string): Promise<Merchant | null> {
    await sleep(20);
    return MERCHANTS.find((m) => m.id === id) ?? null;
  }

  async getMerchantByOwnerId(ownerId: string): Promise<Merchant | null> {
    await sleep(20);
    return MERCHANTS.find((m) => m.ownerId === ownerId) ?? null;
  }

  async getCategories(): Promise<{ id: string; name: string; nameTh: string; icon: string }[]> {
    await sleep(20);
    return CATEGORIES;
  }

  async updateMerchant(id: string, data: Partial<Merchant>): Promise<Merchant> {
    await sleep(30);
    const index = MERCHANTS.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Merchant not found');
    MERCHANTS[index] = { ...MERCHANTS[index], ...data } as Merchant;
    return MERCHANTS[index];
  }

  async updateBusinessHours(id: string, hours: BusinessHours[]): Promise<Merchant> {
    await sleep(30);
    const index = MERCHANTS.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Merchant not found');
    MERCHANTS[index].businessHours = [...hours];
    return MERCHANTS[index];
  }

  async updatePickupInstructions(id: string, instructions: string): Promise<Merchant> {
    await sleep(30);
    const index = MERCHANTS.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Merchant not found');
    MERCHANTS[index].pickupInstructions = instructions;
    return MERCHANTS[index];
  }

  async setStoreClosure(merchantId: string, closedUntil: string | null): Promise<Merchant> {
    await sleep(30);
    const index = MERCHANTS.findIndex((m) => m.id === merchantId);
    if (index === -1) throw new Error('Merchant not found');
    if (closedUntil === null) {
      delete MERCHANTS[index].closedUntil;
      MERCHANTS[index].isOpen = true;
    } else {
      MERCHANTS[index].closedUntil = closedUntil;
      MERCHANTS[index].isOpen = new Date(closedUntil) <= new Date();
    }
    return MERCHANTS[index];
  }

  async getReviews(merchantId: string): Promise<Review[]> {
    await sleep(20);
    return REVIEWS.filter((r) => r.merchantId === merchantId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async replyToReview(reviewId: string, reply: string): Promise<Review> {
    await sleep(30);
    const review = REVIEWS.find((r) => r.id === reviewId);
    if (!review) throw new Error('Review not found');
    review.merchantReply = reply;
    review.merchantRepliedAt = new Date().toISOString();
    return review;
  }

  async submitReview(
    data: Omit<Review, 'id' | 'createdAt' | 'merchantReply' | 'merchantRepliedAt'>
  ): Promise<Review> {
    await sleep(30);
    const review: Review = {
      ...data,
      id: `review_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    REVIEWS.push(review);
    return review;
  }

  async getStaff(merchantId: string): Promise<StaffMember[]> {
    await sleep(20);
    return STAFF_MEMBERS.filter((s) => s.merchantId === merchantId).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  async addStaff(
    merchantId: string,
    data: Omit<StaffMember, 'id' | 'merchantId' | 'createdAt'>
  ): Promise<StaffMember> {
    await sleep(30);
    const staff: StaffMember = {
      ...data,
      id: `staff-${Date.now()}`,
      merchantId,
      createdAt: new Date().toISOString(),
    };
    STAFF_MEMBERS.push(staff);
    return staff;
  }

  async removeStaff(merchantId: string, staffId: string): Promise<void> {
    await sleep(30);
    const index = STAFF_MEMBERS.findIndex((s) => s.merchantId === merchantId && s.id === staffId);
    if (index !== -1) STAFF_MEMBERS.splice(index, 1);
  }

  async getMerchantNotificationPreferences(
    merchantId: string
  ): Promise<MerchantNotificationPreferences> {
    await sleep(20);
    return { ...MERCHANT_NOTIFICATION_PREFS };
  }

  async updateMerchantNotificationPreferences(
    merchantId: string,
    preferences: MerchantNotificationPreferences
  ): Promise<MerchantNotificationPreferences> {
    await sleep(20);
    Object.assign(MERCHANT_NOTIFICATION_PREFS, preferences);
    return { ...MERCHANT_NOTIFICATION_PREFS };
  }

  async getOnboarding(merchantId: string): Promise<MerchantOnboarding> {
    await sleep(20);
    return { ...MERCHANT_ONBOARDING, merchantId };
  }

  async updateOnboarding(
    merchantId: string,
    step: keyof MerchantOnboarding
  ): Promise<MerchantOnboarding> {
    await sleep(20);
    if (step === 'currentStep') {
      MERCHANT_ONBOARDING.currentStep = 'complete';
    } else if (step === 'completedSteps') {
      // no-op marker
    }
    return { ...MERCHANT_ONBOARDING, merchantId };
  }

  async followMerchant(userId: string, merchantId: string): Promise<void> {
    await sleep(20);
    const merchant = MERCHANTS.find((m) => m.id === merchantId);
    if (merchant) merchant.followers += 1;
  }

  async unfollowMerchant(userId: string, merchantId: string): Promise<void> {
    await sleep(20);
    const merchant = MERCHANTS.find((m) => m.id === merchantId);
    if (merchant) merchant.followers = Math.max(0, merchant.followers - 1);
  }

  async verifyMerchant(merchantId: string, override?: boolean): Promise<Merchant> {
    await sleep(50);
    const index = MERCHANTS.findIndex((m) => m.id === merchantId);
    if (index === -1) throw new Error('Merchant not found');
    MERCHANTS[index].verificationStatus = 'verified';
    MERCHANTS[index].isVerified = true;
    return MERCHANTS[index];
  }

  async uploadFoodSafetyCert(merchantId: string, certUrl: string): Promise<Merchant> {
    await sleep(50);
    const index = MERCHANTS.findIndex((m) => m.id === merchantId);
    if (index === -1) throw new Error('Merchant not found');
    MERCHANTS[index].foodSafetyCertUrl = certUrl;
    return MERCHANTS[index];
  }

  async sendBroadcast(merchantId: string, content: string): Promise<BroadcastMessage> {
    await sleep(50);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentBroadcast = BROADCAST_MESSAGES.find(
      (b) => b.merchantId === merchantId && new Date(b.sentAt) > oneDayAgo
    );
    if (recentBroadcast) {
      throw new Error('Rate limit: one broadcast per day');
    }
    const merchant = MERCHANTS.find((m) => m.id === merchantId);
    const broadcast: BroadcastMessage = {
      id: `broadcast-${Date.now()}`,
      merchantId,
      content,
      sentAt: new Date().toISOString(),
      recipientCount: merchant?.followers ?? 0,
    };
    BROADCAST_MESSAGES.unshift(broadcast);
    return broadcast;
  }

  async getRecentBroadcasts(merchantId: string): Promise<BroadcastMessage[]> {
    await sleep(20);
    return BROADCAST_MESSAGES.filter((b) => b.merchantId === merchantId).slice(0, 5);
  }
}

class MockListingRepository implements ListingRepository {
  async getListings(params?: {
    merchantId?: string;
    category?: string;
    query?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    type?: string;
    sortBy?: 'distance' | 'price_asc' | 'price_desc' | 'discount' | 'newest' | 'top_rated' | 'going_fast';
    dietaryTags?: string[];
    allergens?: string[];
    maxPrice?: number;
    minMerchantRating?: number;
  }): Promise<Listing[]> {
    await sleep(30);
    let result = LISTINGS.filter((l) => l.status === 'active');

    if (params?.merchantId) {
      result = result.filter((l) => l.merchantId === params.merchantId);
    }

    if (params?.category && params.category !== 'all') {
      result = result.filter((l) => l.category === params.category);
    }

    if (params?.type) {
      result = result.filter((l) => l.type === params.type);
    }

    if (params?.query) {
      const q = params.query.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q)
      );
    }

    if (params?.dietaryTags && params.dietaryTags.length > 0) {
      result = result.filter((l) =>
        params.dietaryTags!.every((tag) => l.dietaryTags.includes(tag))
      );
    }

    if (params?.allergens && params.allergens.length > 0) {
      result = result.filter(
        (l) => !params.allergens!.some((allergen) => l.allergens.includes(allergen))
      );
    }

    if (params?.maxPrice !== undefined && params.maxPrice > 0) {
      result = result.filter((l) => l.salePrice <= params.maxPrice!);
    }

    if (params?.minMerchantRating != null && params.minMerchantRating > 0) {
      const merchantMap = new Map(MERCHANTS.map((m) => [m.id, m]));
      result = result.filter(
        (l) => (merchantMap.get(l.merchantId)?.rating ?? 0) >= params.minMerchantRating!
      );
    }

    const center =
      params?.lat != null && params?.lng != null
        ? { latitude: params.lat, longitude: params.lng }
        : undefined;
    if (center) {
      result = result.map((l) => {
        const merchant = MERCHANTS.find((m) => m.id === l.merchantId);
        return {
          ...l,
          distance: merchant ? calculateDistance(center, merchant.coordinates) : undefined,
        };
      });
      if (params?.radius != null) {
        result = result.filter((l) => l.distance == null || l.distance <= params.radius!);
      }
    }

    switch (params?.sortBy) {
      case 'distance':
        result.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
        break;
      case 'price_asc':
        result.sort((a, b) => a.salePrice - b.salePrice);
        break;
      case 'price_desc':
        result.sort((a, b) => b.salePrice - a.salePrice);
        break;
      case 'discount':
        result.sort((a, b) => b.originalPrice - b.salePrice - (a.originalPrice - a.salePrice));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'top_rated': {
        const merchantRatingMap = new Map(MERCHANTS.map((m) => [m.id, m.rating]));
        result.sort(
          (a, b) => (merchantRatingMap.get(b.merchantId) ?? 0) - (merchantRatingMap.get(a.merchantId) ?? 0)
        );
        break;
      }
      case 'going_fast':
        result.sort((a, b) => a.quantityRemaining - b.quantityRemaining);
        break;
      default:
        if (center) {
          result.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
        }
        break;
    }

    return result;
  }

  async getListing(id: string): Promise<Listing | null> {
    await sleep(20);
    return LISTINGS.find((l) => l.id === id) ?? null;
  }

  async createListing(data: Omit<Listing, 'id' | 'createdAt'>): Promise<Listing> {
    await sleep(50);
    const listing = {
      ...data,
      id: `listing-${Date.now()}`,
      createdAt: new Date().toISOString(),
    } as unknown as Listing;
    LISTINGS.push(listing);

    // Fire new-listing push to merchant followers (fire-and-forget)
    if (data.status === 'active') {
      const merchant = MERCHANTS.find((m) => m.id === data.merchantId);
      if (merchant) {
        triggerPushEvent('new_listing', {
          merchantId: data.merchantId,
          merchantName: merchant.name,
          listingId: listing.id,
          listingTitle: listing.title,
        }).catch(() => {});
      }
    }

    return listing;
  }

  async updateListing(id: string, data: Partial<Listing>): Promise<Listing> {
    await sleep(30);
    const index = LISTINGS.findIndex((l) => l.id === id);
    if (index === -1) throw new Error('Listing not found');
    const before = LISTINGS[index];
    LISTINGS[index] = { ...before, ...data } as Listing;
    const after = LISTINGS[index];

    // Fire restock push when quantity goes from 0 to >0
    const wasZero = before.quantityRemaining === 0;
    const nowPositive = (after.quantityRemaining ?? 0) > 0;
    if (wasZero && nowPositive) {
      triggerPushEvent('restock', {
        listingId: after.id,
        listingTitle: after.title,
      }).catch(() => {});
    }

    // Auto-delist when sold out
    if (after.autoDelistWhenSoldOut && after.quantityRemaining === 0 && after.status === 'active') {
      LISTINGS[index] = { ...after, status: 'sold_out' };
    }

    return LISTINGS[index];
  }

  async deleteListing(id: string): Promise<void> {
    await sleep(30);
    const index = LISTINGS.findIndex((l) => l.id === id);
    if (index !== -1) LISTINGS.splice(index, 1);
  }

  async getListingTemplates(merchantId: string): Promise<ListingTemplate[]> {
    await sleep(20);
    return LISTING_TEMPLATES.filter((t) => t.merchantId === merchantId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createListingTemplate(
    data: Omit<ListingTemplate, 'id' | 'createdAt'>
  ): Promise<ListingTemplate> {
    await sleep(30);
    const now = new Date();
    const template: ListingTemplate = {
      ...data,
      id: `template-${Date.now()}`,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    };
    LISTING_TEMPLATES.push(template);
    return template;
  }

  async deleteListingTemplate(id: string): Promise<void> {
    await sleep(30);
    const index = LISTING_TEMPLATES.findIndex((t) => t.id === id);
    if (index !== -1) LISTING_TEMPLATES.splice(index, 1);
  }
}

class MockOrderRepository implements OrderRepository {
  async getOrders(userId: string, role: 'customer' | 'merchant'): Promise<Order[]> {
    await sleep(30);
    if (role === 'customer') {
      return ORDERS.filter((o) => o.customerId === userId).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    const merchant = MERCHANTS.find((m) => m.ownerId === userId);
    const merchantId = merchant?.id ?? userId;
    return ORDERS.filter((o) => o.merchantId === merchantId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getOrder(id: string): Promise<Order | null> {
    await sleep(20);
    return ORDERS.find((o) => o.id === id) ?? null;
  }

  async getOrderByPickupCode(merchantId: string, code: string): Promise<Order | null> {
    await sleep(20);
    const normalized = code.trim().toUpperCase();
    return (
      ORDERS.find(
        (o) =>
          o.merchantId === merchantId &&
          o.pickupCode.toUpperCase() === normalized &&
          o.status !== 'cancelled' &&
          o.status !== 'completed'
      ) ?? null
    );
  }

  async createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    await sleep(50);
    const autoConfirm = MERCHANT_NOTIFICATION_PREFS.autoConfirmOrders;
    const merchant = MERCHANTS.find((m) => m.id === data.merchantId);
    const order: Order = {
      ...data,
      status: autoConfirm && data.status === 'pending' ? 'confirmed' : data.status,
      id: `order-${Date.now()}`,
      merchantCoordinates: data.merchantCoordinates ?? merchant?.coordinates,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    ORDERS.unshift(order);

    // Reduce inventory
    for (const item of data.items) {
      const listing = LISTINGS.find((l) => l.id === item.listingId);
      if (listing) {
        listing.quantityRemaining = Math.max(0, listing.quantityRemaining - item.quantity);
        if (listing.quantityRemaining === 0) listing.status = 'sold_out';
      }
    }

    return order;
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    await sleep(30);
    const index = ORDERS.findIndex((o) => o.id === id);
    if (index === -1) throw new Error('Order not found');
    ORDERS[index].status = status;
    ORDERS[index].updatedAt = new Date().toISOString();

    // Auto-verify: when an order completes, check if merchant now qualifies
    if (status === 'completed' || status === 'picked_up') {
      const order = ORDERS[index];
      const merchantIdx = MERCHANTS.findIndex((m) => m.id === order.merchantId);
      if (merchantIdx !== -1) {
        const merchant = MERCHANTS[merchantIdx];
        if (merchant.verificationStatus !== 'verified') {
          merchant.completedOrders = (merchant.completedOrders ?? 0) + 1;
          if (
            merchant.completedOrders >= 10 &&
            merchant.rating >= 4.0 &&
            (merchant.refundDisputes ?? 0) === 0
          ) {
            merchant.verificationStatus = 'verified';
            merchant.isVerified = true;
          }
        }
      }
    }

    return ORDERS[index];
  }

  async cancelOrder(id: string, reason: string): Promise<Order> {
    await sleep(30);
    const order = ORDERS.find((o) => o.id === id);
    if (!order) throw new Error('Order not found');

    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.updatedAt = new Date().toISOString();

    for (const item of order.items) {
      const listing = LISTINGS.find((l) => l.id === item.listingId);
      if (listing) {
        listing.quantityRemaining += item.quantity;
        if (listing.status === 'sold_out') listing.status = 'active';
      }
    }

    return order;
  }

  async refundOrder(id: string, reason: string): Promise<Order> {
    await sleep(30);
    const order = ORDERS.find((o) => o.id === id);
    if (!order) throw new Error('Order not found');

    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.updatedAt = new Date().toISOString();

    for (const item of order.items) {
      const listing = LISTINGS.find((l) => l.id === item.listingId);
      if (listing) {
        listing.quantityRemaining += item.quantity;
        if (listing.status === 'sold_out') listing.status = 'active';
      }
    }

    return order;
  }
}

const walletRewards = new Map<string, WalletReward>();

class MockWalletRepository implements WalletRepository {
  async getWallet(userId: string): Promise<Wallet> {
    await sleep(20);
    return CUSTOMER_WALLET;
  }

  async getTransactions(userId: string): Promise<WalletTransaction[]> {
    await sleep(20);
    return WALLET_TRANSACTIONS.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async topUp(userId: string, amount: number): Promise<Wallet> {
    await sleep(30);
    CUSTOMER_WALLET.balance += amount;
    return CUSTOMER_WALLET;
  }

  async spend(userId: string, amount: number, description: string): Promise<Wallet> {
    await sleep(30);
    CUSTOMER_WALLET.balance = Math.max(0, CUSTOMER_WALLET.balance - amount);
    return CUSTOMER_WALLET;
  }

  async refund(userId: string, amount: number, description: string): Promise<Wallet> {
    await sleep(30);
    CUSTOMER_WALLET.balance += amount;
    return CUSTOMER_WALLET;
  }

  private getOrInitReward(userId: string): WalletReward {
    if (!walletRewards.has(userId)) {
      walletRewards.set(userId, {
        userId,
        points: 0,
        bonusBalance: 0,
        lifetimePoints: 0,
      });
    }
    return walletRewards.get(userId)!;
  }

  async getRewards(userId: string): Promise<WalletReward> {
    await sleep(20);
    return { ...this.getOrInitReward(userId) };
  }

  async addTopUpBonus(userId: string, topUpAmount: number): Promise<WalletReward> {
    await sleep(20);
    const reward = this.getOrInitReward(userId);
    const bonus = Math.floor(topUpAmount * 0.05);
    reward.bonusBalance += bonus;
    const tx: WalletTransaction = {
      id: `tx-bonus-${Date.now()}`,
      userId,
      type: 'top_up_bonus',
      amount: bonus,
      description: `Top-up bonus (+฿${bonus})`,
      createdAt: new Date().toISOString(),
    };
    WALLET_TRANSACTIONS.unshift(tx);
    return { ...reward };
  }

  async addPurchasePoints(userId: string, amountSpent: number): Promise<WalletReward> {
    await sleep(20);
    const reward = this.getOrInitReward(userId);
    const points = Math.floor(amountSpent);
    reward.points += points;
    reward.lifetimePoints += points;
    const tx: WalletTransaction = {
      id: `tx-points-${Date.now()}`,
      userId,
      type: 'points_earned',
      amount: points,
      description: `Points earned (${points} pts)`,
      createdAt: new Date().toISOString(),
    };
    WALLET_TRANSACTIONS.unshift(tx);
    return { ...reward };
  }
}

class MockPayoutRepository implements PayoutRepository {
  async getMerchantWallet(merchantId: string): Promise<MerchantWallet> {
    await sleep(20);
    return { ...MERCHANT_WALLET, merchantId };
  }

  async getPayoutTransactions(merchantId: string): Promise<PayoutTransaction[]> {
    await sleep(20);
    return PAYOUT_TRANSACTIONS.filter((p) => p.merchantId === merchantId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getBankAccounts(merchantId: string): Promise<BankAccount[]> {
    await sleep(20);
    return BANK_ACCOUNTS.filter((b) => b.merchantId === merchantId).sort((a) =>
      a.isDefault ? -1 : 1
    );
  }

  async addBankAccount(
    merchantId: string,
    data: Omit<BankAccount, 'id' | 'merchantId'>
  ): Promise<BankAccount> {
    await sleep(30);
    const account: BankAccount = {
      ...data,
      id: `bank-${Date.now()}`,
      merchantId,
    };
    if (account.isDefault) {
      BANK_ACCOUNTS.filter((b) => b.merchantId === merchantId).forEach(
        (b) => (b.isDefault = false)
      );
    }
    BANK_ACCOUNTS.push(account);
    return account;
  }

  async setDefaultBankAccount(merchantId: string, accountId: string): Promise<void> {
    await sleep(30);
    BANK_ACCOUNTS.filter((b) => b.merchantId === merchantId).forEach((b) => {
      b.isDefault = b.id === accountId;
    });
  }

  async requestPayout(merchantId: string, amount: number): Promise<PayoutTransaction> {
    await sleep(50);
    const account = BANK_ACCOUNTS.find((b) => b.merchantId === merchantId && b.isDefault);
    const payout: PayoutTransaction = {
      id: `payout-${Date.now()}`,
      merchantId,
      amount,
      status: 'pending',
      method: 'bank_transfer',
      bankAccountId: account?.id ?? '',
      bankAccountName: account ? `${account.accountName} - ${account.bankName}` : '',
      createdAt: new Date().toISOString(),
    };
    MERCHANT_WALLET.pendingPayout += amount;
    MERCHANT_WALLET.balance = Math.max(0, MERCHANT_WALLET.balance - amount);
    PAYOUT_TRANSACTIONS.unshift(payout);
    return payout;
  }
}

class MockCouponRepository implements CouponRepository {
  async getCoupons(merchantId: string): Promise<Coupon[]> {
    await sleep(20);
    return COUPONS.filter((c) => c.merchantId === merchantId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createCoupon(
    merchantId: string,
    data: Omit<Coupon, 'id' | 'merchantId' | 'usesCount' | 'createdAt'>
  ): Promise<Coupon> {
    await sleep(30);
    const coupon: Coupon = {
      ...data,
      id: `coupon-${Date.now()}`,
      merchantId,
      usesCount: 0,
      createdAt: new Date().toISOString(),
    };
    COUPONS.push(coupon);
    return coupon;
  }

  async updateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon> {
    await sleep(30);
    const index = COUPONS.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Coupon not found');
    COUPONS[index] = { ...COUPONS[index], ...data };
    return COUPONS[index];
  }

  async deleteCoupon(id: string): Promise<void> {
    await sleep(30);
    const index = COUPONS.findIndex((c) => c.id === id);
    if (index !== -1) COUPONS.splice(index, 1);
  }
}

class MockMessageRepository implements MessageRepository {
  async getConversations(merchantId: string): Promise<MerchantMessage[]> {
    await sleep(20);
    const messages = MERCHANT_MESSAGES.filter((m) => m.merchantId === merchantId);
    const latestByCustomer = new Map<string, MerchantMessage>();
    for (const message of messages) {
      const existing = latestByCustomer.get(message.customerId);
      if (!existing || new Date(message.createdAt) > new Date(existing.createdAt)) {
        latestByCustomer.set(message.customerId, message);
      }
    }
    return Array.from(latestByCustomer.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getMessages(merchantId: string, customerId: string): Promise<MerchantMessage[]> {
    await sleep(20);
    return MERCHANT_MESSAGES.filter(
      (m) => m.merchantId === merchantId && m.customerId === customerId
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async sendMessage(
    merchantId: string,
    customerId: string,
    content: string,
    sentBy: 'merchant' | 'customer'
  ): Promise<MerchantMessage> {
    await sleep(30);
    const conversation = MERCHANT_MESSAGES.find(
      (m) => m.merchantId === merchantId && m.customerId === customerId
    );
    const message: MerchantMessage = {
      id: `msg-${Date.now()}`,
      merchantId,
      customerId,
      customerName: conversation?.customerName ?? 'Customer',
      customerAvatarUrl: conversation?.customerAvatarUrl,
      content,
      sentBy,
      read: sentBy === 'merchant',
      createdAt: new Date().toISOString(),
    };
    MERCHANT_MESSAGES.push(message);
    return message;
  }

  async sendWelcomeMessage(
    merchantId: string,
    customerId: string,
    customerName: string,
    orderId: string
  ): Promise<MerchantMessage> {
    await sleep(100);
    const existing = MERCHANT_MESSAGES.find(
      (m) => m.merchantId === merchantId && m.customerId === customerId
    );
    const message: MerchantMessage = {
      id: `msg-auto-${Date.now()}`,
      merchantId,
      customerId,
      customerName,
      customerAvatarUrl: existing?.customerAvatarUrl,
      orderId,
      content: `Hi! I just placed an order — looking forward to picking up 🙏`,
      sentBy: 'customer',
      read: false,
      createdAt: new Date().toISOString(),
    };
    if (!existing) {
      MERCHANT_MESSAGES.push(message);
    } else {
      MERCHANT_MESSAGES.push(message);
    }
    return message;
  }

  async markConversationAsRead(merchantId: string, customerId: string): Promise<void> {
    await sleep(20);
    MERCHANT_MESSAGES.filter(
      (m) => m.merchantId === merchantId && m.customerId === customerId && m.sentBy === 'customer'
    ).forEach((m) => (m.read = true));
  }
}

class MockNotificationRepository implements NotificationRepository {
  async getNotifications(userId: string): Promise<Notification[]> {
    await sleep(20);
    return NOTIFICATIONS.filter((n) => n.userId === userId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await sleep(20);
    const n = NOTIFICATIONS.find((n) => n.id === notificationId && n.userId === userId);
    if (n) n.read = true;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await sleep(20);
    NOTIFICATIONS.filter((n) => n.userId === userId).forEach((n) => (n.read = true));
  }
}

class MockAnalyticsRepository implements AnalyticsRepository {
  async getMerchantAnalytics(merchantIdOrUserId: string): Promise<MerchantAnalytics> {
    await sleep(30);
    const merchant =
      MERCHANTS.find((m) => m.id === merchantIdOrUserId) ??
      MERCHANTS.find((m) => m.ownerId === merchantIdOrUserId);
    const merchantId = merchant?.id ?? merchantIdOrUserId;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay.getTime() - 6 * 86400000);

    const merchantOrders = ORDERS.filter((o) => o.merchantId === merchantId);
    const completedOrders = merchantOrders.filter((o) =>
      ['completed', 'picked_up'].includes(o.status)
    );

    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = completedOrders.length;
    const totalItemsSaved = completedOrders.reduce(
      (sum, o) => sum + o.items.reduce((is, item) => is + item.quantity, 0),
      0
    );

    const todayOrders = completedOrders.filter((o) => new Date(o.createdAt) >= startOfDay);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

    const weeklyRevenue: number[] = [];
    const weeklyOrders: number[] = [];
    const weeklyItemsSaved: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(startOfDay.getTime() - i * 86400000);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayOrders = completedOrders.filter(
        (o) => new Date(o.createdAt) >= dayStart && new Date(o.createdAt) < dayEnd
      );
      weeklyRevenue.push(dayOrders.reduce((sum, o) => sum + o.total, 0));
      weeklyOrders.push(dayOrders.length);
      weeklyItemsSaved.push(
        dayOrders.reduce((sum, o) => sum + o.items.reduce((is, item) => is + item.quantity, 0), 0)
      );
    }

    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const views = Math.max(100, totalOrders * 12);
    const conversionRate = Math.round((totalOrders / views) * 1000) / 10;

    const listingRevenue = new Map<
      string,
      { listingId: string; title: string; revenue: number; orders: number }
    >();
    for (const order of completedOrders) {
      for (const item of order.items) {
        const existing = listingRevenue.get(item.listingId);
        if (existing) {
          existing.revenue += item.totalPrice;
          existing.orders += item.quantity;
        } else {
          listingRevenue.set(item.listingId, {
            listingId: item.listingId,
            title: item.title,
            revenue: item.totalPrice,
            orders: item.quantity,
          });
        }
      }
    }
    const seedTopListings = merchantId === TEST_MERCHANT_ID ? MERCHANT_ANALYTICS.topListings : [];
    const seedTopMap = new Map(seedTopListings.map((l) => [l.listingId, l]));
    const topListings = Array.from(listingRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((l) => {
        const seedEntry = seedTopMap.get(l.listingId);
        const listing = LISTINGS.find((li) => li.id === l.listingId);
        return {
          ...l,
          views: seedEntry?.views ?? listing?.viewCount ?? 100,
          clicks: seedEntry?.clicks ?? listing?.clickCount ?? 30,
          searchAppearances: seedEntry?.searchAppearances ?? listing?.searchAppearances ?? 50,
          conversionRate:
            seedEntry?.conversionRate ??
            (listing?.viewCount ? l.orders / listing.viewCount : 0),
        };
      });

    const hourlyRevenue = Array.from({ length: 24 }).map((_, hour) => {
      const hourRevenue = completedOrders
        .filter((o) => new Date(o.createdAt).getHours() === hour)
        .reduce((sum, o) => sum + o.total, 0);
      return { hour, revenue: hourRevenue };
    });

    const seed = MERCHANT_ANALYTICS;
    const weeklyAOV =
      seed?.weeklyAOV ??
      weeklyRevenue.map((rev, i) => {
        const orders = weeklyOrders[i] ?? 0;
        return orders > 0 ? Math.round(rev / orders) : 0;
      });
    const followerHistory = seed?.followerHistory ?? [];

    return {
      merchantId,
      totalRevenue,
      totalOrders,
      totalItemsSaved,
      todayRevenue,
      todayOrders: todayOrders.length,
      weeklyRevenue,
      weeklyOrders,
      weeklyItemsSaved,
      views,
      conversionRate,
      avgOrderValue,
      topListings,
      hourlyRevenue,
      weeklyAOV,
      followerHistory,
    };
  }

  async getFollowerHistory(merchantId: string): Promise<{ date: string; count: number }[]> {
    await sleep(20);
    if (merchantId === TEST_MERCHANT_ID) {
      return MERCHANT_ANALYTICS.followerHistory ?? [];
    }
    return [];
  }

  async getCustomerImpact(userId: string): Promise<CustomerImpact> {
    await sleep(30);
    const userOrders = ORDERS.filter(
      (o) => o.customerId === userId && ['completed', 'picked_up'].includes(o.status)
    );
    const mealsSaved = userOrders.reduce(
      (sum, o) => sum + o.items.reduce((is, item) => is + item.quantity, 0),
      0
    );
    const moneySaved = userOrders.reduce((sum, o) => sum + o.discount, 0);
    return {
      mealsSaved,
      moneySaved,
      co2SavedKg: Math.round(mealsSaved * 2.3 * 10) / 10,
      ordersCount: userOrders.length,
    };
  }
}

export const mockRepositories = {
  auth: new MockAuthRepository(),
  users: new MockUserRepository(),
  merchants: new MockMerchantRepository(),
  listings: new MockListingRepository(),
  orders: new MockOrderRepository(),
  wallet: new MockWalletRepository(),
  payouts: new MockPayoutRepository(),
  coupons: new MockCouponRepository(),
  messages: new MockMessageRepository(),
  notifications: new MockNotificationRepository(),
  analytics: new MockAnalyticsRepository(),
};

export { LISTINGS, MERCHANTS, ORDERS, CATEGORIES, ALL_USERS };
