import { useEffect, useRef } from 'react';
import { offlineQueue } from '@/src/lib/offlineQueue';
import { repositories } from '@/src/repositories';
import { useNetworkState } from './useNetworkState';
import type { OfflineOperationType } from '@/src/lib/offlineQueue';

/**
 * Maps offline operation types to actual repository calls.
 * This is the replay engine — called automatically when device comes back online.
 */
async function replayOperation(type: OfflineOperationType, payload: Record<string, unknown>) {
  switch (type) {
    case 'createOrder':
      return repositories.orders.createOrder(payload as Parameters<typeof repositories.orders.createOrder>[0]);
    case 'updateOrderStatus':
      return repositories.orders.updateOrderStatus(payload.id as string, payload.status as Parameters<typeof repositories.orders.updateOrderStatus>[1]);
    case 'cancelOrder':
      return repositories.orders.cancelOrder(payload.id as string, payload.reason as string);
    case 'addFavorite':
      return repositories.users.addFavorite(payload.userId as string, payload.merchantId as string);
    case 'removeFavorite':
      return repositories.users.removeFavorite(payload.userId as string, payload.merchantId as string);
    case 'addSavedListing':
      return repositories.users.addSavedListing(payload.userId as string, payload.listingId as string);
    case 'removeSavedListing':
      return repositories.users.removeSavedListing(payload.userId as string, payload.listingId as string);
    case 'addRestockAlert':
      return repositories.users.addRestockAlert(payload.userId as string, payload.listingId as string);
    case 'removeRestockAlert':
      return repositories.users.removeRestockAlert(payload.userId as string, payload.listingId as string);
    case 'followMerchant':
      return repositories.merchants.followMerchant(payload.userId as string, payload.merchantId as string);
    case 'unfollowMerchant':
      return repositories.merchants.unfollowMerchant(payload.userId as string, payload.merchantId as string);
    case 'submitReview':
      return repositories.merchants.submitReview(payload as Parameters<typeof repositories.merchants.submitReview>[0]);
    case 'sendMessage':
      return repositories.messages.sendMessage(payload.merchantId as string, payload.customerId as string, payload.content as string, payload.sentBy as 'merchant' | 'customer');
    case 'updateProfile':
      return repositories.users.updateProfile(payload.userId as string, payload.data as Parameters<typeof repositories.users.updateProfile>[1]);
    case 'updateCustomerProfile':
      return repositories.users.updateCustomerProfile(payload.userId as string, payload.data as Parameters<typeof repositories.users.updateCustomerProfile>[1]);
    case 'updateNotificationPreferences':
      return repositories.users.updateNotificationPreferences(payload.userId as string, payload.preferences as Parameters<typeof repositories.users.updateNotificationPreferences>[1]);
    case 'addMerchantFollowNotification':
      return repositories.users.addMerchantFollowNotification(payload.userId as string, payload.merchantId as string);
    case 'removeMerchantFollowNotification':
      return repositories.users.removeMerchantFollowNotification(payload.userId as string, payload.merchantId as string);
    case 'upsertUserPersonality':
      return repositories.users.upsertUserPersonality(payload.userId as string, payload.data as Parameters<typeof repositories.users.upsertUserPersonality>[1]);
    case 'upsertMerchantPersonality':
      return repositories.merchants.upsertMerchantPersonality(payload.merchantId as string, payload.data as Parameters<typeof repositories.merchants.upsertMerchantPersonality>[1]);
    case 'createListing':
      return repositories.listings.createListing(payload as Parameters<typeof repositories.listings.createListing>[0]);
    case 'updateListing':
      return repositories.listings.updateListing(payload.id as string, payload.data as Parameters<typeof repositories.listings.updateListing>[1]);
    case 'deleteListing':
      return repositories.listings.deleteListing(payload.id as string);
    case 'createListingTemplate':
      return repositories.listings.createListingTemplate(payload as Parameters<typeof repositories.listings.createListingTemplate>[0]);
    case 'deleteListingTemplate':
      return repositories.listings.deleteListingTemplate(payload.id as string);
    case 'createCoupon':
      return repositories.coupons.createCoupon(payload.merchantId as string, payload.data as Parameters<typeof repositories.coupons.createCoupon>[1]);
    case 'updateCoupon':
      return repositories.coupons.updateCoupon(payload.id as string, payload.data as Parameters<typeof repositories.coupons.updateCoupon>[1]);
    case 'deleteCoupon':
      return repositories.coupons.deleteCoupon(payload.id as string);
    case 'addStaff':
      return repositories.merchants.addStaff(payload.merchantId as string, payload.data as Parameters<typeof repositories.merchants.addStaff>[1]);
    case 'updateStaff':
      return repositories.merchants.updateStaff(payload.merchantId as string, payload.staffId as string, payload.data as Parameters<typeof repositories.merchants.updateStaff>[2]);
    case 'removeStaff':
      return repositories.merchants.removeStaff(payload.merchantId as string, payload.staffId as string);
    case 'setStoreClosure':
      return repositories.merchants.setStoreClosure(payload.merchantId as string, payload.closedUntil as string | null);
    case 'updateBusinessHours':
      return repositories.merchants.updateBusinessHours(payload.merchantId as string, payload.hours as Parameters<typeof repositories.merchants.updateBusinessHours>[1]);
    case 'updatePickupInstructions':
      return repositories.merchants.updatePickupInstructions(payload.merchantId as string, payload.instructions as string);
    case 'updateMerchant':
      return repositories.merchants.updateMerchant(payload.merchantId as string, payload.data as Parameters<typeof repositories.merchants.updateMerchant>[1]);
    case 'updateMerchantNotificationPreferences':
      return repositories.merchants.updateMerchantNotificationPreferences(payload.merchantId as string, payload.preferences as Parameters<typeof repositories.merchants.updateMerchantNotificationPreferences>[1]);
    case 'updateOnboarding':
      return repositories.merchants.updateOnboarding(payload.merchantId as string, payload.step as Parameters<typeof repositories.merchants.updateOnboarding>[1]);
    case 'sendBroadcast':
      return repositories.merchants.sendBroadcast(payload.merchantId as string, payload.content as string);
    case 'verifyMerchant':
      return repositories.merchants.verifyMerchant(payload.merchantId as string, payload.override as boolean);
    case 'uploadFoodSafetyCert':
      return repositories.merchants.uploadFoodSafetyCert(payload.merchantId as string, payload.certUrl as string);
    case 'addBankAccount':
      return repositories.payouts.addBankAccount(payload.merchantId as string, payload.data as Parameters<typeof repositories.payouts.addBankAccount>[1]);
    case 'setDefaultBankAccount':
      return repositories.payouts.setDefaultBankAccount(payload.merchantId as string, payload.accountId as string);
    case 'requestPayout':
      return repositories.payouts.requestPayout(payload.merchantId as string, payload.amount as number);
    case 'markAsRead':
      return repositories.notifications.markAsRead(payload.userId as string, payload.notificationId as string);
    case 'markAllAsRead':
      return repositories.notifications.markAllAsRead(payload.userId as string);
    default:
      throw new Error(`Unknown offline operation: ${type}`);
  }
}

/**
 * Hook that watches network state and replays queued operations when online.
 * Mount once at app root (e.g. in _layout.tsx).
 */
export function useOfflineQueue() {
  const { isOnline } = useNetworkState();
  const isProcessing = useRef(false);

  useEffect(() => {
    if (!isOnline || isProcessing.current) return;

    async function processQueue() {
      isProcessing.current = true;
      offlineQueue.pruneFailed(3);

      while (offlineQueue.length > 0) {
        const op = offlineQueue.peek();
        if (!op) break;

        try {
          await replayOperation(op.type, op.payload);
          offlineQueue.dequeue(op.id);
        } catch (err) {
          offlineQueue.incrementRetry(op.id);
          // Stop processing if one fails to preserve order
          break;
        }
      }

      isProcessing.current = false;
    }

    processQueue();
  }, [isOnline]);
}
