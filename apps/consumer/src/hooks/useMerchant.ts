import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Tables } from '@maithing/shared';

export type ListingWithSlots = Tables<'listings'> & {
  location: { name: string } | null;
  slots: Tables<'pickup_slots'>[];
  items: Tables<'listing_items'>[];
};

export type OrderWithDetails = Tables<'orders'> & {
  buyer: { display_name: string | null } | null;
  listing: { title: string } | null;
  pickup_slot: Tables<'pickup_slots'> | null;
  items: (Tables<'order_items'> & {
    listing_item: { name: string } | null;
  })[];
};

export function useMerchantListings(locationIds: string[]) {
  return useQuery<ListingWithSlots[]>({
    queryKey: ['merchant-listings', locationIds],
    queryFn: async () => {
      if (locationIds.length === 0) return [];
      const { data, error } = await supabase
        .from('listings')
        .select(
          `
          *,
          location:locations(name),
          slots:pickup_slots(*),
          items:listing_items(*)
        `,
        )
        .in('location_id', locationIds)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    enabled: locationIds.length > 0,
    staleTime: 15_000,
  });
}

export function useMerchantOrders(locationIds: string[]) {
  return useQuery<OrderWithDetails[]>({
    queryKey: ['merchant-orders', locationIds],
    queryFn: async () => {
      if (locationIds.length === 0) return [];
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          buyer:profiles(display_name),
          listing:listings(title),
          pickup_slot:pickup_slots(*),
          items:order_items(*, listing_item:listing_items(name))
        `,
        )
        .in('location_id', locationIds)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    enabled: locationIds.length > 0,
    staleTime: 15_000,
  });
}
