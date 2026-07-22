import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { MerchantCard } from '@/src/components/composite/MerchantCard';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import type { Merchant, Coordinates } from '@/src/types';

interface MapProps {
  merchants: Merchant[];
  userLocation?: Coordinates;
  selectedMerchantId?: string;
  onSelectMerchant?: (merchant: Merchant) => void;
}

export function Map({ merchants }: MapProps) {
  const colors = useThemeColor();
  return (
    <View className="flex-1 bg-background">
      <View className="items-center justify-center bg-primary/10 p-8">
        <MapPin size={48} color={colors.primary} />
        <Text className="mt-4 text-center text-lg font-semibold text-foreground">
          Map View
        </Text>
        <Text className="text-center text-muted">
          Native map is available on iOS/Android. On web, browse nearby merchants below.
        </Text>
      </View>
      <ScrollView className="flex-1 px-6 py-4">
        {merchants.map((merchant) => (
          <MerchantCard key={merchant.id} merchant={merchant} />
        ))}
      </ScrollView>
    </View>
  );
}
