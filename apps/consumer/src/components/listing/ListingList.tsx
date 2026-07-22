import { useCallback, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { ListingPin } from '@maithing/shared';
import { LoadingState, EmptyState } from '../ui';
import ListingRow from './ListingRow';

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
    return <LoadingState />;
  }

  if (listings.length === 0) {
    return <EmptyState title={emptyText} icon="search" />;
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

const styles = StyleSheet.create({
  list: { padding: 12 },
});
