import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { NotificationPreferences } from '@/src/types';

let permissionGranted: boolean | null = null;

export async function requestNotificationPermissions(): Promise<boolean> {
  if (permissionGranted !== null) return permissionGranted;
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const result = await Notifications.requestPermissionsAsync();
    status = result.status;
  }
  permissionGranted = status === 'granted';
  return permissionGranted;
}

export type NotificationCategory = 'new_deal' | 'order_update' | 'merchant_message' | 'promotion';

export function shouldScheduleNotification(
  preferences: NotificationPreferences | undefined,
  type: NotificationCategory
): boolean {
  if (!preferences) return true;
  switch (type) {
    case 'new_deal':
      return preferences.newDeals;
    case 'order_update':
      return preferences.orderUpdates;
    case 'merchant_message':
      return preferences.merchantMessages;
    case 'promotion':
      return preferences.promotions;
    default:
      return true;
  }
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  preferences?: NotificationPreferences,
  category?: NotificationCategory,
  url?: string
) {
  if (Platform.OS === 'web') return;
  if (category && !shouldScheduleNotification(preferences, category)) return;

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { ...data, url },
      sound: 'default',
    },
    trigger: null,
  });
}

export async function scheduleNotificationAtDate(
  title: string,
  body: string,
  date: Date,
  data?: Record<string, unknown>,
  url?: string
) {
  if (Platform.OS === 'web') return;
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { ...data, url },
      sound: 'default',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

export async function schedulePickupReminder(
  merchantName: string,
  pickupWindowEnd: string,
  orderId: string
) {
  const endTime = new Date(pickupWindowEnd).getTime();
  const reminderTime = new Date(endTime - 30 * 60 * 1000);
  if (reminderTime <= new Date()) return;

  await scheduleNotificationAtDate(
    'Pickup reminder',
    `Your order from ${merchantName} pickup window closes in 30 minutes.`,
    reminderTime,
    { orderId, type: 'pickup_reminder' },
    `/(customer)/order/${orderId}`
  );
}

export function setNotificationHandler() {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
