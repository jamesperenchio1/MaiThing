import { View } from 'react-native';
import { Image } from '@/src/components/ui/Image';
import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { formatCurrency } from '@/src/lib/utils';
import type { Listing } from '@/src/types';

interface DealOfTheDayCardProps {
  deal: Listing;
  onPress: () => void;
}

export function DealOfTheDayCard({ deal, onPress }: DealOfTheDayCardProps) {
  const discount = Math.round((1 - deal.salePrice / deal.originalPrice) * 100);

  return (
    <PressableScale testID="deal-of-the-day-card" onPress={onPress} scale={0.99} className="mb-3">
      <View className="h-44 overflow-hidden">
        <Image
          source={{ uri: deal.images[0] }}
          className="absolute inset-0 h-full w-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/40" />
        <View
          className="absolute bottom-0 left-0 right-0"
          // eslint-disable-next-line react-native/no-color-literals -- darkening scrim over the photo behind white text, independent of app theme
          style={{ height: '60%', backgroundColor: 'rgba(0,0,0,0.35)' }}
        />
        <View className="absolute inset-0 p-4 justify-between">
          <View className="self-start bg-primary rounded-full px-3 py-1">
            <Text variant="caption" className="text-white font-bold tracking-wide">
              Deal of the Day
            </Text>
          </View>
          <View>
            <Text variant="h3" className="text-white mb-1" numberOfLines={1}>
              {deal.title}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-white text-xl font-bold">{formatCurrency(deal.salePrice)}</Text>
              <Text className="text-white/60 text-sm line-through ml-2">
                {formatCurrency(deal.originalPrice)}
              </Text>
              <View className="ml-2 bg-white/90 rounded-full px-2.5 py-0.5">
                <Text variant="caption" className="text-primary font-bold">
                  -{discount}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}
