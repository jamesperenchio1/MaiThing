import { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { ListingPin } from '@maithing/shared';
import { formatThb, discountPercent } from '@maithing/shared';
import FavoriteButton from './FavoriteButton';

interface Props {
  listings: ListingPin[];
  isLoading: boolean;
  emptyText: string;
}

export default function ListingList({ listings, isLoading, emptyText }: Props) {
  const queryClient = useQueryClient();
  const prefetchedRef = useRef(new Set<string>());

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ item: ListingPin }> }) => {
      for (const { item } of viewableItems) {
        if (prefetchedRef.current.has(item.id)) continue;
        prefetchedRef.current.add(item.id);
        void queryClient.prefetchQuery({
          queryKey: ['listing', item.id],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('listings')
              .select(
                '*, location:locations(*), items:listing_items(*), slots:pickup_slots(starts_at, ends_at, capacity, reserved_count, id)',
              )
              .eq('id', item.id)
              .single();
            if (error) throw error;
            return data;
          },
          staleTime: 30_000,
        });
      }
    },
    [queryClient],
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (listings.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <FlashList
      data={listings}

      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ListingRow listing={item} />}
      contentContainerStyle={styles.list}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ minimumViewTime: 150, itemVisiblePercentThreshold: 30 }}
    />
  );
}

function ListingRow({ listing }: { listing: ListingPin }) {
  const { t } = useTranslation();
  const pct = discountPercent(listing.original_value_thb, listing.price_thb);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/(buyer)/listing/${listing.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${formatThb(listing.price_thb)}`}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={styles.rowStore} numberOfLines={1}>
          {listing.location_name}
        </Text>
        <Text style={styles.rowRating}>★ {listing.rating_avg.toFixed(1)}</Text>
      </View>
      <View style={styles.rowRight}>
        <FavoriteButton locationId={listing.location_id} size={22} />
        <Text style={styles.rowPrice}>{formatThb(listing.price_thb)}</Text>
        {pct > 0 && <Text style={styles.rowSaved}>-{pct}%</Text>}
        <Text style={styles.rowQty}>
          {t('listing.remaining', { count: listing.qty_remaining })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#9ca3af', fontSize: 15 },
  list: { padding: 12 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  rowLeft: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rowStore: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  rowRating: { fontSize: 12, color: '#f59e0b', marginTop: 4 },
  rowRight: { alignItems: 'flex-end', gap: 2 },
  rowPrice: { fontSize: 18, fontWeight: '700', color: '#16a34a' },
  rowSaved: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontWeight: '700',
  },
  rowQty: { fontSize: 12, color: '#9ca3af' },
});
