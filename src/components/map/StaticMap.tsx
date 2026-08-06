import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import type { Merchant } from '@/src/types';

interface StaticMapProps {
  merchant: Merchant;
  height?: number;
}

export function StaticMap({ merchant, height = 160 }: StaticMapProps) {
  return (
    <View className="overflow-hidden rounded-2xl" style={{ height }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: merchant.coordinates.latitude,
          longitude: merchant.coordinates.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <Marker
          coordinate={{
            latitude: merchant.coordinates.latitude,
            longitude: merchant.coordinates.longitude,
          }}
          title={merchant.name}
        />
      </MapView>
    </View>
  );
}
