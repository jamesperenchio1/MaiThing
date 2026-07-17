import { useState, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../src/lib/supabase';
import { useMapStore } from '../../src/stores/map';
import type { Bounds, ListingPin, Json } from '@maithing/shared';
import { boundsSchema } from '@maithing/shared';
import ListingMap from '../../src/components/map/ListingMap';
import ListingList from '../../src/components/listing/ListingList';
import DiscoverHeader from '../../src/components/listing/DiscoverHeader';

const DEBOUNCE_MS = 400;

export default function DiscoverScreen() {
  const { t } = useTranslation();
  const { bounds, filters, setBounds } = useMapStore();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: listings = [], isLoading } = useQuery<ListingPin[]>({
    queryKey: ['listings_in_bounds', bounds, filters],
    queryFn: async () => {
      if (!bounds) return [];
      const { data, error } = await supabase.rpc('listings_in_bounds', {
        min_lat: bounds.min_lat,
        min_lng: bounds.min_lng,
        max_lat: bounds.max_lat,
        max_lng: bounds.max_lng,
        filters: filters as unknown as Json,
        lim: 200,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!bounds,
    staleTime: 15_000,
  });

  const onRegionChange = useCallback(
    (newBounds: Bounds) => {
      const parsed = boundsSchema.safeParse(newBounds);
      if (!parsed.success) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setBounds(parsed.data), DEBOUNCE_MS);
    },
    [setBounds],
  );

  return (
    <View style={styles.container}>
      <DiscoverHeader
        viewMode={viewMode}
        onToggleView={setViewMode}
        isLoading={isLoading}
      />
      {viewMode === 'map' ? (
        <ListingMap listings={listings} onRegionChange={onRegionChange} />
      ) : (
        <ListingList listings={listings} isLoading={isLoading} emptyText={t('discover.noListings')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
});
