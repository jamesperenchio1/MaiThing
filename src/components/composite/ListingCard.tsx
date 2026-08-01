import { Image, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  cn,
  formatCurrency,
  formatDistance,
  formatWalkTime,
  getListingUrgency,
  formatPickupWindow,
} from '@/src/lib/utils';
import { Card } from '@/src/components/ui/Card';
import { Text } from '@/src/components/ui/Text';
import { Badge } from '@/src/components/ui/Badge';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { FavoriteButton } from '@/src/components/composite/FavoriteButton';
import { UrgencyBadge } from '@/src/components/composite/UrgencyBadge';
import { DietaryBadgeRow } from '@/src/components/composite/DietaryBadgeRow';
import { CountdownTimer } from '@/src/components/composite/CountdownTimer';
import type { Listing } from '@/src/types';

interface ListingCardProps {
  listing: Listing;
  variant?: 'horizontal' | 'vertical';
  className?: string;
  testID?: string;
}

export function ListingCard({
  listing,
  variant = 'vertical',
  className,
  testID,
}: ListingCardProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isMystery = listing.type === 'mystery_box';
  const isFlashSale =
    !!listing.flashSalePrice &&
    !!listing.flashSaleEndsAt &&
    new Date(listing.flashSaleEndsAt) > new Date();
  const effectivePrice = isFlashSale ? listing.flashSalePrice! : listing.salePrice;
  const discount = Math.round((1 - effectivePrice / listing.originalPrice) * 100);
  const isSoldOut = listing.quantityRemaining === 0;
  const urgency = getListingUrgency(listing);
  const minsUntilEnd = Math.round(
    (new Date(listing.pickupWindowEnd).getTime() - Date.now()) / 60000
  );
  const showCountdown = !isSoldOut && minsUntilEnd <= 240 && minsUntilEnd > 0;

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
      <Card
        variant="elevated"
        className={cn('overflow-hidden p-0', variant === 'horizontal' && 'flex-row')}
      >
        <View
          className={cn('relative bg-muted', variant === 'vertical' ? 'h-44 w-full' : 'h-28 w-28')}
        >
          <Image source={{ uri: listing.images[0] }} className="h-full w-full" resizeMode="cover" />
          <View className="absolute left-2 top-2">
            <Badge variant={isMystery ? 'warning' : 'info'}>
              {isMystery ? 'Mystery Box' : 'Fixed'}
            </Badge>
          </View>
          {urgency && (
            <View className="absolute bottom-2 left-2">
              <UrgencyBadge urgency={urgency} />
            </View>
          )}
          {isSoldOut && (
            <View className="absolute inset-0 items-center justify-center bg-black/50">
              <Text className="font-semibold text-white">Sold Out</Text>
            </View>
          )}
          <View className="absolute right-2 top-2">
            <FavoriteButton
              merchantId={listing.merchantId}
              size={16}
              variant="overlay"
              className="bg-black/20 p-1.5"
            />
          </View>
        </View>
        <View className={cn('p-3', variant === 'horizontal' && 'flex-1')}>
          <Text variant="body-sm" className="mb-1 font-semibold" numberOfLines={2}>
            {listing.title}
          </Text>

          {isMystery && (
            <Text variant="caption" className="mb-1.5 text-muted">
              Worth {formatCurrency(listing.estimatedRetailValue)}+ of surprises
            </Text>
          )}

          <View className="mb-2 flex-row flex-wrap items-center">
            <Text className="text-lg font-bold text-primary">
              {formatCurrency(effectivePrice)}
            </Text>
            <Text className="ml-2 text-sm text-muted line-through">
              {formatCurrency(isFlashSale ? listing.salePrice : listing.originalPrice)}
            </Text>
            <Badge variant={isFlashSale ? 'danger' : 'success'} className="ml-2">
              {isFlashSale ? '⚡ Flash' : `-${discount}%`}
            </Badge>
          </View>

          {showCountdown && (
            <View className="mb-2">
              <CountdownTimer targetDate={listing.pickupWindowEnd} label="Pickup ends" />
            </View>
          )}

          <DietaryBadgeRow tags={listing.dietaryTags} max={variant === 'horizontal' ? 1 : 2} />

          <Text variant="caption" className="mt-2 text-muted">
            {t('customer.listing.quantityLeft', { count: listing.quantityRemaining })}
            {' · '}
            {
              formatPickupWindow(
                listing.pickupWindowStart,
                listing.pickupWindowEnd,
                i18n.language
              ).split(' · ')[1]
            }
            {listing.distance != null
              ? ` · ${formatDistance(listing.distance)} (${formatWalkTime(listing.distance)})`
              : ''}
          </Text>
        </View>
      </Card>
    </PressableScale>
  );
}
