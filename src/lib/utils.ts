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

export function formatRelativeTime(date: string | Date, locale = 'en') {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffMins) < 60) return rtf.format(diffMins, 'minute');
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  return rtf.format(diffDays, 'day');
}

export function generatePickupCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const CATEGORY_LABELS: Record<string, string> = {
  bakery: 'Bakery',
  cafe: 'Café',
  restaurant: 'Restaurant',
  grocery: 'Grocery',
  hotel: 'Hotel',
  dessert: 'Dessert',
  healthy: 'Healthy',
  street_food: 'Street Food',
};

export function formatCategory(id: string): string {
  return CATEGORY_LABELS[id] ?? id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
