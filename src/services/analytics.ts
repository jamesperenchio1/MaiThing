import { supabase } from '@/src/lib/supabase';
import { featureFlags } from '@/src/lib/featureFlags';

export type AnalyticsEventName =
  | 'screen_view'
  | 'listing_tap'
  | 'add_to_cart'
  | 'order_placed'
  | 'order_cancelled'
  | 'favorite_toggled'
  | 'saved_listing_toggled'
  | 'merchant_follow_notification_toggled'
  | 'review_submitted'
  | 'coupon_applied'
  | 'personality_onboarding_completed'
  | 'offline_queue_replay_started'
  | 'offline_queue_replay_completed';

interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  event_name: AnalyticsEventName;
  properties: Record<string, unknown>;
  created_at: string;
}

const EVENT_QUEUE: AnalyticsEvent[] = [];
const MAX_QUEUE_SIZE = 100;
const IS_SUPABASE_MODE = process.env.EXPO_PUBLIC_REPOSITORY_MODE === 'supabase';

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Track an analytics event.
 * In supabase mode, writes to the analytics_events table.
 * In mock mode, queues in memory and logs to console.
 */
export async function trackEvent(
  eventName: AnalyticsEventName,
  properties?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  const effectiveUserId = userId ?? null;

  if (!featureFlags.enableAnalytics) {
    if (__DEV__) {
      console.log('[Analytics]', eventName, { ...properties, userId: effectiveUserId });
    }
    return;
  }

  const payload: AnalyticsEvent = {
    id: generateId(),
    user_id: effectiveUserId,
    event_name: eventName,
    properties: properties ?? {},
    created_at: new Date().toISOString(),
  };

  if (!IS_SUPABASE_MODE) {
    EVENT_QUEUE.push(payload);
    if (EVENT_QUEUE.length > MAX_QUEUE_SIZE) {
      EVENT_QUEUE.shift();
    }
    if (__DEV__) {
      console.log('[Analytics]', eventName, payload.properties);
    }
    return;
  }

  try {
    await supabase.from('analytics_events').insert({
      user_id: payload.user_id,
      event_name: payload.event_name,
      properties: payload.properties,
    });
  } catch {
    // Silently drop analytics failures — don't block user flow
    EVENT_QUEUE.push(payload);
  }
}

/**
 * Flush queued analytics events to Supabase.
 * Call this when the app comes online or on a timer.
 */
export async function flushAnalyticsEvents(userId?: string): Promise<void> {
  if (EVENT_QUEUE.length === 0) return;
  if (!IS_SUPABASE_MODE) return;

  const batch = EVENT_QUEUE.splice(0, EVENT_QUEUE.length);
  try {
    await supabase.from('analytics_events').insert(
      batch.map((e) => ({
        user_id: userId ?? e.user_id,
        event_name: e.event_name,
        properties: e.properties,
      }))
    );
  } catch {
    // Restore failed events back to queue
    EVENT_QUEUE.unshift(...batch);
  }
}

export function getQueuedAnalyticsEvents(): AnalyticsEvent[] {
  return [...EVENT_QUEUE];
}

/**
 * Convenience helpers for common analytics events.
 */
export const analytics = {
  screenView: (screenName: string, userId?: string) =>
    trackEvent('screen_view', { screen_name: screenName }, userId),

  listingTap: (listingId: string, userId?: string) =>
    trackEvent('listing_tap', { listing_id: listingId }, userId),

  addToCart: (listingId: string, userId?: string) =>
    trackEvent('add_to_cart', { listing_id: listingId }, userId),

  orderPlaced: (orderId: string, amount: number, userId?: string) =>
    trackEvent('order_placed', { order_id: orderId, amount }, userId),

  orderCancelled: (orderId: string, userId?: string) =>
    trackEvent('order_cancelled', { order_id: orderId }, userId),

  favoriteToggled: (merchantId: string, isFavorite: boolean, userId?: string) =>
    trackEvent('favorite_toggled', { merchant_id: merchantId, is_favorite: isFavorite }, userId),

  savedListingToggled: (listingId: string, isSaved: boolean, userId?: string) =>
    trackEvent('saved_listing_toggled', { listing_id: listingId, is_saved: isSaved }, userId),

  merchantFollowNotificationToggled: (merchantId: string, isFollowing: boolean, userId?: string) =>
    trackEvent(
      'merchant_follow_notification_toggled',
      { merchant_id: merchantId, is_following: isFollowing },
      userId
    ),

  reviewSubmitted: (merchantId: string, rating: number, userId?: string) =>
    trackEvent('review_submitted', { merchant_id: merchantId, rating }, userId),

  couponApplied: (couponCode: string, discount: number, userId?: string) =>
    trackEvent('coupon_applied', { coupon_code: couponCode, discount }, userId),

  personalityOnboardingCompleted: (userId?: string) =>
    trackEvent('personality_onboarding_completed', {}, userId),

  offlineQueueReplayStarted: (userId?: string) =>
    trackEvent('offline_queue_replay_started', {}, userId),

  offlineQueueReplayCompleted: (userId?: string) =>
    trackEvent('offline_queue_replay_completed', {}, userId),
};
