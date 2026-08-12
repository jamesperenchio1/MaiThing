import { buildStaticMapUrl } from '@/src/lib/maps';
import type {
  Address,
  BankAccount,
  BusinessHours,
  Category,
  Coordinates,
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
  MysteryBoxListing,
  FixedItemListing,
  Notification,
  NotificationPreferences,
  Order,
  PayoutTransaction,
  Review,
  StaffMember,
  User,
  Wallet,
  WalletTransaction,
} from '@/src/types';

export const TEST_CUSTOMER: User = {
  id: 'user-customer-1',
  email: 'customer@maithing.test',
  phone: '081-234-5678',
  name: 'TEST Customer',
  avatarUrl: 'https://i.pravatar.cc/150?u=ariya',
  roles: ['customer'],
  preferredLanguage: 'en',
  createdAt: '2025-01-15T00:00:00Z',
};

export const TEST_CUSTOMER_PROFILE: CustomerProfile = {
  ...TEST_CUSTOMER,
  favorites: ['merchant-1', 'merchant-3', 'merchant-7'],
  savedListings: [],
  savedAddresses: [
    {
      street: '123 Sukhumvit Soi 55',
      subDistrict: 'Khlong Tan Nuea',
      district: 'Watthana',
      province: 'Bangkok',
      postalCode: '10110',
      country: 'Thailand',
    },
  ],
  notificationPreferences: {
    newDeals: true,
    orderUpdates: true,
    merchantMessages: true,
    promotions: false,
    followedMerchantNotifications: [],
  },
  restockAlerts: [],
};

export const TEST_MERCHANT_USER: User = {
  id: 'user-merchant-1',
  email: 'merchant@maithing.test',
  phone: '089-876-5432',
  name: 'TEST Merchant',
  avatarUrl: 'https://i.pravatar.cc/150?u=kornchai',
  roles: ['merchant'],
  preferredLanguage: 'th',
  createdAt: '2025-01-10T00:00:00Z',
};

export const CATEGORIES: Category[] = [
  { id: 'bakery', name: 'Bakery', nameTh: 'เบเกอรี่', icon: 'cake' },
  { id: 'cafe', name: 'Café', nameTh: 'คาเฟ่', icon: 'coffee' },
  { id: 'restaurant', name: 'Restaurant', nameTh: 'ร้านอาหาร', icon: 'utensils' },
  { id: 'grocery', name: 'Grocery', nameTh: 'ร้านขายของชำ', icon: 'shopping-basket' },
  { id: 'hotel', name: 'Hotel', nameTh: 'โรงแรม', icon: 'bed' },
  { id: 'dessert', name: 'Dessert', nameTh: 'ของหวาน', icon: 'ice-cream' },
  { id: 'healthy', name: 'Healthy', nameTh: 'อาหารเพื่อสุขภาพ', icon: 'leaf' },
  { id: 'street_food', name: 'Street Food', nameTh: 'อาหารริมทาง', icon: 'flame' },
];

const defaultHours: BusinessHours[] = [
  { day: 0, open: '08:00', close: '20:00' },
  { day: 1, open: '07:00', close: '21:00' },
  { day: 2, open: '07:00', close: '21:00' },
  { day: 3, open: '07:00', close: '21:00' },
  { day: 4, open: '07:00', close: '21:00' },
  { day: 5, open: '07:00', close: '22:00' },
  { day: 6, open: '08:00', close: '22:00' },
];

function addr(
  street: string,
  subDistrict: string,
  district: string,
  province: string,
  postal: string
): Address {
  return { street, subDistrict, district, province, postalCode: postal, country: 'Thailand' };
}

