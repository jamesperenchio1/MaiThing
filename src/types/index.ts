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
  savedAddresses: Address[];
  notificationPreferences: NotificationPreferences;
}

export interface MerchantProfile extends User {
  merchantId: string;
}

export interface NotificationPreferences {
  newDeals: boolean;
  orderUpdates: boolean;
  merchantMessages: boolean;
  promotions: boolean;
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
  phone: string;
  categories: string[];
  rating: number;
  reviewCount: number;
  businessHours: BusinessHours[];
  isOpen: boolean;
  pickupInstructions?: string;
  followers: number;
  createdAt: string;
  distance?: number;
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
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'completed'
  | 'cancelled';

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
  merchantId: string;
  merchantName: string;
  merchantLogoUrl?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
  pickupCode: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
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
  type: 'top_up' | 'purchase' | 'refund' | 'payout';
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
  merchantId: string;
  rating: number;
  comment: string;
  createdAt: string;
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
