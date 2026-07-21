import { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../src/lib/supabase';
import { useMapStore } from '../../src/stores/map';
import type { Bounds, ListingPin, Json } from '@maithing/shared';
import { boundsSchema } from '@maithing/shared';
import ListingMap from '../../src/components/map/ListingMap';
import ListingList from '../../src/components/listing/ListingList';
import DiscoverHeader from '../../src/components/listing/DiscoverHeader';
import FiltersPanel from '../../src/components/listing/FiltersPanel';
import { useHasUnreadMessages } from '../../src/hooks/useChat';
import { Screen, Input, Icon } from '../../src/components/ui';
import { useTheme } from '../../src/theme';
import { icons } from '../../src/icons';

const DEBOUNCE_MS = 400;

export default function DiscoverScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, spacing } = theme;
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

  const styles = makeStyles(colors, spacing);

  return (
    <Screen style={styles.container}>
      <DiscoverHeader
        viewMode={viewMode}
        onToggleView={setViewMode}
        isLoading={isLoading}
        hasUnread={hasUnread}
      />
      <View style={styles.searchBar}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={t('discover.searchPlaceholder')}
          accessibilityLabel={t('common.search')}
          style={styles.searchInput}
        />
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilters(true)}
          accessibilityRole="button"
          accessibilityLabel={t('common.filter')}
        >
          <Icon name={icons.filter} size={20} />
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
    </Screen>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing[4],
      paddingBottom: spacing[2],
      gap: spacing[2],
    },
    searchInput: {
      flex: 1,
    },
    filterBtn: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing[3],
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
}
