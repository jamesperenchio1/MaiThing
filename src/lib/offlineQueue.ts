import { createMMKV } from 'react-native-mmkv';

/**
 * Offline Write Queue
 * -------------------
 * Queues mutations when the device is offline and replays them
 * when connectivity is restored.
 *
 * Supported operations mirror repository write methods.
 */

const queueStorage = createMMKV({ id: 'maithing-offline-queue' });

const QUEUE_KEY = 'offline_queue_v1';

export type OfflineOperationType =
  | 'createOrder'
  | 'updateOrderStatus'
  | 'cancelOrder'
  | 'addFavorite'
  | 'removeFavorite'
  | 'addSavedListing'
  | 'removeSavedListing'
  | 'addRestockAlert'
  | 'removeRestockAlert'
  | 'followMerchant'
  | 'unfollowMerchant'
  | 'submitReview'
  | 'sendMessage'
  | 'updateProfile'
  | 'updateCustomerProfile'
  | 'updateNotificationPreferences'
  | 'addMerchantFollowNotification'
  | 'removeMerchantFollowNotification'
  | 'upsertUserPersonality'
  | 'upsertMerchantPersonality'
  | 'createListing'
  | 'updateListing'
  | 'deleteListing'
  | 'createListingTemplate'
  | 'deleteListingTemplate'
  | 'createCoupon'
  | 'updateCoupon'
  | 'deleteCoupon'
  | 'addStaff'
  | 'updateStaff'
  | 'removeStaff'
  | 'setStoreClosure'
  | 'updateBusinessHours'
  | 'updatePickupInstructions'
  | 'updateMerchant'
  | 'updateMerchantNotificationPreferences'
  | 'updateOnboarding'
  | 'sendBroadcast'
  | 'verifyMerchant'
  | 'uploadFoodSafetyCert'
  | 'addBankAccount'
  | 'setDefaultBankAccount'
  | 'requestPayout'
  | 'markAsRead'
  | 'markAllAsRead';

export interface OfflineOperation {
  id: string;
  type: OfflineOperationType;
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
}

interface QueueState {
  operations: OfflineOperation[];
}

function loadQueue(): QueueState {
  const raw = queueStorage.getString(QUEUE_KEY);
  if (!raw) return { operations: [] };
  try {
    return JSON.parse(raw) as QueueState;
  } catch {
    return { operations: [] };
  }
}

function saveQueue(state: QueueState): void {
  queueStorage.set(QUEUE_KEY, JSON.stringify(state));
}

class OfflineQueue {
  private state: QueueState;

  constructor() {
    this.state = loadQueue();
  }

  get length(): number {
    return this.state.operations.length;
  }

  get pending(): OfflineOperation[] {
    return [...this.state.operations];
  }

  enqueue(op: Omit<OfflineOperation, 'id' | 'createdAt' | 'retryCount'>): void {
    const operation: OfflineOperation = {
      ...op,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };
    this.state.operations.push(operation);
    saveQueue(this.state);
  }

  dequeue(operationId: string): void {
    this.state.operations = this.state.operations.filter((o) => o.id !== operationId);
    saveQueue(this.state);
  }

  incrementRetry(operationId: string): void {
    const op = this.state.operations.find((o) => o.id === operationId);
    if (op) {
      op.retryCount += 1;
      saveQueue(this.state);
    }
  }

  clear(): void {
    this.state.operations = [];
    saveQueue(this.state);
  }

  /**
   * Peek at the next operation without removing it.
   */
  peek(): OfflineOperation | undefined {
    return this.state.operations[0];
  }

  /**
   * Remove operations that have failed too many times (max 3 retries).
   */
  pruneFailed(maxRetries = 3): void {
    const before = this.state.operations.length;
    this.state.operations = this.state.operations.filter((o) => o.retryCount < maxRetries);
    if (this.state.operations.length !== before) {
      saveQueue(this.state);
    }
  }
}

export const offlineQueue = new OfflineQueue();
