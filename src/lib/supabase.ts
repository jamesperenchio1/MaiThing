import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const rawSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Provide a non-empty placeholder so @supabase/supabase-js does not throw during
// module initialization when the app is running in mock mode (the default).
// The dummy client is never used for real requests because repositories switch to
// the mock implementation unless EXPO_PUBLIC_REPOSITORY_MODE === 'supabase'.
const supabaseUrl = rawSupabaseUrl || 'http://localhost';
const supabaseAnonKey = rawSupabaseAnonKey || 'dummy-anon-key';

const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return null;
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // key length / charset issues — degrade gracefully
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignore
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

const FUNCTIONS_BASE = `${supabaseUrl}/functions/v1`;

/** Fire-and-forget push notification event to the Edge Function. */
export async function triggerPushEvent(
  event: 'new_listing' | 'restock' | 'follow_notification',
  payload: {
    merchantId?: string;
    merchantName?: string;
    listingId?: string;
    listingTitle?: string;
    userId?: string;
  }
): Promise<void> {
  if (!supabaseUrl) return;
  try {
    await fetch(`${FUNCTIONS_BASE}/send-push-notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, ...payload }),
    });
  } catch {
    // Non-critical — swallow silently
  }
}
