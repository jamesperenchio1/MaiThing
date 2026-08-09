import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Order } from '@/src/types';

const IS_SUPABASE_MODE = process.env.EXPO_PUBLIC_REPOSITORY_MODE === 'supabase';

/**
 * Subscribe to real-time order updates via Supabase Realtime.
 * Automatically invalidates TanStack Query cache when orders change.
 *
 * Use in a top-level layout or screen that persists across the app lifecycle
 * (e.g. the customer/merchant tab layout or the root layout).
 */
export function useRealtimeOrders(userId?: string, role?: 'customer' | 'merchant') {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!IS_SUPABASE_MODE || !userId) return;

    const channel = supabase
      .channel(`orders:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: role === 'merchant' ? `merchant_id=eq.${userId}` : `customer_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Order>) => {
          // Invalidate the order list
          queryClient.invalidateQueries({ queryKey: ['orders'] });

          // If we have a specific order ID, invalidate that too
          const orderId =
            payload.eventType === 'DELETE'
              ? (payload.old as Order | undefined)?.id
              : (payload.new as Order | undefined)?.id;

          if (orderId) {
            queryClient.invalidateQueries({ queryKey: ['order', orderId] });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[Realtime] Orders channel error');
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, role, queryClient]);
}
