import { randomInt } from 'node:crypto';

// ─── Currency ────────────────────────────────────────────────────────────────

export function formatThb(amount: number): string {
  return `฿${amount.toLocaleString('th-TH')}`;
}

export function discountPercent(original: number, price: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - price) / original) * 100);
}

// ─── Pickup code ─────────────────────────────────────────────────────────────

export function generatePickupCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[randomInt(chars.length)]).join('');
}

// ─── QR payload ───────────────────────────────────────────────────────────────

export function generateQrPayload(orderId: string): string {
  return JSON.stringify({ order_id: orderId, v: 1 });
}

// ─── Pickup window ─────────────────────────────────────────────────────────────

export function isPickupWindowOpen(startsAt: string, endsAt: string, now = new Date()): boolean {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  return now >= start && now <= end;
}

// ─── Dates ───────────────────────────────────────────────────────────────────

export function toBuddhistYear(date: Date): number {
  return date.getFullYear() + 543;
}

/** Format a date for Thai locale, optionally using Buddhist era year */
export function formatDateTH(date: Date, buddhistEra = false): string {
  const year = buddhistEra ? toBuddhistYear(date) : date.getFullYear();
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${d}/${m}/${year}`;
}

// ─── Distance ────────────────────────────────────────────────────────────────

/** Haversine distance in metres */
export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

// ─── Platform fee ────────────────────────────────────────────────────────────

/** Default platform fee in basis points (configurable via platform_config table) */
export const DEFAULT_PLATFORM_FEE_BPS = 1500; // 15%

export function platformFee(amountThb: number, feeBps = DEFAULT_PLATFORM_FEE_BPS): number {
  return Math.round((amountThb * feeBps) / 10000);
}

// ─── Food categories ─────────────────────────────────────────────────────────

export const FOOD_CATEGORIES = [
  'bakery',
  'cafe',
  'restaurant',
  'grocery',
  'supermarket',
  'convenience',
  'hotel',
  'buffet',
  'deli',
  'juice_bar',
  'other',
] as const;

export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

// ─── Impact ──────────────────────────────────────────────────────────────────

/** CO₂ saved estimate per meal (kg) */
export const CO2_KG_PER_MEAL = 2.5;

export function mealsToKgCO2(meals: number): number {
  return Math.round(meals * CO2_KG_PER_MEAL * 10) / 10;
}

export type FoodHeroLevel = 'seed' | 'sprout' | 'leaf' | 'tree' | 'forest';

export function heroLevel(mealsSaved: number): FoodHeroLevel {
  if (mealsSaved >= 200) return 'forest';
  if (mealsSaved >= 100) return 'tree';
  if (mealsSaved >= 50) return 'leaf';
  if (mealsSaved >= 10) return 'sprout';
  return 'seed';
}
