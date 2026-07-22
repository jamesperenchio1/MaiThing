import { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useMapStore } from '../../src/stores/map';
import type { Bounds, ListingPin, Json } from '@maithing/shared';
import { boundsSchema } from '@maithing/shared';
import ListingMap from '../../src/components/map/ListingMap';
import ListingList from '../../src/components/listing/ListingList';
import DiscoverHeader from '../../src/components/listing/DiscoverHeader';
import FiltersPanel from '../../src/components/listing/FiltersPanel';
import { useHasUnreadMessages } from '../../src/hooks/useChat';

const DEBOUNCE_MS = 400;

export default function DiscoverScreen() {
  const { t } = useTranslation();
  const { bounds, filters, setBounds } = useMapStore();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rpcFilters = {
    ...filters,
    ...(search.trim() ? { search: search.trim() } : {}),
  };

  const { data: listings = [], isLoading } = useQuery<ListingPin[]>({
    queryKey: ['listings_in_bounds', bounds, rpcFilters],
    queryFn: async () => {
      if (!bounds) return [];
      const { data, error } = await supabase.rpc('listings_in_bounds', {
        min_lat: bounds.min_lat,
        min_lng: bounds.min_lng,
        max_lat: bounds.max_lat,
        max_lng: bounds.max_lng,
        filters: rpcFilters as unknown as Json,
        lim: 200,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!bounds,
    staleTime: 15_000,
  });
  const hasUnread = useHasUnreadMessages();

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
        hasUnread={hasUnread}
      />
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={t('discover.searchPlaceholder')}
          accessibilityLabel={t('common.search')}
        />
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilters(true)}
          accessibilityRole="button"
          accessibilityLabel={t('common.filter')}
        >
          <Icon name="options-outline" size={20} color="#374151" />
        </TouchableOpacity>
      </View>
      {viewMode === 'map' ? (
        <ListingMap listings={listings} onRegionChange={onRegionChange} />
      ) : (
        <ListingList
          listings={listings}
          isLoading={isLoading}
          emptyText={t('discover.noListings')}
        />
      )}
      {showFilters && <FiltersPanel onClose={() => setShowFilters(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  filterBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
