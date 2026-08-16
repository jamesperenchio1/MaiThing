import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { offlineQueue } from '@/src/lib/offlineQueue';
import { repositories } from '@/src/repositories';
import { useNetworkState } from './useNetworkState';
import { useAnalytics } from './useAnalytics';
import type { OfflineOperationType } from '@/src/lib/offlineQueue';

/**
 * Maps offline operation types to actual repository calls.
 * This is the replay engine — called automatically when device comes back online.
 */
async function replayOperation(type: OfflineOperationType, payload: Record<string, unknown>) {
  switch (type) {
    case 'createOrder':
      return repositories.orders.createOrder(
        payload as Parameters<typeof repositories.orders.createOrder>[0]
      );
    case 'updateOrderStatus':
      return repositories.orders.updateOrderStatus(
        payload.id as string,
        payload.status as Parameters<typeof repositories.orders.updateOrderStatus>[1]
      );
    case 'cancelOrder':
      return repositories.orders.cancelOrder(payload.id as string, payload.reason as string);
    case 'refundOrder':
      return repositories.orders.refundOrder(payload.id as string, payload.reason as string);
    case 'addFavorite':
      return repositories.users.addFavorite(payload.userId as string, payload.merchantId as string);
    case 'removeFavorite':
      return repositories.users.removeFavorite(
        payload.userId as string,
        payload.merchantId as string
      );
    case 'addSavedListing':
      return repositories.users.addSavedListing(
        payload.userId as string,
        payload.listingId as string
      );
    case 'removeSavedListing':
      return repositories.users.removeSavedListing(
        payload.userId as string,
        payload.listingId as string
      );
    case 'addRestockAlert':
      return repositories.users.addRestockAlert(
        payload.userId as string,
        payload.listingId as string
      );
    case 'removeRestockAlert':
      return repositories.users.removeRestockAlert(
        payload.userId as string,
        payload.listingId as string
      );
    case 'followMerchant':
      return repositories.merchants.followMerchant(
        payload.userId as string,
        payload.merchantId as string
      );
    case 'unfollowMerchant':
      return repositories.merchants.unfollowMerchant(
        payload.userId as string,
        payload.merchantId as string
      );
    case 'submitReview':
      return repositories.merchants.submitReview(
        payload as Parameters<typeof repositories.merchants.submitReview>[0]
      );
    case 'sendMessage':
      return repositories.messages.sendMessage(
        payload.merchantId as string,
        payload.customerId as string,
        payload.content as string,
        payload.sentBy as 'merchant' | 'customer'
      );
    case 'markConversationAsRead':
      return repositories.messages.markConversationAsRead(
        payload.merchantId as string,
        payload.customerId as string
      );
    case 'updateProfile':
      return repositories.users.updateProfile(
        payload.userId as string,
        payload.data as Parameters<typeof repositories.users.updateProfile>[1]
      );
    case 'updateCustomerProfile':
      return repositories.users.updateCustomerProfile(
        payload.userId as string,
        payload.data as Parameters<typeof repositories.users.updateCustomerProfile>[1]
      );
    case 'updateNotificationPreferences':
      return repositories.users.updateNotificationPreferences(
        payload.userId as string,
        payload.preferences as Parameters<
          typeof repositories.users.updateNotificationPreferences
        >[1]
      );
    case 'addMerchantFollowNotification':
      return repositories.users.addMerchantFollowNotification(
        payload.userId as string,
        payload.merchantId as string
      );
    case 'removeMerchantFollowNotification':
      return repositories.users.removeMerchantFollowNotification(
        payload.userId as string,
        payload.merchantId as string
      );
    case 'upsertUserPersonality':
      return repositories.users.upsertUserPersonality(
        payload.userId as string,
        payload.data as Parameters<typeof repositories.users.upsertUserPersonality>[1]
      );
    case 'upsertMerchantPersonality':
      return repositories.merchants.upsertMerchantPersonality(
        payload.merchantId as string,
        payload.data as Parameters<typeof repositories.merchants.upsertMerchantPersonality>[1]
      );
    case 'createListing':
      return repositories.listings.createListing(
        payload as Parameters<typeof repositories.listings.createListing>[0]
      );
    case 'updateListing':
      return repositories.listings.updateListing(
        payload.id as string,
        payload.data as Parameters<typeof repositories.listings.updateListing>[1]
      );
    case 'deleteListing':
      return repositories.listings.deleteListing(payload.id as string);
    case 'createListingTemplate':
      return repositories.listings.createListingTemplate(
        payload as Parameters<typeof repositories.listings.createListingTemplate>[0]
      );
    case 'deleteListingTemplate':
      return repositories.listings.deleteListingTemplate(payload.id as string);
    case 'createCoupon':
      return repositories.coupons.createCoupon(
        payload.merchantId as string,
        payload.data as Parameters<typeof repositories.coupons.createCoupon>[1]
      );
    case 'updateCoupon':
      return repositories.coupons.updateCoupon(
        payload.id as string,
        payload.data as Parameters<typeof repositories.coupons.updateCoupon>[1]
      );
    case 'deleteCoupon':
      return repositories.coupons.deleteCoupon(payload.id as string);
    case 'addStaff':
      return repositories.merchants.addStaff(
        payload.merchantId as string,
        payload.data as Parameters<typeof repositories.merchants.addStaff>[1]
      );
    case 'updateStaff':
      return repositories.merchants.updateStaff(
        payload.merchantId as string,
        payload.staffId as string,
        payload.data as Parameters<typeof repositories.merchants.updateStaff>[2]
      );
    case 'removeStaff':
      return repositories.merchants.removeStaff(
        payload.merchantId as string,
        payload.staffId as string
      );
    case 'setStoreClosure':
      return repositories.merchants.setStoreClosure(
        payload.merchantId as string,
        payload.closedUntil as string | null
      );
    case 'updateBusinessHours':
      return repositories.merchants.updateBusinessHours(
        payload.merchantId as string,
        payload.hours as Parameters<typeof repositories.merchants.updateBusinessHours>[1]
      );
    case 'updatePickupInstructions':
      return repositories.merchants.updatePickupInstructions(
        payload.merchantId as string,
        payload.instructions as string
      );
    case 'updateMerchant':
      return repositories.merchants.updateMerchant(
        payload.merchantId as string,
        payload.data as Parameters<typeof repositories.merchants.updateMerchant>[1]
      );
    case 'updateMerchantNotificationPreferences':
      return repositories.merchants.updateMerchantNotificationPreferences(
        payload.merchantId as string,
        payload.preferences as Parameters<
          typeof repositories.merchants.updateMerchantNotificationPreferences
        >[1]
      );
    case 'updateOnboarding':
      return repositories.merchants.updateOnboarding(
        payload.merchantId as string,
        payload.step as Parameters<typeof repositories.merchants.updateOnboarding>[1]
      );
    case 'sendBroadcast':
      return repositories.merchants.sendBroadcast(
        payload.merchantId as string,
        payload.content as string
      );
    case 'verifyMerchant':
      return repositories.merchants.verifyMerchant(
        payload.merchantId as string,
        payload.override as boolean
      );
    case 'uploadFoodSafetyCert':
      return repositories.merchants.uploadFoodSafetyCert(
        payload.merchantId as string,
        payload.certUrl as string
      );
    case 'addBankAccount':
      return repositories.payouts.addBankAccount(
        payload.merchantId as string,
        payload.data as Parameters<typeof repositories.payouts.addBankAccount>[1]
      );
    case 'setDefaultBankAccount':
      return repositories.payouts.setDefaultBankAccount(
        payload.merchantId as string,
        payload.accountId as string
      );
    case 'requestPayout':
      return repositories.payouts.requestPayout(
        payload.merchantId as string,
        payload.amount as number
      );
    case 'markAsRead':
      return repositories.notifications.markAsRead(
        payload.userId as string,
        payload.notificationId as string
      );
    case 'markAllAsRead':
      return repositories.notifications.markAllAsRead(payload.userId as string);
    default:
      throw new Error(`Unknown offline operation: ${type}`);
  }
}

