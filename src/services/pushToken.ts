import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/src/lib/supabase';

/**
 * Registers the device's Expo push token with Supabase.
 * Must be called after the user has granted notification permissions.
 * Safe to call multiple times — upserts on token conflict.
 */
export async function registerPushToken(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenData.data;

    await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'token' }
    );

    // Also store on profiles for quick lookup
    await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
  } catch {
    // Non-critical — swallow silently
  }
}

/** Removes the device push token from Supabase on logout. */
export async function unregisterPushToken(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await supabase.from('push_tokens').delete().eq('user_id', userId);
    await supabase.from('profiles').update({ push_token: null }).eq('id', userId);
  } catch {
    // Non-critical
  }
}

/** Syncs a follow-notification subscription to Supabase. */
export async function syncFollowNotification(
  userId: string,
  merchantId: string,
  enabled: boolean
): Promise<void> {
  try {
    if (enabled) {
      await supabase
        .from('followed_merchant_notifications')
        .upsert({ user_id: userId, merchant_id: merchantId });
    } else {
      await supabase
        .from('followed_merchant_notifications')
        .delete()
        .eq('user_id', userId)
        .eq('merchant_id', merchantId);
    }
  } catch {
    // Non-critical
  }
}

/** Syncs a restock alert subscription to Supabase. */
export async function syncRestockAlert(
  userId: string,
  listingId: string,
  enabled: boolean
): Promise<void> {
  try {
    if (enabled) {
      await supabase
        .from('restock_alerts')
        .upsert({ user_id: userId, listing_id: listingId });
    } else {
      await supabase
        .from('restock_alerts')
        .delete()
        .eq('user_id', userId)
        .eq('listing_id', listingId);
    }
  } catch {
    // Non-critical
  }
}
