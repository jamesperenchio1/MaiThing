import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { repositories } from '@/src/repositories';
import { scheduleLocalNotification } from '@/src/services/notifications';
import { analytics } from '@/src/services/analytics';
import { useCartStore } from '@/src/stores/cart';
import { useOfflineMutation } from './useOfflineMutation';
import type { CustomerProfile, Order } from '@/src/types';

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
    queryFn: () => repositories.orders.getOrders(userId, role),
    enabled: !!userId,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => repositories.orders.getOrder(id),
    enabled: !!id,
  });
}

export function useOrderByPickupCode(merchantId: string, code: string) {
  return useQuery({
    queryKey: ['order', 'pickup-code', merchantId, code],
    queryFn: () => repositories.orders.getOrderByPickupCode(merchantId, code),
    enabled: !!merchantId && code.length >= 4,
  });
}

export function useLookupOrderByPickupCode() {
  return useMutation({
    mutationFn: ({ merchantId, code }: { merchantId: string; code: string }) =>
      repositories.orders.getOrderByPickupCode(merchantId, code),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: async (data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
      const order = await repositories.orders.createOrder(data);
      return order;
    },
    offlineOperation: {
      type: 'createOrder',
      payload: (data) => ({ ...data }),
    },
    onMutate: async (data) => {
      const ordersFilter = { queryKey: ['orders'] };
      await queryClient.cancelQueries(ordersFilter);
      const previousOrders = queryClient.getQueriesData<Order[]>(ordersFilter);

      const tempOrder: Order = {
        ...data,
        id: `temp_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'pending',
      };

      queryClient.setQueriesData<Order[]>(ordersFilter, (old) => {
        if (!old) return old;
        return [tempOrder, ...old];
      });

      return { previousOrders, tempOrder };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousOrders) {
        for (const [queryKey, data] of context.previousOrders) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
    onSuccess: (order) => {
      if (!order) return;
      analytics.orderPlaced(order.id, order.total).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', order.customerId] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions', order.customerId] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });

      scheduleLocalNotification(
        'Order placed',
        `Your order ${order.pickupCode} has been placed.`,
        { orderId: order.id, type: 'order_placed' },
        undefined,
        'order_update',
        `/(customer)/order/${order.id}`
      ).catch(() => {});
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const order = await repositories.orders.cancelOrder(id, reason);
      await repositories.wallet.refund(
        order.customerId,
        order.total,
        `Refund for order ${order.pickupCode}`
      );
      return order;
    },
    offlineOperation: {
      type: 'cancelOrder',
      payload: ({ id, reason }) => ({ id, reason }),
    },
    onMutate: async ({ id, reason }) => {
      const orderKey = ['order', id];
      const ordersFilter = { queryKey: ['orders'] };

      await queryClient.cancelQueries({ queryKey: orderKey });
      await queryClient.cancelQueries(ordersFilter);

      const previousOrder = queryClient.getQueryData<Order>(orderKey);
      const previousOrders = queryClient.getQueriesData<Order[]>(ordersFilter);

      queryClient.setQueryData<Order>(orderKey, (old) => {
        if (!old) return old;
        return { ...old, status: 'cancelled', cancellationReason: reason };
      });

      queryClient.setQueriesData<Order[]>(ordersFilter, (old) => {
        if (!old) return old;
        return old.map((o) =>
          o.id === id ? { ...o, status: 'cancelled', cancellationReason: reason } : o
        );
      });

      return { previousOrder, previousOrders };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousOrder) {
        queryClient.setQueryData(['order', id], context.previousOrder);
      }
      if (context?.previousOrders) {
        for (const [queryKey, data] of context.previousOrders) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onSuccess: (order, variables) => {
      if (!order) return;
      const userId = order.customerId;
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
  return useOfflineMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const order = await repositories.orders.refundOrder(id, reason);
      await repositories.wallet.refund(order.customerId, order.total, `Refund: ${reason}`);
      return order;
    },
    offlineOperation: {
      type: 'refundOrder',
      payload: ({ id, reason }) => ({ id, reason }),
    },
    onMutate: async ({ id, reason }) => {
      const orderKey = ['order', id];
      const ordersFilter = { queryKey: ['orders'] };

      await queryClient.cancelQueries({ queryKey: orderKey });
      await queryClient.cancelQueries(ordersFilter);

      const previousOrder = queryClient.getQueryData<Order>(orderKey);
      const previousOrders = queryClient.getQueriesData<Order[]>(ordersFilter);

      queryClient.setQueryData<Order>(orderKey, (old) => {
        if (!old) return old;
        return { ...old, status: 'cancelled', cancellationReason: reason };
      });

      queryClient.setQueriesData<Order[]>(ordersFilter, (old) => {
        if (!old) return old;
        return old.map((o) =>
          o.id === id ? { ...o, status: 'cancelled', cancellationReason: reason } : o
        );
      });

      return { previousOrder, previousOrders };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousOrder) {
        queryClient.setQueryData(['order', id], context.previousOrder);
      }
      if (context?.previousOrders) {
        for (const [queryKey, data] of context.previousOrders) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onSuccess: (order) => {
      if (!order) return;
      queryClient.invalidateQueries({ queryKey: ['wallet', order.customerId] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions', order.customerId] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useOfflineMutation({
    mutationFn: async ({ id, status }: { id: string; status: Order['status'] }) => {
      const order = await repositories.orders.updateOrderStatus(id, status);
      return order;
    },
    offlineOperation: {
      type: 'updateOrderStatus',
      payload: ({ id, status }) => ({ id, status }),
    },
    onMutate: async ({ id, status }) => {
      const orderKey = ['order', id];
      const ordersFilter = { queryKey: ['orders'] };

      await queryClient.cancelQueries({ queryKey: orderKey });
      await queryClient.cancelQueries(ordersFilter);

      const previousOrder = queryClient.getQueryData<Order>(orderKey);
      const previousOrders = queryClient.getQueriesData<Order[]>(ordersFilter);

      queryClient.setQueryData<Order>(orderKey, (old) => {
        if (!old) return old;
        return { ...old, status };
      });

      queryClient.setQueriesData<Order[]>(ordersFilter, (old) => {
        if (!old) return old;
        return old.map((o) => (o.id === id ? { ...o, status } : o));
      });

      return { previousOrder, previousOrders };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousOrder) {
        queryClient.setQueryData(['order', id], context.previousOrder);
      }
      if (context?.previousOrders) {
        for (const [queryKey, data] of context.previousOrders) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onSuccess: (order) => {
      if (!order) return;

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
        order.items.map((item) => repositories.listings.getListing(item.listingId))
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
