import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { Navigation } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { openDirections } from '@/src/lib/maps';
import { formatDistance } from '@/src/lib/utils';
import type { Merchant, Coordinates } from '@/src/types';

interface MapProps {
  merchants: Merchant[];
  userLocation?: Coordinates;
  locationGranted?: boolean;
  selectedMerchantId?: string;
  onSelectMerchant?: (merchant: Merchant | null) => void;
}

export function Map({
  merchants,
  userLocation,
  locationGranted,
  selectedMerchantId,
  onSelectMerchant,
}: MapProps) {
  const colors = useThemeColor();
  const mapRef = useRef<MapView>(null);

  const initialRegion = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 13.7462,
        longitude: 100.5347,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  useEffect(() => {
    if (!mapRef.current) return;
    const coords = merchants.map((m) => m.coordinates);
    if (userLocation) coords.push(userLocation);
    if (coords.length === 0) return;
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 120, right: 60, bottom: 260, left: 60 },
      animated: true,
    });
  }, [merchants, userLocation]);

  useEffect(() => {
    if (!locationGranted || !userLocation || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      600
    );
  }, [locationGranted]);

  useEffect(() => {
    if (!selectedMerchantId || !mapRef.current) return;
    const selected = merchants.find((m) => m.id === selectedMerchantId);
    if (!selected) return;
    mapRef.current.animateToRegion(
      {
        latitude: selected.coordinates.latitude,
        longitude: selected.coordinates.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      350
    );
  }, [selectedMerchantId, merchants]);

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={StyleSheet.absoluteFill as any}
        initialRegion={initialRegion}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
        onPress={() => onSelectMerchant?.(null)}
      >
        {merchants.map((merchant) => (
          <Marker
            key={merchant.id}
            coordinate={merchant.coordinates}
            pinColor={selectedMerchantId === merchant.id ? '#10B981' : '#EF4444'}
            onPress={() => onSelectMerchant?.(merchant)}
          >
            <Callout tooltip onPress={() => openDirections(merchant.coordinates, merchant.name)}>
              <View className="min-w-[200px] rounded-2xl bg-background p-3 shadow-sm">
                <Text variant="body-sm" className="font-semibold text-foreground">
                  {merchant.name}
                </Text>
                <Text variant="caption" numberOfLines={1}>
                  {merchant.address.street}, {merchant.address.district}
                </Text>
                {merchant.distance != null && (
                  <Text variant="caption">{formatDistance(merchant.distance)} away</Text>
                )}
                <View className="mt-2 flex-row items-center">
                  <Navigation size={14} color={colors.primary} />
                  <Text variant="body-sm" className="ml-1 font-medium text-primary">
                    Get directions
                  </Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}
