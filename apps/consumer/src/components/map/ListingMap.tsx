import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import type { Bounds, ListingPin } from '@maithing/shared';
import LeafletMap from './LeafletMap';

interface Props {
  listings: ListingPin[];
  onRegionChange: (bounds: Bounds) => void;
}

export default function ListingMap({ listings, onRegionChange }: Props) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) return;
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  const handlePinPress = useCallback((listingId: string) => {
    router.push(`/(buyer)/listing/${listingId}`);
  }, []);

  return (
    <View style={styles.container}>
      <LeafletMap
        listings={listings}
        onRegionChange={onRegionChange}
        onPinPress={handlePinPress}
        {...(userLocation ? { initialLat: userLocation.lat, initialLng: userLocation.lng } : {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