const MERCHANT_SEEDS: {
  name: string;
  nameTh?: string;
  description: string;
  categories: string[];
  address: Address;
  coords: Coordinates;
  rating: number;
  reviews: number;
  followers: number;
  pickupInstructions: string;
}[] = [
  {
    name: 'After You Siam',
    nameTh: 'After You สยาม',
    description: 'Premium toast and dessert cafe with daily surplus baked goods.',
    categories: ['dessert', 'cafe'],
    address: addr('Siam Square Soi 3', 'Pathum Wan', 'Pathum Wan', 'Bangkok', '10330'),
    coords: { latitude: 13.7462, longitude: 100.5347 },
    rating: 4.7,
    reviews: 312,
    followers: 1240,
    pickupInstructions: 'Pick up at the counter. Show your pickup code.',
  },
  {
    name: 'Villa Market Sukhumvit',
    nameTh: 'วิลล่า มาร์เก็ต สุขุมวิท',
    description: 'Grocery rescue boxes with fresh produce, baked goods, and ready meals.',
    categories: ['grocery'],
    address: addr('Sukhumvit 33', 'Khlong Tan Nuea', 'Watthana', 'Bangkok', '10110'),
    coords: { latitude: 13.7381, longitude: 100.5675 },
    rating: 4.5,
    reviews: 189,
    followers: 856,
    pickupInstructions: 'Collect at the service desk near the entrance.',
  },
  {
    name: 'Rocket Coffeebar',
    description: 'Artisan coffee and pastries in Thonglor.',
    categories: ['cafe', 'bakery'],
    address: addr('Thonglor Soi 11', 'Khlong Tan Nuea', 'Watthana', 'Bangkok', '10110'),
    coords: { latitude: 13.7308, longitude: 100.5852 },
    rating: 4.6,
    reviews: 245,
    followers: 980,
    pickupInstructions: 'Ask barista for Maithing order.',
  },
  {
    name: 'Soul Food Mahanakorn',
    description: 'Thai street food classics with a modern twist.',
    categories: ['restaurant', 'street_food'],
    address: addr('Soi Sukhumvit 55', 'Khlong Tan Nuea', 'Watthana', 'Bangkok', '10110'),
    coords: { latitude: 13.7315, longitude: 100.588 },
    rating: 4.8,
    reviews: 421,
    followers: 1560,
    pickupInstructions: 'Pickup at the side window.',
  },
  {
    name: 'Holey Artisan Bakery',
    description: 'French-style sourdough and viennoiserie.',
    categories: ['bakery'],
    address: addr('Sukhumvit 31', 'Khlong Toei Nuea', 'Watthana', 'Bangkok', '10110'),
    coords: { latitude: 13.735, longitude: 100.569 },
    rating: 4.8,
    reviews: 356,
    followers: 1100,
    pickupInstructions: 'Show code at the bakery counter.',
  },
  {
    name: 'Pad Thai Fai Ta Lu',
    nameTh: 'ผัดไทยไฟทะลุ',
    description: 'Famous wok-fried pad thai with mystery boxes of stir-fried noodles.',
    categories: ['street_food', 'restaurant'],
    address: addr('Charoen Krung Soi 50', 'Bang Rak', 'Bang Rak', 'Bangkok', '10500'),
    coords: { latitude: 13.7246, longitude: 100.5293 },
    rating: 4.6,
    reviews: 278,
    followers: 760,
    pickupInstructions: 'Line up at the takeaway window.',
  },
  {
    name: 'The Gardens of Dinsor Palace',
    description: 'Hotel buffet surplus and pastries from Dusit area.',
    categories: ['hotel', 'dessert'],
    address: addr('Ratchawithi Road', 'Dusit', 'Dusit', 'Bangkok', '10300'),
    coords: { latitude: 13.759, longitude: 100.517 },
    rating: 4.4,
    reviews: 134,
    followers: 540,
    pickupInstructions: 'Pickup at the hotel bakery lobby.',
  },
  {
    name: 'Broccoli Revolution',
    description: 'Plant-based bowls and vegan baked goods.',
    categories: ['healthy', 'restaurant'],
    address: addr('Sukhumvit 49', 'Khlong Tan Nuea', 'Watthana', 'Bangkok', '10110'),
    coords: { latitude: 13.728, longitude: 100.575 },
    rating: 4.7,
    reviews: 203,
    followers: 890,
    pickupInstructions: 'Collect at the counter near the entrance.',
  },
  {
    name: 'Karma Kafé',
    description: 'Healthy cafe with salads and cold-pressed juices.',
    categories: ['healthy', 'cafe'],
    address: addr('Ari Soi 1', 'Samsen Nai', 'Phaya Thai', 'Bangkok', '10400'),
    coords: { latitude: 13.7799, longitude: 100.5447 },
    rating: 4.5,
    reviews: 167,
    followers: 620,
    pickupInstructions: 'Pickup at the juice bar.',
  },
  {
    name: 'Mae Varee Mango Sticky Rice',
    nameTh: 'ข้าวเหนียวมะม่วงแม่วารี',
    description: 'Legendary mango sticky rice boxes.',
    categories: ['dessert', 'street_food'],
    address: addr('Thonglor Soi 38', 'Khlong Tan Nuea', 'Watthana', 'Bangkok', '10110'),
    coords: { latitude: 13.7275, longitude: 100.584 },
    rating: 4.8,
    reviews: 502,
    followers: 1890,
    pickupInstructions: 'Show code at the mango stall.',
  },
  {
    name: 'Tops Market Silom',
    description: 'Supermarket surplus boxes and deli items.',
    categories: ['grocery'],
    address: addr('Silom Road', 'Suriyawong', 'Bang Rak', 'Bangkok', '10500'),
    coords: { latitude: 13.727, longitude: 100.534 },
    rating: 4.3,
    reviews: 98,
    followers: 430,
    pickupInstructions: 'Service counter on the ground floor.',
  },
  {
    name: 'Gaggan Anand',
    description: 'Progressive Indian fine dining with chef surprise boxes.',
    categories: ['restaurant'],
    address: addr('Wireless Road', 'Lumphini', 'Pathum Wan', 'Bangkok', '10330'),
    coords: { latitude: 13.739, longitude: 100.543 },
    rating: 4.9,
    reviews: 88,
    followers: 340,
    pickupInstructions: 'Ring the bell and show code at the door.',
  },
  {
    name: 'Chiang Mai Night Bakery',
    nameTh: 'เบเกอรี่เชียงใหม่',
    description: 'Bakery rescue boxes from the old city.',
    categories: ['bakery'],
    address: addr('Ratchadamnoen Road', 'Phra Sing', 'Mueang Chiang Mai', 'Chiang Mai', '50200'),
    coords: { latitude: 18.7883, longitude: 98.9853 },
    rating: 4.6,
    reviews: 145,
    followers: 520,
    pickupInstructions: 'Pickup at the front counter.',
  },
  {
    name: 'Phuket Old Town Coffee',
    description: 'Heritage shophouse coffee and pastries.',
    categories: ['cafe', 'bakery'],
    address: addr('Thalang Road', 'Talat Yai', 'Mueang Phuket', 'Phuket', '83000'),
    coords: { latitude: 7.8804, longitude: 98.3923 },
    rating: 4.7,
    reviews: 176,
    followers: 680,
    pickupInstructions: 'Show code at the bar.',
  },
  {
    name: 'Mai Thai Kitchen',
    nameTh: 'ครัวใหม่ไทย',
    description: 'Home-style Thai curries and stir-fries.',
    categories: ['restaurant', 'street_food'],
    address: addr('Rama IV Road', 'Si Lom', 'Bang Rak', 'Bangkok', '10500'),
    coords: { latitude: 13.725, longitude: 100.532 },
    rating: 4.4,
    reviews: 112,
    followers: 380,
    pickupInstructions: 'Pickup at the kitchen window.',
  },
  {
    name: 'Summer Street Ice Cream',
    description: 'Artisan ice cream pints and waffle cones.',
    categories: ['dessert'],
    address: addr('Ekkamai Soi 12', 'Khlong Tan Nuea', 'Watthana', 'Bangkok', '10110'),
    coords: { latitude: 13.732, longitude: 100.583 },
    rating: 4.5,
    reviews: 156,
    followers: 470,
    pickupInstructions: 'Show code at the ice cream counter.',
  },
  {
    name: 'Bangkok Farmers Market',
    description: 'Fresh produce and organic pantry boxes.',
    categories: ['grocery', 'healthy'],
    address: addr('Phahon Yothin Road', 'Chatuchak', 'Chatuchak', 'Bangkok', '10900'),
    coords: { latitude: 13.817, longitude: 100.56 },
    rating: 4.6,
    reviews: 231,
    followers: 920,
    pickupInstructions: 'Pickup at the market info booth.',
  },
  {
    name: 'Cabbages & Cones',
    description: 'Vegetarian comfort food with surplus lunch boxes.',
    categories: ['healthy', 'restaurant'],
    address: addr('Sukhumvit 23', 'Khlong Toei Nuea', 'Watthana', 'Bangkok', '10110'),
    coords: { latitude: 13.736, longitude: 100.564 },
    rating: 4.5,
    reviews: 178,
    followers: 640,
    pickupInstructions: 'Pickup at the cashier counter.',
  },
  {
    name: 'Laantaa Riverside',
    description: 'Riverside restaurant with Thai sharing platters.',
    categories: ['restaurant'],
    address: addr('Charoen Nakorn Road', 'Khlong Ton Sai', 'Khlong San', 'Bangkok', '10600'),
    coords: { latitude: 13.733, longitude: 100.506 },
    rating: 4.7,
    reviews: 267,
    followers: 830,
    pickupInstructions: 'Pickup at the riverside takeaway counter.',
  },
  {
    name: 'Fuu Din Daeng',
    nameTh: 'ฟูดินแดง',
    description: 'Isaan grilled chicken and sticky rice mystery boxes.',
    categories: ['street_food', 'restaurant'],
    address: addr('Ratchadaphisek Road', 'Din Daeng', 'Din Daeng', 'Bangkok', '10400'),
    coords: { latitude: 13.77, longitude: 100.57 },
    rating: 4.6,
    reviews: 198,
    followers: 710,
    pickupInstructions: 'Pickup at the grill station.',
  },
];

