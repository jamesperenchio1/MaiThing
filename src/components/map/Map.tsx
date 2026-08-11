import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { Navigation, Heart, Star } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { FavoriteButton } from '@/src/components/composite/FavoriteButton';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { openDirections } from '@/src/lib/maps';
import { formatDistance } from '@/src/lib/utils';
import type { Merchant, Coordinates } from '@/src/types';

export interface MapProps {
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
  const [mapReady, setMapReady] = useState(false);

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
    if (!mapRef.current || !mapReady) return;
    const coords = merchants.map((m) => m.coordinates);
    if (userLocation) coords.push(userLocation);
    if (coords.length === 0) return;
    // Use a small delay to ensure the native map has finished laying out.
    const timeout = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 120, right: 60, bottom: 260, left: 60 },
        animated: true,
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [merchants, userLocation, mapReady]);

  useEffect(() => {
    if (!locationGranted || !userLocation || !mapRef.current || !mapReady) return;
    mapRef.current.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      600
    );
  }, [locationGranted, mapReady]);

  useEffect(() => {
    if (!selectedMerchantId || !mapRef.current || !mapReady) return;
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
  }, [selectedMerchantId, merchants, mapReady]);

  return (
    <View className="relative flex-1">
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill as any}
        initialRegion={initialRegion}
        showsUserLocation={!!userLocation && !!locationGranted}
        showsMyLocationButton={false}
        onMapReady={() => setMapReady(true)}
        onPress={() => onSelectMerchant?.(null)}
      >
        {merchants.map((merchant) => (
          <Marker
            key={merchant.id}
            coordinate={merchant.coordinates}
            pinColor={selectedMerchantId === merchant.id ? '#10B981' : '#EF4444'}
            onPress={() => onSelectMerchant?.(merchant)}
          >
            <Callout tooltip>
              <View className="min-w-[220px] rounded-2xl bg-background p-3 shadow-sm">
                <View className="flex-row items-start justify-between">
                  <View className="mr-2 flex-1">
                    <Text variant="body-sm" className="font-semibold text-foreground">
                      {merchant.name}
                    </Text>
                    <Text variant="caption" numberOfLines={1}>
                      {merchant.address.street}, {merchant.address.district}
                    </Text>
                    <View className="mt-1 flex-row items-center">
                      <Star size={12} color={colors.warning} fill={colors.warning} />
                      <Text variant="caption" className="ml-1">
                        {merchant.rating.toFixed(1)} ({merchant.reviewCount})
                      </Text>
                    </View>
                    {merchant.distance != null && (
                      <Text variant="caption">{formatDistance(merchant.distance)} away</Text>
                    )}
                  </View>
                  <FavoriteButton merchantId={merchant.id} size={18} />
                </View>

                <PressableScale
                  onPress={() => openDirections(merchant.coordinates, merchant.name)}
                  className="mt-3 flex-row items-center justify-center rounded-xl bg-primary/10 py-2"
                  scale={0.97}
                  accessibilityLabel={`Get directions to ${merchant.name}`}
                  hitSlop={8}
                >
                  <Navigation size={14} color={colors.primary} />
                  <Text variant="body-sm" className="ml-1.5 font-medium text-primary">
                    Get directions
                  </Text>
                </PressableScale>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}
