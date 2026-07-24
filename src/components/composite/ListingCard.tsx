import { Image, View } from 'react-native';
import { Heart, MapPin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { cn, formatCurrency, formatDistance } from '@/src/lib/utils';
import { Card } from '@/src/components/ui/Card';
import { Text } from '@/src/components/ui/Text';
import { Badge } from '@/src/components/ui/Badge';
import { PressableScale } from '@/src/components/ui/PressableScale';
import type { Listing } from '@/src/types';

interface ListingCardProps {
  listing: Listing;
  variant?: 'horizontal' | 'vertical';
  className?: string;
  testID?: string;
}

export function ListingCard({ listing, variant = 'vertical', className, testID }: ListingCardProps) {
  const router = useRouter();
  const isMystery = listing.type === 'mystery_box';
  const discount = Math.round((1 - listing.salePrice / listing.originalPrice) * 100);
  const isSoldOut = listing.quantityRemaining === 0;

  return (
    <PressableScale
      testID={testID}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/(customer)/listing/${listing.id}`);
      }}
      className={cn('mb-3', className)}
      scale={0.98}
    >
      <Card variant="elevated" className={cn('overflow-hidden p-0', variant === 'horizontal' && 'flex-row')}>
        <View className={cn('relative bg-muted', variant === 'vertical' ? 'h-40 w-full' : 'h-24 w-24')}>
          <Image source={{ uri: listing.images[0] }} className="h-full w-full" resizeMode="cover" />
          <View className="absolute left-2 top-2">
            <Badge variant={isMystery ? 'warning' : 'info'}>
              {isMystery ? 'Mystery Box' : 'Fixed'}
            </Badge>
          </View>
          {isSoldOut && (
            <View className="absolute inset-0 items-center justify-center bg-black/50">
              <Text className="font-semibold text-white">Sold Out</Text>
            </View>
          )}
          <View className="absolute right-2 top-2">
            <PressableScale
              onPress={() => {}}
              className="rounded-full bg-black/20 p-1.5"
              scale={0.9}
            >
              <Heart size={16} color="#fff" />
            </PressableScale>
          </View>
        </View>
        <View className={cn('p-3', variant === 'horizontal' && 'flex-1')}>
          <Text variant="body-sm" className="mb-1 font-semibold" numberOfLines={2}>
            {listing.title}
          </Text>
          <View className="mb-2 flex-row items-center">
            <Text className="text-lg font-bold text-primary">
              {formatCurrency(listing.salePrice)}
            </Text>
            <Text className="ml-2 text-sm text-muted line-through">
              {formatCurrency(listing.originalPrice)}
            </Text>
            <Text className="ml-2 text-sm font-semibold text-primary">
              -{discount}%
            </Text>
          </View>
          <Text variant="caption" className="text-muted">
            {listing.quantityRemaining} left · Pickup {new Date(listing.pickupWindowStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {listing.distance != null ? ` · ${formatDistance(listing.distance)}` : ''}
          </Text>
        </View>
      </Card>
    </PressableScale>
  );
}