export const TEST_MERCHANT_ID = 'merchant-1';

export const MERCHANTS: Merchant[] = MERCHANT_SEEDS.map((m, idx) => ({
  id: `merchant-${idx + 1}`,
  ownerId: idx === 0 ? TEST_MERCHANT_USER.id : `user-merchant-${idx + 1}`,
  name: m.name,
  slug: m.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, ''),
  description: m.description,
  logoUrl: `https://placehold.co/200x200/F97316/FFFFFF/png?text=${encodeURIComponent(m.name.charAt(0))}`,
  coverUrl: getFoodImage(m.categories[0], m.name + '-cover') + '&w=800&h=400',
  address: m.address,
  coordinates: m.coords,
  staticMapUrl: buildStaticMapUrl(m.coords) ?? undefined,
  phone: '02-123-4567',
  categories: m.categories,
  rating: m.rating,
  reviewCount: m.reviews,
  businessHours: defaultHours,
  isOpen: true,
  pickupInstructions: m.pickupInstructions,
  followers: m.followers,
  createdAt: '2025-01-01T00:00:00Z',
  // Test merchant (idx 0) starts unverified so the dashboard progress card is visible
  isVerified: idx !== 0 && idx < 12,
  verificationStatus: idx === 0 ? 'unverified' : idx < 12 ? 'verified' : ('unverified' as const),
  completedOrders: idx === 0 ? 8 : 10 + idx * 5,
  refundDisputes: 0,
  joinedAt: new Date(Date.now() - (idx + 1) * 30 * 86400000).toISOString(),
  hygieneRating: Math.round((4.2 + (idx % 8) / 10) * 10) / 10,
  ...(idx === 0 ? { revenueGoal: 5000, lastFollowerMilestone: 0 } : {}),
}));

