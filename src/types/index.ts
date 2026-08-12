export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  street: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  country: string;
}

export type UserRole = 'customer' | 'merchant';

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  avatarUrl?: string;
  roles: UserRole[];
  preferredLanguage: 'th' | 'en';
  createdAt: string;
}

export interface CustomerProfile extends User {
  favorites: string[];
  savedListings: string[]; // listing IDs
  savedAddresses: Address[];
  notificationPreferences: NotificationPreferences;
  restockAlerts: string[]; // listing IDs to notify on restock
}

export interface MerchantProfile extends User {
  merchantId: string;
}

export interface NotificationPreferences {
  newDeals: boolean;
  orderUpdates: boolean;
  merchantMessages: boolean;
  promotions: boolean;
  followedMerchantNotifications: string[]; // merchant IDs to notify on new listing
}

export interface BusinessHours {
  day: number; // 0-6
  open: string; // HH:mm
  close: string;
}

export interface Merchant {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  address: Address;
  coordinates: Coordinates;
  staticMapUrl?: string;
  phone: string;
  categories: string[];
  rating: number;
  reviewCount: number;
  businessHours: BusinessHours[];
  isOpen: boolean;
  closedUntil?: string;
  pickupInstructions?: string;
  followers: number;
  createdAt: string;
  distance?: number;
  isVerified?: boolean;
  joinedAt?: string;
  hygieneRating?: number;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'suspended';
  completedOrders?: number;
  refundDisputes?: number;
  foodSafetyCertUrl?: string;
  revenueGoal?: number;
  lastFollowerMilestone?: number;
}

export type ListingType = 'mystery_box' | 'fixed_item';
export type ListingStatus = 'active' | 'sold_out' | 'expired' | 'draft';

export interface ListingBase {
  id: string;
  merchantId: string;
  type: ListingType;
  title: string;
  description: string;
  images: string[];
  category: string;
  originalPrice: number;
  salePrice: number;
  quantity: number;
  quantityRemaining: number;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  dietaryTags: string[];
  allergens: string[];
  status: ListingStatus;
  createdAt: string;
  distance?: number;
  lowStockThreshold?: number;
  couponId?: string;
  viewCount?: number;
  clickCount?: number;
  searchAppearances?: number;
  flashSalePrice?: number;
  flashSaleEndsAt?: string;
  autoDelistWhenSoldOut?: boolean;
}

export interface MysteryBoxListing extends ListingBase {
  type: 'mystery_box';
  boxSize: 'small' | 'medium' | 'large' | 'xl';
  estimatedRetailValue: number;
}

export interface FixedItemListing extends ListingBase {
  type: 'fixed_item';
}

export type Listing = MysteryBoxListing | FixedItemListing;

export type OrderStatus =
  'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'completed' | 'cancelled';

export interface OrderItem {
  listingId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  customerAvatarUrl?: string;
  merchantId: string;
  merchantName: string;
  merchantLogoUrl?: string;
  merchantCoordinates?: Coordinates;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponId?: string;
  couponCode?: string;
  couponDiscount: number;
  total: number;
  status: OrderStatus;
  pickupCode: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  userId: string;
  balance: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'top_up' | 'purchase' | 'refund' | 'payout' | 'top_up_bonus' | 'points_earned';
  amount: number;
  description: string;
  orderId?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  merchantId: string;
  listingId?: string;
  rating: number;
  comment: string;
  images?: string[];
  merchantReply?: string;
  merchantRepliedAt?: string;
  createdAt: string;
}

export interface WalletReward {
  userId: string;
  points: number; // 1 point per ฿1 spent
  bonusBalance: number; // top-up bonus credit (฿)
  lifetimePoints: number; // all-time points earned
}

export interface MerchantAnalytics {
  merchantId: string;
  totalRevenue: number;
  totalOrders: number;
  totalItemsSaved: number;
  todayRevenue: number;
  todayOrders: number;
  weeklyRevenue: number[];
  weeklyOrders: number[];
  weeklyItemsSaved: number[];
  views: number;
  conversionRate: number;
  avgOrderValue: number;
  topListings: {
    listingId: string;
    title: string;
    revenue: number;
    orders: number;
    views: number;
    clicks: number;
    searchAppearances: number;
    conversionRate: number;
  }[];
  hourlyRevenue: { hour: number; revenue: number }[];
  weeklyAOV: number[];
  followerHistory: { date: string; count: number }[];
}

export interface CustomerImpact {
  mealsSaved: number;
  moneySaved: number;
  co2SavedKg: number;
  ordersCount: number;
}

export interface Category {
  id: string;
  name: string;
  nameTh: string;
  icon: string;
}

export interface FoodTag {
  id: string;
  name: string;
  nameTh: string;
  type: 'dietary' | 'allergen' | 'category';
}

