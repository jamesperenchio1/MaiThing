import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';

export function useRealtimeStock(listingId: string) {
  useEffect(() => {
    const channel = supabase
      .channel(`listing-${listingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'listings',
          filter: `id=eq.${listingId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['listing', listingId] });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'listing_items',
          filter: `listing_id=eq.${listingId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['listing', listingId] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [listingId]);
}