function hoursFromNow(offsetHours: number, durationHours: number): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

const MYSTERY_BOX_TITLES: Record<string, string[]> = {
  bakery: ['Surprise Bread Box', 'Pastry Rescue Box', 'Sourdough & Viennoiserie Box'],
  cafe: ['Coffee & Pastry Box', 'Morning Mystery Bag', 'Café Rescue Set'],
  restaurant: ['Chef Surprise Box', 'Dinner Rescue Box', 'Thai Mystery Meal'],
  grocery: ['Fresh Produce Box', 'Grocery Rescue Box', 'Pantry Surprise'],
  hotel: ['Hotel Buffet Box', 'Pastry & Dessert Box', 'Luxury Rescue Bag'],
  dessert: ['Sweet Tooth Box', 'Dessert Surprise', 'Cake & Pastry Box'],
  healthy: ['Healthy Bowl Box', 'Vegan Rescue Box', 'Salad & Juice Box'],
  street_food: ['Street Food Surprise', 'Wok Box', 'Local Favorites Box'],
};

const FIXED_ITEM_TITLES: Record<string, string[]> = {
  bakery: ['Croissant Set', 'Sourdough Loaf', 'Danish Pastry'],
  cafe: ['Iced Latte + Cake', 'Avocado Toast', 'Cold Brew Bundle'],
  restaurant: ['Pad Thai', 'Green Curry', 'Stir-Fried Basil'],
  grocery: ['Fruit Box', 'Organic Vegetables', 'Ready Meal'],
  hotel: ['Macarons', 'Fruit Tart', 'Chocolate Cake'],
  dessert: ['Mango Sticky Rice', 'Shaved Ice', 'Ice Cream Pint'],
  healthy: ['Buddha Bowl', 'Acai Bowl', 'Green Smoothie'],
  street_food: ['Grilled Chicken', 'Pork Skewers', 'Som Tam'],
};

function getFoodImage(category: string, seed: string): string {
  const images: Record<string, string[]> = {
    bakery: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&h=400&fit=crop',
    ],
    cafe: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600&h=400&fit=crop',
    ],
    restaurant: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&h=400&fit=crop',
    ],
    grocery: [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?w=600&h=400&fit=crop',
    ],
    hotel: [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
    ],
    dessert: [
      'https://images.unsplash.com/photo-1563729784474-d8b8c88a8b5f?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&h=400&fit=crop',
    ],
    healthy: [
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=600&h=400&fit=crop',
    ],
    street_food: [
      'https://images.unsplash.com/photo-1606491956689-2ea866820c96?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&h=400&fit=crop',
    ],
  };

  const list = images[category] ?? images.bakery;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return list[Math.abs(hash) % list.length];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function generateMysteryBox(merchant: Merchant, index: number): MysteryBoxListing {
  const size = pick(['small', 'medium', 'large', 'xl'] as const);
  const prices = { small: 49, medium: 99, large: 149, xl: 249 };
  const originalPrices = { small: 150, medium: 300, large: 450, xl: 750 };
  const window = hoursFromNow(randomInt(1, 4), randomInt(1, 3));
  const title = pick(MYSTERY_BOX_TITLES[merchant.categories[0]] ?? MYSTERY_BOX_TITLES.bakery);

  return {
    id: `listing-${merchant.id}-${index}-box`,
    merchantId: merchant.id,
    type: 'mystery_box',
    title: `${merchant.name} ${title}`,
    description: `A delicious mystery box from ${merchant.name}. Contents vary based on daily surplus. Great value and helps reduce food waste.`,
    images: [getFoodImage(merchant.categories[0], `${merchant.id}-${index}-box`)],
    category: merchant.categories[0],
    originalPrice: originalPrices[size],
    salePrice: prices[size],
    quantity: randomInt(5, 20),
    quantityRemaining: randomInt(1, 8),
    pickupWindowStart: window.start,
    pickupWindowEnd: window.end,
    dietaryTags: pick([['vegetarian'], ['halal'], ['vegan'], []]),
    allergens: pick([[], ['wheat'], ['dairy'], ['eggs']]),
    status: 'active',
    createdAt: new Date().toISOString(),
    boxSize: size,
    estimatedRetailValue: originalPrices[size],
    viewCount: randomInt(60, 400),
    clickCount: randomInt(15, 120),
    searchAppearances: randomInt(25, 200),
  };
}

