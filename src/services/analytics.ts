/**
 * Lightweight analytics event tracker for Maithing.
 * In production, swap the console.log with a real analytics provider
 * (e.g. Mixpanel, Amplitude, PostHog, or a Supabase Edge Function).
 *
 * All events are typed so adding new ones is self-documenting.
 */

import { featureFlags } from '@/src/lib/featureFlags';

type EventName =
  | 'screen_view'
  | 'listing_view'
  | 'listing_purchase'
  | 'order_status_change'
  | 'merchant_follow'
  | 'merchant_unfollow'
  | 'search_query'
  | 'coupon_applied'
  | 'wallet_top_up'
  | 'personality_updated'
  | 'personality_onboarding_completed'
  | 'notification_tapped'
  | 'offline_mode_detected'
  | 'online_mode_restored';

interface AnalyticsEvent {
  name: EventName;
  timestamp: string;
  userId?: string;
  merchantId?: string;
  properties?: Record<string, unknown>;
}

const EVENT_QUEUE: AnalyticsEvent[] = [];
const MAX_QUEUE_SIZE = 100;

export function trackEvent(
  name: EventName,
  payload?: { userId?: string; merchantId?: string; properties?: Record<string, unknown> }
) {
  if (!featureFlags.enableAnalytics) {
    // In dev/mock mode just log to console
    console.log('[Analytics]', name, payload);
    return;
  }

  const event: AnalyticsEvent = {
    name,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  EVENT_QUEUE.push(event);
  if (EVENT_QUEUE.length > MAX_QUEUE_SIZE) {
    EVENT_QUEUE.shift();
  }

  // TODO: flush queue to backend in batches
  flushEvents().catch(() => {});
}

async function flushEvents() {
  if (EVENT_QUEUE.length === 0) return;
  const batch = EVENT_QUEUE.splice(0, EVENT_QUEUE.length);

  // Placeholder: replace with real analytics provider
  try {
    await fetch('https://your-analytics-endpoint.com/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
    });
  } catch {
    // Silently drop analytics failures — don't block user flow
  }
}

export function getQueuedEvents(): AnalyticsEvent[] {
  return [...EVENT_QUEUE];
}
