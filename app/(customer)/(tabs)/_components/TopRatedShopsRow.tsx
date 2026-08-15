import { View, ScrollView } from 'react-native';
import { Star } from 'lucide-react-native';

import { Image } from '@/src/components/ui/Image';
import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';
import type { Merchant } from '@/src/types';

interface TopRatedShopsRowProps {
  merchants: Merchant[];
  onSeeMap: () => void;
  onMerchantPress: (id: string) => void;
}

export function TopRatedShopsRow({ merchants, onSeeMap, onMerchantPress }: TopRatedShopsRowProps) {
  return (
    <View className="mb-3">
      <View className="mb-3 flex-row items-center justify-between px-4">
        <Text variant="h3">Top Rated Shops</Text>
        <PressableScale onPress={onSeeMap} scale={0.95}>
          <Text variant="caption" className="text-primary font-medium">
            See on map
          </Text>
        </PressableScale>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 24 }}
      >
        {merchants.map((merchant) => (
          <PressableScale
            key={merchant.id}
            onPress={() => onMerchantPress(merchant.id)}
            scale={0.97}
            className="mr-3"
          >
            <View style={{ width: 140, height: 100 }} className="rounded-2xl overflow-hidden">
              <Image
                source={{ uri: merchant.coverUrl ?? merchant.logoUrl }}
                style={{ width: 140, height: 100 }}
                resizeMode="cover"
              />
              {/* gradient overlay */}
              <View className="absolute inset-0 bg-black/30" />
              <View
                className="absolute bottom-0 left-0 right-0"
                style={{ height: '65%', backgroundColor: 'rgba(0,0,0,0.35)' }}
              />
              <View className="absolute bottom-0 left-0 right-0 p-2.5">
                <Text variant="caption" className="text-white font-semibold" numberOfLines={1}>
                  {merchant.name}
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <Star size={10} color="#FBBF24" fill="#FBBF24" />
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, marginLeft: 2 }}>
                    {merchant.rating.toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>
          </PressableScale>
        ))}
      </ScrollView>
    </View>
  );
}
