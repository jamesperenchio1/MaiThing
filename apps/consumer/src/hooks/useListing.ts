import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';
import type { Tables, ListingPin } from '@maithing/shared';

export type ListingDetail = Tables<'listings'> & {
  location: Tables<'locations'>;
  items: Tables<'listing_items'>[];
  slots: Tables<'pickup_slots'>[];
};

/** Lift a pin from the list cache into a partial ListingDetail for instant paint. */
function pinToPartialDetail(pin: ListingPin): Partial<ListingDetail> {
  return {
    id: pin.id,
    location_id: pin.location_id,
    title: pin.title,
    category: pin.category,
    fulfillment_type: pin.fulfillment_type,
    price_thb: pin.price_thb,
    original_value_thb: pin.original_value_thb,
    qty_remaining: pin.qty_remaining,
  };
}

function findPinInCache(listingId: string): ListingPin | undefined {
  const cacheEntries = queryClient.getQueriesData<ListingPin[]>({
    queryKey: ['listings_in_bounds'],
  });
  for (const [, pins] of cacheEntries) {
    if (!pins) continue;
    const found = pins.find((p) => p.id === listingId);
    if (found) return found;
  }
  return undefined;
}

export function useListingDetail(listingId: string) {
  const cachedPin = findPinInCache(listingId);

  return useQuery<ListingDetail>({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(
          `
          *,
          location:locations(*),
          items:listing_items(*),
          slots:pickup_slots(starts_at, ends_at, capacity, reserved_count, id)
        `,
        )
        .eq('id', listingId)
        .single();
      if (error) throw error;
      return data as unknown as ListingDetail;
    },
    staleTime: 30_000,
    // exactOptionalPropertyTypes forbids `undefined` as a value, so spread conditionally
    ...(cachedPin ? { placeholderData: pinToPartialDetail(cachedPin) as ListingDetail } : {}),
  });
}
