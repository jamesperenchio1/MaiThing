import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { ListingPin } from '@maithing/shared';
import { useTheme } from '../../theme';
import { LoadingState } from '../ui';
import ListingRow from './ListingRow';

interface Props {
  listings: ListingPin[];
  isLoading: boolean;
  emptyText: string;
}

export default function ListingList({ listings, isLoading, emptyText }: Props) {
  const { colors, spacing } = useTheme();

  if (isLoading) {
    return <LoadingState />;
  }

  if (listings.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <FlashList
      data={listings}
      estimatedItemSize={88}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ListingRow listing={item} />}
      contentContainerStyle={{ padding: spacing[3] }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15 },
});
