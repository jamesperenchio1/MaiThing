import { View } from 'react-native';

import type { Merchant } from '@/src/types';

interface MerchantMapProps {
  merchant: Merchant;
}

export function MerchantMap({ merchant }: MerchantMapProps) {
  return (
    <View style={{ height: 200 }}>
      <iframe
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${merchant.coordinates.longitude - 0.01},${merchant.coordinates.latitude - 0.01},${merchant.coordinates.longitude + 0.01},${merchant.coordinates.latitude + 0.01}&layer=mapnik&marker=${merchant.coordinates.latitude},${merchant.coordinates.longitude}`}
        className="h-full w-full border-0"
        title={`${merchant.name} location`}
        loading="lazy"
      />
    </View>
  );
}
