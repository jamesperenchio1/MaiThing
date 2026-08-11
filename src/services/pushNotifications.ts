import { Platform } from 'react-native';
import { supabase } from '@/src/lib/supabase';

const IS_SUPABASE_MODE = process.env.EXPO_PUBLIC_REPOSITORY_MODE === 'supabase';

export interface RemoteNotificationPayload {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  subtitle?: string;
  sound?: string;
}

/**
 * Sends a remote push notification via the Supabase Edge Function.
 * Only runs in Supabase mode on native platforms.
 */
export async function sendRemoteNotification(payload: RemoteNotificationPayload): Promise<void> {
  if (!IS_SUPABASE_MODE || Platform.OS === 'web') return;

  try {
    const { error } = await supabase.functions.invoke('push-notify', {
      body: payload,
    });
    if (error) {
      // Non-critical — swallow silently
    }
  } catch {
    // Non-critical — swallow silently
  }
}

/**
 * Fetches push tokens for a user from Supabase.
 * Returns tokens from push_tokens table, falling back to profiles.push_token.
 */
export async function getUserPushTokens(userId: string): Promise<string[]> {
  if (!IS_SUPABASE_MODE || Platform.OS === 'web') return [];

  try {
    const [{ data: tokens }, { data: profile }] = await Promise.all([
      supabase.from('push_tokens').select('token').eq('user_id', userId),
      supabase.from('profiles').select('push_token').eq('id', userId).maybeSingle(),
    ]);

    const result = new Set<string>();
    tokens?.forEach((t) => {
      if (t.token) result.add(t.token);
    });
    if (profile?.push_token) result.add(profile.push_token);

    return Array.from(result);
  } catch {
    return [];
  }
}