function generateFixedItem(merchant: Merchant, index: number): FixedItemListing {
  const title = pick(FIXED_ITEM_TITLES[merchant.categories[0]] ?? FIXED_ITEM_TITLES.bakery);
  const originalPrice = randomInt(80, 350);
  const salePrice = Math.floor(originalPrice * (randomInt(40, 65) / 100));
  const window = hoursFromNow(randomInt(1, 4), randomInt(1, 2));

  return {
    id: `listing-${merchant.id}-${index}-fixed`,
    merchantId: merchant.id,
    type: 'fixed_item',
    title: `${title} @ ${merchant.name}`,
    description: `Surplus ${title.toLowerCase()} ready for pickup. Fresh and delicious, available at a discounted price while stocks last.`,
    images: [getFoodImage(merchant.categories[0], `${merchant.id}-${index}-fixed`)],
    category: merchant.categories[0],
    originalPrice,
    salePrice,
    quantity: randomInt(5, 15),
    quantityRemaining: randomInt(1, 6),
    pickupWindowStart: window.start,
    pickupWindowEnd: window.end,
    dietaryTags: pick([[], ['vegetarian'], ['halal']]),
    allergens: pick([[], ['wheat'], ['dairy'], ['peanuts']]),
    status: 'active',
    createdAt: new Date().toISOString(),
    viewCount: randomInt(40, 300),
    clickCount: randomInt(10, 90),
    searchAppearances: randomInt(20, 160),
  };
}

export const LISTINGS: Listing[] = [
  ...MERCHANTS.flatMap((merchant) => {
    const listings: Listing[] = [];
    const count = randomInt(2, 4);
    for (let i = 0; i < count; i++) {
      listings.push(generateMysteryBox(merchant, i));
      listings.push(generateFixedItem(merchant, i + 100));
    }
    return listings;
  }),
  // Sold-out listing for testing waitlist / restock alert
  {
    id: 'listing-demo-soldout',
    merchantId: 'merchant-1',
    type: 'fixed_item',
    title: 'Sold Out Demo — Tap Notify Me',
    description:
      'This listing is sold out. Customers can join the waitlist and get notified when it restocks.',
    images: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400'],
    category: 'restaurant',
    originalPrice: 300,
    salePrice: 99,
    quantity: 5,
    quantityRemaining: 0,
    pickupWindowStart: hoursFromNow(1, 1).start,
    pickupWindowEnd: hoursFromNow(1, 1).end,
    dietaryTags: ['vegetarian'],
    allergens: [],
    status: 'sold_out',
    createdAt: new Date().toISOString(),
    viewCount: 280,
    clickCount: 95,
    searchAppearances: 140,
  } as Listing,
  // Flash-sale listing for testing countdown timer
  {
    id: 'listing-demo-flashsale',
    merchantId: 'merchant-2',
    type: 'mystery_box',
    title: 'Flash Sale Demo — 3-Hour Countdown',
    description: 'This listing has an active flash sale with a countdown timer. Act fast!',
    images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400'],
    category: 'restaurant',
    originalPrice: 500,
    salePrice: 200,
    flashSalePrice: 120,
    flashSaleEndsAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    quantity: 8,
    quantityRemaining: 3,
    pickupWindowStart: hoursFromNow(1, 2).start,
    pickupWindowEnd: hoursFromNow(1, 2).end,
    dietaryTags: ['halal'],
    allergens: [],
    status: 'active',
    createdAt: new Date().toISOString(),
    boxSize: 'medium',
    estimatedRetailValue: 500,
    viewCount: 420,
    clickCount: 180,
    searchAppearances: 220,
  } as Listing,
];

export const CUSTOMER_WALLET: Wallet = {
  userId: TEST_CUSTOMER.id,
  balance: 999999,
  currency: 'THB',
};

const CUSTOMER_NAMES = [
  'Ariya Wong',
  'Kornchai Srisuk',
  'Somchai Jaidee',
  'Nattawadee Praphai',
  'Pimchanok Lim',
  'Thanakrit Maneerat',
  'Wipada Suksawat',
  'Jirayu Khemjira',
  'Suthida Rattanakosin',
  'Chaiwat Thongchai',
];

