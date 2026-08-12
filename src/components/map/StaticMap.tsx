import { useState } from 'react';
import { View, Image as RNImage } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { buildStaticMapUrl } from '@/src/lib/maps';
import type { Merchant } from '@/src/types';

interface StaticMapProps {
  merchant: Merchant;
  height?: number;
}

function NativeMap({ merchant, height }: StaticMapProps) {
  return (
    <View className="overflow-hidden rounded-2xl" style={{ height }}>
      <MapView
        provider="google"
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

export function StaticMap({ merchant, height = 160 }: StaticMapProps) {
  const [hasError, setHasError] = useState(false);

  // Prefer the DB-cached URL so every customer view doesn't hit Google Static Maps API.
  const cachedUrl = merchant.staticMapUrl;
  const generatedUrl = !cachedUrl ? buildStaticMapUrl(merchant.coordinates) : null;
  const uri = cachedUrl ?? generatedUrl ?? null;

  if (!uri || hasError) {
    return <NativeMap merchant={merchant} height={height} />;
  }

  return (
    <View className="mb-3 overflow-hidden rounded-2xl" style={{ height }}>
      <RNImage
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
        onError={() => setHasError(true)}
      />
    </View>
  );
}
