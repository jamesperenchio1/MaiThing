import * as Notifications from 'expo-notifications';
import { PermissionStatus } from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

let registeredToken: string | null = null;

async function saveTokenToProfile(token: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('device_tokens').upsert(
    {
      profile_id: user.id,
      expo_push_token: token,
    },
    { onConflict: 'profile_id,expo_push_token' },
  );

  if (error) {
    console.warn('Failed to save push token', error);
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus: PermissionStatus = existingStatus;

    if (existingStatus !== PermissionStatus.GRANTED) {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== PermissionStatus.GRANTED) {
      console.warn('Push notification permission not granted');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    if (registeredToken === token) return token;
    registeredToken = token;

    await saveTokenToProfile(token);
    return token;
  } catch (err) {
    console.warn('Push registration error', err);
    return null;
  }
}

export function addPushTokenListener(): Notifications.Subscription | null {
  if (Platform.OS === 'web') return null;

  return Notifications.addPushTokenListener((tokenData: { data: string }) => {
    const token = tokenData.data;
    if (registeredToken === token) return;
    registeredToken = token;
    void saveTokenToProfile(token);
  });
}
