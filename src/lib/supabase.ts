import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
