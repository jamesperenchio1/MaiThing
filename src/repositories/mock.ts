import { calculateDistance } from '@/src/lib/utils';
import type {
  AuthRepository,
  UserRepository,
  MerchantRepository,
  ListingRepository,
  OrderRepository,
  WalletRepository,
  NotificationRepository,
  AnalyticsRepository,
} from './interfaces';
import {
  ALL_USERS,
  CATEGORIES,
  CUSTOMER_WALLET,
  LISTINGS,
  MERCHANTS,
  MERCHANT_ANALYTICS,
  NOTIFICATIONS,
  ORDERS,
  REVIEWS,
  TEST_CUSTOMER,
  TEST_CUSTOMER_PROFILE,
  TEST_MERCHANT_USER,
  WALLET_TRANSACTIONS,
} from './seed';
import type {
  BusinessHours,
  CustomerImpact,
  CustomerProfile,
  Listing,
  ListingStatus,
  Merchant,
  MerchantAnalytics,
  Notification,
  NotificationPreferences,
  Order,
  Review,
  User,
  Wallet,
  WalletTransaction,
} from '@/src/types';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class MockAuthRepository implements AuthRepository {
  async signIn(email: string, password: string): Promise<User> {
    await sleep(400);
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
    await sleep(400);
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

  async signOut(): Promise<void> {
    await sleep(200);
  }

  async resetPassword(email: string): Promise<void> {
    await sleep(300);
  }

  async verifyOtp(code: string): Promise<boolean> {
    await sleep(300);
    return code === '123456';
  }

  async resendVerification(email: string): Promise<void> {
    await sleep(300);
  }
}

class MockUserRepository implements UserRepository {
  async getCurrentUser(): Promise<User | null> {
    await sleep(300);
    return null;
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    await sleep(300);
    const user = ALL_USERS.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    Object.assign(user, data);
    return user;
  }

  async updateCustomerProfile(
    userId: string,
    data: Partial<CustomerProfile>
  ): Promise<CustomerProfile> {
    await sleep(300);
    Object.assign(TEST_CUSTOMER_PROFILE, data);
    return TEST_CUSTOMER_PROFILE;
  }

  async getCustomerProfile(userId: string): Promise<CustomerProfile> {
    await sleep(300);
    return TEST_CUSTOMER_PROFILE;
  }

  async addFavorite(userId: string, merchantId: string): Promise<void> {
    await sleep(200);
    if (!TEST_CUSTOMER_PROFILE.favorites.includes(merchantId)) {
      TEST_CUSTOMER_PROFILE.favorites.push(merchantId);
    }
  }

  async removeFavorite(userId: string, merchantId: string): Promise<void> {
    await sleep(200);
    TEST_CUSTOMER_PROFILE.favorites = TEST_CUSTOMER_PROFILE.favorites.filter(
      (id) => id !== merchantId
    );
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences> {
    await sleep(200);
    TEST_CUSTOMER_PROFILE.notificationPreferences = { ...preferences };
    return TEST_CUSTOMER_PROFILE.notificationPreferences;
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
    await sleep(300);
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
    await sleep(200);
    return MERCHANTS.find((m) => m.id === id) ?? null;
  }

  async getMerchantByOwnerId(ownerId: string): Promise<Merchant | null> {
    await sleep(200);
    return MERCHANTS.find((m) => m.ownerId === ownerId) ?? null;
  }

  async getCategories(): Promise<{ id: string; name: string; nameTh: string; icon: string }[]> {
    await sleep(200);
    return CATEGORIES;
  }

  async updateMerchant(id: string, data: Partial<Merchant>): Promise<Merchant> {
    await sleep(300);
    const index = MERCHANTS.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Merchant not found');
    MERCHANTS[index] = { ...MERCHANTS[index], ...data } as Merchant;
    return MERCHANTS[index];
  }

  async updateBusinessHours(id: string, hours: BusinessHours[]): Promise<Merchant> {
    await sleep(300);
    const index = MERCHANTS.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Merchant not found');
    MERCHANTS[index].businessHours = [...hours];
    return MERCHANTS[index];
  }

  async updatePickupInstructions(id: string, instructions: string): Promise<Merchant> {
    await sleep(300);
    const index = MERCHANTS.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Merchant not found');
    MERCHANTS[index].pickupInstructions = instructions;
    return MERCHANTS[index];
  }

  async getReviews(merchantId: string): Promise<Review[]> {
    await sleep(200);
    return REVIEWS.filter((r) => r.merchantId === merchantId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async followMerchant(userId: string, merchantId: string): Promise<void> {
    await sleep(200);
    const merchant = MERCHANTS.find((m) => m.id === merchantId);
    if (merchant) merchant.followers += 1;
  }

  async unfollowMerchant(userId: string, merchantId: string): Promise<void> {
    await sleep(200);
    const merchant = MERCHANTS.find((m) => m.id === merchantId);
    if (merchant) merchant.followers = Math.max(0, merchant.followers - 1);
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
    sortBy?: 'distance' | 'price_asc' | 'price_desc' | 'discount' | 'newest';
    dietaryTags?: string[];
    allergens?: string[];
    maxPrice?: number;
  }): Promise<Listing[]> {
    await sleep(300);
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
      default:
        if (center) {
          result.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
        }
        break;
    }

    return result;
  }

  async getListing(id: string): Promise<Listing | null> {
    await sleep(200);
    return LISTINGS.find((l) => l.id === id) ?? null;
  }

  async createListing(data: Omit<Listing, 'id' | 'createdAt'>): Promise<Listing> {
    await sleep(500);
    const listing = {
      ...data,
      id: `listing-${Date.now()}`,
      createdAt: new Date().toISOString(),
    } as unknown as Listing;
    LISTINGS.push(listing);
    return listing;
  }

  async updateListing(id: string, data: Partial<Listing>): Promise<Listing> {
    await sleep(300);
    const index = LISTINGS.findIndex((l) => l.id === id);
    if (index === -1) throw new Error('Listing not found');
    LISTINGS[index] = { ...LISTINGS[index], ...data } as Listing;
    return LISTINGS[index];
  }

  async deleteListing(id: string): Promise<void> {
    await sleep(300);
    const index = LISTINGS.findIndex((l) => l.id === id);
    if (index !== -1) LISTINGS.splice(index, 1);
  }
}

class MockOrderRepository implements OrderRepository {
  async getOrders(userId: string, role: 'customer' | 'merchant'): Promise<Order[]> {
    await sleep(300);
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
    await sleep(200);
    return ORDERS.find((o) => o.id === id) ?? null;
  }

  async createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    await sleep(500);
    const order: Order = {
      ...data,
      id: `order-${Date.now()}`,
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
    await sleep(300);
    const index = ORDERS.findIndex((o) => o.id === id);
    if (index === -1) throw new Error('Order not found');
    ORDERS[index].status = status;
    ORDERS[index].updatedAt = new Date().toISOString();
    return ORDERS[index];
  }

  async cancelOrder(id: string, _reason: string): Promise<Order> {
    await sleep(300);
    const order = ORDERS.find((o) => o.id === id);
    if (!order) throw new Error('Order not found');

    order.status = 'cancelled';
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

class MockWalletRepository implements WalletRepository {
  async getWallet(userId: string): Promise<Wallet> {
    await sleep(200);
    return CUSTOMER_WALLET;
  }

  async getTransactions(userId: string): Promise<WalletTransaction[]> {
    await sleep(200);
    return WALLET_TRANSACTIONS.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async topUp(userId: string, amount: number): Promise<Wallet> {
    await sleep(300);
    CUSTOMER_WALLET.balance += amount;
    return CUSTOMER_WALLET;
  }

  async spend(userId: string, amount: number, description: string): Promise<Wallet> {
    await sleep(300);
    CUSTOMER_WALLET.balance = Math.max(0, CUSTOMER_WALLET.balance - amount);
    return CUSTOMER_WALLET;
  }

  async refund(userId: string, amount: number, description: string): Promise<Wallet> {
    await sleep(300);
    CUSTOMER_WALLET.balance += amount;
    return CUSTOMER_WALLET;
  }
}

class MockNotificationRepository implements NotificationRepository {
  async getNotifications(userId: string): Promise<Notification[]> {
    await sleep(200);
    return NOTIFICATIONS.filter((n) => n.userId === userId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await sleep(200);
    const n = NOTIFICATIONS.find((n) => n.id === notificationId && n.userId === userId);
    if (n) n.read = true;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await sleep(200);
    NOTIFICATIONS.filter((n) => n.userId === userId).forEach((n) => (n.read = true));
  }
}

class MockAnalyticsRepository implements AnalyticsRepository {
  async getMerchantAnalytics(merchantIdOrUserId: string): Promise<MerchantAnalytics> {
    await sleep(300);
    if (merchantIdOrUserId === MERCHANT_ANALYTICS.merchantId) return MERCHANT_ANALYTICS;
    const merchant = MERCHANTS.find((m) => m.ownerId === merchantIdOrUserId);
    if (merchant) return { ...MERCHANT_ANALYTICS, merchantId: merchant.id };
    return MERCHANT_ANALYTICS;
  }

  async getCustomerImpact(userId: string): Promise<CustomerImpact> {
    await sleep(300);
    const userOrders = ORDERS.filter(
      (o) => o.customerId === userId && ['completed', 'picked_up'].includes(o.status)
    );
    const mealsSaved = userOrders.reduce((sum, o) => sum + o.items.reduce((is, item) => is + item.quantity, 0), 0);
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
  notifications: new MockNotificationRepository(),
  analytics: new MockAnalyticsRepository(),
};

export { LISTINGS, MERCHANTS, ORDERS, CATEGORIES, ALL_USERS };
