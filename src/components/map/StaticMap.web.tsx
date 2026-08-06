import { View } from 'react-native';

import type { Merchant } from '@/src/types';

interface StaticMapProps {
  merchant: Merchant;
  height?: number;
}

export function StaticMap({ merchant, height = 160 }: StaticMapProps) {
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
