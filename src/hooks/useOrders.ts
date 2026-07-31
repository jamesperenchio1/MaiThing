import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { mockRepositories } from '@/src/repositories/mock';
import { WALLET_TRANSACTIONS } from '@/src/repositories/seed';
import { scheduleLocalNotification } from '@/src/services/notifications';
import { useCartStore } from '@/src/stores/cart';
import type { CustomerProfile, Order, WalletTransaction } from '@/src/types';

function getStatusNotification(order: Order, status: Order['status']) {
  const label = order.merchantName;
  switch (status) {
    case 'pending':
      return {
        title: 'New order received',
        body: `Order ${order.pickupCode} from ${label} is pending confirmation.`,
      };
    case 'confirmed':
      return {
        title: 'Order confirmed',
        body: `Order ${order.pickupCode} from ${label} has been confirmed.`,
      };
    case 'preparing':
      return {
        title: 'Order being prepared',
        body: `Order ${order.pickupCode} from ${label} is now being prepared.`,
      };
    case 'ready':
      return {
        title: 'Order ready for pickup',
        body: `Your order ${order.pickupCode} from ${label} is ready!`,
      };
    case 'picked_up':
      return {
        title: 'Order picked up',
        body: `Order ${order.pickupCode} from ${label} has been picked up.`,
      };
    case 'completed':
      return {
        title: 'Order completed',
        body: `Order ${order.pickupCode} from ${label} is complete. Enjoy!`,
      };
    case 'cancelled':
      return {
        title: 'Order cancelled',
        body: `Order ${order.pickupCode} from ${label} was cancelled.`,
      };
    default:
      return null;
  }
}

export function useOrders(userId: string, role: 'customer' | 'merchant') {
  return useQuery({
    queryKey: ['orders', userId, role],
    queryFn: () => mockRepositories.orders.getOrders(userId, role),
    enabled: !!userId,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => mockRepositories.orders.getOrder(id),
    enabled: !!id,
  });
}

export function useOrderByPickupCode(merchantId: string, code: string) {
  return useQuery({
    queryKey: ['order', 'pickup-code', merchantId, code],
    queryFn: () => mockRepositories.orders.getOrderByPickupCode(merchantId, code),
    enabled: !!merchantId && code.length >= 4,
  });
}

export function useLookupOrderByPickupCode() {
  return useMutation({
    mutationFn: ({ merchantId, code }: { merchantId: string; code: string }) =>
      mockRepositories.orders.getOrderByPickupCode(merchantId, code),
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const order = await mockRepositories.orders.cancelOrder(id, reason);
      const userId = order.customerId;
      const description = `Refund for order ${order.pickupCode}`;

      await mockRepositories.wallet.refund(userId, order.total, description);

      const transaction: WalletTransaction = {
        id: `txn-${Date.now()}`,
        userId,
        type: 'refund',
        amount: order.total,
        description,
        orderId: order.id,
        createdAt: new Date().toISOString(),
      };
      WALLET_TRANSACTIONS.unshift(transaction);

      return order;
    },
    onSuccess: (order, variables) => {
      const userId = order.customerId;
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', userId] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions', userId] });

      const body = variables.reason || `Order ${order.pickupCode} was cancelled.`;
      const customerProfile = queryClient.getQueryData<CustomerProfile>([
        'customerProfile',
        userId,
      ]);
      scheduleLocalNotification(
        'Order cancelled',
        body,
        {
          orderId: order.id,
          type: 'order_cancelled',
        },
        customerProfile?.notificationPreferences,
        'order_update',
        `/(customer)/order/${order.id}`
      ).catch(() => {});
    },
  });
}

export function useRefundOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const order = await mockRepositories.orders.refundOrder(id, reason);
      await mockRepositories.wallet.refund(order.customerId, order.total, `Refund: ${reason}`);
      return order;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Order['status'] }) => {
      const order = await mockRepositories.orders.updateOrderStatus(id, status);
      return order;
    },
    onSuccess: (order, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });

      const notification = getStatusNotification(order, order.status);
      if (notification) {
        const customerProfile = queryClient.getQueryData<CustomerProfile>([
          'customerProfile',
          order.customerId,
        ]);
        scheduleLocalNotification(
          notification.title,
          notification.body,
          {
            orderId: order.id,
            type: `order_${order.status}`,
          },
          customerProfile?.notificationPreferences,
          'order_update',
          `/(customer)/order/${order.id}`
        ).catch(() => {});
      }
    },
  });
}

export function useReorder() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  return useMutation({
    mutationFn: async (order: Order) => {
      const listings = await Promise.all(
        order.items.map((item) => mockRepositories.listings.getListing(item.listingId))
      );
      return { order, listings: listings.filter((l): l is NonNullable<typeof l> => l != null) };
    },
    onSuccess: ({ order, listings }) => {
      for (const listing of listings) {
        const orderItem = order.items.find((i) => i.listingId === listing.id);
        if (orderItem) {
          addItem(listing, orderItem.quantity);
        }
      }
      router.push('/(customer)/cart' as any);
    },
  });
}
