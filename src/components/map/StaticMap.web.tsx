import { useState } from 'react';
import { View, Image as RNImage, useWindowDimensions } from 'react-native';
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
  return mapsPlugin[1]?.androidGoogleMapsApiKey ?? mapsPlugin[1]?.iosGoogleMapsApiKey ?? null;
}

function OSMMap({ merchant, height }: StaticMapProps) {
  const lon = merchant.coordinates.longitude;
  const lat = merchant.coordinates.latitude;
  const bbox = `${lon - 0.008},${lat - 0.008},${lon + 0.008},${lat + 0.008}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;

  return (
    <View className="overflow-hidden rounded-2xl" style={{ height }}>
      <iframe
        src={src}
        style={{ width: '100%', height: '100%', border: 'none', borderRadius: 16 }}
        title={`${merchant.name} location`}
        loading="lazy"
      />
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