export interface ListingTemplate {
  id: string;
  merchantId: string;
  name: string;
  type: ListingType;
  title: string;
  description: string;
  category: string;
  originalPrice: number;
  salePrice: number;
  quantity: number;
  boxSize?: 'small' | 'medium' | 'large' | 'xl';
  estimatedRetailValue?: number;
  dietaryTags: string[];
  allergens: string[];
  images: string[];
  pickupWindowDurationHours: number;
  autoExpiry: boolean;
  createdAt: string;
  expiresAt?: string;
  isFlagged?: boolean;
  flagReason?: string;
}

export interface MerchantWallet {
  merchantId: string;
  balance: number;
  currency: string;
  totalEarnings: number;
  pendingPayout: number;
  lastPayoutDate?: string;
  nextPayoutDate?: string;
  commissionRate: number;
}

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface PayoutTransaction {
  id: string;
  merchantId: string;
  amount: number;
  status: PayoutStatus;
  method: 'bank_transfer';
  bankAccountId: string;
  bankAccountName?: string;
  createdAt: string;
  completedAt?: string;
}

export interface BankAccount {
  id: string;
  merchantId: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
  isDefault: boolean;
}

export type StaffRole = 'owner' | 'manager' | 'staff';

export interface StaffMember {
  id: string;
  merchantId: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  role: StaffRole;
  isActive: boolean;
  lastActiveAt?: string;
  permissions: string[];
  avatarUrl?: string;
  createdAt: string;
}

export type CouponDiscountType = 'percentage' | 'fixed';
export type CouponStatus = 'active' | 'inactive' | 'expired';

export interface Coupon {
  id: string;
  merchantId: string;
  code: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  maxUses?: number;
  perCustomerMaxUses?: number;
  firstTimeCustomerOnly?: boolean;
  applicableCategories?: string[];
  applicableListingTypes?: ('mystery_box' | 'fixed_item')[];
  usesCount: number;
  status: CouponStatus;
  validFrom: string;
  validUntil: string;
  createdAt: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  message?: string;
}

export interface MerchantMessage {
  id: string;
  merchantId: string;
  customerId: string;
  customerName: string;
  customerAvatarUrl?: string;
  orderId?: string;
  content: string;
  sentBy: 'merchant' | 'customer';
  read: boolean;
  createdAt: string;
}

export interface MerchantNotificationPreferences {
  newOrders: boolean;
  lowStock: boolean;
  payoutUpdates: boolean;
  customerReviews: boolean;
  pickupReminders: boolean;
  autoConfirmOrders: boolean;
}

export type OnboardingStep =
  'welcome' | 'business_info' | 'verification' | 'bank_account' | 'first_listing' | 'complete';

export interface MerchantOnboarding {
  merchantId: string;
  completedSteps: OnboardingStep[];
  currentStep: OnboardingStep;
}

export interface BroadcastMessage {
  id: string;
  merchantId: string;
  content: string;
  sentAt: string;
  recipientCount: number;
}

/* ─── Personality Profiles ──────────────────────────────────────────────── */

export type PriceRange = 'budget' | 'mid' | 'premium' | 'luxury' | 'any';
export type DiscoveryStyle = 'explore' | 'favorites' | 'deals' | 'mystery' | 'fixed' | 'both';
export type EnvironmentalMotivation = 'high' | 'medium' | 'low';
export type PickupTimePreference = 'morning' | 'lunch' | 'evening' | 'night' | 'any';
export type NotificationStyle = 'all' | 'important' | 'minimal';

export interface UserPersonality {
  userId: string;
  dietaryPreferences: string[];
  priceRange: PriceRange;
  preferredCategories: string[];
  discoveryStyle: DiscoveryStyle;
  environmentalMotivation: EnvironmentalMotivation;
  pickupTimePreference: PickupTimePreference;
  maxDistanceKm: number;
  notificationStyle: NotificationStyle;
  favoriteMerchants: string[];
  orderPatterns: Record<string, unknown>;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BrandVoice = 'friendly' | 'professional' | 'playful' | 'luxury' | 'minimal';
export type SustainabilityFocus = 'high' | 'medium' | 'low';
export type CommunityEngagement = 'high' | 'medium' | 'low';
export type CustomerCommunication = 'proactive' | 'responsive' | 'minimal';
export type PickupPersonality = 'standard' | 'warm' | 'express' | 'zero_waste';
export type PackagingStyle = 'standard' | 'eco' | 'premium' | 'minimal';

export interface MerchantPersonality {
  merchantId: string;
  brandVoice: BrandVoice;
  sustainabilityFocus: SustainabilityFocus;
  communityEngagement: CommunityEngagement;
  customerCommunication: CustomerCommunication;
  story?: string;
  values: string[];
  autoWelcomeMessage?: string;
  pickupPersonality: PickupPersonality;
  packagingStyle: PackagingStyle;
  socialLinks: Record<string, string>;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastMessage {
  id: string;
  merchantId: string;
  content: string;
  sentAt: string;
  recipientCount: number;
}
