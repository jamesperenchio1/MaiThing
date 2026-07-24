import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';

import { useThemeColor } from '@/src/hooks/useThemeColor';
import type { Merchant, Coordinates } from '@/src/types';

interface MapProps {
  merchants: Merchant[];
  userLocation?: Coordinates;
  selectedMerchantId?: string;
  onSelectMerchant?: (merchant: Merchant) => void;
}

export function Map(props: MapProps) {
  const colors = useThemeColor();
  const [ClientMap, setClientMap] = useState<React.ComponentType<MapProps> | null>(null);

  useEffect(() => {
    import('./LeafletMap').then((module) => {
      setClientMap(() => module.LeafletMap);
    });
  }, []);

  if (!ClientMap) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <MapPin size={48} color={colors.primary} />
        <Text className="mt-4 text-center text-lg font-semibold text-foreground">Map View</Text>
        <Text className="text-center text-muted">Loading map...</Text>
      </View>
    );
  }

  return <ClientMap {...props} />;
}
