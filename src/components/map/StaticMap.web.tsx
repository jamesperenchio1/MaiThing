import { useState } from 'react';
import { View, Image as RNImage } from 'react-native';

import { buildStaticMapUrl } from '@/src/lib/maps';
import type { Merchant } from '@/src/types';

interface StaticMapProps {
  merchant: Merchant;
  height?: number;
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
  const [hasError, setHasError] = useState(false);

  // Prefer the DB-cached URL so every customer view doesn't hit Google Static Maps API.
  const cachedUrl = merchant.staticMapUrl;
  const generatedUrl = !cachedUrl ? buildStaticMapUrl(merchant.coordinates) : null;
  const uri = cachedUrl ?? generatedUrl ?? null;

  if (!uri || hasError) {
    return <OSMMap merchant={merchant} height={height} />;
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
