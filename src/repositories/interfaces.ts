import type {
  BroadcastMessage,
  BusinessHours,
  Category,
  Coupon,
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
  PayoutTransaction,
  BankAccount,
  Review,
  StaffMember,
  User,
  Wallet,
  WalletReward,
  WalletTransaction,
  CustomerImpact,
} from '@/src/types';

export interface AuthRepository {
  signIn(email: string, password: string): Promise<User>;
  signUp(email: string, password: string, name: string): Promise<User>;
  registerMerchant(data: {
    email: string;
    password: string;
    name: string;
    businessName: string;
    phone: string;
  }): Promise<User>;
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
  addSavedListing(userId: string, listingId: string): Promise<void>;
  removeSavedListing(userId: string, listingId: string): Promise<void>;
  updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences>;
  addMerchantFollowNotification(userId: string, merchantId: string): Promise<void>;
  removeMerchantFollowNotification(userId: string, merchantId: string): Promise<void>;
  addRestockAlert(userId: string, listingId: string): Promise<void>;
  removeRestockAlert(userId: string, listingId: string): Promise<void>;
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
  replyToReview(reviewId: string, reply: string): Promise<Review>;
  submitReview(data: Omit<Review, 'id' | 'createdAt' | 'merchantReply' | 'merchantRepliedAt'>): Promise<Review>;
  getStaff(merchantId: string): Promise<StaffMember[]>;
  addStaff(
    merchantId: string,
    data: Omit<StaffMember, 'id' | 'merchantId' | 'createdAt'>
  ): Promise<StaffMember>;
  removeStaff(merchantId: string, staffId: string): Promise<void>;
  setStoreClosure(merchantId: string, closedUntil: string | null): Promise<Merchant>;
  getMerchantNotificationPreferences(merchantId: string): Promise<MerchantNotificationPreferences>;
  updateMerchantNotificationPreferences(
    merchantId: string,
    preferences: MerchantNotificationPreferences
  ): Promise<MerchantNotificationPreferences>;
  getOnboarding(merchantId: string): Promise<MerchantOnboarding>;
  updateOnboarding(merchantId: string, step: keyof MerchantOnboarding): Promise<MerchantOnboarding>;
  sendBroadcast(merchantId: string, content: string): Promise<BroadcastMessage>;
  getRecentBroadcasts(merchantId: string): Promise<BroadcastMessage[]>;
  verifyMerchant(merchantId: string, override?: boolean): Promise<Merchant>;
  uploadFoodSafetyCert(merchantId: string, certUrl: string): Promise<Merchant>;
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
    status?: string;
  }): Promise<Listing[]>;
  getListing(id: string): Promise<Listing | null>;
  createListing(data: Omit<Listing, 'id' | 'createdAt'>): Promise<Listing>;
  updateListing(id: string, data: Partial<Listing>): Promise<Listing>;
  deleteListing(id: string): Promise<void>;
  getListingTemplates(merchantId: string): Promise<ListingTemplate[]>;
  createListingTemplate(data: Omit<ListingTemplate, 'id' | 'createdAt'>): Promise<ListingTemplate>;
  deleteListingTemplate(id: string): Promise<void>;
}

export interface OrderRepository {
  getOrders(userId: string, role: 'customer' | 'merchant'): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  getOrderByPickupCode(merchantId: string, code: string): Promise<Order | null>;
  createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order>;
  updateOrderStatus(id: string, status: Order['status']): Promise<Order>;
  cancelOrder(id: string, reason: string): Promise<Order>;
  refundOrder(id: string, reason: string): Promise<Order>;
}

export interface WalletRepository {
  getWallet(userId: string): Promise<Wallet>;
  getTransactions(userId: string): Promise<WalletTransaction[]>;
  topUp(userId: string, amount: number): Promise<Wallet>;
  spend(userId: string, amount: number, description: string): Promise<Wallet>;
  refund(userId: string, amount: number, description: string): Promise<Wallet>;
  getRewards(userId: string): Promise<WalletReward>;
  addTopUpBonus(userId: string, topUpAmount: number): Promise<WalletReward>;
  addPurchasePoints(userId: string, amountSpent: number): Promise<WalletReward>;
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

export interface PayoutRepository {
  getMerchantWallet(merchantId: string): Promise<MerchantWallet>;
  getPayoutTransactions(merchantId: string): Promise<PayoutTransaction[]>;
  getBankAccounts(merchantId: string): Promise<BankAccount[]>;
  addBankAccount(
    merchantId: string,
    data: Omit<BankAccount, 'id' | 'merchantId'>
  ): Promise<BankAccount>;
  setDefaultBankAccount(merchantId: string, accountId: string): Promise<void>;
  requestPayout(merchantId: string, amount: number): Promise<PayoutTransaction>;
}

export interface CouponRepository {
  getCoupons(merchantId: string): Promise<Coupon[]>;
  createCoupon(
    merchantId: string,
    data: Omit<Coupon, 'id' | 'merchantId' | 'usesCount' | 'createdAt'>
  ): Promise<Coupon>;
  updateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon>;
  deleteCoupon(id: string): Promise<void>;
}

export interface MessageRepository {
  getConversations(merchantId: string): Promise<MerchantMessage[]>;
  getMessages(merchantId: string, customerId: string): Promise<MerchantMessage[]>;
  sendMessage(
    merchantId: string,
    customerId: string,
    content: string,
    sentBy: 'merchant' | 'customer'
  ): Promise<MerchantMessage>;
  markConversationAsRead(merchantId: string, customerId: string): Promise<void>;
}

export interface Repositories {
  auth: AuthRepository;
  users: UserRepository;
  merchants: MerchantRepository;
  listings: ListingRepository;
  orders: OrderRepository;
  wallet: WalletRepository;
  payouts: PayoutRepository;
  coupons: CouponRepository;
  messages: MessageRepository;
  notifications: NotificationRepository;
  analytics: AnalyticsRepository;
}

export type RepositorySource = 'mock' | 'supabase';
