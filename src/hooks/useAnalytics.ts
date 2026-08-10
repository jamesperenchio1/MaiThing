import { useCallback } from 'react';
import { trackEvent, type AnalyticsEventName, analytics } from '@/src/services/analytics';
import { useAuthStore } from '@/src/stores/auth';

interface UseAnalyticsReturn {
  track: (event: AnalyticsEventName, properties?: Record<string, unknown>) => void;
  screenView: (screenName: string) => void;
  listingTap: (listingId: string) => void;
  addToCart: (listingId: string) => void;
  orderPlaced: (orderId: string, amount: number) => void;
  orderCancelled: (orderId: string) => void;
  personalityOnboardingCompleted: () => void;
  offlineQueueReplayStarted: () => void;
  offlineQueueReplayCompleted: () => void;
}

export function useAnalytics(): UseAnalyticsReturn {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const track = useCallback(
    (event: AnalyticsEventName, properties?: Record<string, unknown>) => {
      trackEvent(event, properties, userId).catch(() => {});
    },
    [userId]
  );

  const screenView = useCallback(
    (screenName: string) => {
      analytics.screenView(screenName, userId).catch(() => {});
    },
    [userId]
  );

  const listingTap = useCallback(
    (listingId: string) => {
      analytics.listingTap(listingId, userId).catch(() => {});
    },
    [userId]
  );

  const addToCart = useCallback(
    (listingId: string) => {
      analytics.addToCart(listingId, userId).catch(() => {});
    },
    [userId]
  );

  const orderPlaced = useCallback(
    (orderId: string, amount: number) => {
      analytics.orderPlaced(orderId, amount, userId).catch(() => {});
    },
    [userId]
  );

  const orderCancelled = useCallback(
    (orderId: string) => {
      analytics.orderCancelled(orderId, userId).catch(() => {});
    },
    [userId]
  );

  const personalityOnboardingCompleted = useCallback(() => {
    analytics.personalityOnboardingCompleted(userId).catch(() => {});
  }, [userId]);

  const offlineQueueReplayStarted = useCallback(() => {
    analytics.offlineQueueReplayStarted(userId).catch(() => {});
  }, [userId]);

  const offlineQueueReplayCompleted = useCallback(() => {
    analytics.offlineQueueReplayCompleted(userId).catch(() => {});
  }, [userId]);

  return {
    track,
    screenView,
    listingTap,
    addToCart,
    orderPlaced,
    orderCancelled,
    personalityOnboardingCompleted,
    offlineQueueReplayStarted,
    offlineQueueReplayCompleted,
  };
}
