import { useState } from 'react';
import { View, Image as RNImage, Platform, useWindowDimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Constants from 'expo-constants';

import type { Merchant } from '@/src/types';

interface StaticMapProps {
  merchant: Merchant;
  height?: number;
}

function getGoogleMapsApiKey(): string | null {
  const plugins = (Constants.expoConfig?.plugins ?? []) as Array<
    string | [string, Record<string, string>]
  >;
  const mapsPlugin = plugins.find(
    (p): p is [string, Record<string, string>] => Array.isArray(p) && p[0] === 'react-native-maps'
  );
  if (!mapsPlugin) return null;
  const config = mapsPlugin[1];
  return Platform.select({
    ios: config?.iosGoogleMapsApiKey,
    android: config?.androidGoogleMapsApiKey,
    default: config?.androidGoogleMapsApiKey,
  });
}

function OSMMap({ merchant, height }: StaticMapProps) {
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

export function StaticMap({ merchant, height = 160 }: StaticMapProps) {
  const { width } = useWindowDimensions();
  const [hasError, setHasError] = useState(false);
  const apiKey = getGoogleMapsApiKey();
  const { latitude, longitude } = merchant.coordinates;

  if (!apiKey || hasError) {
    return <OSMMap merchant={merchant} height={height} />;
  }

  // Static Maps max free size is 640x640; use scale=2 for retina clarity.
  const mapWidth = Math.min(Math.round(width - 48), 640);
  const mapHeight = Math.min(Math.round(height * 2), 640);
  const size = `${mapWidth}x${mapHeight}`;
  const uri = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=${size}&scale=2&maptype=roadmap&markers=color:0x16A34A%7C${latitude},${longitude}&key=${apiKey}`;

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