function getQueryKeysForOperation(type: OfflineOperationType): string[][] {
  switch (type) {
    case 'addFavorite':
    case 'removeFavorite':
    case 'addSavedListing':
    case 'removeSavedListing':
    case 'addRestockAlert':
    case 'removeRestockAlert':
    case 'followMerchant':
    case 'unfollowMerchant':
    case 'addMerchantFollowNotification':
    case 'removeMerchantFollowNotification':
      return [['customer-profile']];

    case 'createOrder':
    case 'updateOrderStatus':
    case 'cancelOrder':
    case 'refundOrder':
      return [['orders']];

    case 'submitReview':
      return [['reviews']];

    case 'sendMessage':
    case 'markConversationAsRead':
      return [['messages'], ['conversations']];

    case 'updateProfile':
    case 'updateCustomerProfile':
    case 'updateNotificationPreferences':
      return [['customer-profile'], ['profile']];

    case 'upsertUserPersonality':
      return [['user-personality'], ['customer-profile']];

    case 'upsertMerchantPersonality':
    case 'createListing':
    case 'updateListing':
    case 'deleteListing':
    case 'createListingTemplate':
    case 'deleteListingTemplate':
      return [['listings'], ['merchant-listings']];

    case 'createCoupon':
    case 'updateCoupon':
    case 'deleteCoupon':
      return [['coupons'], ['merchant-coupons']];

    case 'addStaff':
    case 'updateStaff':
    case 'removeStaff':
      return [['merchant'], ['merchant-staff']];

    case 'setStoreClosure':
    case 'updateBusinessHours':
    case 'updatePickupInstructions':
    case 'updateMerchant':
    case 'updateMerchantNotificationPreferences':
    case 'updateOnboarding':
    case 'sendBroadcast':
    case 'verifyMerchant':
    case 'uploadFoodSafetyCert':
      return [['merchant']];

    case 'addBankAccount':
    case 'setDefaultBankAccount':
    case 'requestPayout':
      return [['merchant'], ['merchant-payouts']];

    case 'markAsRead':
    case 'markAllAsRead':
      return [['notifications']];

    default:
      return [['customer-profile'], ['orders']];
  }
}