export function generateOrders(count: number): Order[] {
  const statuses: Order['status'][] = [
    'completed',
    'completed',
    'completed',
    'completed',
    'picked_up',
    'ready',
    'preparing',
    'confirmed',
  ];
  return Array.from({ length: count })
    .map((_, i) => {
      const merchant = pick(MERCHANTS);
      const listing = pick(LISTINGS.filter((l) => l.merchantId === merchant.id));
      const quantity = randomInt(1, 3);
      const status = i < 5 ? statuses[i] : pick(statuses);
      const createdAt = new Date(Date.now() - i * 43200000 - randomInt(0, 3600000)).toISOString();
      const customerIndex = i % CUSTOMER_NAMES.length;
      const customerName = CUSTOMER_NAMES[customerIndex];
      const customerId =
        customerIndex === 0 ? TEST_CUSTOMER.id : `user-customer-${customerIndex + 1}`;

      return {
        id: `order-${i + 1}`,
        customerId,
        customerName,
        customerPhone: `08${randomInt(10000000, 99999999)}`,
        customerAvatarUrl: `https://i.pravatar.cc/150?u=${customerId}`,
        merchantId: merchant.id,
        merchantName: merchant.name,
        merchantLogoUrl: merchant.logoUrl,
        merchantCoordinates: merchant.coordinates,
        items: [
          {
            listingId: listing.id,
            title: listing.title,
            quantity,
            unitPrice: listing.salePrice,
            totalPrice: listing.salePrice * quantity,
            imageUrl: listing.images[0],
          },
        ],
        subtotal: listing.salePrice * quantity,
        discount: (listing.originalPrice - listing.salePrice) * quantity,
        couponDiscount: 0,
        total: listing.salePrice * quantity,
        status,
        pickupCode: `MTH${randomInt(1000, 9999)}`,
        pickupWindowStart: listing.pickupWindowStart,
        pickupWindowEnd: listing.pickupWindowEnd,
        notes: randomInt(0, 4) === 0 ? 'Please pack separately. Thank you!' : undefined,
        createdAt,
        updatedAt: createdAt,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export const ORDERS: Order[] = generateOrders(150);

export const WALLET_TRANSACTIONS: WalletTransaction[] = Array.from({ length: 20 }).map((_, i) => {
  const type = pick(['top_up', 'purchase', 'refund'] as const);
  const order = type !== 'top_up' ? pick(ORDERS) : null;
  const amount =
    type === 'purchase' && order
      ? order.total
      : type === 'refund' && order
        ? order.total
        : randomInt(50, 500);
  const description =
    type === 'top_up' ? 'Top up' : `Order at ${order?.merchantName ?? 'After You Siam'}`;
  return {
    id: `txn-${i + 1}`,
    userId: TEST_CUSTOMER.id,
    type,
    amount,
    description,
    orderId: order?.id,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  };
});

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    userId: TEST_CUSTOMER.id,
    title: 'Your order is ready!',
    body: 'Pick up your After You Siam mystery box before 7:00 PM.',
    data: { orderId: 'order-1' },
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    userId: TEST_CUSTOMER.id,
    title: 'New deal near you',
    body: 'Rocket Coffeebar just added a fresh pastry box.',
    data: { merchantId: 'merchant-3' },
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'notif-3',
    userId: TEST_CUSTOMER.id,
    title: 'Order completed',
    body: 'Thanks for rescuing food today!',
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  newDeals: true,
  orderUpdates: true,
  merchantMessages: true,
  promotions: false,
  followedMerchantNotifications: [],
};

export const MERCHANT_ANALYTICS: MerchantAnalytics = {
  merchantId: TEST_MERCHANT_ID,
  totalRevenue: 148500,
  totalOrders: 312,
  totalItemsSaved: 984,
  todayRevenue: 4200,
  todayOrders: 11,
  weeklyRevenue: [5200, 6100, 4800, 7300, 5400, 6900, 4200],
  weeklyOrders: [12, 15, 11, 18, 13, 16, 11],
  weeklyItemsSaved: [38, 45, 32, 51, 41, 48, 35],
  views: 4820,
  conversionRate: 6.4,
  avgOrderValue: 118,
  topListings: [
    {
      listingId: 'listing-merchant-1-0-box',
      title: 'After You Siam Surprise Bread Box',
      revenue: 12800,
      orders: 86,
      views: 2140,
      clicks: 643,
      searchAppearances: 892,
      conversionRate: 0.134,
    },
    {
      listingId: 'listing-merchant-1-100-fixed',
      title: 'Croissant Set @ After You Siam',
      revenue: 9200,
      orders: 64,
      views: 1560,
      clicks: 421,
      searchAppearances: 634,
      conversionRate: 0.152,
    },
    {
      listingId: 'listing-merchant-1-1-box',
      title: 'After You Siam Pastry Rescue Box',
      revenue: 7100,
      orders: 52,
      views: 1120,
      clicks: 289,
      searchAppearances: 445,
      conversionRate: 0.18,
    },
  ],
  weeklyAOV: [145, 162, 138, 171, 155, 168, 152],
  followerHistory: [
    { date: '2026-01-01', count: 12 },
    { date: '2026-02-01', count: 28 },
    { date: '2026-03-01', count: 51 },
    { date: '2026-04-01', count: 89 },
    { date: '2026-05-01', count: 134 },
    { date: '2026-06-01', count: 198 },
    { date: '2026-07-01', count: 267 },
    { date: '2026-08-01', count: 312 },
  ],
  hourlyRevenue: [
    { hour: 8, revenue: 0 },
    { hour: 9, revenue: 0 },
    { hour: 10, revenue: 0 },
    { hour: 11, revenue: 0 },
    { hour: 12, revenue: 0 },
    { hour: 13, revenue: 0 },
    { hour: 14, revenue: 0 },
    { hour: 15, revenue: 0 },
    { hour: 16, revenue: 0 },
    { hour: 17, revenue: 0 },
    { hour: 18, revenue: 0 },
    { hour: 19, revenue: 0 },
    { hour: 20, revenue: 0 },
    { hour: 21, revenue: 0 },
    { hour: 22, revenue: 0 },
    { hour: 23, revenue: 0 },
    { hour: 0, revenue: 0 },
    { hour: 1, revenue: 0 },
    { hour: 2, revenue: 0 },
    { hour: 3, revenue: 0 },
    { hour: 4, revenue: 0 },
    { hour: 5, revenue: 0 },
    { hour: 6, revenue: 0 },
    { hour: 7, revenue: 0 },
  ],
};

export const ALL_USERS: User[] = [TEST_CUSTOMER, TEST_MERCHANT_USER];

const REVIEW_TEMPLATES = [
  'Great value! The mystery box was full of delicious surprises.',
  'Friendly staff and easy pickup. Will definitely order again.',
  'Good food, amazing price. Helped me discover this place.',
  'The portion was generous and everything was fresh.',
  'Quick pickup and the staff knew exactly what to do.',
  'Nice surprise bag, loved the variety.',
  'Excellent way to save food and money. Highly recommended!',
  'Pickup was smooth, food quality was better than expected.',
  'Such a clever idea. Got a lot more than I paid for.',
  'The fixed item deal was perfect for lunch.',
];

const REVIEWER_NAMES = [
  'Ariya Wong',
  'Kornchai Srisuk',
  'Somchai J',
  'Nattawadee P',
  'Pimchanok L',
  'Thanakrit M',
  'Wipada S',
  'Jirayu K',
  'Suthida R',
  'Chaiwat T',
];

const REVIEW_SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1563729784474-d8b8c88a8b5f?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300&h=300&fit=crop',
];

export const REVIEWS: Review[] = MERCHANTS.flatMap((merchant) => {
  const count = Math.min(merchant.reviewCount, 12);
  return Array.from({ length: count }).map((_, i) => {
    const targetRating = merchant.rating;
    const variance = i % 2 === 0 ? 0.5 : -0.3;
    const rating = Math.min(5, Math.max(1, Math.round((targetRating + variance) * 2) / 2));
    const daysAgo = i * 3 + randomInt(1, 6);
    return {
      id: `review-${merchant.id}-${i}`,
      orderId: `order-review-${merchant.id}-${i}`,
      customerId: i === 0 ? TEST_CUSTOMER.id : `user-review-${i}`,
      customerName: REVIEWER_NAMES[i % REVIEWER_NAMES.length],
      merchantId: merchant.id,
      rating,
      comment: REVIEW_TEMPLATES[i % REVIEW_TEMPLATES.length],
      images: i % 3 === 0 ? REVIEW_SAMPLE_IMAGES.slice(0, Math.min(3, (i % 5) + 1)) : undefined,
      createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    };
  });
});

export const LISTING_TEMPLATES: ListingTemplate[] = [
  {
    id: 'template-1',
    merchantId: TEST_MERCHANT_ID,
    name: 'Evening Bread Box',
    type: 'mystery_box',
    title: 'Surprise Bread Box',
    description: 'A mix of surplus breads and pastries from today.',
    category: 'bakery',
    originalPrice: 300,
    salePrice: 99,
    quantity: 8,
    boxSize: 'medium',
    estimatedRetailValue: 300,
    dietaryTags: [],
    allergens: ['wheat'],
    images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop'],
    pickupWindowDurationHours: 2,
    autoExpiry: true,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    expiresAt: new Date(
      new Date(Date.now() - 30 * 86400000).getTime() + 90 * 86400000
    ).toISOString(),
  },
  {
    id: 'template-2',
    merchantId: TEST_MERCHANT_ID,
    name: 'Lunch Set',
    type: 'fixed_item',
    title: 'Chef Surprise Lunch',
    description: 'One main dish plus a side. Contents vary by day.',
    category: 'restaurant',
    originalPrice: 250,
    salePrice: 129,
    quantity: 10,
    dietaryTags: [],
    allergens: [],
    images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop'],
    pickupWindowDurationHours: 1.5,
    autoExpiry: true,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    expiresAt: new Date(
      new Date(Date.now() - 20 * 86400000).getTime() + 90 * 86400000
    ).toISOString(),
  },
];

export const MERCHANT_WALLET: MerchantWallet = {
  merchantId: TEST_MERCHANT_ID,
  balance: 12450,
  currency: 'THB',
  totalEarnings: 148500,
  pendingPayout: 8750,
  lastPayoutDate: new Date(Date.now() - 7 * 86400000).toISOString(),
  nextPayoutDate: new Date(Date.now() + 7 * 86400000).toISOString(),
  commissionRate: 0.12,
};

export const PAYOUT_TRANSACTIONS: PayoutTransaction[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `payout-${i + 1}`,
  merchantId: TEST_MERCHANT_ID,
  amount: [8750, 9200, 8100, 10500, 7800, 9400, 11200, 8600][i],
  status: (i < 2 ? 'pending' : 'completed') as PayoutTransaction['status'],
  method: 'bank_transfer',
  bankAccountId: 'bank-1',
  bankAccountName: 'Kornchai Srisuk - SCB',
  createdAt: new Date(Date.now() - i * 7 * 86400000).toISOString(),
  completedAt:
    i < 2 ? undefined : new Date(Date.now() - i * 7 * 86400000 + 2 * 86400000).toISOString(),
}));

