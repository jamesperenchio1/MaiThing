import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { scheduleLocalNotification } from '@/src/services/notifications';
import { useAuthStore } from '@/src/stores/auth';

const IS_SUPABASE_MODE = process.env.EXPO_PUBLIC_REPOSITORY_MODE === 'supabase';

/**
 * Background notification handler using Supabase Realtime.
 * Listens for order status updates, new merchant messages, and restock alerts,
 * then schedules local notifications when relevant events occur.
 *
 * Mount once at app root (e.g. in _layout.tsx).
 */
export function useBackgroundNotifications() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  useEffect(() => {
    if (!IS_SUPABASE_MODE || !user?.id || Platform.OS === 'web') return;

    // ── Order status updates ──────────────────────────────────────────────
    const ordersChannel = supabase
      .channel(`bg-notifications:orders:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `buyer_id=eq.${user.id}`,
        },
        async (payload) => {
          const newRow = payload.new as Record<string, unknown>;
          const oldRow = payload.old as Record<string, unknown>;
          const newStatus = newRow.status as string;
          const oldStatus = oldRow.status as string;

          if (newStatus !== oldStatus) {
            const merchantName = (newRow.merchant_name as string) ?? 'Merchant';
            const orderId = newRow.id as string;
            const statusLabels: Record<string, string> = {
              paid: 'confirmed',
              preparing: 'preparing',
              ready: 'ready for pickup',
              collected: 'picked up',
              cancelled: 'cancelled',
            };
            const label = statusLabels[newStatus] ?? newStatus;

            await scheduleLocalNotification(
              'Order Update',
              `Your order from ${merchantName} is now ${label}.`,
              { orderId, type: 'order_update' },
              undefined,
              'order_update',
              `/(customer)/order/${orderId}`
            );

            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order', orderId] });
          }
        }
      )
      .subscribe();

    // ── New merchant messages ─────────────────────────────────────────────
    const messagesChannel = supabase
      .channel(`bg-notifications:messages:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'merchant_messages',
          filter: `customer_id=eq.${user.id}`,
        },
        async (payload) => {
          const row = payload.new as Record<string, unknown>;
          const sentBy = row.sent_by as string;
          if (sentBy !== 'merchant') return;

          const merchantName = (row.merchant_name as string) ?? 'Merchant';
          const content = (row.content as string) ?? 'New message';
          const orderId = (row.order_id as string) ?? undefined;

          await scheduleLocalNotification(
            merchantName,
            content,
            { orderId, type: 'merchant_message' },
            undefined,
            'merchant_message',
            orderId ? `/(customer)/order/${orderId}` : undefined
          );

          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();

    // ── Restock alerts ────────────────────────────────────────────────────
    const restockChannel = supabase
      .channel(`bg-notifications:restock:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'listings',
        },
        async (payload) => {
          const newRow = payload.new as Record<string, unknown>;
          const oldRow = payload.old as Record<string, unknown>;
          const wasZero = (oldRow.qty_remaining as number) === 0;
          const nowPositive = (newRow.qty_remaining as number) > 0;
          const listingId = newRow.id as string;

          if (wasZero && nowPositive) {
            // Check if user has a restock alert for this listing
            const { data } = await supabase
              .from('restock_alerts')
              .select('*')
              .eq('user_id', user.id)
              .eq('listing_id', listingId)
              .maybeSingle();

            if (data) {
              const title = (newRow.name as string) ?? 'Listing';
              await scheduleLocalNotification(
                'Back in Stock',
                `${title} is now available again.`,
                { listingId, type: 'restock' },
                undefined,
                'new_deal',
                `/(customer)/listing/${listingId}`
              );
            }
          }

          queryClient.invalidateQueries({ queryKey: ['listings'] });
        }
      )
      .subscribe();

    channelsRef.current = [ordersChannel, messagesChannel, restockChannel];

    return () => {
      channelsRef.current.forEach((ch) => {
        ch.unsubscribe();
        supabase.removeChannel(ch);
      });
      channelsRef.current = [];
    };
  }, [user?.id, queryClient]);
}
