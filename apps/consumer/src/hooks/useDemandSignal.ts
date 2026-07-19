import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth';
import { queryClient as qc } from '../lib/queryClient';
import type { ListingPin } from '@maithing/shared';

/** Approximate geohash from lat/lng (~1 km cells at 2 decimal places). */
function latLngToGeohash(lat: number, lng: number): string {
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
}

/** Look up lat/lng for a listing from the map-pin cache. Returns null if not cached. */
function getPinCoords(listingId: string): { lat: number; lng: number } | null {
  const cacheEntries = qc.getQueriesData<ListingPin[]>({ queryKey: ['listings_in_bounds'] });
  for (const [, pins] of cacheEntries) {
    if (!pins) continue;
    const pin = pins.find((p) => p.id === listingId);
    if (pin) return { lat: pin.location_lat, lng: pin.location_lng };
  }
  return null;
}

/** Returns the demand signal row ID if the current user has registered a notify-me for this listing's area + category. */
export function useDemandSignal(listingId: string, category: string) {
  const user = useAuthStore((s) => s.user);
  return useQuery<string | null>({
    queryKey: ['demand_signal', listingId],
    queryFn: async () => {
      if (!user) return null;
      const coords = getPinCoords(listingId);
      if (!coords) return null;
      const geohash = latLngToGeohash(coords.lat, coords.lng);
      const { data } = await supabase
        .from('demand_signals')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('geohash', geohash)
        .eq('category', category)
        .maybeSingle();
      return data?.id ?? null;
    },
    enabled: !!user,
  });
}

/** Toggle notify-me for a listing's area + category. Returns the new state (true = notifying). */
export function useToggleDemandSignal(listingId: string, category: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation<boolean, Error, { currentId: string | null }>({
    mutationFn: async ({ currentId }) => {
      if (!user) throw new Error('Not authenticated');
      if (currentId) {
        const { error } = await supabase.from('demand_signals').delete().eq('id', currentId);
        if (error) throw new Error(error.message);
        return false;
      }
      const coords = getPinCoords(listingId);
      if (!coords) throw new Error('Location coordinates not available');
      const geohash = latLngToGeohash(coords.lat, coords.lng);
      const { error } = await supabase
        .from('demand_signals')
        .insert({ buyer_id: user.id, geohash, category });
      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['demand_signal', listingId] });
    },
  });
}
