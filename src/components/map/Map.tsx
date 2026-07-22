import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { Merchant, Coordinates } from '@/src/types';

interface MapProps {
  merchants: Merchant[];
  userLocation?: Coordinates;
  selectedMerchantId?: string;
  onSelectMerchant?: (merchant: Merchant) => void;
}

export function Map({ merchants, userLocation, selectedMerchantId, onSelectMerchant }: MapProps) {
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

  return (
    <View className="flex-1">
      <MapView
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={StyleSheet.absoluteFill as any}
        initialRegion={initialRegion}
      >
        {merchants.map((merchant) => (
          <Marker
            key={merchant.id}
            coordinate={merchant.coordinates}
            title={merchant.name}
            description={merchant.categories.join(', ')}
            pinColor={selectedMerchantId === merchant.id ? '#10B981' : '#EF4444'}
            onPress={() => onSelectMerchant?.(merchant)}
          />
        ))}
      </MapView>
    </View>
  );
}
