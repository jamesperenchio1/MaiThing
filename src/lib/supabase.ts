// Stub — real Supabase client wired up when backend is live.
// All callers are fire-and-forget and degrade gracefully when this is a no-op.

export const supabase = null as unknown as {
  from: (table: string) => unknown;
  auth: unknown;
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
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