/**
 * Hook that watches network state and replays queued operations when online.
 * Mount once at app root (e.g. in _layout.tsx).
 */
export function useOfflineQueue() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkState();
  const isProcessing = useRef(false);
  const { offlineQueueReplayStarted, offlineQueueReplayCompleted } = useAnalytics();

  useEffect(() => {
    if (!isOnline || isProcessing.current) return;

    async function processQueue() {
      isProcessing.current = true;
      offlineQueueReplayStarted();
      const pruned = offlineQueue.pruneFailed(3);

      if (pruned.length > 0) {
        const keySet = new Set<string>();
        for (const op of pruned) {
          for (const queryKey of getQueryKeysForOperation(op.type)) {
            keySet.add(JSON.stringify(queryKey));
          }
        }
        await Promise.all(
          Array.from(keySet).map((serialized) =>
            queryClient.invalidateQueries({ queryKey: JSON.parse(serialized) as string[] })
          )
        );
        if (__DEV__) {
          console.log('[OfflineQueue] invalidated query keys for pruned ops:', keySet.size);
        }
      }

      if (__DEV__) {
        console.log('[OfflineQueue] replay started, length:', offlineQueue.length);
      }

      while (offlineQueue.length > 0) {
        const op = offlineQueue.peek();
        if (!op) break;

        try {
          if (__DEV__) {
            console.log('[OfflineQueue] replaying', op.type, op.id);
          }
          await replayOperation(op.type, op.payload);
          offlineQueue.dequeue(op.id);
          if (__DEV__) {
            console.log('[OfflineQueue] replayed OK', op.type);
          }
        } catch (err) {
          if (__DEV__) {
            console.log('[OfflineQueue] replay failed', op.type, err);
          }
          offlineQueue.incrementRetry(op.id);
          // Stop processing if one fails to preserve order
          break;
        }
      }

      offlineQueueReplayCompleted();
      if (__DEV__) {
        console.log('[OfflineQueue] replay completed, length:', offlineQueue.length);
      }
      isProcessing.current = false;
    }

    processQueue();
  }, [isOnline, offlineQueueReplayStarted, offlineQueueReplayCompleted]);
}
