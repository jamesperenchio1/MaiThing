import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import type { ListingPin, Bounds } from '@maithing/shared';
import { formatThb } from '@maithing/shared';

interface Props {
  listings: ListingPin[];
  onRegionChange: (bounds: Bounds) => void;
}

const THAILAND_BOUNDS: Bounds = {
  min_lat: 5.0,
  min_lng: 97.0,
  max_lat: 21.0,
  max_lng: 106.0,
};

export default function ListingMap({ listings, onRegionChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    onRegionChange(THAILAND_BOUNDS);
  }, [onRegionChange]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map view</Text>
      <Text style={styles.subtitle}>
        {listings.length} rescue bags nearby. Use the native app for the full map experience.
      </Text>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {listings.map((listing) => (
          <Pressable
            key={listing.id}
            style={[styles.card, selectedId === listing.id && styles.cardSelected]}
            onPress={() => {
              setSelectedId(listing.id);
              router.push(`/(buyer)/listing/${listing.id}`);
            }}
          >
            <Text style={styles.cardTitle} numberOfLines={1}>
              {listing.title}
            </Text>
            <Text style={styles.cardPrice}>{formatThb(listing.price_thb)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 16 },
  list: { flex: 1 },
  listContent: { paddingBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: { borderColor: '#16a34a', borderWidth: 2 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', marginRight: 12 },
  cardPrice: { fontSize: 15, fontWeight: '700', color: '#16a34a' },
});
