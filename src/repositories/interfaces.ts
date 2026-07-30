import type {
  BusinessHours,
  Category,
  CustomerProfile,
  Listing,
  Merchant,
  MerchantAnalytics,
  Notification,
  NotificationPreferences,
  Order,
  Review,
  User,
  Wallet,
  WalletTransaction,
  CustomerImpact,
} from '@/src/types';

export interface AuthRepository {
  signIn(email: string, password: string): Promise<User>;
  signUp(email: string, password: string, name: string): Promise<User>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  verifyOtp(code: string): Promise<boolean>;
  resendVerification(email: string): Promise<void>;
}

export interface UserRepository {
  getCurrentUser(): Promise<User | null>;
  updateProfile(userId: string, data: Partial<User>): Promise<User>;
  updateCustomerProfile(userId: string, data: Partial<CustomerProfile>): Promise<CustomerProfile>;
  getCustomerProfile(userId: string): Promise<CustomerProfile>;
  addFavorite(userId: string, merchantId: string): Promise<void>;
  removeFavorite(userId: string, merchantId: string): Promise<void>;
  updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences>;
}

export interface MerchantRepository {
  getMerchants(params?: {
    lat?: number;
    lng?: number;
    radius?: number;
    category?: string;
    query?: string;
  }): Promise<Merchant[]>;
  getMerchant(id: string): Promise<Merchant | null>;
  getMerchantByOwnerId(ownerId: string): Promise<Merchant | null>;
  getCategories(): Promise<Category[]>;
  followMerchant(userId: string, merchantId: string): Promise<void>;
  unfollowMerchant(userId: string, merchantId: string): Promise<void>;
  updateMerchant(id: string, data: Partial<Merchant>): Promise<Merchant>;
  updateBusinessHours(id: string, hours: BusinessHours[]): Promise<Merchant>;
  updatePickupInstructions(id: string, instructions: string): Promise<Merchant>;
  getReviews(merchantId: string): Promise<Review[]>;
}

export interface ListingRepository {
  getListings(params?: {
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
  }): Promise<Listing[]>;
  getListing(id: string): Promise<Listing | null>;
  createListing(data: Omit<Listing, 'id' | 'createdAt'>): Promise<Listing>;
  updateListing(id: string, data: Partial<Listing>): Promise<Listing>;
  deleteListing(id: string): Promise<void>;
}

export interface OrderRepository {
  getOrders(userId: string, role: 'customer' | 'merchant'): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order>;
  updateOrderStatus(id: string, status: Order['status']): Promise<Order>;
  cancelOrder(id: string, reason: string): Promise<Order>;
}

export interface WalletRepository {
  getWallet(userId: string): Promise<Wallet>;
  getTransactions(userId: string): Promise<WalletTransaction[]>;
  topUp(userId: string, amount: number): Promise<Wallet>;
  spend(userId: string, amount: number, description: string): Promise<Wallet>;
  refund(userId: string, amount: number, description: string): Promise<Wallet>;
}

export interface NotificationRepository {
  getNotifications(userId: string): Promise<Notification[]>;
  markAsRead(userId: string, notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
}

export interface AnalyticsRepository {
  getMerchantAnalytics(merchantId: string): Promise<MerchantAnalytics>;
  getCustomerImpact(userId: string): Promise<CustomerImpact>;
}

export interface Repositories {
  auth: AuthRepository;
  users: UserRepository;
  merchants: MerchantRepository;
  listings: ListingRepository;
  orders: OrderRepository;
  wallet: WalletRepository;
  notifications: NotificationRepository;
  analytics: AnalyticsRepository;
}

export type RepositorySource = 'mock' | 'supabase';
