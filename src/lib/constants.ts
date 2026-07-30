import type { Category, Coordinates } from '@/src/types';

export const APP_NAME = 'Maithing';
export const APP_TAGLINE = 'Save money. Save food. Help the planet.';
export const APP_TAGLINE_TH = 'ประหยัดเงิน ลด food waste ช่วยโลก';

// Default user location for distance calculations (Siam, Bangkok).
export const DEFAULT_USER_LOCATION: Coordinates = {
  latitude: 13.7462,
  longitude: 100.5347,
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

export const DIETARY_TAGS = [
  { id: 'vegetarian', name: 'Vegetarian', nameTh: 'มังสวิรัติ' },
  { id: 'vegan', name: 'Vegan', nameTh: 'วีแกน' },
  { id: 'halal', name: 'Halal', nameTh: 'ฮาลาล' },
  { id: 'gluten_free', name: 'Gluten Free', nameTh: 'ไม่มีกลูเตน' },
  { id: 'keto', name: 'Keto', nameTh: 'คีโต' },
  { id: 'low_sodium', name: 'Low Sodium', nameTh: 'ลดโซเดียม' },
];

export const ALLERGENS = [
  { id: 'peanuts', name: 'Peanuts', nameTh: 'ถั่วลิสง' },
  { id: 'tree_nuts', name: 'Tree Nuts', nameTh: 'ถั่วต่างๆ' },
  { id: 'dairy', name: 'Dairy', nameTh: 'นม' },
  { id: 'eggs', name: 'Eggs', nameTh: 'ไข่' },
  { id: 'wheat', name: 'Wheat', nameTh: 'ข้าวสาลี' },
  { id: 'soy', name: 'Soy', nameTh: 'ถั่วเหลือง' },
  { id: 'shellfish', name: 'Shellfish', nameTh: 'อาหารทะเล' },
  { id: 'sesame', name: 'Sesame', nameTh: 'งา' },
];

export const BOX_SIZES = [
  {
    id: 'small',
    name: 'Small',
    nameTh: 'เล็ก',
    description: '1-2 items',
    descriptionTh: '1-2 รายการ',
  },
  {
    id: 'medium',
    name: 'Medium',
    nameTh: 'กลาง',
    description: '2-4 items',
    descriptionTh: '2-4 รายการ',
  },
  {
    id: 'large',
    name: 'Large',
    nameTh: 'ใหญ่',
    description: '4-6 items',
    descriptionTh: '4-6 รายการ',
  },
  {
    id: 'xl',
    name: 'XL',
    nameTh: 'XL',
    description: 'Family size',
    descriptionTh: 'สำหรับครอบครัว',
  },
];

export const MEAL_TIMES = [
  { id: 'breakfast', name: 'Breakfast', nameTh: 'อาหารเช้า', icon: 'sunrise' },
  { id: 'lunch', name: 'Lunch', nameTh: 'อาหารกลางวัน', icon: 'sun' },
  { id: 'dinner', name: 'Dinner', nameTh: 'อาหารเย็น', icon: 'sunset' },
  { id: 'late_night', name: 'Late Night', nameTh: 'ดึก', icon: 'moon' },
] as const;

export type MealTimeId = (typeof MEAL_TIMES)[number]['id'];

export const HOME_COLLECTIONS = [
  { id: 'under_100', name: 'Under ฿100', filter: { maxPrice: 100 } },
  { id: 'ending_soon', name: 'Ending Soon', filter: { sortBy: 'newest' as const } },
  { id: 'biggest_discount', name: 'Biggest Discount', filter: { sortBy: 'discount' as const } },
  { id: 'mystery_boxes', name: 'Mystery Boxes', filter: { type: 'mystery_box' as const } },
] as const;

export const APP_STATS = {
  totalRescuers: 52800,
  totalMealsSaved: 312000,
  totalMerchantPartners: 230,
};
