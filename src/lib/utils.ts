import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Merchant } from '@/src/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'THB', locale = 'en-TH') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDistance(meters: number, locale = 'en') {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatWalkTime(meters: number, locale = 'en') {
  const minutes = Math.max(1, Math.round(meters / 80));
  const unit = locale === 'th' ? 'นาที' : 'min';
  return `${minutes} ${unit}`;
}

export function formatRelativeTime(date: string | Date, locale = 'en') {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  const isThai = locale === 'th';
  const abs = Math.abs.bind(Math);

  if (abs(diffMins) < 60) {
    if (diffMins === 0) return isThai ? 'เมื่อครู่' : 'just now';
    if (isThai) return diffMins > 0 ? `อีก ${diffMins} นาที` : `${abs(diffMins)} นาทีที่แล้ว`;
    return diffMins > 0 ? `in ${diffMins}m` : `${abs(diffMins)}m ago`;
  }
  if (abs(diffHours) < 24) {
    if (isThai) return diffHours > 0 ? `อีก ${diffHours} ชั่วโมง` : `${abs(diffHours)} ชั่วโมงที่แล้ว`;
    return diffHours > 0 ? `in ${diffHours}h` : `${abs(diffHours)}h ago`;
  }
  if (isThai) return diffDays > 0 ? `อีก ${diffDays} วัน` : `${abs(diffDays)} วันที่แล้ว`;
  return diffDays > 0 ? `in ${diffDays}d` : `${abs(diffDays)}d ago`;
}

export function generatePickupCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const CATEGORY_LABELS: Record<string, { en: string; th: string }> = {
  bakery: { en: 'Bakery', th: 'เบเกอรี่' },
  cafe: { en: 'Café', th: 'คาเฟ่' },
  restaurant: { en: 'Restaurant', th: 'ร้านอาหาร' },
  grocery: { en: 'Grocery', th: 'ร้านขายของชำ' },
  hotel: { en: 'Hotel', th: 'โรงแรม' },
  dessert: { en: 'Dessert', th: 'ของหวาน' },
  healthy: { en: 'Healthy', th: 'อาหารเพื่อสุขภาพ' },
  street_food: { en: 'Street Food', th: 'อาหารริมทาง' },
};

export function formatCategory(id: string, locale = 'en'): string {
  const label = CATEGORY_LABELS[id];
  if (label) return label[locale as 'en' | 'th'] ?? label.en;
  return id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatPickupWindow(start: string | Date, end: string | Date, locale = 'en') {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const isThai = locale === 'th';

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !isThai,
  });

  return `${dateFormatter.format(startDate)} · ${timeFormatter.format(startDate)} – ${timeFormatter.format(endDate)}`;
}

function parseTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return { hours: hours ?? 0, minutes: minutes ?? 0 };
}

function isCurrentlyOpen(hours: { open: string; close: string }) {
  const now = new Date();
  const { hours: openH, minutes: openM } = parseTime(hours.open);
  const { hours: closeH, minutes: closeM } = parseTime(hours.close);

  const open = new Date(now);
  open.setHours(openH, openM, 0, 0);

  const close = new Date(now);
  close.setHours(closeH, closeM, 0, 0);

  if (close <= open) {
    close.setDate(close.getDate() + 1);
  }

  return now >= open && now <= close;
}

export function getMerchantOpenStatus(merchant: Merchant, locale = 'en') {
  const todayHours = merchant.businessHours.find((h) => h.day === new Date().getDay());

  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: locale !== 'th',
  });

  if (!todayHours) {
    return { isOpen: false, openTime: undefined, closeTime: undefined };
  }

  const isOpen = isCurrentlyOpen(todayHours);
  const now = new Date();
  const { hours: openH, minutes: openM } = parseTime(todayHours.open);
  const { hours: closeH, minutes: closeM } = parseTime(todayHours.close);

  const openDate = new Date(now);
  openDate.setHours(openH, openM, 0, 0);
  const closeDate = new Date(now);
  closeDate.setHours(closeH, closeM, 0, 0);

  return {
    isOpen,
    openTime: timeFormatter.format(openDate),
    closeTime: timeFormatter.format(closeDate),
  };
}

export function formatCompactNumber(value: number, locale = 'en') {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ListingUrgency {
  level: UrgencyLevel;
  label: string;
  color: 'success' | 'warning' | 'danger';
}

export function getListingUrgency(
  listing: {
    quantityRemaining: number;
    pickupWindowEnd: string;
  },
  locale = 'en'
): ListingUrgency | null {
  const remaining = listing.quantityRemaining;
  const minsUntilEnd = Math.max(
    0,
    Math.round((new Date(listing.pickupWindowEnd).getTime() - Date.now()) / 60000)
  );

  const isThai = locale === 'th';

  if (remaining === 0) return null;
  if (remaining <= 2 || minsUntilEnd <= 30) {
    return {
      level: 'critical',
      label:
        remaining <= 2
          ? isThai
            ? `เหลือ ${remaining}`
            : `Only ${remaining} left`
          : isThai
            ? 'หมดใน 30 นาที'
            : 'Ends in 30 min',
      color: 'danger',
    };
  }
  if (remaining <= 5 || minsUntilEnd <= 90) {
    return {
      level: 'high',
      label:
        remaining <= 5
          ? isThai
            ? `เหลือ ${remaining}`
            : `Only ${remaining} left`
          : isThai
            ? 'กำลังจะหมด'
            : 'Ends soon',
      color: 'warning',
    };
  }
  if (minsUntilEnd <= 240) {
    return {
      level: 'medium',
      label: isThai ? 'ขายดี' : 'Selling fast',
      color: 'warning',
    };
  }
  return null;
}

export type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'late_night';

export function getMealTimeForHour(hour: number): MealTime {
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 21) return 'dinner';
  return 'late_night';
}

export function getCurrentMealTime(): MealTime {
  return getMealTimeForHour(new Date().getHours());
}

export function calculateDistance(from: Coordinates, to: Coordinates) {
  const R = 6371000; // Earth radius in meters
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.latitude * Math.PI) / 180) *
      Math.cos((to.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}