export const BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank-1',
    merchantId: TEST_MERCHANT_ID,
    bankName: 'Siam Commercial Bank',
    accountName: 'Kornchai Srisuk',
    accountNumber: '123-4-56789-0',
    branch: 'Siam Square',
    isDefault: true,
  },
  {
    id: 'bank-2',
    merchantId: TEST_MERCHANT_ID,
    bankName: 'Kasikornbank',
    accountName: 'Kornchai Srisuk',
    accountNumber: '987-6-54321-0',
    branch: 'Sukhumvit',
    isDefault: false,
  },
];

export const STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'staff-1',
    merchantId: TEST_MERCHANT_ID,
    name: 'Kornchai Srisuk',
    email: 'merchant@maithing.test',
    phone: '089-876-5432',
    role: 'owner',
    isActive: true,
    lastActiveAt: new Date().toISOString(),
    permissions: ['all'],
    avatarUrl: 'https://i.pravatar.cc/150?u=kornchai',
    createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
  },
  {
    id: 'staff-2',
    merchantId: TEST_MERCHANT_ID,
    name: 'Nattapong Kaew',
    email: 'nattapong@maithing.test',
    phone: '081-111-2233',
    role: 'manager',
    isActive: true,
    lastActiveAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    permissions: ['manage_orders', 'manage_inventory', 'manage_staff', 'view_analytics'],
    avatarUrl: 'https://i.pravatar.cc/150?u=nattapong',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'staff-3',
    merchantId: TEST_MERCHANT_ID,
    name: 'Supansa Boon',
    email: 'supansa@maithing.test',
    phone: '082-333-4455',
    role: 'staff',
    isActive: false,
    permissions: ['manage_orders'],
    avatarUrl: 'https://i.pravatar.cc/150?u=supansa',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

export const COUPONS: Coupon[] = [
  {
    id: 'coupon-1',
    merchantId: TEST_MERCHANT_ID,
    code: 'WELCOME20',
    description: '20% off first rescue',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscountAmount: 100,
    minOrderAmount: 100,
    maxUses: 100,
    perCustomerMaxUses: 1,
    firstTimeCustomerOnly: true,
    applicableCategories: ['restaurant', 'cafe'],
    applicableListingTypes: ['fixed_item', 'mystery_box'],
    usesCount: 34,
    status: 'active',
    validFrom: new Date(Date.now() - 30 * 86400000).toISOString(),
    validUntil: new Date(Date.now() + 60 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'coupon-2',
    merchantId: TEST_MERCHANT_ID,
    code: 'LUNCH50',
    description: '฿50 off lunch boxes',
    discountType: 'fixed',
    discountValue: 50,
    minOrderAmount: 150,
    maxUses: 50,
    perCustomerMaxUses: 2,
    firstTimeCustomerOnly: false,
    applicableCategories: ['restaurant'],
    applicableListingTypes: ['fixed_item'],
    usesCount: 12,
    status: 'active',
    validFrom: new Date(Date.now() - 10 * 86400000).toISOString(),
    validUntil: new Date(Date.now() + 20 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

export const MERCHANT_MESSAGES: MerchantMessage[] = [
  {
    id: 'msg-1',
    merchantId: TEST_MERCHANT_ID,
    customerId: 'user-customer-1',
    customerName: 'Ariya Wong',
    customerAvatarUrl: 'https://i.pravatar.cc/150?u=ariya',
    orderId: 'order-1',
    content: 'Hi, can I pick up a bit later tonight?',
    sentBy: 'customer',
    read: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'msg-2',
    merchantId: TEST_MERCHANT_ID,
    customerId: 'user-customer-1',
    customerName: 'Ariya Wong',
    customerAvatarUrl: 'https://i.pravatar.cc/150?u=ariya',
    orderId: 'order-1',
    content: 'Sure, pickup is available until 9 PM. See you then!',
    sentBy: 'merchant',
    read: true,
    createdAt: new Date(Date.now() - 1.5 * 3600000).toISOString(),
  },
  {
    id: 'msg-3',
    merchantId: TEST_MERCHANT_ID,
    customerId: 'user-customer-2',
    customerName: 'Kornchai Srisuk',
    customerAvatarUrl: 'https://i.pravatar.cc/150?u=kornchai',
    orderId: 'order-3',
    content: 'Is the mystery box vegetarian today?',
    sentBy: 'customer',
    read: false,
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
];

export const MERCHANT_NOTIFICATION_PREFS: MerchantNotificationPreferences = {
  newOrders: true,
  lowStock: true,
  payoutUpdates: true,
  customerReviews: true,
  pickupReminders: true,
  autoConfirmOrders: false,
};

export const MERCHANT_ONBOARDING: MerchantOnboarding = {
  merchantId: TEST_MERCHANT_ID,
  completedSteps: ['welcome', 'business_info', 'verification', 'bank_account', 'first_listing'],
  currentStep: 'complete',
};
