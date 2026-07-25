import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockRepositories } from '@/src/repositories/mock';
import { scheduleLocalNotification } from '@/src/services/notifications';
import type { Order } from '@/src/types';

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
      if (order.status === 'ready') {
        scheduleLocalNotification(
          'Order ready for pickup',
          `Your order from ${order.merchantName} is ready! Pickup code: ${order.pickupCode}`,
          { orderId: order.id, type: 'order_ready' }
        ).catch(() => {});
      }
    },
  });
}
