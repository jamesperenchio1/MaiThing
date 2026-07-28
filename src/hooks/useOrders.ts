import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockRepositories } from '@/src/repositories/mock';
import { scheduleLocalNotification } from '@/src/services/notifications';
import type { Order } from '@/src/types';

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
        scheduleLocalNotification(notification.title, notification.body, {
          orderId: order.id,
          type: `order_${order.status}`,
        }).catch(() => {});
      }
    },
  });
}
