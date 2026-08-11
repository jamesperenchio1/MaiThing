import { View, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import type { Merchant } from '@/src/types';

interface MerchantMapProps {
  merchant: Merchant;
}

export function MerchantMap({ merchant }: MerchantMapProps) {
  return (
    <View style={{ height: 200 }}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill as any}
        initialRegion={{
          latitude: merchant.coordinates.latitude,
          longitude: merchant.coordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={merchant.coordinates} title={merchant.name} />
      </MapView>
    </View>
  );
}
